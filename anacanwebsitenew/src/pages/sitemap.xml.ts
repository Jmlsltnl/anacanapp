import type { APIRoute } from 'astro';
import { LANGUAGES, DEFAULT_LANG, getLanguage } from '@/config/languages';
import { PAGES, pagePath } from '@/config/pages';
import { getPosts, getAlternates } from '@/utils/blog';
import { getCompetitorPages, getCompetitorAlternates } from '@/utils/competitors';

/**
 * sitemap.xml with full hreflang alternate annotations (xhtml:link)
 * and image extensions for blog cover images.
 * Every language + every blog post is included automatically.
 */
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: APIRoute = async ({ site }) => {
  const abs = (path: string) => new URL(path, site).href;
  const buildDate = new Date().toISOString().split('T')[0];

  interface UrlEntry {
    loc: string;
    lastmod: string;
    changefreq: string;
    priority: number;
    alternates: { hreflang: string; href: string }[];
    image?: { loc: string; title: string };
  }

  const entries: UrlEntry[] = [];

  /* Static pages × languages */
  for (const page of PAGES) {
    const alternates = LANGUAGES.map((l) => ({
      hreflang: l.bcp47,
      href: abs(pagePath(page.key, l.code)),
    }));
    alternates.push({ hreflang: 'x-default', href: abs(pagePath(page.key, DEFAULT_LANG)) });

    for (const l of LANGUAGES) {
      entries.push({
        loc: abs(pagePath(page.key, l.code)),
        lastmod: buildDate,
        changefreq: page.changefreq,
        priority: page.priority,
        alternates,
      });
    }
  }

  /* Blog posts × languages (alternates via translationKey) */
  const posts = await getPosts();
  const alternatesCache = new Map<string, { hreflang: string; href: string }[]>();

  for (const post of posts) {
    const key = post.entry.data.translationKey;
    let alternates = alternatesCache.get(key);
    if (!alternates) {
      const siblings = await getAlternates(key);
      alternates = siblings.map((p) => ({
        hreflang: getLanguage(p.lang).bcp47,
        href: abs(p.path),
      }));
      const xDefault = siblings.find((p) => p.lang === DEFAULT_LANG) ?? siblings[0];
      if (xDefault) alternates.push({ hreflang: 'x-default', href: abs(xDefault.path) });
      alternatesCache.set(key, alternates);
    }

    const lastmod = (post.entry.data.updatedDate ?? post.entry.data.pubDate).toISOString().split('T')[0];
    entries.push({
      loc: abs(post.path),
      lastmod,
      changefreq: 'monthly',
      priority: 0.7,
      alternates,
      image: {
        loc: abs(`/og/blog/${post.lang}/${post.slug}.png`),
        title: post.entry.data.title,
      },
    });
  }

  /* Competitor comparison pages × languages (alternates via translationKey) */
  const competitorPages = await getCompetitorPages();
  const competitorAlternatesCache = new Map<string, { hreflang: string; href: string }[]>();

  for (const cp of competitorPages) {
    const key = cp.entry.data.translationKey;
    let alternates = competitorAlternatesCache.get(key);
    if (!alternates) {
      const siblings = await getCompetitorAlternates(key);
      alternates = siblings.map((p) => ({
        hreflang: getLanguage(p.lang).bcp47,
        href: abs(p.path),
      }));
      const xDefault = siblings.find((p) => p.lang === DEFAULT_LANG) ?? siblings[0];
      if (xDefault) alternates.push({ hreflang: 'x-default', href: abs(xDefault.path) });
      competitorAlternatesCache.set(key, alternates);
    }

    const lastmod = (cp.entry.data.updatedDate ?? cp.entry.data.pubDate).toISOString().split('T')[0];
    entries.push({
      loc: abs(cp.path),
      lastmod,
      changefreq: 'monthly',
      priority: 0.7,
      alternates,
      image: {
        loc: abs(`/og/blog/${cp.lang}/${cp.slug}.png`),
        title: cp.entry.data.title,
      },
    });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries
  .map(
    (e) => `  <url>
    <loc>${esc(e.loc)}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority.toFixed(1)}</priority>
${e.alternates.map((a) => `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${esc(a.href)}"/>`).join('\n')}${
      e.image
        ? `\n    <image:image>\n      <image:loc>${esc(e.image.loc)}</image:loc>\n      <image:title>${esc(e.image.title)}</image:title>\n    </image:image>`
        : ''
    }
  </url>`,
  )
  .join('\n')}
</urlset>
`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
