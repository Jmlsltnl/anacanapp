import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/seo";
import ProductPage from "@/components/ProductPage";

interface Props {
  params: Promise<{ locale: AppLocale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.advance" });
  return buildPageMetadata({
    locale,
    href: "/instant-advance",
    title: t("title"),
    description: t("description"),
  });
}

export default async function InstantAdvancePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <ProductPage
      locale={locale}
      namespace="advance"
      href="/instant-advance"
      stepsTitleKey="howTitle"
    />
  );
}
