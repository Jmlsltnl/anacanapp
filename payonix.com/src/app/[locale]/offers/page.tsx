import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/seo";
import { absoluteUrl, jsonLdGraph, organizationSchema } from "@/lib/structured-data";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";

interface Props {
  params: Promise<{ locale: AppLocale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.offers" });
  return buildPageMetadata({
    locale,
    href: "/offers",
    title: t("title"),
    description: t("description"),
  });
}

const CATEGORY_EMOJI = ["ðŸ½ï¸", "ðŸ›’", "ðŸ‘•", "ðŸŽ¬", "ðŸ’Š", "ðŸ“±"];

export default async function OffersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("offers");
  const bc = await getTranslations("breadcrumb");

  const steps = t.raw("steps") as { title: string; text: string }[];
  const categories = t.raw("categories") as string[];

  return (
    <div className="px-4 pb-20">
      <div className="mx-auto max-w-7xl">
        <JsonLd data={jsonLdGraph(organizationSchema())} />
        <Breadcrumbs
          items={[
            { name: bc("home"), href: "/", absoluteUrl: absoluteUrl(locale) },
            { name: t("h1"), absoluteUrl: absoluteUrl(locale, "/offers") },
          ]}
        />

        <div className="mb-14 max-w-3xl">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">{t("h1")}</h1>
          <p className="text-base leading-relaxed text-gray-700 md:text-lg">{t("intro")}</p>
        </div>

        <section className="mb-16">
          <h2 className="mb-8 text-2xl font-bold md:text-3xl">{t("howTitle")}</h2>
          <ol className="grid gap-6 md:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.title} className="rounded-2xl bg-gray-50 p-6">
                <span aria-hidden="true" className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-lime text-lg font-bold">
                  {i + 1}
                </span>
                <h3 className="mb-2 font-semibold">{step.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mb-6">
          <h2 className="mb-8 text-2xl font-bold md:text-3xl">{t("categoriesTitle")}</h2>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((cat, i) => (
              <li
                key={cat}
                className="flex flex-col items-center gap-2 rounded-2xl border border-gray-200 p-6 text-center transition hover:border-lime-deep hover:bg-lime/10"
              >
                <span aria-hidden="true" className="text-3xl">
                  {CATEGORY_EMOJI[i] ?? "ðŸ·ï¸"}
                </span>
                <span className="text-sm font-medium">{cat}</span>
              </li>
            ))}
          </ul>
        </section>

        <p className="mb-16 max-w-3xl text-sm text-gray-500">{t("note")}</p>

        <section className="rounded-[36px] bg-navy p-8 text-white md:p-12">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <h2 className="mb-2 text-2xl font-bold md:text-3xl">{t("partnerTitle")}</h2>
              <p className="text-sm leading-relaxed text-gray-300 md:text-base">{t("partnerText")}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/partner-terms"
                className="rounded-xl bg-lime px-6 py-3 text-center text-sm font-medium text-ink transition hover:brightness-95"
              >
                {t("partnerCta")}
              </Link>
              <Link
                href="/contact"
                className="rounded-xl border border-white/30 px-6 py-3 text-center text-sm font-medium text-white transition hover:bg-white/10"
              >
                {t("contactCta")}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
