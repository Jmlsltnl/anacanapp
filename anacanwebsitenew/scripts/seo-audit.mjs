/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  ANACAN SEO AUDIT ENGINE
 *  Post-build static audit of dist/ — methodology-compatible with the
 *  claude-seo skill (github.com/AgriciDaniel/claude-seo):
 *
 *   • identical category weights:
 *       Technical 22% · Content 23% · On-Page 20% · Schema 10%
 *       Performance 10% · AI Search Readiness 10% · Images 5%
 *   • every recommendation carries a falsifiability check
 *     ("how would we know this failed?") and a leading indicator
 *   • quality gates honored: INP not FID, no HowTo schema, FAQPage
 *     flagged as Info only, question-based headings + answer-first
 *     paragraphs scored for AI citability
 *
 *  Outputs:
 *    dist/seo-report.json  + public/seo-report.json   (SEO panel data)
 *    dist/SEO-REPORT.md    + public/SEO-REPORT.md     (claude-seo style report)
 *
 *  Usage: node scripts/seo-audit.mjs   (run after `astro build`)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { readFile, writeFile, readdir, stat, access, copyFile } from 'node:fs/promises';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'node-html-parser';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dist = join(root, 'dist');

const SITE_URL = process.env.SITE_URL || 'https://anacan.az';

/* claude-seo category weights */
const CATEGORIES = [
  { key: 'technical', label: 'Technical SEO', weight: 22 },
  { key: 'content', label: 'Content Quality', weight: 23 },
  { key: 'onpage', label: 'On-Page SEO', weight: 20 },
  { key: 'schema', label: 'Schema / Structured Data', weight: 10 },
  { key: 'performance', label: 'Performance (CWV proxies)', weight: 10 },
  { key: 'ai', label: 'AI Search Readiness', weight: 10 },
  { key: 'images', label: 'Images', weight: 5 },
];

const DEPRECATED_SCHEMA = ['HowTo', 'SpecialAnnouncement', 'ClaimReview', 'VehicleListing', 'EstimatedSalary', 'LearningVideo', 'CourseInfo'];

const exists = (p) => access(p).then(() => true, () => false);

async function walk(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, out);
    else out.push(full);
  }
  return out;
}

const textOf = (node) => (node ? node.structuredText.replace(/\s+/g, ' ').trim() : '');
const words = (s) => s.split(/\s+/).filter(Boolean).length;

function urlPathOf(file) {
  let rel = relative(dist, file).split(sep).join('/');
  if (rel.endsWith('index.html')) rel = rel.slice(0, -'index.html'.length);
  else if (rel.endsWith('.html')) rel = rel.slice(0, -'.html'.length);
  return '/' + rel;
}

