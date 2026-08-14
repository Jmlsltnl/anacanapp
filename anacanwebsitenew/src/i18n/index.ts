import { DEFAULT_LANG, LANG_CODES } from '@/config/languages';

/**
 * Dictionary loader.
 * Auto-discovers every `src/i18n/<code>.json` file — dropping a new JSON file
 * (plus a registry entry in languages.ts) is all a new language needs.
 * Missing keys fall back to the default language (az) via deep merge, so a
 * partially translated locale never breaks the build.
 */
type Dict = Record<string, unknown>;

const modules = import.meta.glob<{ default: Dict }>('./*.json', { eager: true });

const raw: Record<string, Dict> = {};
for (const [path, mod] of Object.entries(modules)) {
  const code = path.replace('./', '').replace('.json', '');
  raw[code] = mod.default;
}

function deepMerge<T extends Dict>(base: T, override: Dict): T {
  const out: Dict = Array.isArray(base) ? [...(base as unknown[])] : { ...base };
  for (const [key, value] of Object.entries(override)) {
    const baseVal = (base as Dict)[key];
    if (
      value &&
      baseVal &&
      typeof value === 'object' &&
      typeof baseVal === 'object' &&
      !Array.isArray(value) &&
      !Array.isArray(baseVal)
    ) {
      out[key] = deepMerge(baseVal as Dict, value as Dict);
    } else {
      out[key] = value;
    }
  }
  return out as T;
}

const dictionaries: Record<string, Dict> = {};
for (const code of LANG_CODES) {
  const base = raw[DEFAULT_LANG] ?? {};
  const target = raw[code] ?? {};
  dictionaries[code] = code === DEFAULT_LANG ? base : deepMerge(base as Dict, target);
}

/** Get the full merged dictionary for a language. */
export function getDict(lang: string): Dict {
  return dictionaries[lang] ?? dictionaries[DEFAULT_LANG];
}

/**
 * Translation getter with dot-path access:
 *   const t = useTranslations('az');
 *   t('hero.titleA')          -> string
 *   t<string[]>('ai.bullets') -> array
 */
export function useTranslations(lang: string) {
  const dict = getDict(lang);
  return function t<T = string>(path: string): T {
    const value = path
      .split('.')
      .reduce<unknown>((acc, key) => (acc && typeof acc === 'object' ? (acc as Dict)[key] : undefined), dict);
    if (value === undefined) {
      throw new Error(`[i18n] Missing key "${path}" for language "${lang}"`);
    }
    return value as T;
  };
}
