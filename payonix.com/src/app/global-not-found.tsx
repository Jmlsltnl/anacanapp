import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "404 — Səhifə tapılmadı | Payonix",
  description: "Axtardığınız səhifə mövcud deyil. | Page not found. | Страница не найдена.",
};

/**
 * Global catch-all 404 for URLs that match no route at all (enabled via
 * experimental.globalNotFound). This permanently fixes the live site's #1
 * audit finding: every invalid URL used to return HTTP 200 with a cached
 * homepage (universal soft-404). This page returns a real 404 status and
 * Next.js injects noindex automatically.
 *
 * Trilingual by design: it renders outside the [locale] layout, so no
 * translation context exists here.
 */
export default function GlobalNotFound() {
  return (
    <html lang="az">
      <body className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="max-w-lg text-center">
          <p className="mb-4 inline-block rounded-full bg-[#d2fa52] px-4 py-1 text-sm font-semibold text-[#171717]">
            404
          </p>
          <h1 className="mb-3 text-3xl font-bold text-[#171717]">
            Səhifə tapılmadı
          </h1>
          <p className="mb-1 text-gray-600">
            Axtardığınız səhifə mövcud deyil, silinib və ya ünvanı dəyişib.
          </p>
          <p className="mb-1 text-sm text-gray-500">
            The page you are looking for does not exist.
          </p>
          <p className="mb-8 text-sm text-gray-500">
            Страница, которую вы ищете, не существует.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="rounded-xl bg-[#171717] px-6 py-3 text-sm font-medium text-white"
            >
              Ana səhifə
            </Link>
            <Link
              href="/en"
              className="rounded-xl border border-gray-300 px-6 py-3 text-sm font-medium text-[#171717]"
            >
              Home
            </Link>
            <Link
              href="/ru"
              className="rounded-xl border border-gray-300 px-6 py-3 text-sm font-medium text-[#171717]"
            >
              Главная
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
