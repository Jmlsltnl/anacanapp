import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/seo";
import { absoluteUrl, jsonLdGraph, organizationSchema } from "@/lib/structured-data";
import { APP_LINKS } from "@/lib/constants";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import AppBadges from "@/components/AppBadges";

interface Props {
  params: Promise<{ locale: AppLocale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.about" });
  return buildPageMetadata({
    locale,
    href: "/about",
    title: t("title"),
    description: t("description"),
  });
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");
  const bc = await getTranslations("breadcrumb");
  const appBanner = await getTranslations("appBanner");

  const story = t.raw("story") as string[];
  const values = t.raw("values") as { title: string; text: string }[];
  const companyRows = t.raw("companyRows") as { label: string; value: string }[];
  const stats = t.raw("stats") as { value: string; label: string }[];

  return (
    <div className="px-4 pb-20">
      <div className="mx-auto max-w-7xl">
        <JsonLd data={jsonLdGraph(organizationSchema())} />
        <Breadcrumbs
          items={[
            { name: bc("home"), href: "/", absoluteUrl: absoluteUrl(locale) },
            { name: t("h1"), absoluteUrl: absoluteUrl(locale, "/about") },
          ]}
        />

        <div className="max-w-3xl">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">{t("h1")}</h1>
          <p className="mb-12 text-lg text-gray-600">{t("intro")}</p>
        </div>

        {/* Stats band */}
        <div className="mb-16 grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-gray-50 p-6 text-center">
              <p className="text-2xl font-bold md:text-3xl">{s.value}</p>
              <p className="mt-1 text-sm text-gray-600">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Story */}
        <section className="mb-16 max-w-3xl">
          <h2 className="mb-5 text-2xl font-bold md:text-3xl">{t("storyTitle")}</h2>
          <div className="space-y-4 text-sm leading-relaxed text-gray-700 md:text-base">
            {story.map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
          </div>
        </section>

        {/* Mission */}
        <section className="mb-16 rounded-[36px] bg-lime p-8 md:p-12">
          <h2 className="mb-3 text-2xl font-bold md:text-3xl">{t("missionTitle")}</h2>
          <p className="max-w-3xl text-base font-medium md:text-xl">{t("mission")}</p>
        </section>

        {/* Values */}
        <section className="mb-16">
          <h2 className="mb-8 text-2xl font-bold md:text-3xl">{t("valuesTitle")}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl border border-gray-200 p-6">
                <h3 className="mb-2 text-lg font-semibold">{v.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{v.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Official details â€” verifiable trust/regulatory facts */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold md:text-3xl">{t("companyTitle")}</h2>
          <div className="overflow-hidden rounded-2xl border border-gray-200">
            <table className="w-full text-sm md:text-base">
              <tbody>
                {companyRows.map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <th scope="row" className="w-1/3 px-5 py-4 text-left font-medium">
                      {row.label}
                    </th>
                    <td className="px-5 py-4 text-gray-700">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-[36px] bg-ink p-8 text-white md:p-12">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="mb-2 text-2xl font-bold md:text-3xl">{t("ctaTitle")}</h2>
              <p className="text-sm text-gray-300 md:text-base">{t("ctaText")}</p>
            </div>
            <div className="flex flex-col gap-3">
              <AppBadges iosAlt={appBanner("ios")} androidAlt={appBanner("android")} />
              <a
                href={APP_LINKS.smartLink}
                target="_blank"
                rel="noopener noreferrer"
                className="sr-only"
              >
                Payonix
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
