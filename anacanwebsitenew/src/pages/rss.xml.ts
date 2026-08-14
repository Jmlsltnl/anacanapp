import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { SITE } from '@/config/site';
import { DEFAULT_LANG, getLanguage } from '@/config/languages';
import { useTranslations } from '@/i18n';
import { getPosts } from '@/utils/blog';

/** RSS feed for the default language (az) at /rss.xml */
export const GET: APIRoute = async ({ site }) => {
  const lang = DEFAULT_LANG;
  const t = useTranslations(lang);
  const posts = await getPosts(lang);

  return rss({
    title: `${SITE.name} — ${t('blog.eyebrow')}`,
    description: t('meta.blog.description'),
    site: site!,
    customData: `<language>${getLanguage(lang).bcp47.toLowerCase()}</language>`,
    items: posts.map((post) => ({
      title: post.entry.data.title,
      description: post.entry.data.description,
      pubDate: post.entry.data.pubDate,
      link: post.path,
      categories: [post.entry.data.category, ...post.entry.data.tags],
      author: `${SITE.email} (${post.entry.data.author ?? t('blog.authorName')})`,
    })),
  });
};
