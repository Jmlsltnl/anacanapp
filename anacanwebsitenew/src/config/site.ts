/**
 * Global site/brand configuration for the Anacan marketing website.
 * All SEO surfaces (JSON-LD, OG, llms.txt, sitemap, panel) read from here.
 */
export const SITE = {
  name: 'Anacan',
  legalName: 'Anacan MMC',
  domain: 'anacan.az',
  url: 'https://anacan.az',
  email: 'info@anacan.az',
  foundingYear: 2024,
  country: 'AZ',
  city: 'Baku',

  /** Mobile app identity */
  app: {
    bundleId: 'com.atlasoon.anacan',
    appStoreUrl: 'https://apps.apple.com/app/anacan/id6745406124',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.atlasoon.anacan',
    appUrl: 'https://app.anacan.az',
    scheme: 'anacan://',
    category: 'HealthApplication',
    operatingSystems: ['iOS', 'Android'],
    /** Free tier + premium subscriptions (kept in sync with the app stores) */
    pricing: {
      free: true,
      monthly: { amount: '7.99', currency: 'AZN' },
      yearly: { amount: '49.99', currency: 'AZN' },
    },
  },

  /**
   * Public profiles (JSON-LD sameAs + footer).
   * Fill these in when the official accounts are live — leave '' to hide.
   * Only non-empty URLs are rendered in the footer and in `sameAs`.
   */
  socials: {
    instagram: '',
    facebook: '',
    tiktok: '',
    youtube: '',
  } as Record<string, string>,

  /** Brand color used for theme-color and OG art. */
  themeColor: '#FFF7F3',
  brandColor: '#FF5A5F',

  /** Default OG image size */
  ogWidth: 1200,
  ogHeight: 630,
} as const;

export type SiteConfig = typeof SITE;
