import { getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { absoluteUrl, jsonLdGraph, organizationSchema } from "@/lib/structured-data";
import { APP_LINKS } from "@/lib/constants";
import JsonLd from "./JsonLd";
import Breadcrumbs from "./Breadcrumbs";
import FaqList from "./FaqList";

interface ProductPageProps {
  locale: AppLocale;
  /** messages namespace: "loan" | "advance" */
  namespace: "loan" | "advance";
  href: "/instant-loan" | "/instant-advance";
  /** key of the steps title in the namespace ("stepsTitle" | "howTitle") */
  stepsTitleKey: string;
}

/**
 * Shared template for the two credit products.
 *
 * YMYL note (audit fix C2): sample terms are rendered inside a clearly
 * labelled disclaimer block. All figures are illustrative; binding terms are
 * always shown in-app before signing. Do not present these numbers as offers.
 */
export default async function ProductPage({
  locale,
  namespace,
  href,
  stepsTitleKey,
}: ProductPageProps) {
  const t = await getTranslations(namespace);
  const bc = await getTranslations("breadcrumb");

  const steps = t.raw("steps") as { title: string; text: string }[];
  const reqs = t.raw("reqs") as string[];
  const termsRows = t.raw("termsRows") as { label: string; value: string }[];
  const faqItems = t.raw("faq") as { q: string; a: string }[];
  const hasResponsible = namespace === "loan";

  return (
    <div className="px-4 pb-20">
      <div className="mx-auto max-w-7xl">
        <JsonLd data={jsonLdGraph(organizationSchema())} />
        <Breadcrumbs
          items={[
            { name: bc("home"), href: "/", absoluteUrl: absoluteUrl(locale) },
            { name: t("h1"), absoluteUrl: absoluteUrl(locale, href) },
          ]}
        />

        {/* Hero */}
        <div className="mb-14 max-w-3xl">
          <p className="mb-3 inline-block rounded-full bg-lime px-4 py-1.5 text-sm font-medium">
            {t("badge")}
          </p>
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">{t("h1")}</h1>
          <p className="mb-6 text-base leading-relaxed text-gray-700 md:text-lg">
            {t("intro")}
          </p>
          <a
            href={APP_LINKS.smartLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-xl bg-ink px-8 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            {t("cta")} â†’
          </a>
        </div>

        {/* Steps */}
        <section className="mb-16">
          <h2 className="mb-8 text-2xl font-bold md:text-3xl">{t(stepsTitleKey)}</h2>
          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <li key={step.title} className="rounded-2xl bg-gray-50 p-6">
                <span
                  aria-hidden="true"
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-lime text-lg font-bold"
                >
                  {i + 1}
                </span>
                <h3 className="mb-2 font-semibold">{step.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Requirements */}
        <section className="mb-16 max-w-3xl">
          <h2 className="mb-6 text-2xl font-bold md:text-3xl">{t("reqTitle")}</h2>
          <ul className="space-y-3">
            {reqs.map((req) => (
              <li key={req} className="flex items-start gap-3 text-sm md:text-base">
                <span aria-hidden="true" className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-lime text-xs font-bold">
                  âœ“
                </span>
                {req}
              </li>
            ))}
          </ul>
        </section>

        {/* Sample terms â€” clearly labelled illustrative data */}
        <section className="mb-16 max-w-3xl">
          <h2 className="mb-4 text-2xl font-bold md:text-3xl">{t("termsTitle")}</h2>
          <div
            role="note"
            className="mb-6 rounded-2xl border-2 border-amber-300 bg-amber-50 p-5"
          >
            <p className="mb-1 font-semibold">âš  {t("termsDisclaimerTitle")}</p>
            <p className="text-sm leading-relaxed text-gray-700">{t("termsDisclaimer")}</p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-gray-200">
            <table className="w-full text-sm md:text-base">
              <tbody>
                {termsRows.map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <th scope="row" className="w-1/2 px-5 py-4 text-left font-medium">
                      {row.label}
                    </th>
                    <td className="px-5 py-4 text-gray-700">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 rounded-2xl bg-gray-50 p-6">
            <h3 className="mb-2 font-semibold">{t("exampleTitle")}</h3>
            <p className="text-sm leading-relaxed text-gray-700">{t("exampleText")}</p>
          </div>
        </section>

        {hasResponsible && (
          <section className="mb-16 max-w-3xl rounded-2xl border border-gray-200 p-6">
            <h2 className="mb-2 text-xl font-bold">{t("responsibleTitle")}</h2>
            <p className="text-sm leading-relaxed text-gray-700">{t("responsibleText")}</p>
          </section>
        )}

        {/* Product FAQ â€” visible, crawlable answers */}
        <section className="mb-16 max-w-3xl">
          <h2 className="mb-6 text-2xl font-bold md:text-3xl">{t("faqTitle")}</h2>
          <FaqList items={faqItems} />
        </section>

        {/* Bottom CTA */}
        <div className="rounded-[36px] bg-lime p-8 text-center md:p-12">
          <a
            href={APP_LINKS.smartLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-xl bg-ink px-10 py-4 text-base font-medium text-white transition hover:bg-gray-800"
          >
            {t("cta")} â†’
          </a>
        </div>
      </div>
    </div>
  );
}
