import { supabase } from '@/integrations/supabase/client';
import azStatic from '@/locales/az.json';

// In-memory translation cache: { [lang]: { [key]: value } }
const translationCache: Record<string, Record<string, string>> = {};

// Synchronously seed ONLY the AZ cache from the bundled JSON so tr() returns
// expected language on the very first render after a reload — no waiting on
// the network. AZ is the universal default/fallback (localStorage.getItem
// ('language') || 'az' pattern used app-wide), so it alone must stay a
// STATIC import (eager, ~461KB in the main chunk).
//
// QEYD (bundle ölçüsü audit tapıntısı): əvvəllər EN də (~525KB) burada
// statik import edilirdi — 2 dil JSON-u BİRLİKDƏ əsas JS chunk-ın ~37%-ni
// təşkil edirdi, dilindən asılı olmayaraq HƏR istifadəçi bunu yükləyirdi.
// EN artıq aşağıdakı ru/tr/kk/de/ar ilə EYNİ "lazy seed" modelinə keçirilib
// (bax SEED_LANGS + loadLocalSeed) — yalnız EN seçən istifadəçilər yükləyir.
translationCache['az'] = { ...(azStatic as Record<string, string>) };

// ── Zero-flash dil yüklənməsi ──
// Problem: ru/tr/kk əvvəllər YALNIZ DB-dən (şəbəkə) gəlirdi → ilk render AZ görünürdü,
// sonra seçilmiş dilə "sıçrayırdı" (zəif internetdə saniyələrlə). Həll — 3 qat:
//   1) localStorage keşi: son uğurlu dəst sinxron hidratasiya olunur (aşağıda, modul yüklənən an)
//   2) Lokal seed chunk-ları: en/ru/tr/kk/de/ar seed-ləri bundle-ın hissəsidir (dynamic import, şəbəkəsiz)
//   3) DB overlay: admin düzəlişləri arxa planda gəlir və keşə yazılır
const SEED_LANGS = new Set(['en', 'ru', 'tr', 'kk', 'de', 'ar', 'uz']);
const LS_CACHE_PREFIX = 'anacan_i18n_cache:';

function hydrateFromLocalStorage(lang: string): boolean {
  try {
    const raw = localStorage.getItem(LS_CACHE_PREFIX + lang);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as Record<string, string>;
    if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
      translationCache[lang] = { ...(translationCache[lang] || {}), ...parsed };
      return true;
    }
  } catch { /* korlanmış keş — seed/DB yolu işləyəcək */ }
  return false;
}

function persistToLocalStorage(lang: string): void {
  try {
    const data = translationCache[lang];
    if (data && Object.keys(data).length > 0) {
      localStorage.setItem(LS_CACHE_PREFIX + lang, JSON.stringify(data));
    }
  } catch { /* kvota dolub — keşsiz davam (seed onsuz da lokaldır) */ }
}

// Modul yüklənən AN (React-dan əvvəl) persist dil üçün sinxron hidratasiya —
// ikinci açılışdan etibarən heç bir await olmadan düzgün dildə render olunur.
try {
  const bootLang = localStorage.getItem('language') || 'az';
  if (SEED_LANGS.has(bootLang)) hydrateFromLocalStorage(bootLang);
} catch { /* SSR-safe */ }

/** Lokal seed chunk-ını yüklə (şəbəkəsiz — bundle assets). Mövcud dəyərlər üstün qalır. */
async function loadLocalSeed(lang: string): Promise<void> {
  if (!SEED_LANGS.has(lang)) return;
  try {
    const seedModule = lang === 'en'
      ? await import('@/locales/en.json')
      : lang === 'ru'
        ? await import('../../scripts/i18n/ru.seed.json')
        : lang === 'kk'
          ? await import('../../scripts/i18n/kk.seed.json')
          : lang === 'de'
            ? await import('../../scripts/i18n/de.seed.json')
            : lang === 'ar'
              ? await import('../../scripts/i18n/ar.seed.json')
              : lang === 'uz'
                ? await import('../../scripts/i18n/uz.seed.json')
                : await import('../../scripts/i18n/tr.seed.json');
    const seed = (seedModule.default ?? seedModule) as Record<string, string>;
    // seed ALTDA — localStorage keşi / DB overlay dəyərləri üstün qalsın
    translationCache[lang] = { ...seed, ...(translationCache[lang] || {}) };
  } catch (e) {
    console.warn('[i18n] Lokal seed yüklənmədi:', e);
  }
}

/**
 * İlk render-dən ƏVVƏL dilin hazır olmasını təmin edir (main.tsx boot gate).
 * az/en → dərhal (bundle); ru/tr/kk → localStorage keşi varsa dərhal,
 * yoxdursa lokal seed chunk-ı gözlənilir (şəbəkəsiz, millisaniyələr).
 */
export async function ensureLanguageReady(lang: string): Promise<void> {
  if (!SEED_LANGS.has(lang)) return;
  const cached = translationCache[lang];
  if (cached && Object.keys(cached).length > 100) return; // artıq hidratasiya olunub
  await loadLocalSeed(lang);
  persistToLocalStorage(lang); // növbəti açılış sinxron olsun
}

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
      // Lokal seed HƏMİŞƏ birinci (prod daxil) — DB yalnız admin düzəlişləri üçün overlay-dır.
      await loadLocalSeed(lang);

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
      // Birləşmiş dəsti keşlə — növbəti soyuq açılış sinxron və şəbəkəsiz olsun
      persistToLocalStorage(lang);
    } catch (err) {
      console.error('Translation load error:', err);
      // DB alınmasa belə seed-i keşlə (offline-first)
      persistToLocalStorage(lang);
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
/** ru/tr/kk bu bundle-da HƏMİŞƏ seçilə bilir (DB app_languages.is_active-dən asılı olmayaraq).
    Köhnə buildlər köhnə bundle daşıdığı üçün onlarda görünmür — yalnız yeni web/build. */
function withDevLanguages(list: AppLanguage[]): AppLanguage[] {
  const have = new Set(list.map((l) => l.code));
  const extras: AppLanguage[] = [
    { code: 'tr', name: 'Turkish', native_name: 'Türkçe' },
    { code: 'ru', name: 'Russian', native_name: 'Русский' },
    { code: 'kk', name: 'Kazakh', native_name: 'Қазақша' },
    { code: 'de', name: 'German', native_name: 'Deutsch' },
    { code: 'ar', name: 'Arabic', native_name: 'العربية' },
    { code: 'uz', name: 'Uzbek', native_name: "O'zbekcha" },
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
  kk: 'kk-KZ',
  de: 'de-DE',
  // QEYD: 'ar-SA' YOX — o, Hicri təqimə keçir; generic 'ar' = Qriqorian + ərəb-hind rəqəmləri (١٢٣)
  ar: 'ar',
  uz: 'uz-UZ',
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
  // Re-seed bundle (AZ yeganə statik idxaldır — bax yuxarı şərh). EN artıq
  // ru/tr/kk/de/ar kimi lazy seed-dir — çağıran kod (LanguageSelector.tsx/
  // InitialLanguageScreen.tsx) clearTranslationCache()-dən dərhal sonra
  // `code !== 'az'` olduqda `await ensureLanguageReady(code)` çağırır, bu da
  // EN daxil bütün lazy dilləri render-dən ƏVVƏL yenidən yükləyir.
  translationCache['az'] = { ...(azStatic as Record<string, string>) };
  dbLoadedFor = null;
  dbPromise = null;
}
