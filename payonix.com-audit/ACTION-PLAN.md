# Action Plan: payonix.com

Derived from [FULL-AUDIT-REPORT.md](./FULL-AUDIT-REPORT.md). Items are dependency-sequenced: Phase 1 unblocks accurate measurement and content work in later phases (there is no point optimizing titles on pages that don't render, or measuring CWV improvements on a soft-404'd origin).

---

## Phase 1: Critical Fixes (Week 1)

These are infrastructure-level defects, not optimization opportunities — several affect real users, not just crawlers.

| # | Action | Why it's first | How you'd know it's fixed |
|---|---|---|---|
| 1 | **Fix routing/hosting so `/about-us`, `/instant-loan`, `/instant-advance`, `/offers`, `/partner-terms` render their own content** instead of the homepage. Root cause is almost certainly a reverse-proxy/CDN catch-all (`try_files`) rule serving a cached homepage for any path it doesn't explicitly recognize — check the nginx config in front of the Next.js app first. | Blocks everything downstream: no title/meta/content work matters on a page nobody can actually reach | Each URL shows content matching its own topic (e.g., `/instant-loan` shows loan terms, not the hero "Fast and easy payments" copy) |
| 2 | **Implement real HTTP 404 handling** so invalid paths return status 404, not 200 with the homepage body | Same root cause as #1; also required before a sitemap has any integrity | `curl -I https://payonix.com/this-does-not-exist` returns `HTTP/1.1 404` |
| 3 | **Add a real `robots.txt`** (`text/plain`, with `Sitemap: https://payonix.com/sitemap.xml`) | Currently swallowed by the same fallback as #1/#2; needed before submitting a sitemap | `/robots.txt` returns `Content-Type: text/plain` with real directives |
| 4 | **Generate and publish an XML sitemap** covering all 8 (soon-to-be-real) URLs | Depends on #1 being fixed first (no point listing pages that don't render) | `/sitemap.xml` returns valid XML; submits cleanly in Search Console |
| 5 | **Disclose loan/salary-advance interest rate, fee schedule, and repayment terms as real visible text** on the fixed `/instant-loan` and `/instant-advance` pages | YMYL trust requirement; currently zero disclosure exists anywhere on-site | The rate/fee figures a user needs before applying are readable without opening the app |
| 6 | **Add canonical tags site-wide** and **resolve `www` vs. non-`www`** with a 301 to one canonical host | Prevents duplicate-content dilution once #1-4 multiply the number of real, indexable URLs | Every page has a self-referencing (or otherwise correct) `<link rel="canonical">`; the non-preferred host redirects with 301 |

---

## Phase 2: High-Impact Improvements (Weeks 2-3)

| # | Action | Dependency | Falsifiability |
|---|---|---|---|
| 7 | Write unique `<title>` (30-60 chars) and meta description (120-160 chars) for all 8 pages | Depends on Phase 1 #1 (real content to describe) | `site:payonix.com` search shows 8 distinct snippets |
| 8 | Add Open Graph + Twitter Card tags (`og:title`, `og:description`, `og:image`, `twitter:card`) | Independent — can ship immediately | Sharing a payonix.com link on Facebook/LinkedIn/X/WhatsApp shows a proper preview card, not a blank/generic one |
| 9 | Enable gzip or brotli compression on the nginx/reverse-proxy layer for HTML, JS, and CSS | Independent — pure server config change | `curl -H "Accept-Encoding: br" -I https://payonix.com/` shows `Content-Encoding: br` |
| 10 | Add `Cache-Control: public, max-age=31536000, immutable` to all `/_next/static/*` responses | Independent — server config change | Response headers on any hashed JS/CSS asset show the new `Cache-Control` |
| 11 | Open port 80 and issue a real `301` redirect to the HTTPS equivalent URL | Independent — server/firewall config | `curl -I http://payonix.com/` returns `301` with a `Location: https://...` header, not a connection failure |
| 12 | Make the 5 FAQ answers visible as real text in the page (target ~134-167 words per answer for optimal citability) | Independent — content/frontend change | Viewing page source (not just the rendered accordion) shows full answer text for all 5 questions |

---

## Phase 3: Content & Authority (Month 2)

| # | Action | Notes |
|---|---|---|
| 13 | Add `Organization` JSON-LD (name, logo, `contactPoint`, `sameAs` → Facebook/Instagram/YouTube/LinkedIn) | All source data already exists on the page; this is markup-only |
| 14 | Add `SoftwareApplication` JSON-LD for the mobile app, including `aggregateRating` **only if** sourced from real App Store/Google Play rating data (not the curated homepage testimonials) | Do not fabricate a rating value |
| 15 | Build out real "About Us" content: company story, founding, team/leadership presence, why-trust-us narrative (≥400 words) | Core E-E-A-T page; currently non-existent (Phase 1 #1 is the prerequisite) |
| 16 | Add standard security headers: `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, a `Content-Security-Policy` | Defense-in-depth; relevant given the site handles financial account linking |
| 17 | Suppress or generalize the `Server: nginx/1.18.0` version banner (`server_tokens off;`) and evaluate upgrading nginx | Reduces targeted-exploit reconnaissance surface |
| 18 | Clarify the header language-switcher: either wire it to real localized URLs with `hreflang` tags, or confirm/scope it as a cosmetic-only control | Currently ambiguous — a button exists with no observable effect on crawlable output |

---

## Phase 4: Monitoring & Iteration (Ongoing)

| # | Action |
|---|---|
| 19 | Configure a Google PageSpeed Insights API key (free, Tier 0) and re-run performance measurement to replace the estimate in §5 of the full report with real Lighthouse + CrUX data |
| 20 | Connect Google Search Console (if not already) and monitor the "Pages" report weekly for soft-404/duplicate-content regressions, especially right after the Phase 1 fixes ship |
| 21 | Re-crawl monthly (or after each deploy) to confirm the 5 previously-broken pages continue to render correctly — this class of infra bug can silently regress with reverse-proxy config changes |
| 22 | Convert testimonial/photo PNGs to WebP/AVIF | Minor, backlog-tier |
| 23 | Add `manifest.json`, `apple-touch-icon.png`, and `security.txt` once the soft-404 fallback (Phase 1 #2) is fixed | Currently all three are swallowed by the same fallback |

---

## Priority Legend
- **Critical**: Blocks indexing, blocks users, or creates YMYL/regulatory exposure — fix immediately
- **High**: Significantly impacts rankings or trust — fix within 1 week
- **Medium**: Real optimization opportunity — fix within 1 month
- **Low**: Backlog

---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Built by agricidaniel — Join the AI Marketing Hub community
🆓 Free  → https://www.skool.com/ai-marketing-hub
⚡ Pro   → https://www.skool.com/ai-marketing-hub-pro
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
