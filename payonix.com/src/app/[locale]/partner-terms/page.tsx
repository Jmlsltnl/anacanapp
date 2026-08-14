import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/structured-data";
import { getLegalDoc } from "@/content/legal";
import LegalDocument from "@/components/LegalDocument";
import Breadcrumbs from "@/components/Breadcrumbs";

interface Props {
  params: Promise<{ locale: AppLocale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.partnerTerms" });
  return buildPageMetadata({
    locale,
    href: "/partner-terms",
    title: t("title"),
    description: t("description"),
  });
}

export default async function PartnerTermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const legal = await getTranslations("legal");
  const bc = await getTranslations("breadcrumb");
  const doc = getLegalDoc("partnerTerms", locale);

  return (
    <div className="px-4 pb-20">
      <div className="mx-auto max-w-3xl">
        <Breadcrumbs
          items={[
            { name: bc("home"), href: "/", absoluteUrl: absoluteUrl(locale) },
            { name: doc.title, absoluteUrl: absoluteUrl(locale, "/partner-terms") },
          ]}
        />
        <LegalDocument doc={doc} updatedLabel={legal("updated")} />
      </div>
    </div>
  );
}
