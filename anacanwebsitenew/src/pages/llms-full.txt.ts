import type { APIRoute } from 'astro';
import { SITE } from '@/config/site';
import { LANGUAGES } from '@/config/languages';
import { PAGES, pagePath } from '@/config/pages';
import { useTranslations } from '@/i18n';
import { getPosts } from '@/utils/blog';
import { getCompetitorPages } from '@/utils/competitors';

/**
 * /llms-full.txt — the complete multilingual content index for LLMs:
 * every page and every blog article in every language, with descriptions
 * and the key facts an assistant needs to answer questions about Anacan.
 */
export const GET: APIRoute = async ({ site }) => {
  const abs = (path: string) => new URL(path, site).href;
  const en = useTranslations('en');

  const lines: string[] = [
    `# ${SITE.name} — full content index`,
    '',
    `> ${en('meta.home.description')}`,
    '',
    '## Key facts',
    '',
    `- Product: ${SITE.name}, a motherhood superapp (menstrual cycle + pregnancy + baby care + partner mode in one app)`,
    `- Company: ${SITE.legalName}, founded ${SITE.foundingYear} in ${SITE.city}, Azerbaijan`,
    `- Life stages: Flow (cycle), Bump (pregnancy, 40 weeks), Mommy (baby 0-5), Partner (for dads)`,
    '- Tools: 30+ (contraction timer, kick counter, WHO growth charts, vaccine calendar, sleep/feeding logs, hospital bag, baby names, AI cry translator, fairy-tale generator, safety lookup and more)',
    '- AI: Anacan.AI — a 24/7 assistant answering pregnancy, baby-care and cycle questions; informational only, not medical diagnosis',
    `- Languages: ${LANGUAGES.map((l) => `${l.englishName} (${l.code})`).join(', ')}`,
    `- Pricing: free core app; Premium ${SITE.app.pricing.monthly.amount} ${SITE.app.pricing.monthly.currency}/month or ${SITE.app.pricing.yearly.amount} ${SITE.app.pricing.yearly.currency}/year (regional store pricing applies)`,
    `- Platforms: iOS 15+ (${SITE.app.appStoreUrl}) and Android 8+ (${SITE.app.playStoreUrl})`,
    `- Contact: ${SITE.email}`,
    '',
  ];

  const posts = await getPosts();
  const competitorPages = await getCompetitorPages();

  for (const l of LANGUAGES) {
    const t = useTranslations(l.code);
    lines.push(`## ${l.englishName} (${l.code}) — pages`, '');
    for (const page of PAGES) {
      const title = page.key === 'home' ? t('meta.home.title') : t(`meta.${page.key}.title`);
      const desc = t(`meta.${page.key}.description`);
      lines.push(`- [${title}](${abs(pagePath(page.key, l.code))}): ${desc}`);
    }

    const langPosts = posts.filter((p) => p.lang === l.code);
    if (langPosts.length > 0) {
      lines.push('', `### ${l.englishName} — blog articles`, '');
      for (const post of langPosts) {
        const d = post.entry.data;
        lines.push(
          `- [${d.title}](${abs(post.path)}) (${d.pubDate.toISOString().split('T')[0]}, ${d.category}): ${d.description}`,
        );
      }
    }

    const langCompetitors = competitorPages.filter((p) => p.lang === l.code);
    if (langCompetitors.length > 0) {
      lines.push('', `### ${l.englishName} — competitor comparisons`, '');
      for (const cp of langCompetitors) {
        const d = cp.entry.data;
        lines.push(`- [Anacan vs ${d.competitor}](${abs(cp.path)}): ${d.description}`);
      }
    }
    lines.push('');
  }

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