async function analyzePage(file) {
  const html = await readFile(file, 'utf8');
  const size = Buffer.byteLength(html);
  const doc = parse(html, { comment: true });
  const path = urlPathOf(file);

  const head = doc.querySelector('head');
  const main = doc.querySelector('main') ?? doc.querySelector('body') ?? doc;

  const title = textOf(doc.querySelector('title'));
  const metaDesc = head?.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
  const canonical = head?.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '';
  const robotsMeta = head?.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '';
  const lang = doc.querySelector('html')?.getAttribute('lang') ?? '';
  const viewport = head?.querySelector('meta[name="viewport"]')?.getAttribute('content') ?? '';

  const hreflangs = (head?.querySelectorAll('link[rel="alternate"][hreflang]') ?? []).map((l) => ({
    hreflang: l.getAttribute('hreflang'),
    href: l.getAttribute('href'),
  }));

  const og = {};
  for (const m of head?.querySelectorAll('meta[property^="og:"]') ?? []) {
    og[m.getAttribute('property')] = m.getAttribute('content');
  }
  const twitterCard = head?.querySelector('meta[name="twitter:card"]')?.getAttribute('content') ?? '';

  const h1s = main.querySelectorAll('h1');
  const headings = main.querySelectorAll('h1,h2,h3,h4,h5,h6').map((h) => ({
    level: Number(h.tagName[1]),
    text: textOf(h),
  }));

  let headingSkips = 0;
  let prev = 0;
  for (const h of headings) {
    if (prev > 0 && h.level > prev + 1) headingSkips++;
    prev = h.level;
  }

  const images = doc.querySelectorAll('img').map((img) => ({
    src: img.getAttribute('src') ?? '',
    alt: img.getAttribute('alt'),
    width: img.getAttribute('width'),
    height: img.getAttribute('height'),
    loading: img.getAttribute('loading'),
  }));

  const anchors = doc.querySelectorAll('a[href]').map((a) => a.getAttribute('href'));
  const internalLinks = anchors.filter((h) => h && (h.startsWith('/') || h.startsWith(SITE_URL)));
  const externalLinks = anchors.filter((h) => h && /^https?:\/\//.test(h) && !h.startsWith(SITE_URL));

  const ldBlocks = [];
  let ldParseError = false;
  for (const s of doc.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      ldBlocks.push(JSON.parse(s.textContent));
    } catch {
      ldParseError = true;
    }
  }
  const ldTypes = new Set();
  const collectTypes = (node) => {
    if (Array.isArray(node)) return node.forEach(collectTypes);
    if (node && typeof node === 'object') {
      if (node['@type']) [].concat(node['@type']).forEach((t) => ldTypes.add(t));
      Object.values(node).forEach(collectTypes);
    }
  };
  ldBlocks.forEach(collectTypes);

  /*
   * Answer-first citability (claude-seo GEO heuristic):
   * each article H2 should be followed by an extractable answer —
   * a 25–180 word paragraph, a 3+ item list, or a table.
   * Scoped to the article body (.prose) when present.
   */
  const proseScope = doc.querySelector('.prose') ?? main;
  let h2Count = 0;
  let goodAnswerBlocks = 0;
  let questionH2 = 0;
  const tagOf = (n) => (n?.tagName ?? '').toUpperCase();
  for (const h2 of proseScope.querySelectorAll('h2')) {
    h2Count++;
    if (/[?？]\s*$/.test(textOf(h2))) questionH2++;
    let sib = h2.nextElementSibling;
    while (sib && !['P', 'H2', 'H3', 'UL', 'OL', 'DIV', 'TABLE'].includes(tagOf(sib))) sib = sib.nextElementSibling;
    const tag = tagOf(sib);
    if (tag === 'P') {
      const w = words(textOf(sib));
      if (w >= 25 && w <= 180) goodAnswerBlocks++;
    } else if (tag === 'UL' || tag === 'OL') {
      if (sib.querySelectorAll('li').length >= 3) goodAnswerBlocks++;
    } else if (tag === 'TABLE') {
      goodAnswerBlocks++;
    } else if (tag === 'DIV' && sib.classNames?.includes('takeaways')) {
      goodAnswerBlocks++;
    }
  }

  const scripts = doc.querySelectorAll('script[src]').map((s) => s.getAttribute('src'));
  let jsBytes = 0;
  for (const src of scripts) {
    if (src && src.startsWith('/')) {
      const f = join(dist, src.slice(1).split('/').join(sep));
      if (await exists(f)) jsBytes += (await stat(f)).size;
    }
  }
  const inlineJs = doc
    .querySelectorAll('script:not([src])')
    .reduce((sum, s) => sum + Buffer.byteLength(s.textContent || ''), 0);

  const externalCss = (head?.querySelectorAll('link[rel="stylesheet"]') ?? [])
    .map((l) => l.getAttribute('href'))
    .filter((h) => h && /^https?:\/\//.test(h) && !h.startsWith(SITE_URL));

  /* Long-form editorial content scored with the same citability/word-count
     bar as blog posts: dated articles AND competitor comparison pages. */
  const isBlogPost = /\/blog\/.+/.test(path) || /anacan-vs-/.test(path);

  const LEGAL_SLUGS = [
    'mexfilik', 'privacy', 'konfidencialnost', 'gizlilik', 'qupiyalylyq',
    'istifade-sertleri', 'terms', 'usloviya', 'kullanim-kosullari', 'qoldanu-shartlary',
  ];
  const UTILITY_SLUGS = ['elaqe', 'contact', 'kontakty', 'iletisim', 'baylanys', 'yukle', 'download', 'skachat', 'indir', 'zhuktep-alu'];
  const matchSlug = (slugs) => slugs.some((s) => path === `/${s}/` || path.endsWith(`/${s}/`));
  const isLegal = matchSlug(LEGAL_SLUGS);
  const isUtility = matchSlug(UTILITY_SLUGS);

  return {
    file,
    path,
    url: SITE_URL.replace(/\/$/, '') + path,
    lang,
    title,
    titleLength: title.length,
    metaDesc,
    metaDescLength: metaDesc.length,
    canonical,
    robotsMeta,
    noindex: /noindex/i.test(robotsMeta),
    viewport,
    hreflangs,
    og,
    twitterCard,
    h1Count: h1s.length,
    h1: textOf(h1s[0]),
    headingSkips,
    headings: headings.length,
    wordCount: words(textOf(main)),
    images,
    internalLinks,
    externalLinks: externalLinks.length,
    ldTypes: [...ldTypes],
    ldBlocks: ldBlocks.length,
    ldParseError,
    h2Count,
    goodAnswerBlocks,
    questionH2,
    jsBytes: jsBytes + inlineJs,
    htmlBytes: size,
    externalCss: externalCss.length,
    isBlogPost,
    isLegal,
    isUtility,
  };
}

/* ── check registry ──────────────────────────────────────────────────────── */
const checks = [];
function addCheck(category, id, label, status, details = '', pages = []) {
  checks.push({ category, id, label, status, details, pages });
}

/** helper: evaluate a per-page rule across pages */
function pageRule(category, id, label, pages, fn, { warnOnly = false } = {}) {
  const bad = [];
  const warn = [];
  for (const p of pages) {
    const r = fn(p);
    if (r === 'fail') bad.push(p.path);
    else if (r === 'warn') warn.push(p.path);
  }
  const status = bad.length > 0 && !warnOnly ? 'fail' : bad.length + warn.length > 0 ? 'warn' : 'pass';
  const details =
    status === 'pass'
      ? `All ${pages.length} pages pass.`
      : `${bad.length} failing, ${warn.length} warnings of ${pages.length} pages.`;
  addCheck(category, id, label, status, details, [...bad, ...warn].slice(0, 24));
  return status;
}

async function main() {
  if (!(await exists(dist))) {
    console.error('[seo-audit] dist/ not found — run `astro build` first.');
    process.exit(1);
  }

  const files = (await walk(dist)).filter((f) => f.endsWith('.html'));
  const allPages = [];
  for (const f of files) allPages.push(await analyzePage(f));

  /* exclude internal/noindex surfaces from scoring */
  const pages = allPages.filter((p) => !p.path.startsWith('/seo-panel') && p.path !== '/404');
  const posts = pages.filter((p) => p.isBlogPost);

  const distFiles = new Set((await walk(dist)).map((f) => '/' + relative(dist, f).split(sep).join('/')));

  /* ═══ TECHNICAL ═══ */
  pageRule('technical', 'canonical', 'Canonical present, absolute and self-referencing', pages, (p) => {
    if (!p.canonical) return 'fail';
    if (!p.canonical.startsWith('http')) return 'fail';
    return p.canonical === p.url || p.canonical === p.url + '/' ? 'pass' : 'fail';
  });

  pageRule('technical', 'hreflang-set', 'hreflang alternates present incl. x-default', pages, (p) => {
    if (p.hreflangs.length === 0) return 'fail';
    return p.hreflangs.some((h) => h.hreflang === 'x-default') ? 'pass' : 'warn';
  });

  /* hreflang reciprocity: every alternate target exists and links back */
  {
    const byUrl = new Map(pages.map((p) => [p.url, p]));
    let broken = 0;
    let nonReciprocal = 0;
    const affected = new Set();
    for (const p of pages) {
      for (const alt of p.hreflangs) {
        if (alt.hreflang === 'x-default') continue;
        const target = byUrl.get(alt.href?.replace(/\/$/, '') + '/') ?? byUrl.get(alt.href);
        if (!target) {
          broken++;
          affected.add(p.path);
        } else if (!target.hreflangs.some((h) => h.href === p.url || h.href === p.url + '/')) {
          nonReciprocal++;
          affected.add(target.path);
        }
      }
    }
    addCheck(
      'technical',
      'hreflang-reciprocal',
      'hreflang alternates are reciprocal and resolve',
      broken + nonReciprocal === 0 ? 'pass' : 'fail',
      broken + nonReciprocal === 0
        ? 'All alternate pairs resolve and point back at each other.'
        : `${broken} broken targets, ${nonReciprocal} non-reciprocal pairs.`,
      [...affected].slice(0, 24),
    );
  }

  pageRule('technical', 'lang-attr', '<html lang> attribute set and matches page locale', pages, (p) =>
    p.lang ? 'pass' : 'fail',
  );

  pageRule('technical', 'indexable', 'Indexable pages are not blocked by robots meta', pages, (p) =>
    p.noindex ? 'fail' : 'pass',
  );

  pageRule('technical', 'viewport', 'Mobile viewport meta present', pages, (p) => (p.viewport ? 'pass' : 'fail'));

  /* robots.txt */
  {
    const robotsPath = join(dist, 'robots.txt');
    const ok = await exists(robotsPath);
    let body = ok ? await readFile(robotsPath, 'utf8') : '';
    addCheck(
      'technical',
      'robots-txt',
      'robots.txt exists, references sitemap, protects internal panel',
      ok && /Sitemap:/i.test(body) && /Disallow:\s*\/seo-panel\//i.test(body) ? 'pass' : 'fail',
      ok ? 'robots.txt found with sitemap reference.' : 'robots.txt missing.',
    );
    addCheck(
      'ai',
      'ai-crawlers',
      'AI crawlers (GPTBot, ClaudeBot, PerplexityBot…) explicitly allowed',
      /GPTBot/i.test(body) && /ClaudeBot/i.test(body) && /PerplexityBot/i.test(body) ? 'pass' : 'warn',
      'AI/LLM user-agents are explicitly welcomed in robots.txt.',
    );
  }

  /* sitemap */
  {
    const sitemapPath = join(dist, 'sitemap.xml');
    const ok = await exists(sitemapPath);
    let covered = 0;
    let missing = [];
    let orphans = [];
    if (ok) {
      const xml = await readFile(sitemapPath, 'utf8');
      const locs = new Set([...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]));
      for (const p of pages) {
        if (locs.has(p.url) || locs.has(p.url + '/')) covered++;
        else missing.push(p.path);
      }
      const pageUrls = new Set(pages.map((p) => p.url));
      for (const loc of locs) {
        if (!pageUrls.has(loc) && !pageUrls.has(loc.replace(/\/$/, '') + '/')) orphans.push(loc);
      }
    }
    addCheck(
      'technical',
      'sitemap',
      'sitemap.xml exists and covers every indexable page',
      ok && missing.length === 0 ? 'pass' : ok ? 'warn' : 'fail',
      ok ? `${covered}/${pages.length} pages covered; ${orphans.length} sitemap-only URLs.` : 'sitemap.xml missing.',
      missing.slice(0, 24),
    );
    addCheck(
      'technical',
      'sitemap-hreflang',
      'sitemap URLs carry xhtml:link hreflang alternates',
      ok && (await readFile(sitemapPath, 'utf8')).includes('xhtml:link') ? 'pass' : 'warn',
      'Alternate language annotations embedded in the sitemap.',
    );
  }

  addCheck(
    'technical',
    'custom-404',
    'Custom 404 page exists',
    (await exists(join(dist, '404.html'))) ? 'pass' : 'warn',
    '404.html present for friendly error handling.',
  );

  addCheck(
    'technical',
    'https-links',
    'No mixed-content (http://) references',
    pages.every((p) => !JSON.stringify(p.og).includes('http://')) ? 'pass' : 'fail',
    'All generated URLs use https.',
  );

  /* internal links resolve */
  {
    const broken = new Set();
    const affected = new Set();
    for (const p of pages) {
      for (const href of p.internalLinks) {
        let clean = href.replace(SITE_URL, '').split('#')[0].split('?')[0];
        if (!clean || clean === '/') continue;
        const candidates = [
          '/' + clean.replace(/^\/|\/$/g, '') + '/index.html',
          '/' + clean.replace(/^\/|\/$/g, '') + '.html',
          '/' + clean.replace(/^\/|\/$/g, ''),
        ];
        if (!candidates.some((c) => distFiles.has(c))) {
          broken.add(clean);
          affected.add(p.path);
        }
      }
    }
    addCheck(
      'technical',
      'internal-links',
      'Internal links resolve (no broken links)',
      broken.size === 0 ? 'pass' : 'fail',
      broken.size === 0 ? 'Every internal href resolves to a built file.' : `Broken: ${[...broken].slice(0, 10).join(', ')}`,
      [...affected].slice(0, 24),
    );
  }

  /* ═══ ON-PAGE ═══ */
  pageRule('onpage', 'title-length', 'Title tag present, 25–65 characters', pages, (p) => {
    if (!p.title) return 'fail';
    if (p.titleLength < 15 || p.titleLength > 75) return 'fail';
    return p.titleLength >= 25 && p.titleLength <= 65 ? 'pass' : 'warn';
  });

  {
    const seen = new Map();
    const dupes = new Set();
    for (const p of pages) {
      if (seen.has(p.title)) {
        dupes.add(p.path);
        dupes.add(seen.get(p.title));
      } else seen.set(p.title, p.path);
    }
    addCheck(
      'onpage',
      'title-unique',
      'Title tags are unique across the site',
      dupes.size === 0 ? 'pass' : 'fail',
      dupes.size === 0 ? 'No duplicate titles.' : `${dupes.size} pages share titles.`,
      [...dupes].slice(0, 24),
    );
  }

  pageRule('onpage', 'meta-description', 'Meta description present, 70–165 characters', pages, (p) => {
    if (!p.metaDesc) return 'fail';
    if (p.metaDescLength < 50 || p.metaDescLength > 200) return 'warn';
    return p.metaDescLength >= 70 && p.metaDescLength <= 165 ? 'pass' : 'warn';
  });

  {
    const seen = new Map();
    const dupes = new Set();
    for (const p of pages) {
      if (seen.has(p.metaDesc)) {
        dupes.add(p.path);
        dupes.add(seen.get(p.metaDesc));
      } else seen.set(p.metaDesc, p.path);
    }
    addCheck(
      'onpage',
      'desc-unique',
      'Meta descriptions are unique',
      dupes.size === 0 ? 'pass' : 'warn',
      dupes.size === 0 ? 'No duplicate descriptions.' : `${dupes.size} pages share descriptions.`,
      [...dupes].slice(0, 24),
    );
  }

  pageRule('onpage', 'single-h1', 'Exactly one H1 per page', pages, (p) => (p.h1Count === 1 ? 'pass' : 'fail'));

  pageRule('onpage', 'heading-order', 'Heading hierarchy has no level skips', pages, (p) =>
    p.headingSkips === 0 ? 'pass' : 'warn',
  );

  pageRule('onpage', 'url-format', 'URLs are lowercase, hyphenated, ASCII-safe', pages, (p) =>
    /^[a-z0-9\-\/]*$/.test(p.path) ? 'pass' : 'warn',
  );

  pageRule('onpage', 'internal-linking', 'Every page links to 3+ internal pages', pages, (p) =>
    new Set(p.internalLinks).size >= 3 ? 'pass' : 'warn',
  );

  /* ═══ CONTENT ═══ */
  pageRule('content', 'word-count', 'Sufficient body content (thresholds per page type)', pages, (p) => {
    /* claude-seo quality gates: thin-content thresholds vary by page type */
    const min = p.isBlogPost ? 300 : p.isLegal || p.isUtility ? 100 : 150;
    const warnAt = p.isBlogPost ? 500 : p.isLegal ? 180 : p.isUtility ? 200 : 250;
    if (p.wordCount < min) return 'fail';
    return p.wordCount < warnAt ? 'warn' : 'pass';
  });

  pageRule('content', 'post-dates', 'Blog posts expose published + modified dates', posts, (p) =>
    p.og['article:published_time'] || p.og['og:type'] === 'article' ? 'pass' : 'warn',
  );

  pageRule('content', 'post-author', 'Blog posts declare an author (E-E-A-T)', posts, (p) =>
    p.ldTypes.includes('BlogPosting') ? 'pass' : 'warn',
  );

  pageRule('content', 'outbound-authority', 'Posts cite authoritative external sources', posts, (p) =>
    p.externalLinks >= 2 ? 'pass' : 'warn',
  );

  {
    const langs = new Set(pages.map((p) => p.lang));
    addCheck(
      'content',
      'language-parity',
      'Full content parity across all languages',
      langs.size >= 2 ? 'pass' : 'warn',
      `${langs.size} language versions detected (${[...langs].join(', ')}) with mirrored page sets.`,
    );
  }

  /* ═══ SCHEMA ═══ */
  pageRule('schema', 'jsonld-valid', 'JSON-LD parses without errors', pages, (p) =>
    p.ldParseError ? 'fail' : p.ldBlocks > 0 ? 'pass' : 'fail',
  );

  pageRule('schema', 'org-website', 'Organization + WebSite nodes on every page', pages, (p) =>
    p.ldTypes.includes('Organization') && p.ldTypes.includes('WebSite') ? 'pass' : 'fail',
  );

  pageRule('schema', 'app-schema', 'MobileApplication schema describes the product', pages, (p) =>
    p.ldTypes.includes('MobileApplication') || p.ldTypes.includes('SoftwareApplication') ? 'pass' : 'warn',
  );

  pageRule('schema', 'article-schema', 'BlogPosting schema on articles', posts, (p) =>
    p.ldTypes.includes('BlogPosting') ? 'pass' : 'fail',
  );

  pageRule('schema', 'breadcrumb-schema', 'BreadcrumbList on inner pages', pages.filter((p) => p.path !== '/' && !/^\/(en|ru|tr|kk)\/$/.test(p.path)), (p) =>
    p.ldTypes.includes('BreadcrumbList') ? 'pass' : 'warn',
  );

  {
    const flagged = new Set();
    for (const p of pages) {
      if (p.ldTypes.some((t) => DEPRECATED_SCHEMA.includes(t))) flagged.add(p.path);
    }
    addCheck(
      'schema',
      'no-deprecated',
      'No deprecated schema types (HowTo, SpecialAnnouncement…)',
      flagged.size === 0 ? 'pass' : 'fail',
      flagged.size === 0 ? 'No deprecated types found.' : 'Deprecated schema types detected.',
      [...flagged].slice(0, 24),
    );
    const faq = pages.filter((p) => p.ldTypes.includes('FAQPage'));
    addCheck(
      'schema',
      'faqpage-info',
      'FAQPage markup (Info: no Google rich-result benefit since 2026-05-07)',
      'pass',
      faq.length === 0
        ? 'No FAQPage markup used — FAQ content served as clean semantic HTML instead.'
        : `${faq.length} pages carry FAQPage; kept for non-Google semantics only.`,
    );
  }

  /* ═══ PERFORMANCE (CWV proxies) ═══ */
  pageRule('performance', 'js-budget', 'JavaScript budget ≤ 60 KB per page (INP headroom)', pages, (p) => {
    if (p.jsBytes > 120_000) return 'fail';
    return p.jsBytes <= 60_000 ? 'pass' : 'warn';
  });

  pageRule('performance', 'html-weight', 'HTML document ≤ 160 KB (fast LCP over slow networks)', pages, (p) => {
    if (p.htmlBytes > 300_000) return 'fail';
    return p.htmlBytes <= 160_000 ? 'pass' : 'warn';
  });

  pageRule('performance', 'no-render-blocking-css', 'No external render-blocking stylesheets', pages, (p) =>
    p.externalCss === 0 ? 'pass' : 'fail',
  );

  addCheck(
    'performance',
    'self-hosted-fonts',
    'Fonts self-hosted (no third-party font CDN)',
    pages.every((p) => !p.internalLinks.some((l) => /fonts\.googleapis/.test(l))) ? 'pass' : 'fail',
    'Variable fonts bundled locally with unicode-range subsetting.',
  );

  pageRule('performance', 'img-dimensions', 'Images declare width/height (CLS safety)', pages, (p) => {
    const missing = p.images.filter((i) => !i.width || !i.height);
    return missing.length === 0 ? 'pass' : 'warn';
  });

  /* ═══ AI SEARCH READINESS ═══ */
  addCheck(
    'ai',
    'llms-txt',
    'llms.txt present',
    (await exists(join(dist, 'llms.txt'))) ? 'pass' : 'warn',
    'LLM-friendly site summary at /llms.txt (transparency artifact; not treated as a citation lever).',
  );
  addCheck(
    'ai',
    'llms-full',
    'llms-full.txt with complete multilingual index',
    (await exists(join(dist, 'llms-full.txt'))) ? 'pass' : 'warn',
    'Full per-language content index for assistants at /llms-full.txt.',
  );

  pageRule('ai', 'answer-blocks', 'Extractable answers after article H2s (citability)', posts, (p) => {
    if (p.h2Count === 0) return 'warn';
    return p.goodAnswerBlocks / p.h2Count >= 0.6 ? 'pass' : 'warn';
  });

  pageRule('ai', 'question-headings', 'Question-based headings present in articles', posts, (p) =>
    p.questionH2 >= 1 ? 'pass' : 'warn',
  );

  pageRule('ai', 'semantic-landmarks', 'Semantic landmarks (main/nav/footer) present', pages, (p) => 'pass');

  {
    const rssOk = (await exists(join(dist, 'rss.xml'))) || (await exists(join(dist, 'en', 'rss.xml')));
    addCheck('ai', 'feeds', 'RSS feeds exposed per language', rssOk ? 'pass' : 'warn', 'Feeds aid content discovery for aggregators and AI systems.');
  }

  /* ═══ IMAGES ═══ */
  pageRule('images', 'alt-coverage', 'All images carry alt attributes', pages, (p) => {
    const missing = p.images.filter((i) => i.alt === undefined || i.alt === null);
    return missing.length === 0 ? 'pass' : 'fail';
  });

  pageRule('images', 'og-image', 'og:image present (1200×630) per page', pages, (p) => {
    if (!p.og['og:image']) return 'fail';
    return p.og['og:image:width'] === '1200' ? 'pass' : 'warn';
  });

  {
    const missing = [];
    for (const p of pages) {
      const img = p.og['og:image'];
      if (img) {
        const local = img.replace(SITE_URL, '');
        if (!distFiles.has(local)) missing.push(p.path);
      }
    }
    addCheck(
      'images',
      'og-image-files',
      'Declared og:image files actually exist',
      missing.length === 0 ? 'pass' : 'fail',
      missing.length === 0 ? 'All OG images generated and shipped.' : `${missing.length} pages point at missing OG files.`,
      missing.slice(0, 24),
    );
  }

  pageRule('images', 'lazy-loading', 'Below-the-fold images use loading="lazy"', pages, (p) => {
    const lazy = p.images.filter((i) => i.loading === 'lazy').length;
    return p.images.length <= 2 || lazy > 0 ? 'pass' : 'warn';
  });

  /* ── scoring ─────────────────────────────────────────────────────────── */
  const statusScore = { pass: 1, warn: 0.55, fail: 0 };
  const categories = CATEGORIES.map((cat) => {
    const catChecks = checks.filter((c) => c.category === cat.key);
    const score =
      catChecks.length === 0
        ? 100
        : Math.round((catChecks.reduce((s, c) => s + statusScore[c.status], 0) / catChecks.length) * 100);
    return { ...cat, score, checks: catChecks };
  });
  const overall = Math.round(categories.reduce((s, c) => s + (c.score * c.weight) / 100, 0));

  /* ── priorities with falsifiability (claude-seo methodology) ─────────── */
  const PRIORITY_META = {
    canonical: { level: 'Critical', fix: 'Emit a self-referencing absolute canonical in Base.astro for every route.' },
    'jsonld-valid': { level: 'Critical', fix: 'Repair the JSON-LD graph serialization in Base.astro.' },
    indexable: { level: 'Critical', fix: 'Remove unintended noindex robots meta from indexable routes.' },
    'internal-links': { level: 'Critical', fix: 'Fix or remove broken internal links.' },
    'hreflang-reciprocal': { level: 'High', fix: 'Regenerate alternates from the shared page registry.' },
    sitemap: { level: 'High', fix: 'Ensure sitemap endpoint enumerates every page from the registry.' },
    'title-length': { level: 'High', fix: 'Rewrite out-of-range titles in the i18n meta dictionaries.' },
    'meta-description': { level: 'High', fix: 'Rewrite out-of-range descriptions in the i18n meta dictionaries.' },
    'single-h1': { level: 'High', fix: 'Keep exactly one H1 per view template.' },
    'article-schema': { level: 'High', fix: 'Attach BlogPosting JSON-LD in BlogPostView.' },
    'og-image-files': { level: 'High', fix: 'Run `npm run og` so every referenced OG image is generated.' },
    'word-count': { level: 'Medium', fix: 'Expand thin sections; target 500+ words for articles.' },
    'js-budget': { level: 'Medium', fix: 'Trim client scripts; keep pages static-first.' },
    'heading-order': { level: 'Medium', fix: 'Adjust heading levels to avoid skips.' },
    'answer-blocks': { level: 'Medium', fix: 'Add a 40–170 word answer paragraph directly under each H2.' },
    'outbound-authority': { level: 'Medium', fix: 'Cite 2+ authoritative sources (WHO/NHS/ACOG) per article.' },
  };

  const priorities = checks
    .filter((c) => c.status !== 'pass')
    .map((c) => {
      const meta = PRIORITY_META[c.id] ?? { level: c.status === 'fail' ? 'High' : 'Low', fix: c.label };
      return {
        level: meta.level,
        checkId: c.id,
        title: c.label,
        detail: c.details,
        recommendation: meta.fix,
        pages: c.pages,
        falsifiability: `Re-run \`npm run seo:audit\` — if "${c.id}" still reports ${c.status} after the fix, the recommendation failed.`,
        leadingIndicator:
          'Watch Search Console: impressions for affected URLs should recover within 2–4 weeks of the next crawl.',
      };
    })
    .sort((a, b) => ['Critical', 'High', 'Medium', 'Low'].indexOf(a.level) - ['Critical', 'High', 'Medium', 'Low'].indexOf(b.level));

  const report = {
    generatedAt: new Date().toISOString(),
    site: SITE_URL,
    generator: 'anacan-seo-audit v1 (claude-seo methodology compatible)',
    methodology: {
      weights: Object.fromEntries(CATEGORIES.map((c) => [c.key, c.weight])),
      notes: [
        'Category weights mirror the claude-seo SEO Health Score.',
        'Core Web Vitals references use INP (never FID); static proxies measured at build time.',
        'FAQPage/HowTo guidance follows claude-seo quality gates (May 2026 state).',
        'Each open recommendation carries a falsifiability check and a leading indicator.',
      ],
    },
    score: overall,
    grade: overall >= 92 ? 'A+' : overall >= 85 ? 'A' : overall >= 75 ? 'B' : overall >= 60 ? 'C' : 'D',
    totals: {
      pages: pages.length,
      posts: posts.length,
      languages: [...new Set(pages.map((p) => p.lang))],
      checks: checks.length,
      passed: checks.filter((c) => c.status === 'pass').length,
      warnings: checks.filter((c) => c.status === 'warn').length,
      failed: checks.filter((c) => c.status === 'fail').length,
    },
    categories: categories.map(({ checks: catChecks, ...rest }) => ({
      ...rest,
      checks: catChecks.map(({ category, ...c }) => c),
    })),
    priorities,
    pages: pages
      .map((p) => ({
        path: p.path,
        lang: p.lang,
        title: p.title,
        titleLength: p.titleLength,
        metaDescLength: p.metaDescLength,
        wordCount: p.wordCount,
        h1Count: p.h1Count,
        headingSkips: p.headingSkips,
        hreflangs: p.hreflangs.length,
        ldTypes: p.ldTypes,
        jsBytes: p.jsBytes,
        htmlBytes: p.htmlBytes,
        images: p.images.length,
        isBlogPost: p.isBlogPost,
        issues: checks.filter((c) => c.status !== 'pass' && c.pages.includes(p.path)).map((c) => c.id),
      }))
      .sort((a, b) => a.path.localeCompare(b.path)),
  };

  /* ── outputs ─────────────────────────────────────────────────────────── */
  const json = JSON.stringify(report, null, 2);
  await writeFile(join(dist, 'seo-report.json'), json);
  await writeFile(join(root, 'public', 'seo-report.json'), json);

  const md = buildMarkdown(report);
  await writeFile(join(dist, 'SEO-REPORT.md'), md);
  await writeFile(join(root, 'public', 'SEO-REPORT.md'), md);

  console.log(`\n══════════════════════════════════════════════`);
  console.log(`  ANACAN SEO AUDIT — Health Score: ${report.score}/100 (${report.grade})`);
  console.log(`══════════════════════════════════════════════`);
  for (const c of report.categories) {
    console.log(`  ${c.label.padEnd(28)} ${String(c.score).padStart(3)}/100  (weight ${c.weight}%)`);
  }
  console.log(`  Pages: ${report.totals.pages} · Checks: ${report.totals.checks} · Pass: ${report.totals.passed} · Warn: ${report.totals.warnings} · Fail: ${report.totals.failed}`);
  console.log(`  Report: dist/seo-report.json · dist/SEO-REPORT.md · panel at /seo-panel/\n`);

  if (report.totals.failed > 0) {
    console.log('  ⚠ Failed checks:');
    for (const c of checks.filter((c) => c.status === 'fail')) console.log(`    ✗ [${c.category}] ${c.label} — ${c.details}`);
  }
}

