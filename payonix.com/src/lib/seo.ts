import type { Metadata } from "next";
import { getPathname } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { SITE_URL } from "./constants";

type RouteKey = keyof typeof routing.pathnames;

interface PageSeoInput {
  locale: AppLocale;
  href: RouteKey;
  title: string;
  description: string;
  noIndex?: boolean;
}

/**
 * Builds a full Next.js Metadata object for one page in one locale,
 * including a self-referencing canonical tag, hreflang alternates for every
 * locale (+ x-default), and Open Graph / Twitter Card tags.
 *
 * Directly fixes 5 audit findings:
 * - O1/O2: identical title/description on every page -> unique per page
 * - T5/O3: zero canonical tags -> self-referencing canonical everywhere
 * - O7: language switcher with no real hreflang -> real hreflang alternates
 * - O4: zero Open Graph / Twitter tags -> populated on every page
 * - C4: meta description mismatched B2C audience -> caller supplies an
 *   accurate, page-specific description from the locale's messages
 */
export function buildPageMetadata({
  locale,
  href,
  title,
  description,
  noIndex = false,
}: PageSeoInput): Metadata {
  const languageAlternates: Record<string, string> = {};
  for (const l of routing.locales) {
    languageAlternates[l] = new URL(
      getPathname({ href, locale: l }),
      SITE_URL,
    ).toString();
  }
  languageAlternates["x-default"] = new URL(
    getPathname({ href, locale: routing.defaultLocale }),
    SITE_URL,
  ).toString();

  const canonical = new URL(
    getPathname({ href, locale }),
    SITE_URL,
  ).toString();

  const ogLocaleMap: Record<AppLocale, string> = {
    az: "az_AZ",
    en: "en_US",
    ru: "ru_RU",
  };

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: languageAlternates,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Payonix",
      locale: ogLocaleMap[locale],
      alternateLocale: routing.locales
        .filter((l) => l !== locale)
        .map((l) => ogLocaleMap[l]),
      type: "website",
      // og:image is injected automatically by the opengraph-image.tsx file
      // convention under app/[locale]/ (a generated 1200x630 PNG), which
      // cascades to all nested routes. X/Twitter falls back to og:image.
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
