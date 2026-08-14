/**
 * Global competitor registry — the "major competitor" set used to generate
 * /compare/anacan-vs-<slug>/ pages in every language.
 *
 * This is a FACTS-ONLY registry (founding data, category, website) used for
 * the at-a-glance comparison table markup shared by every language version.
 * The actual long-form narrative content lives in
 * src/content/competitors/<lang>/anacan-vs-<slug>.md (hand-written per language,
 * not spun/duplicated, to stay clear of thin/duplicate-content risk).
 *
 * Add a new competitor: add an entry here, then create 5 markdown files
 * (one per language) at src/content/competitors/<lang>/anacan-vs-<slug>.md.
 */
export interface CompetitorFacts {
  slug: string;
  name: string;
  website: string;
  founded: string;
  hq: string;
  category: 'period-tracker' | 'pregnancy-tracker' | 'parenting-community' | 'fertility';
  /** Rough platform coverage */
  platforms: string;
}

export const COMPETITORS: CompetitorFacts[] = [
  { slug: 'flo', name: 'Flo', website: 'https://flo.health', founded: '2015', hq: 'London / Cyprus', category: 'period-tracker', platforms: 'iOS, Android' },
  { slug: 'clue', name: 'Clue', website: 'https://helloclue.com', founded: '2013', hq: 'Berlin, Germany', category: 'period-tracker', platforms: 'iOS, Android' },
  { slug: 'ovia-health', name: 'Ovia Health', website: 'https://oviahealth.com', founded: '2012', hq: 'Boston, USA', category: 'pregnancy-tracker', platforms: 'iOS, Android' },
  { slug: 'what-to-expect', name: 'What to Expect', website: 'https://www.whattoexpect.com', founded: '2008 (app)', hq: 'New York, USA', category: 'pregnancy-tracker', platforms: 'iOS, Android' },
  { slug: 'pregnancy-plus', name: 'Pregnancy+', website: 'https://www.pregnancyplusapp.com', founded: '2011', hq: 'Malta', category: 'pregnancy-tracker', platforms: 'iOS, Android' },
  { slug: 'babycenter', name: 'BabyCenter', website: 'https://www.babycenter.com', founded: '1997', hq: 'San Francisco, USA', category: 'parenting-community', platforms: 'iOS, Android, Web' },
  { slug: 'natural-cycles', name: 'Natural Cycles', website: 'https://www.naturalcycles.com', founded: '2013', hq: 'Stockholm, Sweden', category: 'fertility', platforms: 'iOS, Android' },
  { slug: 'peanut', name: 'Peanut', website: 'https://www.peanut-app.io', founded: '2016', hq: 'London, UK', category: 'parenting-community', platforms: 'iOS, Android' },
];

export const COMPETITOR_MAP: Record<string, CompetitorFacts> = Object.fromEntries(
  COMPETITORS.map((c) => [c.slug, c]),
);
