import { getCachedTranslation } from './i18n';

function getPersistedLanguage(): string {
  if (typeof window === 'undefined') return 'az';

  try {
    const raw = window.localStorage.getItem('anacan-user-store');
    if (!raw) return 'az';

    const parsed = JSON.parse(raw);
    const language = parsed?.state?.language;
    return typeof language === 'string' && language.length > 0 ? language : 'az';
  } catch {
    return 'az';
  }
}

/**
 * Module-level translation helper. Works in any scope (utils, callbacks, module-level constants).
 * Reads current language from the Zustand store synchronously (no hook required).
 *
 * For 'az' (default), returns the hardcoded fallback. For other languages, looks up the cached
 * DB translation. If missing, returns the fallback.
 *
 * Note: Components that need to re-render on language change should still subscribe via
 * useUserStore(state => state.language) somewhere in their tree (Dashboard / App handles this globally).
 */
export function tr(key: string, defaultValue: string): string {
  const lang = getPersistedLanguage();
  if (lang === 'az') return defaultValue;
  return getCachedTranslation(key, lang) || defaultValue;
}
