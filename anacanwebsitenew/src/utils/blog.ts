import { getCollection, type CollectionEntry } from 'astro:content';
import { blogPostPath } from '@/config/pages';

export type BlogEntry = CollectionEntry<'blog'>;

export interface BlogPost {
  entry: BlogEntry;
  lang: string;
  slug: string;
  path: string;
  readingTime: number;
}

function wordCount(body: string): number {
  return body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_\-\[\]()!`]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
}

export function toPost(entry: BlogEntry): BlogPost {
  const [lang, ...rest] = entry.id.split('/');
  const slug = rest.join('/');
  return {
    entry,
    lang,
    slug,
    path: blogPostPath(lang, slug),
    readingTime: Math.max(1, Math.round(wordCount(entry.body ?? '') / 200)),
  };
}

/** All published posts, optionally for one language, newest first. */
export async function getPosts(lang?: string): Promise<BlogPost[]> {
  const entries = await getCollection('blog', ({ data }) => !data.draft);
  return entries
    .map(toPost)
    .filter((p) => (lang ? p.lang === lang : true))
    .sort((a, b) => b.entry.data.pubDate.valueOf() - a.entry.data.pubDate.valueOf());
}

/** Translations of the same article across languages (for hreflang + switcher). */
export async function getAlternates(translationKey: string): Promise<BlogPost[]> {
  const entries = await getCollection(
    'blog',
    ({ data }) => data.translationKey === translationKey && !data.draft,
  );
  return entries.map(toPost);
}

/** Related posts: same language, shares category or a tag, excludes self. */
export async function getRelated(post: BlogPost, limit = 3): Promise<BlogPost[]> {
  const all = await getPosts(post.lang);
  return all
    .filter((p) => p.slug !== post.slug)
    .map((p) => ({
      p,
      score:
        (p.entry.data.category === post.entry.data.category ? 2 : 0) +
        p.entry.data.tags.filter((t) => post.entry.data.tags.includes(t)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ p }) => p);
}

export function formatDate(date: Date, dateLocale: string): string {
  return new Intl.DateTimeFormat(dateLocale, { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
}
