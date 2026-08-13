// ============================================================
// useFeedLanguages — cəmiyyət feed-inin dil linzası.
// Mənbə: user_preferences.feed_languages (cihazlararası sinxron).
// NULL/boş olduqda ölkəyə görə ağıllı default hesablanır və DB-yə yazılır:
//   AZ (və ölkəsiz) → [az, ru, tr] · TR → [tr] · post-sovet → [ru] · digər → [en]
//   UI dili HƏMİŞƏ linzaya daxil edilir.
// useGroupPosts (qlobal feed) və unread sayğacı bu linza ilə filtrlənir.
// Dəyişiklikdə 'anacan:feed-langs-changed' eventi atılır (unread yenidən hesablansın).
// ============================================================
import { useCallback, useEffect } from 'react';
import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from '@/store/userStore';
import { useAuth } from '@/hooks/useAuth';
import { FeedLang, isFeedLang, sanitizeFeedLangs } from '@/lib/langDetect';

export const FEED_LANGS_CHANGED_EVENT = 'anacan:feed-langs-changed';

// Rus dilinin default linzaya daxil edildiyi ölkələr
const RU_DEFAULT_COUNTRIES = new Set(['RU', 'BY', 'UA', 'KG', 'UZ', 'TJ', 'TM', 'AM', 'GE', 'MD']);

/** Ölkə + UI dilinə görə ağıllı default linza */
export function defaultFeedLanguages(countryCode: string | null | undefined, uiLang: string): FeedLang[] {
  const ui: FeedLang = isFeedLang(uiLang) ? uiLang : 'az';
  const cc = (countryCode || '').toUpperCase();
  let langs: FeedLang[];
  if (cc === 'AZ' || !cc) langs = ['az', 'ru', 'tr']; // AZ bazarı — ölkə seçməyənlər də bura
  else if (cc === 'TR') langs = ['tr'];
  else if (cc === 'KZ') langs = ['kk', 'ru']; // Qazaxıstan — qazax + rus
  else if (RU_DEFAULT_COUNTRIES.has(cc)) langs = ['ru'];
  else langs = ['en'];
  if (!langs.includes(ui)) langs = [ui, ...langs];
  return langs;
}

type FeedLangsState = {
  langs: FeedLang[] | null; // null = hələ DB-dən yüklənməyib
  hydratedUserId: string | null;
  hydrate: (userId: string) => Promise<void>;
  save: (userId: string, langs: FeedLang[]) => Promise<void>;
};

let hydrationInFlight: string | null = null;

const useFeedLangsStore = create<FeedLangsState>((set, get) => ({
  langs: null,
  hydratedUserId: null,

  hydrate: async (userId: string) => {
    if (get().hydratedUserId === userId || hydrationInFlight === userId) return;
    hydrationInFlight = userId;
    // İstifadəçi dəyişibsə köhnə linzanı sıfırla
    if (get().hydratedUserId && get().hydratedUserId !== userId) {
      set({ langs: null, hydratedUserId: null });
    }
    try {
      const us = useUserStore.getState();
      const fallback = defaultFeedLanguages(us.countryCode, us.language);

      // Qeyd: feed_languages Son27 ilə əlavə olunur — types.ts köhnədir, ona görə cast
      const { data } = await (supabase as any)
        .from('user_preferences')
        .select('feed_languages')
        .eq('user_id', userId)
        .maybeSingle();

      const stored = (data as any)?.feed_languages;
      if (Array.isArray(stored) && stored.length > 0) {
        set({ langs: sanitizeFeedLangs(stored, fallback), hydratedUserId: userId });
      } else {
        // İlk dəfə — ölkə defaultunu DB-yə yaz (bütün cihazlarda eyni olsun)
        set({ langs: fallback, hydratedUserId: userId });
        await supabase
          .from('user_preferences')
          .upsert({ user_id: userId, feed_languages: fallback } as any, { onConflict: 'user_id' });
      }
    } catch (e) {
      // Şəbəkə xətası — default lokal işləsin, amma yenidən cəhdə imkan qalsın
      console.error('[feed-langs] hydrate failed:', e);
      set({ hydratedUserId: userId });
    } finally {
      hydrationInFlight = null;
    }
  },

  save: async (userId: string, langs: FeedLang[]) => {
    set({ langs, hydratedUserId: userId });
    try {
      window.dispatchEvent(new CustomEvent(FEED_LANGS_CHANGED_EVENT));
    } catch { /* SSR-safe */ }
    const { error } = await supabase
      .from('user_preferences')
      .upsert({ user_id: userId, feed_languages: langs } as any, { onConflict: 'user_id' });
    if (error) console.error('[feed-langs] save failed:', error.message);
  },
}));

/**
 * Reaktiv linza — komponentlər/hooklar üçün.
 * DB yüklənənədək ölkə defaultu qaytarır (heç vaxt boş deyil).
 */
export function useFeedLanguages() {
  const { user } = useAuth();
  const langs = useFeedLangsStore((s) => s.langs);
  const hydrate = useFeedLangsStore((s) => s.hydrate);
  const save = useFeedLangsStore((s) => s.save);
  const countryCode = useUserStore((s) => s.countryCode);
  const uiLang = useUserStore((s) => s.language);

  useEffect(() => {
    if (user?.id) void hydrate(user.id);
  }, [user?.id, hydrate]);

  const feedLangs = langs ?? defaultFeedLanguages(countryCode, uiLang);

  /** Dili aç/bağla. Sonuncu dili çıxarmağa icazə vermir → false qaytarır. */
  const toggleFeedLang = useCallback(
    (lang: FeedLang): boolean => {
      if (!user?.id) return false;
      const us = useUserStore.getState();
      const cur =
        useFeedLangsStore.getState().langs ?? defaultFeedLanguages(us.countryCode, us.language);
      let next: FeedLang[];
      if (cur.includes(lang)) {
        if (cur.length === 1) return false; // ən azı 1 dil qalmalıdır
        next = cur.filter((l) => l !== lang);
      } else {
        next = [...cur, lang];
      }
      void save(user.id, next);
      return true;
    },
    [user?.id, save],
  );

  return { feedLangs, toggleFeedLang, isHydrated: langs !== null };
}

/** Komponent-xarici snapshot (unread store və s. üçün) — heç vaxt boş deyil */
export function getFeedLanguagesSnapshot(): FeedLang[] {
  const s = useFeedLangsStore.getState().langs;
  if (s && s.length > 0) return s;
  const us = useUserStore.getState();
  return defaultFeedLanguages(us.countryCode, us.language);
}

/**
 * PostgREST OR ifadəsi: linza filtri.
 * "az" seçilibsə köhnə NULL dilli postlar da az sayılır (sütun defaultu az idi).
 */
export function feedLangsOrExpr(langs: FeedLang[]): string {
  const inExpr = `language.in.(${langs.join(',')})`;
  return langs.includes('az') ? `${inExpr},language.is.null` : inExpr;
}
