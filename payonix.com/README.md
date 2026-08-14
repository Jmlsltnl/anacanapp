# Payonix.com — Complete Rebuild

A from-scratch rebuild of [payonix.com](https://payonix.com), driven by the full SEO/technical audit in [`../payonix.com-audit/`](../payonix.com-audit/FULL-AUDIT-REPORT.md). Azerbaijani-first, trilingual (AZ / EN / RU), fully functional, and SEO-complete.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (CSS-first `@theme` config)
- **next-intl 4** — locale routing, localized pathnames, hreflang-aware navigation
- Real brand assets (logo, icons, illustrations, photos) carried over from the live site

## i18n architecture (Azerbaijani first)

| Locale | URL pattern | Example |
|---|---|---|
| `az` (default) | no prefix | `/`, `/ani-kredit`, `/haqqimizda` |
| `en` | `/en/...` | `/en/instant-loan`, `/en/about-us` |
| `ru` | `/ru/...` | `/ru/bystryy-kredit`, `/ru/o-nas` |

- Every route has a **translated slug per locale** (`src/i18n/routing.ts`), not just translated copy on a shared URL.
- Every page emits a **self-referencing canonical + hreflang alternates for all 3 locales + x-default** (`src/lib/seo.ts`).
- Automatic browser-language redirection is deliberately **off** (`localeDetection: false`): `/` is always stable Azerbaijani for users and crawlers; hreflang handles the rest.
- The header language switcher performs real navigation to the target locale's own URL (the old site's switcher was a dead button).

## Audit findings → fixes map

| Audit finding (severity) | Fix in this rebuild |
|---|---|
| 5 of 8 pages served duplicate homepage content (Critical) | All 10 page types are real, unique, statically prerendered in 3 locales (30 pages) |
| Universal soft-404 — every bad URL returned HTTP 200 (Critical) | `experimental.globalNotFound` + `src/app/global-not-found.tsx` → real **404 status** + auto `noindex` for any unmatched URL (verified) |
| No `robots.txt` (Critical) | `src/app/robots.ts` → real `text/plain` robots with sitemap directive |
| No `sitemap.xml` (High) | `src/app/sitemap.ts` → all pages × locales with `xhtml:link` hreflang alternates (30 alternates) |
| No canonical tags (High) | Self-referencing canonical on every page |
| Identical title/description on all pages (Critical) | Unique, length-tuned title + description per page per locale (`messages/*.json → meta.*`) |
| Meta description described B2B, product is B2C (High) | Rewritten to match the actual consumer product |
| Zero Open Graph / Twitter tags (High) | Full OG + Twitter Card on every page; generated 1200×630 PNG OG image (`opengraph-image.tsx`) |
| Zero structured data (High) | JSON-LD: `Organization` (+`sameAs`, license-holding legal entity), `WebSite`, `SoftwareApplication`, `BreadcrumbList`, `ContactPage` |
| FAQ answers absent from DOM (High) | Native `<details>` accordions — **answers always in server HTML**, crawlable & citable; dedicated `/faq` page with 17 Q&A |
| No rate/fee disclosure for loan products (Critical, YMYL) | Dedicated Instant Loan / Instant Advance pages with terms tables, representative example calculations and responsible-borrowing note — **clearly labelled as sample data** (see below) |
| About Us had no content (High) | Full company narrative (500+ words/locale), values, stats, official registry/license details table |
| Nav "Contact" pointed to `/` (Low) | Dedicated `/contact` page with methods, map link and a working form |
| No compression (High) | `compress: true` (verified gzip) — also enable brotli at the reverse proxy |
| No `Cache-Control` on static assets (Medium) | `immutable, max-age=31536000` on `/_next/static/*` and image files |
| Missing security headers (Medium) | CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS w/ preload |
| `manifest.json` / touch icon soft-404s (Low) | Real `manifest.webmanifest` via `src/app/manifest.ts` |
| Search Console verification + GTM continuity | Existing verification meta tag and GTM container (`GTM-M5PSPSX2`) preserved (`src/lib/constants.ts`) |

## ⚠️ Sample data that must be replaced before go-live

The audit confirmed no real rate/fee figures exist anywhere publicly. Per the agreed approach, the loan/advance pages ship with **realistic, clearly-labelled illustrative figures** (each page shows a prominent disclaimer that binding terms appear in-app before signing). Replace them with real product data in:

- `messages/az.json`, `messages/en.json`, `messages/ru.json` → `loan.termsRows`, `loan.exampleText`, `advance.termsRows`, `advance.exampleText`

## Legal content provenance

- **Privacy Policy** — the live site's real English text, captured verbatim during the audit; AZ/RU are faithful translations. (`src/content/legal/privacy-*.ts`)
- **Customer Terms** — the live site's real Azerbaijani contract (≈4,600 words), captured verbatim; EN/RU are faithful courtesy translations carrying an "Azerbaijani version prevails" note. (`src/content/legal/customer-terms-*.ts`)
- **Partner Terms** — the live page was broken (homepage duplicate), so this document was **written fresh** as a professional framework text; have legal counsel review before publication. (`src/content/legal/partner-terms-*.ts`)

## Backend wiring (stubs ready)

Forms are fully functional client-side and POST to real API routes that validate + log:

- `src/app/api/contact/route.ts` — contact form (honeypot spam guard included)
- `src/app/api/apply-interest/route.ts` — product-interest lead capture

Each contains a `TODO(backend)` marking exactly where to plug SMTP/CRM credentials (via env vars).

## Commands

```bash
npm run dev     # local development
npm run build   # production build (all pages prerendered)
npm start       # production server
```

## Deployment notes

- **Node server required** (proxy/i18n routing + OG image generation) — do not static-export.
- At the reverse proxy / host level (fixes audit findings T6/T7, which live outside the app):
  - Listen on **port 80** and 301 → HTTPS (the old server refused port-80 connections outright).
  - 301 `www.payonix.com` → `payonix.com` (both previously returned 200 with no canonicalization).
  - Enable brotli if available (app already serves gzip).
  - Keep `server_tokens off;` (old server leaked `nginx/1.18.0`).
- OG image text is intentionally English-only (the OG renderer's bundled font doesn't cover `ə/İ` reliably); localized `og:title`/`og:description` carry the per-locale message.
- Manifest currently uses the SVG logo; add 192/512px PNG icons when brand PNGs are available for maximum Android install-prompt compatibility.

## Structure

```
src/
├─ app/
│  ├─ [locale]/                 # root layout + all pages (az/en/ru)
│  │  ├─ page.tsx               # Home
│  │  ├─ about/ instant-loan/ instant-advance/ offers/
│  │  ├─ faq/ contact/ privacy-policy/ customer-terms/ partner-terms/
│  │  ├─ not-found.tsx          # localized 404
│  │  └─ opengraph-image.tsx    # generated 1200×630 PNG
│  ├─ api/contact/ api/apply-interest/
│  ├─ global-not-found.tsx      # real 404 for unmatched URLs (audit fix #1)
│  ├─ sitemap.ts robots.ts manifest.ts
├─ components/                  # Navbar, Footer, FaqList, ContactForm, ...
├─ content/legal/               # real captured legal docs + translations
├─ i18n/                        # routing (localized slugs), navigation, request
├─ lib/                         # constants (brand facts), seo, structured-data
messages/                       # az.json en.json ru.json (all page copy)
```
