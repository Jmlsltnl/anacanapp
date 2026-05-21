import { supabase } from '@/integrations/supabase/client';

// In-memory translation cache: { [lang]: { [key]: value } }
const translationCache: Record<string, Record<string, string>> = {};
let cacheLoadedFor: string | null = null;
let cachePromise: Promise<void> | null = null;

/**
 * Load all translations for a given language into cache.
 * Skips loading for 'az' since Azerbaijani is hardcoded as fallback.
 * For 'en', loads a bundled JSON immediately (instant), then overlays DB values if any.
 */
export async function loadTranslations(lang: string): Promise<void> {
  if (lang === 'az') return;
  if (cacheLoadedFor === lang) return;
  if (cachePromise) return cachePromise;

  cachePromise = (async () => {
    try {
      const allTranslations: Record<string, string> = {};

      // 1) Static bundled fallback (currently only EN ships with the app)
      if (lang === 'en') {
        try {
          const staticEn = (await import('@/locales/en.json')).default as Record<string, string>;
          Object.assign(allTranslations, staticEn);
        } catch (e) {
          console.warn('Static EN bundle not found', e);
        }
      }

      // 2) Overlay with DB translations (admin can override individual keys)
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
        if (data) data.forEach(row => { allTranslations[row.key] = row.value; });
        hasMore = (data?.length ?? 0) === batchSize;
        from += batchSize;
      }

      translationCache[lang] = allTranslations;
      cacheLoadedFor = lang;
    } catch (err) {
      console.error('Translation load error:', err);
    } finally {
      cachePromise = null;
    }
  })();

  return cachePromise;
}

export function getCachedTranslation(key: string, lang: string): string | undefined {
  return translationCache[lang]?.[key];
}

export function clearTranslationCache(): void {
  Object.keys(translationCache).forEach(k => delete translationCache[k]);
  cacheLoadedFor = null;
  cachePromise = null;
}
