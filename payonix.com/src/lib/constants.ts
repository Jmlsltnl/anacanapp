/**
 * Central, single-source-of-truth facts about the Payonix brand and legal
 * entity. Pulled directly from the live site during the audit (contact
 * details, social profiles, regulator license) so every page renders the
 * same, consistent information instead of duplicating literals.
 */

export const SITE_URL = "https://payonix.com";

export const BRAND = {
  name: "Payonix",
  legalName: '"Baku Pay" MMC',
  founded: "2019",
} as const;

export const CONTACT = {
  email: "info@payonix.com",
  phoneDisplay: "*2021",
  phoneTel: "+994124356698",
  addressStreet: "Malibo Residence, Şamil Əzizbəyov küç. 217",
  addressCity: "Bakı",
  addressCountry: "Azərbaycan",
  addressCountryCode: "AZ",
} as const;

export const REGULATOR = {
  licenseNumber: "EPT-016",
  licenseDate: "2025-01-15",
  authority: "Azərbaycan Respublikasının Mərkəzi Bankı",
  authorityEn: "Central Bank of the Republic of Azerbaijan",
  authorityRu: "Центральный банк Азербайджанской Республики",
} as const;

export const SOCIAL_LINKS = {
  facebook: "https://www.facebook.com/payonix",
  instagram: "https://www.instagram.com/payonix",
  youtube: "http://www.youtube.com/@payonix3172",
  linkedin: "https://www.linkedin.com/company/payonix/",
} as const;

export const APP_LINKS = {
  ios: "https://apps.apple.com/az/app/payonix/id1518804559",
  android: "https://play.google.com/store/apps/details?id=com.payonix",
  smartLink: "https://onelink.to/vebsayt",
} as const;

// GTM id preserved from the live site so analytics continuity isn't lost in
// the rebuild. Wired through a consent-friendly loader in the root layout.
export const GTM_ID = "GTM-M5PSPSX2";

// The live site's meta tag; kept so Search Console property verification
// (already established) isn't lost when the rebuild goes live.
export const GOOGLE_SITE_VERIFICATION = "hc8vCJpFCTvx_cmj5e4f-SlJN-zSVa57bUppdXHGlQs";