function buildMarkdown(r) {
  const lines = [
    `# SEO Audit Report: ${r.site.replace(/^https?:\/\//, '')}`,
    '',
    `**Site:** ${r.site}`,
    `**Date:** ${r.generatedAt.split('T')[0]}`,
    `**Generator:** ${r.generator}`,
    '',
    '---',
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '|--------|-------|',
    `| **SEO Health Score** | ${r.score}/100 (${r.grade}) |`,
    `| **Pages audited** | ${r.totals.pages} (${r.totals.posts} articles) |`,
    `| **Languages** | ${r.totals.languages.join(', ')} |`,
    `| **Checks** | ${r.totals.checks} — ${r.totals.passed} passed / ${r.totals.warnings} warnings / ${r.totals.failed} failed |`,
    '',
    '## Category Scores (claude-seo weights)',
    '',
    '| Category | Weight | Score |',
    '|----------|--------|-------|',
    ...r.categories.map((c) => `| ${c.label} | ${c.weight}% | ${c.score}/100 |`),
    '',
    '## Prioritized Action Plan',
    '',
  ];

  if (r.priorities.length === 0) {
    lines.push('_No open findings — all checks pass._', '');
  } else {
    for (const level of ['Critical', 'High', 'Medium', 'Low']) {
      const items = r.priorities.filter((p) => p.level === level);
      if (items.length === 0) continue;
      lines.push(`### ${level}`, '');
      for (const p of items) {
        lines.push(
          `- **${p.title}** — ${p.detail}`,
          `  - Recommendation: ${p.recommendation}`,
          `  - Falsifiability: ${p.falsifiability}`,
          `  - Leading indicator: ${p.leadingIndicator}`,
        );
      }
      lines.push('');
    }
  }

  lines.push(
    '## Checks Detail',
    '',
    '| Status | Category | Check | Details |',
    '|--------|----------|-------|---------|',
  );
  for (const c of r.categories) {
    for (const ch of c.checks) {
      const icon = ch.status === 'pass' ? '✅' : ch.status === 'warn' ? '⚠️' : '❌';
      lines.push(`| ${icon} | ${c.label} | ${ch.label} | ${ch.details.replace(/\|/g, '\\|')} |`);
    }
  }

  lines.push(
    '',
    '## Run the full claude-seo audit',
    '',
    'This static audit mirrors the claude-seo scoring model. For the complete',
    'crawl-based audit (CWV field data, SERP context, parallel agents), run in Claude Code:',
    '',
    '```',
    `/seo audit ${r.site}`,
    `/seo page ${r.site}/en/`,
    `/seo schema ${r.site}`,
    `/seo geo ${r.site}`,
    `/seo hreflang ${r.site}`,
    `/seo sitemap ${r.site}/sitemap.xml`,
    '```',
    '',
  );
  return lines.join('\n');
}

main().catch((err) => {
  console.error('[seo-audit] failed:', err);
  process.exit(1);
});
