import rss from '@astrojs/rss';
import type { APIRoute, GetStaticPaths } from 'astro';
import { SITE } from '@/config/site';
import { LANGUAGES, DEFAULT_LANG, getLanguage } from '@/config/languages';
import { useTranslations } from '@/i18n';
import { getPosts } from '@/utils/blog';

/** Per-language RSS feeds at /<lang>/rss.xml (default language lives at /rss.xml) */
export const getStaticPaths = (() =>
  LANGUAGES.filter((l) => l.code !== DEFAULT_LANG).map((l) => ({
    params: { lang: l.code },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params, site }) => {
  const lang = params.lang as string;
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
