import { getCollection, type CollectionEntry } from 'astro:content';
import { langPrefix } from '@/config/languages';
import { pageSlug } from '@/config/pages';

export type CompetitorEntry = CollectionEntry<'competitors'>;

export interface CompetitorPage {
  entry: CompetitorEntry;
  lang: string;
  slug: string; // "anacan-vs-<competitorSlug>"
  path: string;
  readingTime: number;
}

function wordCount(body: string): number {
  return body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_\-[\]()!`]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
}

/** URL path for a competitor comparison page. */
export function competitorPath(lang: string, competitorSlug: string): string {
  return `${langPrefix(lang)}/${pageSlug('competitors', lang)}/anacan-vs-${competitorSlug}/`;
}

function toPage(entry: CompetitorEntry): CompetitorPage {
  const [lang] = entry.id.split('/');
  return {
    entry,
    lang,
    slug: `anacan-vs-${entry.data.competitorSlug}`,
    path: competitorPath(lang, entry.data.competitorSlug),
    readingTime: Math.max(1, Math.round(wordCount(entry.body ?? '') / 200)),
  };
}

/** All published comparison pages, optionally for one language. */
export async function getCompetitorPages(lang?: string): Promise<CompetitorPage[]> {
  const entries = await getCollection('competitors', ({ data }) => !data.draft);
  return entries
    .map(toPage)
    .filter((p) => (lang ? p.lang === lang : true))
    .sort((a, b) => a.entry.data.competitor.localeCompare(b.entry.data.competitor));
}

/** Translations of the same comparison across languages (hreflang + switcher). */
export async function getCompetitorAlternates(translationKey: string): Promise<CompetitorPage[]> {
  const entries = await getCollection(
    'competitors',
    ({ data }) => data.translationKey === translationKey && !data.draft,
  );
  return entries.map(toPage);
}
