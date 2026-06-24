import { getCachedTranslation } from './i18n';

export function getPersistedLanguage(): string {
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
  return getCachedTranslation(key, lang) || defaultValue;
}

/**
 * Maps translatable fields on a database row to the current language.
 * Checks for field_lang first, then field_az, and finally defaults to the base field value.
 */
export function mapRowTranslation<T extends Record<string, any>>(
  row: T | null | undefined,
  language: string,
  fields: string[]
): T | null {
  if (!row) return null;
  const result = { ...row } as any;
  for (const field of fields) {
    let val: any;
    if (language === 'az') {
      val = row[`${field}_az`] ?? row[field];
    } else {
      val = row[`${field}_${language}`] ?? row[field] ?? row[`${field}_az`];
    }

    // Safely parse array fields if the translation is stored as a JSON string
    if (Array.isArray(row[field]) && typeof val === 'string') {
      try {
        val = JSON.parse(val);
      } catch {
        if (val.includes('\n')) {
          val = val.split('\n').map((s: string) => s.trim()).filter(Boolean);
        } else {
          val = row[field]; // fallback to base array
        }
      }
    }

    result[field] = val;
  }
  return result as T;
}

/**
 * Maps translatable fields on an array of database rows to the current language.
 */
export function mapRowsTranslation<T extends Record<string, any>>(
  rows: T[] | null | undefined,
  language: string,
  fields: string[]
): T[] {
  if (!rows) return [];
  return rows.map(row => mapRowTranslation(row, language, fields) as T);
}

