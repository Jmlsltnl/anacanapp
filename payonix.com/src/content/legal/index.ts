import type { AppLocale } from "@/i18n/routing";
import type { LegalDoc } from "./types";
import { privacyAz } from "./privacy-az";
import { privacyEn } from "./privacy-en";
import { privacyRu } from "./privacy-ru";
import { customerTermsAzPart1 } from "./customer-terms-az-part1";
import { customerTermsAzPart2 } from "./customer-terms-az-part2";
import { customerTermsEnPart1 } from "./customer-terms-en-part1";
import { customerTermsEnPart2 } from "./customer-terms-en-part2";
import { customerTermsRuPart1 } from "./customer-terms-ru-part1";
import { customerTermsRuPart2 } from "./customer-terms-ru-part2";
import { partnerTermsAz } from "./partner-terms-az";
import { partnerTermsEn } from "./partner-terms-en";
import { partnerTermsRu } from "./partner-terms-ru";

export type { LegalDoc, LegalSection } from "./types";

const customerTermsAz: LegalDoc = {
  title: "İstifadə Qaydaları",
  updated: "2026-07-01",
  sections: [...customerTermsAzPart1, ...customerTermsAzPart2],
};

const customerTermsEn: LegalDoc = {
  title: "Terms of Use for Customers",
  updated: "2026-07-01",
  sections: [...customerTermsEnPart1, ...customerTermsEnPart2],
};

const customerTermsRu: LegalDoc = {
  title: "Условия использования для клиентов",
  updated: "2026-07-01",
  sections: [...customerTermsRuPart1, ...customerTermsRuPart2],
};

export type LegalDocKey = "privacy" | "customerTerms" | "partnerTerms";

const registry: Record<LegalDocKey, Record<AppLocale, LegalDoc>> = {
  privacy: { az: privacyAz, en: privacyEn, ru: privacyRu },
  customerTerms: { az: customerTermsAz, en: customerTermsEn, ru: customerTermsRu },
  partnerTerms: { az: partnerTermsAz, en: partnerTermsEn, ru: partnerTermsRu },
};

export function getLegalDoc(key: LegalDocKey, locale: AppLocale): LegalDoc {
  return registry[key][locale];
}
