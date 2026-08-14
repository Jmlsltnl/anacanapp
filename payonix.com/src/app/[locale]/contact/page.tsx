import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/seo";
import {
  absoluteUrl,
  contactPageSchema,
  jsonLdGraph,
  organizationSchema,
} from "@/lib/structured-data";
import { CONTACT } from "@/lib/constants";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import ContactForm from "@/components/ContactForm";

interface Props {
  params: Promise<{ locale: AppLocale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.contact" });
  return buildPageMetadata({
    locale,
    href: "/contact",
    title: t("title"),
    description: t("description"),
  });
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");
  const bc = await getTranslations("breadcrumb");

  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(
    `${CONTACT.addressStreet}, ${CONTACT.addressCity}, ${CONTACT.addressCountry}`,
  )}`;

  return (
    <div className="px-4 pb-20">
      <div className="mx-auto max-w-7xl">
        <JsonLd
          data={jsonLdGraph(
            organizationSchema(),
            contactPageSchema(locale, t("h1")),
          )}
        />
        <Breadcrumbs
          items={[
            { name: bc("home"), href: "/", absoluteUrl: absoluteUrl(locale) },
            { name: t("h1"), absoluteUrl: absoluteUrl(locale, "/contact") },
          ]}
        />

        <div className="mb-12 max-w-3xl">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">{t("h1")}</h1>
          <p className="text-base leading-relaxed text-gray-700 md:text-lg">{t("intro")}</p>
        </div>

        <div className="grid gap-12 lg:grid-cols-2">
          {/* Contact methods */}
          <div className="space-y-4">
            <a
              href={`mailto:${CONTACT.email}`}
              className="flex items-center gap-4 rounded-2xl border border-gray-200 p-5 transition hover:border-lime-deep"
            >
              <span className="rounded-xl border border-gray-200 bg-gray-100 p-3">
                <Image src="/mail.svg" alt="" aria-hidden="true" width={26} height={26} />
              </span>
              <span>
                <span className="block text-xs text-gray-500">{t("methodEmail")}</span>
                <span className="text-base font-medium">{CONTACT.email}</span>
              </span>
            </a>

            <a
              href={`tel:${CONTACT.phoneTel}`}
              className="flex items-center gap-4 rounded-2xl border border-gray-200 p-5 transition hover:border-lime-deep"
            >
              <span className="rounded-xl border border-gray-200 bg-gray-100 p-3">
                <Image src="/phone.svg" alt="" aria-hidden="true" width={26} height={26} />
              </span>
              <span>
                <span className="block text-xs text-gray-500">{t("methodPhone")}</span>
                <span className="text-base font-medium">
                  {CONTACT.phoneDisplay} Â· {CONTACT.phoneTel}
                </span>
              </span>
            </a>

            <div className="rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center gap-4">
                <span className="rounded-xl border border-gray-200 bg-gray-100 p-3">
                  <Image src="/location.svg" alt="" aria-hidden="true" width={26} height={26} />
                </span>
                <span>
                  <span className="block text-xs text-gray-500">{t("methodAddress")}</span>
                  <address className="text-base font-medium not-italic">
                    {CONTACT.addressStreet}, {CONTACT.addressCity}, {CONTACT.addressCountry}
                  </address>
                </span>
              </div>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-sm font-medium underline hover:text-lime-deep"
              >
                {t("mapCta")} â†’
              </a>
            </div>
          </div>

          {/* Form */}
          <div className="rounded-[28px] bg-gray-50 p-6 md:p-8">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
