import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/seo";
import {
  jsonLdGraph,
  organizationSchema,
  softwareApplicationSchema,
  webSiteSchema,
} from "@/lib/structured-data";
import { APP_LINKS, CONTACT } from "@/lib/constants";
import JsonLd from "@/components/JsonLd";
import FaqList from "@/components/FaqList";
import Testimonials from "@/components/Testimonials";
import AppBadges from "@/components/AppBadges";

interface Props {
  params: Promise<{ locale: AppLocale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.home" });
  return buildPageMetadata({
    locale,
    href: "/",
    title: t("title"),
    description: t("description"),
  });
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const hero = await getTranslations("hero");
  const cards = await getTranslations("cards");
  const control = await getTranslations("control");
  const services = await getTranslations("services");
  const faq = await getTranslations("faqHome");
  const contactSection = await getTranslations("contactSection");
  const appBanner = await getTranslations("appBanner");

  const faqItems = faq.raw("items") as { q: string; a: string }[];

  return (
    <>
      <JsonLd
        data={jsonLdGraph(
          organizationSchema(),
          webSiteSchema(locale),
          softwareApplicationSchema(),
        )}
      />

      {/* Hero */}
      <section className="px-4 pb-16 pt-10 text-center">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-medium underline">{hero("badge")}</p>
          <div className="mt-3 flex items-center justify-center -space-x-3">
            {["/h-1.svg", "/h-2.svg", "/h-3.svg", "/h-4.svg"].map((src, i) => (
              <Image
                key={src}
                src={src}
                alt=""
                aria-hidden="true"
                width={44}
                height={44}
                className={`h-11 w-11 rounded-full border-2 border-white object-cover shadow ${i === 0 ? "" : ""}`}
              />
            ))}
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-200 text-xs font-bold shadow">
              +499k
            </span>
          </div>

          <h1 className="mx-auto mt-10 max-w-4xl text-4xl font-bold md:text-6xl">
            {hero("title")}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm text-gray-700 md:text-base">
            {hero("subtitle")}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href={APP_LINKS.smartLink}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-ink px-8 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              {hero("ctaPrimary")} â†’
            </a>
            <Link
              href="/about"
              className="rounded-xl border border-gray-300 px-8 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              {hero("ctaSecondary")}
            </Link>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="px-4 pb-20">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
          <Link
            href="/instant-loan"
            className="group relative flex min-h-[360px] flex-col justify-between overflow-hidden rounded-[36px] bg-gray-50 p-8 transition hover:bg-lime hover:shadow-lg"
          >
            <div className="flex justify-center">
              <Image
                src="/p-1.png"
                alt={cards("loan.title")}
                width={400}
                height={800}
                className="h-52 w-auto object-contain"
              />
            </div>
            <div className="text-center">
              <h2 className="mb-2 inline-flex items-center gap-2 text-2xl font-medium md:text-3xl">
                {cards("loan.title")}
                <Image src="/arrow.svg" alt="" aria-hidden="true" width={32} height={32} className="-rotate-45 transition group-hover:translate-x-1 group-hover:-translate-y-1" />
              </h2>
              <p className="text-sm text-gray-700">{cards("loan.text")}</p>
            </div>
          </Link>

          <Link
            href="/instant-advance"
            className="group relative flex min-h-[360px] flex-col justify-between overflow-hidden rounded-[36px] bg-gray-50 p-8 transition hover:bg-lime hover:shadow-lg"
          >
            <div className="text-center">
              <h2 className="mb-2 inline-flex items-center gap-2 text-2xl font-medium md:text-3xl">
                {cards("advance.title")}
                <Image src="/arrow.svg" alt="" aria-hidden="true" width={32} height={32} className="-rotate-45 transition group-hover:translate-x-1 group-hover:-translate-y-1" />
              </h2>
              <p className="text-sm text-gray-700">{cards("advance.text")}</p>
            </div>
            <div className="flex justify-center">
              <Image
                src="/p-2.svg"
                alt={cards("advance.title")}
                width={269}
                height={100}
                className="w-56 object-contain"
              />
            </div>
          </Link>

          <Link
            href="/offers"
            className="group relative flex min-h-[360px] flex-col justify-between overflow-hidden rounded-[36px] bg-gray-50 p-8 transition hover:bg-lime hover:shadow-lg"
          >
            <div className="flex justify-center">
              <Image
                src="/p-3.svg"
                alt={cards("offers.title")}
                width={269}
                height={100}
                className="w-56 object-contain"
              />
            </div>
            <div className="text-center">
              <h2 className="mb-2 inline-flex items-center gap-2 text-2xl font-medium md:text-3xl">
                {cards("offers.title")}
                <Image src="/arrow.svg" alt="" aria-hidden="true" width={32} height={32} className="-rotate-45 transition group-hover:translate-x-1 group-hover:-translate-y-1" />
              </h2>
              <p className="text-sm text-gray-700">{cards("offers.text")}</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Control section */}
      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-8 md:flex-row md:items-start">
            <h2 className="max-w-xl text-3xl font-bold leading-tight md:text-5xl">
              {control("title")}
            </h2>
            <div className="max-w-md space-y-5">
              <p className="text-sm text-gray-600 md:text-base">{control("text")}</p>
              <a
                href={APP_LINKS.smartLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-xl bg-ink px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
              >
                {control("button")} â†’
              </a>
            </div>
          </div>
          <div className="relative mx-auto h-72 max-w-4xl md:h-[520px]">
            <Image
              src="/payment_image.svg"
              alt={control("title")}
              fill
              className="object-contain drop-shadow-xl"
              sizes="(max-width: 768px) 100vw, 896px"
            />
          </div>
        </div>
      </section>

      {/* Services grid */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-5xl">{services("title")}</h2>
            <p className="mx-auto max-w-3xl text-sm text-gray-600 md:text-base">
              {services("subtitle")}
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex min-h-[380px] flex-col overflow-hidden rounded-2xl bg-navy-2 p-7 text-white">
              <h3 className="mb-2 text-center text-2xl font-bold md:text-3xl">
                {services("expenses.title")}
              </h3>
              <div className="relative mt-auto h-48 w-full">
                <Image src="/adv-1.svg" alt={services("expenses.title")} fill className="object-contain object-bottom" sizes="(max-width: 768px) 100vw, 400px" />
              </div>
              <p className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl font-bold">â‚¼6.800</span>
                <span className="text-xs opacity-70">{services("expenses.total")}</span>
              </p>
            </div>
            <div className="flex min-h-[380px] flex-col overflow-hidden rounded-2xl bg-gray-100 p-7">
              <h3 className="mb-2 text-center text-2xl font-bold md:text-3xl">
                {services("transfer.title")}
              </h3>
              <p className="mb-6 text-center text-sm text-gray-600">
                {services("transfer.text")}
              </p>
              <div className="relative mt-auto h-48 w-full">
                <Image src="/adv-2.svg" alt={services("transfer.title")} fill className="object-contain object-bottom" sizes="(max-width: 768px) 100vw, 400px" />
              </div>
            </div>
            <div className="flex min-h-[380px] flex-col overflow-hidden rounded-2xl bg-gray-50 p-7">
              <h3 className="mb-2 text-center text-2xl font-bold md:text-3xl">
                {services("byDate.title")}
              </h3>
              <p className="mb-6 text-center text-sm text-gray-600">
                {services("byDate.text")}
              </p>
              <div className="relative mt-auto h-48 w-full">
                <Image src="/adv-3.svg" alt={services("byDate.title")} fill className="object-contain object-bottom" sizes="(max-width: 768px) 100vw, 400px" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ â€” answers are real, visible, crawlable text (audit fix C3/G1) */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-10 md:flex-row">
            <div className="md:w-1/2">
              <h2 className="mb-8 text-3xl font-bold md:text-5xl">{faq("title")}</h2>
              <FaqList items={faqItems} />
              <Link
                href="/faq"
                className="mt-6 inline-block text-sm font-medium underline hover:text-lime-deep"
              >
                {faq("seeAll")} â†’
              </Link>
            </div>
            <div className="relative hidden md:block md:w-1/2">
              <Image
                src="/banner-phones.svg"
                alt="Payonix"
                fill
                className="object-contain"
                sizes="50vw"
              />
            </div>
          </div>
        </div>
      </section>

      <Testimonials />

      {/* Contact methods */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-lg text-center">
          <p className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs">
            <Image src="/phone.svg" alt="" aria-hidden="true" width={14} height={14} />
            {contactSection("badge")}
          </p>
          <h2 className="mb-3 text-3xl font-bold md:text-4xl">{contactSection("title")}</h2>
          <p className="mb-10 text-gray-600">{contactSection("text")}</p>
          <div className="space-y-3 text-left">
            <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 transition hover:border-lime-deep">
              <span className="rounded-lg border border-gray-200 bg-gray-100 p-2">
                <Image src="/mail.svg" alt="" aria-hidden="true" width={24} height={24} />
              </span>
              <span className="flex-grow">
                <span className="block text-xs text-gray-500">{contactSection("emailLabel")}</span>
                <span className="text-sm font-medium">{CONTACT.email}</span>
              </span>
            </a>
            <a href={`tel:${CONTACT.phoneTel}`} className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 transition hover:border-lime-deep">
              <span className="rounded-lg border border-gray-200 bg-gray-100 p-2">
                <Image src="/phone.svg" alt="" aria-hidden="true" width={24} height={24} />
              </span>
              <span className="flex-grow">
                <span className="block text-xs text-gray-500">{contactSection("phoneLabel")}</span>
                <span className="text-sm font-medium">{CONTACT.phoneDisplay}</span>
              </span>
            </a>
            <Link href="/contact" className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 transition hover:border-lime-deep">
              <span className="rounded-lg border border-gray-200 bg-gray-100 p-2">
                <Image src="/location.svg" alt="" aria-hidden="true" width={24} height={24} />
              </span>
              <span className="flex-grow">
                <span className="block text-xs text-gray-500">{contactSection("addressLabel")}</span>
                <span className="text-sm font-medium">{CONTACT.addressStreet}, {CONTACT.addressCity}</span>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* App download banner */}
      <section className="px-4 pb-20">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[36px] bg-lime p-8 md:p-12">
          <Image src="/banner-pattern.svg" alt="" aria-hidden="true" fill className="object-cover" sizes="100vw" />
          <div className="relative z-10 flex flex-col items-center gap-10 lg:flex-row">
            <div className="relative order-last h-72 w-full lg:order-first lg:h-[420px] lg:w-3/5">
              <Image src="/banner-phones.svg" alt="Payonix app" fill className="object-contain object-bottom" sizes="(max-width: 1024px) 100vw, 60vw" />
            </div>
            <div className="flex w-full flex-col items-center lg:w-2/5 lg:items-start">
              <span className="mb-4 rounded-lg bg-white p-2">
                <Image src="/appqr.png" alt={appBanner("scanLabel")} width={90} height={90} className="rounded-lg" />
              </span>
              <h2 className="mb-3 text-center text-3xl font-bold leading-tight md:text-5xl lg:text-left">
                {appBanner("title")}
              </h2>
              <p className="mb-6 text-center text-sm lg:text-left">{appBanner("text")}</p>
              <AppBadges iosAlt={appBanner("ios")} androidAlt={appBanner("android")} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
