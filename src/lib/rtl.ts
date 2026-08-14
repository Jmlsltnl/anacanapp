/**
 * RTL köməkçiləri — ərəb (və gələcək RTL dilləri) üçün istiqamət idarəetməsi.
 * Zero-flash prinsipi: dir İLK render-dən əvvəl (main.tsx bootstrap) təyin olunur.
 */

export const RTL_LANGS = new Set(['ar']);

export const isRtlLang = (lang: string | null | undefined): boolean =>
  !!lang && RTL_LANGS.has(lang);

/** <html dir/lang> atributlarını təyin et — boot və dil dəyişmələrində çağırılır */
export function applyDocumentDirection(lang: string): void {
  try {
    const dir = isRtlLang(lang) ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);
  } catch { /* SSR-safe */ }
}
