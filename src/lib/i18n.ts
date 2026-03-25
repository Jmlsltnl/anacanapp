import { supabase } from '@/integrations/supabase/client';

// In-memory translation cache: { [lang]: { [key]: value } }
const translationCache: Record<string, Record<string, string>> = {};
let cacheLoadedFor: string | null = null;
let cachePromise: Promise<void> | null = null;

/**
 * Load all translations for a given language into cache.
 * Skips loading for 'az' since Azerbaijani is hardcoded as fallback.
 */
export async function loadTranslations(lang: string): Promise<void> {
  if (lang === 'az') return;
  if (cacheLoadedFor === lang) return;
  
  // Prevent duplicate loads
  if (cachePromise) return cachePromise;
  
  cachePromise = (async () => {
    try {
      const allTranslations: Record<string, string> = {};
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const { data, error } = await supabase
          .from('translations')
          .select('key, value')
          .eq('lang', lang)
          .range(from, from + batchSize - 1);
        
        if (error) {
          console.error('Failed to load translations:', error);
          break;
        }
        
        if (data) {
          data.forEach(row => {
            allTranslations[row.key] = row.value;
          });
        }
        
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

/**
 * Get a cached translation. Returns undefined if not found.
 */
export function getCachedTranslation(key: string, lang: string): string | undefined {
  return translationCache[lang]?.[key];
}

/**
 * Clear the translation cache (e.g. when language changes).
 */
export function clearTranslationCache(): void {
  Object.keys(translationCache).forEach(k => delete translationCache[k]);
  cacheLoadedFor = null;
  cachePromise = null;
}
