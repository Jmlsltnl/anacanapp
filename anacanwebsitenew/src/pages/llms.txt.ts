import type { APIRoute } from 'astro';
import { SITE } from '@/config/site';
import { LANGUAGES } from '@/config/languages';
import { PAGES, pagePath } from '@/config/pages';
import { useTranslations } from '@/i18n';
import { getPosts } from '@/utils/blog';

/**
 * /llms.txt — concise, LLM-friendly site map (llmstxt.org convention).
 * Generated from the same registries that drive routes, so it can never drift.
 */
export const GET: APIRoute = async ({ site }) => {
  const abs = (path: string) => new URL(path, site).href;
  const en = useTranslations('en');

  const corePages = PAGES.filter((p) => !['privacy', 'terms'].includes(p.key));

  const lines: string[] = [
    `# ${SITE.name}`,
    '',
    `> ${en('meta.home.description')}`,
    '',
    `${SITE.name} ("mom-dear" in Azerbaijani) is a motherhood superapp by ${SITE.legalName} (${SITE.city}, Azerbaijan). One app covers four life stages: Flow (menstrual-cycle tracking), Bump (40-week pregnancy tracking), Mommy (baby care and development) and Partner (a dedicated mode for dads). It ships 30+ tools, a 24/7 AI assistant (Anacan.AI) and a mothers' community, fully localized in ${LANGUAGES.length} languages: ${LANGUAGES.map((l) => l.englishName).join(', ')}.`,
    '',
    `The app is free with an optional Premium subscription. iOS: ${SITE.app.appStoreUrl} — Android: ${SITE.app.playStoreUrl}`,
    '',
    '## Core pages (English)',
    '',
  ];

  for (const page of corePages) {
    const title = page.key === 'home' ? en('meta.home.title') : en(`meta.${page.key}.title`);
    const desc = en(`meta.${page.key}.description`);
    lines.push(`- [${title}](${abs(pagePath(page.key, 'en'))}): ${desc}`);
  }

  lines.push('', '## Languages', '');
  for (const l of LANGUAGES) {
    lines.push(`- [${l.nativeName} (${l.englishName})](${abs(pagePath('home', l.code))}): full site in ${l.englishName}`);
  }

  const enPosts = await getPosts('en');
  if (enPosts.length > 0) {
    lines.push('', '## Blog (English — every article is also available in all languages)', '');
    for (const post of enPosts) {
      lines.push(`- [${post.entry.data.title}](${abs(post.path)}): ${post.entry.data.description}`);
    }
  }

  lines.push(
    '',
    '## Optional',
    '',
    `- [Privacy Policy](${abs(pagePath('privacy', 'en'))}): how user data is collected and protected`,
    `- [Terms of Use](${abs(pagePath('terms', 'en'))}): service terms and medical disclaimer`,
    `- [Full content index](${abs('/llms-full.txt')}): every page and article in every language`,
    '',
    '## Contact',
    '',
    `- Email: ${SITE.email}`,
    `- Company: ${SITE.legalName}, ${SITE.city}, Azerbaijan`,
    '',
  );

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
