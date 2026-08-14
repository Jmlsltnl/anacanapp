/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  BLOG SYNC — pulls the SAME blog posts the mobile app shows (Supabase
 *  `blog_posts` table) and writes them as static content files.
 *
 *    npm run blog:sync            # sync all published posts
 *    npm run blog:sync -- --wipe  # remove previously generated files first
 *
 *  Source of truth: the app's database.
 *    • az   -> base columns (title/excerpt/content)
 *    • en   -> *_en   • ru -> *_ru   • tr -> *_tr
 *    • kk   -> falls back to ru, then base (exactly like the app's
 *              mapRowTranslation kk→ru→base behavior)
 *
 *  Credentials: read from env (SUPABASE_URL / SUPABASE_ANON_KEY) or
 *  automatically from the app repo's .env one directory up.
 *
 *  Output: src/content/blog/<lang>/<slug>.md  (frontmatter + sanitized HTML)
 *  Everything downstream (routes, hreflang, sitemap, RSS, llms.txt, OG
 *  images, SEO audit) picks the files up automatically on next build.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { readFile, writeFile, mkdir, readdir, rm, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'src/content/blog');
const WIPE = process.argv.includes('--wipe');

const GENERATED_MARK = 'anacan-app-db';

/** Site languages that mirror app DB columns (kk uses the fallback chain). */
const LANGS = [
  { code: 'az', pick: (p, f) => p[f] },
  { code: 'en', pick: (p, f) => p[`${f}_en`] || p[f] },
  { code: 'ru', pick: (p, f) => p[`${f}_ru`] || p[f] },
  { code: 'tr', pick: (p, f) => p[`${f}_tr`] || p[f] },
  { code: 'kk', pick: (p, f) => p[`${f}_kk`] || p[`${f}_ru`] || p[f] }, // app parity: kk→ru→base
];

/** life_stage -> site category + card theme + fallback emoji */
const STAGE_MAP = {
  flow: { category: 'cycle', theme: 'flow', emoji: '🌸' },
  bump: { category: 'pregnancy', theme: 'bump', emoji: '🤰' },
  mommy: { category: 'motherhood', theme: 'mommy', emoji: '🍼' },
  partner: { category: 'partner', theme: 'partner', emoji: '🤝' },
  all: { category: 'health', theme: 'bump', emoji: '💛' },
};

const exists = (p) => access(p).then(() => true, () => false);

async function credentials() {
  let url = process.env.SUPABASE_URL;
  let key = process.env.SUPABASE_ANON_KEY;
  if (url && key) return { url, key };

  /* fall back to the mobile app's .env (site lives inside the app repo) */
  for (const envPath of [join(root, '.env'), join(root, '..', '.env')]) {
    if (await exists(envPath)) {
      const env = await readFile(envPath, 'utf8');
      url ??= env.match(/(?:VITE_)?SUPABASE_URL="?([^"\r\n]+)/)?.[1];
      key ??= env.match(/(?:VITE_)?SUPABASE_(?:PUBLISHABLE_KEY|ANON_KEY)="?([^"\r\n]+)/)?.[1];
      if (url && key) return { url, key };
    }
  }
  throw new Error('Supabase credentials not found (env or ../.env).');
}

/* ── content sanitization ────────────────────────────────────────────────── */
function sanitizeHtml(html) {
  if (!html) return '';
  let out = html;
  out = out.replace(/<script[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<style[\s\S]*?<\/style>/gi, '');
  out = out.replace(/\son\w+="[^"]*"/gi, '');
  out = out.replace(/\son\w+='[^']*'/gi, '');
  out = out.replace(/href="javascript:[^"]*"/gi, 'href="#"');
  /* single H1 per page: demote in-content h1s */
  out = out.replace(/<h1(\s[^>]*)?>/gi, '<h2>').replace(/<\/h1>/gi, '</h2>');
  /* CLS + perf hints on content images */
  out = out.replace(/<img\b([^>]*?)\/?>/gi, (m, attrs) => {
    let a = attrs;
    if (!/\bloading=/.test(a)) a += ' loading="lazy"';
    if (!/\bdecoding=/.test(a)) a += ' decoding="async"';
    if (!/\bwidth=/.test(a)) a += ' width="800"';
    if (!/\bheight=/.test(a)) a += ' height="450"';
    if (!/\balt=/.test(a)) a += ' alt=""';
    return `<img${a}>`;
  });
  return out.trim();
}

const stripTags = (html) => (html ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/* ── URL-safe slugs ──────────────────────────────────────────────────────────
 * Some DB slugs contain raw Azerbaijani letters (ə, ö, ş, ı…), which break
 * canonical/hreflang consistency and file naming. We transliterate to ASCII
 * for the URL while keeping the ORIGINAL DB slug as translationKey.
 */
const AZ_TRANSLIT = {
  ə: 'e', ö: 'o', ü: 'u', ı: 'i', ş: 's', ç: 'c', ğ: 'g', ѐ: 'e',
};

function asciiSlug(input) {
  let s = String(input).toLowerCase();
  s = s.replace(/i̇/g, 'i'); // dotted-i decomposition artifact
  s = s.replace(/[əöüışçğ]/g, (ch) => AZ_TRANSLIT[ch] ?? ch);
  s = s.normalize('NFKD').replace(/[\u0300-\u036f]/g, ''); // strip remaining diacritics
  s = s.replace(/[^a-z0-9]+/g, '-').replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '');
  return s || 'post';
}

function truncate(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1).replace(/\s+\S*$/, '');
  return `${cut}…`;
}

