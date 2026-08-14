import {
  APP_LINKS,
  BRAND,
  CONTACT,
  SITE_URL,
  SOCIAL_LINKS,
} from "./constants";
import type { AppLocale } from "@/i18n/routing";

/**
 * JSON-LD builders.
 *
 * Audit finding fixed: the live site shipped zero structured data of any
 * kind. Only current, non-deprecated Schema.org types are used here
 * (Organization, WebSite, SoftwareApplication, BreadcrumbList, ContactPage),
 * matching the claude-seo schema-types.md reference gathered during the
 * audit. FAQPage is deliberately NOT used (Google retired FAQ rich results
 * for all sites on 2026-05-07) - the FAQ content itself is instead real,
 * crawlable visible text (see the FAQ page/section), which is the actual
 * fix for citability, not markup.
 */

function localePath(locale: AppLocale) {
  return locale === "az" ? "" : `/${locale}`;
}

export function absoluteUrl(locale: AppLocale, path = "") {
  return `${SITE_URL}${localePath(locale)}${path}`;
}

export function organizationSchema(locale: AppLocale) {
  return {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: BRAND.name,
    legalName: BRAND.legalName,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/logo.svg`,
    },
    foundingDate: BRAND.founded,
    address: {
      "@type": "PostalAddress",
      streetAddress: CONTACT.addressStreet,
      addressLocality: CONTACT.addressCity,
      addressCountry: CONTACT.addressCountryCode,
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer service",
        email: CONTACT.email,
        telephone: CONTACT.phoneTel,
        areaServed: "AZ",
        availableLanguage: ["az", "en", "ru"],
      },
    ],
    sameAs: [
      SOCIAL_LINKS.facebook,
      SOCIAL_LINKS.instagram,
      SOCIAL_LINKS.youtube,
      SOCIAL_LINKS.linkedin,
    ],
  };
}

export function webSiteSchema(locale: AppLocale) {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: BRAND.name,
    url: SITE_URL,
    inLanguage: locale,
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

/**
 * SoftwareApplication for the mobile app. Deliberately omits
 * `aggregateRating`: the audit explicitly flagged fabricating a rating from
 * curated homepage testimonials as a trust risk. Populate `aggregateRating`
 * here only once real App Store / Google Play rating + review-count data is
 * available and can be kept in sync.
 */
export function softwareApplicationSchema() {
  return {
    "@type": "SoftwareApplication",
    "@id": `${SITE_URL}/#app`,
    name: BRAND.name,
    operatingSystem: "iOS, Android",
    applicationCategory: "FinanceApplication",
    url: SITE_URL,
    author: { "@id": `${SITE_URL}/#organization` },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "AZN",
      category: "free",
    },
    downloadUrl: [APP_LINKS.ios, APP_LINKS.android],
  };
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function contactPageSchema(locale: AppLocale, name: string) {
  return {
    "@type": "ContactPage",
    "@id": `${absoluteUrl(locale)}#contactpage`,
    name,
    url: absoluteUrl(locale),
    about: { "@id": `${SITE_URL}/#organization` },
  };
}

/** Wraps one or more schema nodes in a single @context graph. */
export function jsonLdGraph(...nodes: Record<string, unknown>[]) {
  return {
    "@context": "https://schema.org",
    "@graph": nodes,
  };
}
