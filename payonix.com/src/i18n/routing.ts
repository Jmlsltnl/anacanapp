import { defineRouting } from "next-intl/routing";

/**
 * Central i18n routing configuration.
 *
 * - Azerbaijani (az) is the default locale and is served WITHOUT a URL prefix
 *   (e.g. https://payonix.com/ani-kredit) because Azerbaijani users are the
 *   primary audience.
 * - English and Russian are served with a locale prefix
 *   (e.g. /en/instant-loan, /ru/bystryy-kredit).
 * - Every route has a real, human-readable, translated slug per locale
 *   (not just a translated H1 on a shared URL) so each language gets its own
 *   fully indexable, correctly-hreflang-linked URL.
 */
export const routing = defineRouting({
  locales: ["az", "en", "ru"],
  defaultLocale: "az",
  localePrefix: "as-needed",
  localeDetection: true,
  pathnames: {
    "/": "/",

    "/about": {
      az: "/haqqimizda",
      en: "/about-us",
      ru: "/o-nas",
    },
    "/instant-loan": {
      az: "/ani-kredit",
      en: "/instant-loan",
      ru: "/bystryy-kredit",
    },
    "/instant-advance": {
      az: "/ani-avans",
      en: "/instant-advance",
      ru: "/bystryy-avans",
    },
    "/offers": {
      az: "/endirimler",
      en: "/offers",
      ru: "/skidki",
    },
    "/faq": {
      az: "/suallar",
      en: "/faq",
      ru: "/voprosy",
    },
    "/contact": {
      az: "/elaqe",
      en: "/contact",
      ru: "/kontakty",
    },
    "/privacy-policy": {
      az: "/mexfilik-siyaseti",
      en: "/privacy-policy",
      ru: "/politika-konfidencialnosti",
    },
    "/customer-terms": {
      az: "/istifade-qaydalari",
      en: "/customer-terms",
      ru: "/usloviya-ispolzovaniya",
    },
    "/partner-terms": {
      az: "/terefdas-sertleri",
      en: "/partner-terms",
      ru: "/usloviya-dlya-partnyorov",
    },
  },
});

export type AppLocale = (typeof routing.locales)[number];
