"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { APP_LINKS } from "@/lib/constants";
import LanguageSwitcher from "./LanguageSwitcher";

const NAV_ITEMS = [
  { key: "about", href: "/about" },
  { key: "loan", href: "/instant-loan" },
  { key: "advance", href: "/instant-advance" },
  { key: "offers", href: "/offers" },
  { key: "faq", href: "/faq" },
  { key: "contact", href: "/contact" },
] as const;

export default function Navbar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4">
      <div className="mx-auto mt-4 max-w-7xl rounded-2xl bg-ink px-5">
        <nav className="flex h-16 items-center justify-between" aria-label="Main">
          <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <Image
              src="/logo.svg"
              alt="Payonix"
              width={44}
              height={40}
              className="h-10 w-11 object-contain"
              priority
            />
            <span className="sr-only">Payonix</span>
          </Link>

          <ul className="hidden items-center gap-6 lg:flex">
            {NAV_ITEMS.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className={`text-sm transition hover:text-lime ${
                    pathname === item.href
                      ? "font-semibold text-lime"
                      : "font-normal text-white"
                  }`}
                >
                  {t(item.key)}
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden items-center gap-3 lg:flex">
            <LanguageSwitcher label={t("language")} />
            <a
              href={APP_LINKS.smartLink}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-lime-strong px-6 py-2.5 text-sm font-medium text-ink transition hover:brightness-95"
            >
              {t("downloadApp")}
            </a>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <LanguageSwitcher label={t("language")} />
            <button
              type="button"
              aria-label={open ? t("closeMenu") : t("openMenu")}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="rounded-full p-2 text-white hover:bg-white/10"
            >
              {open ? (
                <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              ) : (
                <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              )}
            </button>
          </div>
        </nav>

        {open && (
          <div className="border-t border-white/10 pb-4 lg:hidden">
            <ul className="flex flex-col gap-1 pt-3">
              {NAV_ITEMS.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`block rounded-lg px-3 py-2 text-sm ${
                      pathname === item.href
                        ? "bg-white/10 font-semibold text-lime"
                        : "text-white hover:bg-white/5"
                    }`}
                  >
                    {t(item.key)}
                  </Link>
                </li>
              ))}
              <li className="pt-2">
                <a
                  href={APP_LINKS.smartLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl bg-lime-strong px-4 py-2.5 text-center text-sm font-medium text-ink"
                >
                  {t("downloadApp")}
                </a>
              </li>
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}
