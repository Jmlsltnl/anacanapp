/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  ANACAN LANGUAGE REGISTRY — single source of truth for every locale.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  HOW TO ADD A NEW LANGUAGE (e.g. when the app ships a new locale):
 *
 *    1. Run `npm run add:lang -- <code>`  (e.g. `npm run add:lang -- uz`)
 *       — or do the steps below by hand:
 *    2. Add an entry to LANGUAGES below.
 *    3. Create `src/i18n/<code>.json` (the script copies en.json as template).
 *    4. Create `src/content/blog/<code>/` and add translated posts
 *       (same `translationKey` as their siblings, localized file names).
 *    5. Optionally add localized page slugs in `src/config/pages.ts`.
 *
 *  Everything else — routes, hreflang, sitemap.xml, RSS feeds, llms.txt,
 *  OG images, language switcher, SEO panel — derives automatically.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface Language {
  /** URL prefix + i18n file name (ISO 639-1) */
  code: string;
  /** Full BCP-47 tag used in hreflang + JSON-LD `inLanguage` */
  bcp47: string;
  /** Native display name (used in the language switcher) */
  nativeName: string;
  /** English name (used in llms.txt / reports) */
  englishName: string;
  /** Open Graph locale (e.g. az_AZ) */
  ogLocale: string;
  /** Intl date-formatting locale */
  dateLocale: string;
  /** Writing direction */
  dir: 'ltr' | 'rtl';
  /** Flag emoji for pickers (never used in <head>) */
  flag: string;
}

export const LANGUAGES: Language[] = [
  {
    code: 'az',
    bcp47: 'az-AZ',
    nativeName: 'Azərbaycan',
    englishName: 'Azerbaijani',
    ogLocale: 'az_AZ',
    dateLocale: 'az-Latn-AZ',
    dir: 'ltr',
    flag: '🇦🇿',
  },
  {
    code: 'en',
    bcp47: 'en-US',
    nativeName: 'English',
    englishName: 'English',
    ogLocale: 'en_US',
    dateLocale: 'en-US',
    dir: 'ltr',
    flag: '🇺🇸',
  },
  {
    code: 'ru',
    bcp47: 'ru-RU',
    nativeName: 'Русский',
    englishName: 'Russian',
    ogLocale: 'ru_RU',
    dateLocale: 'ru-RU',
    dir: 'ltr',
    flag: '🇷🇺',
  },
  {
    code: 'tr',
    bcp47: 'tr-TR',
    nativeName: 'Türkçe',
    englishName: 'Turkish',
    ogLocale: 'tr_TR',
    dateLocale: 'tr-TR',
    dir: 'ltr',
    flag: '🇹🇷',
  },
  {
    code: 'kk',
    bcp47: 'kk-KZ',
    nativeName: 'Қазақша',
    englishName: 'Kazakh',
    ogLocale: 'kk_KZ',
    dateLocale: 'kk-KZ',
    dir: 'ltr',
    flag: '🇰🇿',
  },
];

/** Default language: served at the site root (no URL prefix). */
export const DEFAULT_LANG = 'az';

export const LANG_CODES = LANGUAGES.map((l) => l.code);

export function getLanguage(code: string): Language {
  const lang = LANGUAGES.find((l) => l.code === code);
  if (!lang) throw new Error(`[i18n] Unknown language code: ${code}`);
  return lang;
}

export function isDefaultLang(code: string): boolean {
  return code === DEFAULT_LANG;
}

/** URL prefix for a language: '' for the default, '/en' etc. otherwise. */
export function langPrefix(code: string): string {
  return isDefaultLang(code) ? '' : `/${code}`;
}
