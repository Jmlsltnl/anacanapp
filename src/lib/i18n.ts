import { supabase } from '@/integrations/supabase/client';
import enStatic from '@/locales/en.json';
import { useUserStore } from '@/store/userStore';

// In-memory translation cache: { [lang]: { [key]: value } }
const translationCache: Record<string, Record<string, string>> = {};

// Synchronously seed the EN cache from the bundled JSON so tr() returns English
// on the very first render after a reload — no waiting on the network.
translationCache['en'] = { ...(enStatic as Record<string, string>) };

let dbLoadedFor: string | null = null;
let dbPromise: Promise<void> | null = null;

/**
 * Overlay translations from the DB for a given language.
 * EN already has the static bundle preloaded; this just adds admin overrides.
 */
export async function loadTranslations(lang: string): Promise<void> {
  if (lang === 'az') return;
  if (dbLoadedFor === lang) return;
  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    try {
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
      // Trigger re-render of subscribed components
      try { useUserStore.getState().bumpI18n?.(); } catch {}
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

export function clearTranslationCache(): void {
  Object.keys(translationCache).forEach(k => delete translationCache[k]);
  // Re-seed EN bundle (it's always available)
  translationCache['en'] = { ...(enStatic as Record<string, string>) };
  dbLoadedFor = null;
  dbPromise = null;
}
