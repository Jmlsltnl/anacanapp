import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CONTACT, SOCIAL_LINKS } from "@/lib/constants";
import AppBadges from "./AppBadges";

const SOCIALS = [
  { name: "Facebook", href: SOCIAL_LINKS.facebook, icon: "/social/facebook.svg" },
  { name: "Instagram", href: SOCIAL_LINKS.instagram, icon: "/social/instagram.svg" },
  { name: "YouTube", href: SOCIAL_LINKS.youtube, icon: "/social/youtube.svg" },
  { name: "LinkedIn", href: SOCIAL_LINKS.linkedin, icon: "/social/linkedin.svg" },
] as const;

export default async function Footer() {
  const t = await getTranslations("footer");
  const nav = await getTranslations("nav");
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy text-white">
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Image
              src="/logo.svg"
              alt="Payonix"
              width={72}
              height={72}
              className="mb-5"
            />
            <p className="text-sm leading-relaxed text-gray-400">{t("about")}</p>
          </div>

          <nav aria-label={t("navTitle")}>
            <h2 className="mb-4 text-base font-medium">{t("navTitle")}</h2>
            <ul className="space-y-3 text-sm">
              <li><Link className="text-gray-400 transition hover:text-white" href="/">{nav("home")}</Link></li>
              <li><Link className="text-gray-400 transition hover:text-white" href="/about">{nav("about")}</Link></li>
              <li><Link className="text-gray-400 transition hover:text-white" href="/instant-loan">{nav("loan")}</Link></li>
              <li><Link className="text-gray-400 transition hover:text-white" href="/instant-advance">{nav("advance")}</Link></li>
              <li><Link className="text-gray-400 transition hover:text-white" href="/offers">{nav("offers")}</Link></li>
              <li><Link className="text-gray-400 transition hover:text-white" href="/faq">{nav("faq")}</Link></li>
              <li><Link className="text-gray-400 transition hover:text-white" href="/contact">{nav("contact")}</Link></li>
            </ul>
          </nav>

          <nav aria-label={t("legalTitle")}>
            <h2 className="mb-4 text-base font-medium">{t("legalTitle")}</h2>
            <ul className="space-y-3 text-sm">
              <li><Link className="text-gray-400 transition hover:text-white" href="/privacy-policy">{t("privacy")}</Link></li>
              <li><Link className="text-gray-400 transition hover:text-white" href="/customer-terms">{t("customerTerms")}</Link></li>
              <li><Link className="text-gray-400 transition hover:text-white" href="/partner-terms">{t("partnerTerms")}</Link></li>
            </ul>
          </nav>

          <div>
            <h2 className="mb-4 text-base font-medium">{t("downloadTitle")}</h2>
            <AppBadges
              variant="footer"
              iosAlt="App Store"
              androidAlt="Google Play"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-4 md:flex-row">
          <p className="text-sm text-gray-400">{t("copyright", { year })}</p>
          <ul className="flex items-center gap-5">
            {SOCIALS.map((s) => (
              <li key={s.name}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-90 transition hover:opacity-100"
                >
                  <Image src={s.icon} alt={s.name} width={24} height={24} />
                </a>
              </li>
            ))}
          </ul>
          <a
            href={`tel:${CONTACT.phoneTel}`}
            className="flex items-center gap-2 text-sm text-white"
          >
            <Image src="/phone.svg" alt="" aria-hidden="true" width={18} height={18} className="brightness-0 invert" />
            {CONTACT.phoneDisplay}
          </a>
        </div>
      </div>

      <div className="border-t border-white/10 py-5">
        <div className="mx-auto max-w-7xl space-y-1.5 px-4 text-center text-xs text-gray-400">
          <p>{t("licenseLine")}</p>
          <p>{t("hotline")}</p>
        </div>
      </div>
    </footer>
  );
}