/** description: excerpt (70–160 chars), padded from content when too short */
function buildDescription(excerpt, contentHtml) {
  let desc = stripTags(excerpt);
  if (desc.length < 70) {
    const body = stripTags(contentHtml);
    desc = desc ? `${desc} ${body.slice(0, 200)}` : body.slice(0, 220);
    desc = desc.replace(/\s+/g, ' ').trim();
  }
  return truncate(desc, 160);
}

const yaml = (v) => JSON.stringify(v ?? '');

async function main() {
  const { url, key } = await credentials();
  const headers = { apikey: key, Authorization: `Bearer ${key}` };

  console.log(`Fetching published posts from ${new URL(url).host} …`);
  const res = await fetch(
    `${url}/rest/v1/blog_posts?is_published=eq.true&select=*&order=created_at.desc&limit=1000`,
    { headers },
  );
  if (!res.ok) throw new Error(`Supabase responded ${res.status}: ${await res.text()}`);
  const posts = await res.json();
  console.log(`Fetched ${posts.length} published posts.\n`);

  /* wipe previously generated files (keeps any hand-written ones intact) */
  if (WIPE && (await exists(OUT))) {
    for (const lang of await readdir(OUT)) {
      const dir = join(OUT, lang);
      for (const file of await readdir(dir)) {
        const text = await readFile(join(dir, file), 'utf8');
        if (text.includes(GENERATED_MARK)) await rm(join(dir, file));
      }
    }
    console.log('Wiped previously synced files.\n');
  }

  let written = 0;
  const seenFeatured = new Set();
  const usedSlugs = new Map(); // asciiSlug -> db slug (collision guard)

  for (const post of posts) {
    const stage = STAGE_MAP[post.life_stage] ?? STAGE_MAP.all;
    let slug = asciiSlug(post.slug);
    if (usedSlugs.has(slug) && usedSlugs.get(slug) !== post.slug) {
      slug = `${slug}-${post.id.slice(0, 6)}`;
    }
    usedSlugs.set(slug, post.slug);
    const pubDate = (post.created_at ?? new Date().toISOString()).slice(0, 10);
    const updated = post.updated_at && post.updated_at > post.created_at ? post.updated_at.slice(0, 10) : null;

    for (const { code, pick } of LANGS) {
      const title = (pick(post, 'title') ?? '').trim();
      const contentHtml = sanitizeHtml(pick(post, 'content'));
      if (!title || !contentHtml) continue;

      const description = buildDescription(pick(post, 'excerpt'), contentHtml);
      const tags = (code === 'az' ? post.tags : post.tags_en?.length ? post.tags_en : post.tags) ?? [];
      /* one featured post per language keeps the hero slot deterministic */
      const featured = Boolean(post.is_featured) && !seenFeatured.has(code);
      if (featured) seenFeatured.add(code);

      const fm = [
        '---',
        `# generated: ${GENERATED_MARK} (npm run blog:sync) — do not edit by hand`,
        `title: ${yaml(truncate(title, 118))}`,
        `description: ${yaml(description)}`,
        `pubDate: ${pubDate}`,
        ...(updated ? [`updatedDate: ${updated}`] : []),
        `category: ${stage.category}`,
        `tags: ${JSON.stringify((tags ?? []).slice(0, 8))}`,
        `author: ${yaml(post.author_name || 'Anacan')}`,
        `translationKey: ${yaml(post.slug)}`,
        `theme: ${stage.theme}`,
        `emoji: ${yaml(stage.emoji)}`,
        ...(post.cover_image_url ? [`cover: ${yaml(post.cover_image_url)}`] : []),
        ...(featured ? ['featured: true'] : []),
        '---',
        '',
      ].join('\n');

      const dir = join(OUT, code);
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, `${slug}.md`), `${fm}${contentHtml}\n`);
      written++;
    }
  }

  console.log(`✓ Wrote ${written} files (${posts.length} posts × up to ${LANGS.length} languages) into src/content/blog/`);
  console.log('\nNext: npm run og   (post OG cards)  →  npm run build');
}

main().catch((err) => {
  console.error('[sync-blog] failed:', err.message);
  process.exit(1);
});
