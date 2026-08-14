import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/seo";
import { absoluteUrl, jsonLdGraph, organizationSchema } from "@/lib/structured-data";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import FaqList from "@/components/FaqList";

interface Props {
  params: Promise<{ locale: AppLocale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.faq" });
  return buildPageMetadata({
    locale,
    href: "/faq",
    title: t("title"),
    description: t("description"),
  });
}

/**
 * Full FAQ page. Every answer is server-rendered visible text (<details>),
 * fixing the audit's citability gap. No FAQPage JSON-LD by design: Google
 * retired FAQ rich results for all sites on 2026-05-07, so the actual fix is
 * crawlable content, not markup.
 */
export default async function FaqPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("faqPage");
  const bc = await getTranslations("breadcrumb");

  const categories = t.raw("categories") as {
    title: string;
    items: { q: string; a: string }[];
  }[];

  return (
    <div className="px-4 pb-20">
      <div className="mx-auto max-w-4xl">
        <JsonLd data={jsonLdGraph(organizationSchema())} />
        <Breadcrumbs
          items={[
            { name: bc("home"), href: "/", absoluteUrl: absoluteUrl(locale) },
            { name: t("h1"), absoluteUrl: absoluteUrl(locale, "/faq") },
          ]}
        />

        <h1 className="mb-4 text-4xl font-bold md:text-5xl">{t("h1")}</h1>
        <p className="mb-12 text-base leading-relaxed text-gray-700 md:text-lg">
          {t("intro")}
        </p>

        <div className="space-y-12">
          {categories.map((cat) => (
            <section key={cat.title}>
              <h2 className="mb-5 text-2xl font-bold">{cat.title}</h2>
              <FaqList items={cat.items} />
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
