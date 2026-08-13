import { supabase } from '@/integrations/supabase/client';
import enStatic from '@/locales/en.json';
import azStatic from '@/locales/az.json';

// In-memory translation cache: { [lang]: { [key]: value } }
const translationCache: Record<string, Record<string, string>> = {};

// Synchronously seed the EN and AZ cache from the bundled JSON so tr() returns expected language
// on the very first render after a reload — no waiting on the network.
translationCache['en'] = { ...(enStatic as Record<string, string>) };
translationCache['az'] = { ...(azStatic as Record<string, string>) };

let dbLoadedFor: string | null = null;
let dbPromise: Promise<void> | null = null;

/**
 * Overlay translations from the DB for a given language.
 * EN already has the static bundle preloaded; this just adds admin overrides.
 */
export async function loadTranslations(lang: string): Promise<void> {
  if (dbLoadedFor === lang) return;
  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    try {
      // DEV-only: lokal sınaq üçün ru/tr seed fayllarını overlay et (DB push-dan əvvəl).
      // import.meta.env.DEV prod build-də false-a çevrilir və bu blok tamamilə silinir.
      if (import.meta.env.DEV && (lang === 'ru' || lang === 'tr')) {
        try {
          const seedModule = lang === 'ru'
            ? await import('../../scripts/i18n/ru.seed.json')
            : await import('../../scripts/i18n/tr.seed.json');
          const seed = (seedModule.default ?? seedModule) as Record<string, string>;
          translationCache[lang] = { ...seed, ...(translationCache[lang] || {}) };
          console.info(`[i18n][DEV] Lokal ${lang} seed yükləndi: ${Object.keys(seed).length} açar`);
        } catch (e) {
          console.warn('[i18n][DEV] Lokal seed yüklənmədi:', e);
        }
      }

      const overlay: Record<string, string> = {};
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;
      while (hasMore) {
        const { data, error } = await supabase
          .from('translations')
          .select('key, value')
          .eq('lang', lang)
          .range(from, from + batchSize - 1);
        if (error) { console.error('Failed to load translations:', error); break; }
        if (data) data.forEach(row => { overlay[row.key] = row.value; });
        hasMore = (data?.length ?? 0) === batchSize;
        from += batchSize;
      }
      translationCache[lang] = { ...(translationCache[lang] || {}), ...overlay };
      dbLoadedFor = lang;
    } catch (err) {
      console.error('Translation load error:', err);
    } finally {
      dbPromise = null;
    }
  })();

  return dbPromise;
}

export function getCachedTranslation(key: string, lang: string): string | undefined {
  return translationCache[lang]?.[key];
}

export interface AppLanguage {
  code: string;
  name: string;
  native_name: string;
}

const FALLBACK_LANGUAGES: AppLanguage[] = [
  { code: 'az', name: 'Azerbaijani', native_name: 'Azərbaycan' },
  { code: 'en', name: 'English', native_name: 'English' },
];

/**
 * Aktiv dilləri app_languages cədvəlindən oxuyur (is_active=true, sort_order üzrə).
 * ru/tr istifadəçilərə açmaq üçün DB-də is_active=true etmək kifayətdir — app release lazım deyil.
 * Şəbəkə/RLS xətasında az+en fallback qaytarır.
 */
/** DEV-only: lokal sınaq üçün ru/tr-ni siyahıya əlavə et (prod build-də silinir). */
function withDevLanguages(list: AppLanguage[]): AppLanguage[] {
  if (!import.meta.env.DEV) return list;
  const have = new Set(list.map((l) => l.code));
  const extras: AppLanguage[] = [
    { code: 'tr', name: 'Turkish', native_name: 'Türkçe' },
    { code: 'ru', name: 'Russian', native_name: 'Русский' },
  ];
  return [...list, ...extras.filter((e) => !have.has(e.code))];
}

export async function fetchActiveLanguages(): Promise<AppLanguage[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('app_languages')
      .select('code, name, native_name')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (error || !data?.length) return withDevLanguages(FALLBACK_LANGUAGES);
    return withDevLanguages(data as AppLanguage[]);
  } catch {
    return withDevLanguages(FALLBACK_LANGUAGES);
  }
}

/** BCP-47 locale tags per app language — Date/Number toLocale* formatlaması üçün. */
const LOCALE_TAGS: Record<string, string> = {
  az: 'az-AZ',
  en: 'en-US',
  ru: 'ru-RU',
  tr: 'tr-TR',
};

/**
 * Cari seçilmiş dilin locale tag-ı (az-AZ / en-US / ru-RU / tr-TR).
 * Dil dəyişəndə tətbiq reload olunduğu üçün çağırış anında localStorage-dan oxumaq kifayətdir.
 */
export function getLocaleTag(): string {
  try {
    const lang = localStorage.getItem('language') || 'az';
    return LOCALE_TAGS[lang] || 'az-AZ';
  } catch {
    return 'az-AZ';
  }
}

export function clearTranslationCache(): void {
  Object.keys(translationCache).forEach(k => delete translationCache[k]);
  // Re-seed bundles
  translationCache['en'] = { ...(enStatic as Record<string, string>) };
  translationCache['az'] = { ...(azStatic as Record<string, string>) };
  dbLoadedFor = null;
  dbPromise = null;
}
