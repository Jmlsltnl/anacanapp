import { DEFAULT_LANG, langPrefix } from './languages';

/**
 * Static page registry with per-language SEO slugs.
 * Slugs are localized for stronger on-page relevance (keyword-in-URL) while
 * `key` stays stable for hreflang pairing, nav links and the SEO panel.
 *
 * A language without an explicit slug falls back to the `en` slug, so adding
 * a new language never breaks routing.
 */
export type PageKey =
  | 'home'
  | 'features'
  | 'flow'
  | 'bump'
  | 'mommy'
  | 'partner'
  | 'ai'
  | 'premium'
  | 'blog'
  | 'about'
  | 'download'
  | 'contact'
  | 'faq'
  | 'privacy'
  | 'terms'
  | 'ovulation'
  | 'symptoms'
  | 'competitors';

export interface PageDef {
  key: PageKey;
  /** Per-language URL slug ('' only for home). Falls back to `en`. */
  slugs: Record<string, string>;
  /** Included in sitemap/llms (seo-panel & co. are excluded elsewhere) */
  priority: number;
  changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly';
  /** Show in header nav / footer group */
  nav?: 'header' | 'footer-product' | 'footer-company' | 'footer-resources' | 'footer-legal';
}

export const PAGES: PageDef[] = [
  { key: 'home', slugs: { en: '' }, priority: 1.0, changefreq: 'weekly' },
  {
    key: 'features',
    slugs: { en: 'features', az: 'funksiyalar', ru: 'vozmozhnosti', tr: 'ozellikler', kk: 'mumkindikter' },
    priority: 0.9,
    changefreq: 'monthly',
    nav: 'header',
  },
  {
    key: 'flow',
    slugs: { en: 'cycle-tracker', az: 'tsikl-izleyicisi', ru: 'otslezhivanie-tsikla', tr: 'dongu-takibi', kk: 'tsikl-baqylauy' },
    priority: 0.9,
    changefreq: 'monthly',
    nav: 'footer-product',
  },
  {
    key: 'bump',
    slugs: { en: 'pregnancy-tracker', az: 'hamilelik-izleyicisi', ru: 'kalendar-beremennosti', tr: 'gebelik-takibi', kk: 'zhuktilik-baqylauy' },
    priority: 0.9,
    changefreq: 'monthly',
    nav: 'footer-product',
  },
  {
    key: 'mommy',
    slugs: { en: 'baby-tracker', az: 'ana-ve-korpe', ru: 'razvitie-malysha', tr: 'anne-bebek-takibi', kk: 'ana-men-sabi' },
    priority: 0.9,
    changefreq: 'monthly',
    nav: 'footer-product',
  },
  {
    key: 'partner',
    slugs: { en: 'partner-mode', az: 'ata-rejimi', ru: 'rezhim-partnera', tr: 'baba-modu', kk: 'serikte-rezhimi' },
    priority: 0.9,
    changefreq: 'monthly',
    nav: 'footer-product',
  },
  {
    key: 'ai',
    slugs: { en: 'anacan-ai' },
    priority: 0.9,
    changefreq: 'monthly',
    nav: 'header',
  },
  {
    key: 'premium',
    slugs: { en: 'premium' },
    priority: 0.8,
    changefreq: 'monthly',
    nav: 'header',
  },
  {
    key: 'blog',
    slugs: { en: 'blog' },
    priority: 0.8,
    changefreq: 'daily',
    nav: 'header',
  },
  {
    key: 'about',
    slugs: { en: 'about', az: 'haqqimizda', ru: 'o-nas', tr: 'hakkimizda', kk: 'biz-turaly' },
    priority: 0.7,
    changefreq: 'monthly',
    nav: 'footer-company',
  },
  {
    key: 'download',
    slugs: { en: 'download', az: 'yukle', ru: 'skachat', tr: 'indir', kk: 'zhuktep-alu' },
    priority: 0.8,
    changefreq: 'monthly',
    nav: 'footer-product',
  },
  {
    key: 'contact',
    slugs: { en: 'contact', az: 'elaqe', ru: 'kontakty', tr: 'iletisim', kk: 'baylanys' },
    priority: 0.6,
    changefreq: 'yearly',
    nav: 'footer-company',
  },
  {
    key: 'faq',
    slugs: { en: 'faq', az: 'suallar', ru: 'voprosy', tr: 'sss', kk: 'suraqtar' },
    priority: 0.7,
    changefreq: 'monthly',
    nav: 'footer-resources',
  },
  {
    key: 'privacy',
    slugs: { en: 'privacy', az: 'mexfilik', ru: 'konfidencialnost', tr: 'gizlilik', kk: 'qupiyalylyq' },
    priority: 0.3,
    changefreq: 'yearly',
    nav: 'footer-legal',
  },
  {
    key: 'terms',
    slugs: { en: 'terms', az: 'istifade-sertleri', ru: 'usloviya', tr: 'kullanim-kosullari', kk: 'qoldanu-shartlary' },
    priority: 0.3,
    changefreq: 'yearly',
    nav: 'footer-legal',
  },
  {
    /* Exact URL requested — preserves the live indexed slug 1:1 for migration continuity */
    key: 'ovulation',
    slugs: {
      en: 'ovulation-calculator',
      az: 'ovulyasiya-kalkulyatoru',
      ru: 'kalkulyator-ovulyacii',
      tr: 'ovulasyon-hesaplayici',
      kk: 'ovulyaciya-kalkulyatory',
    },
    priority: 0.9,
    changefreq: 'monthly',
    nav: 'footer-product',
  },
  {
    /* Exact URL requested (kept as-given, including the shortened "elamtleri" spelling) */
    key: 'symptoms',
    slugs: {
      en: 'pregnancy-symptoms',
      az: 'hamilelik-elamtleri',
      ru: 'priznaki-beremennosti',
      tr: 'hamilelik-belirtileri',
      kk: 'zhuktilik-belgileri',
    },
    priority: 0.9,
    changefreq: 'monthly',
    nav: 'footer-product',
  },
  {
    key: 'competitors',
    slugs: { en: 'compare', az: 'muqayise', ru: 'sravnenie', tr: 'karsilastirma', kk: 'salystyru' },
    priority: 0.8,
    changefreq: 'monthly',
    nav: 'footer-resources',
  },
];

export const PAGE_MAP: Record<PageKey, PageDef> = Object.fromEntries(
  PAGES.map((p) => [p.key, p]),
) as Record<PageKey, PageDef>;

/** Localized slug for a page (falls back to en). */
export function pageSlug(key: PageKey, lang: string): string {
  const def = PAGE_MAP[key];
  return def.slugs[lang] ?? def.slugs.en ?? key;
}

/** Site-relative path for a page in a language, always with trailing slash. */
export function pagePath(key: PageKey, lang: string): string {
  const prefix = langPrefix(lang);
  if (key === 'home') return `${prefix}/` || '/';
  return `${prefix}/${pageSlug(key, lang)}/`;
}

/** Path for a blog post. */
export function blogPostPath(lang: string, slug: string): string {
  return `${langPrefix(lang)}/${pageSlug('blog', lang)}/${slug}/`;
}

/** Reverse lookup: which page key does a (lang, slug) belong to? */
export function pageKeyFromSlug(lang: string, slug: string): PageKey | undefined {
  return PAGES.find((p) => pageSlug(p.key, lang) === slug)?.key;
}

export { DEFAULT_LANG };
