import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    // Audit finding fix: original site had zero CSP. This is a reasonably
    // strict baseline for a Next.js app with GTM-style third-party tags.
    // Tighten further (remove 'unsafe-inline'/'unsafe-eval') once a nonce-
    // based strategy or a fixed script inventory is finalized.
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com",
      "frame-src https://www.googletagmanager.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Explicit even though true is the default: response compression
  // (gzip/brotli) was confirmed completely absent on the live site.
  compress: true,
  poweredByHeader: false,

  experimental: {
    // Required so a single, correct 404 (with a real 404 status + noindex)
    // is served for any URL that doesn't match a route at all - this is the
    // framework-level fix for the audit's #1 and #2 critical findings
    // (broken pages / universal soft-404), since the root layout lives under
    // the [locale] dynamic segment.
    globalNotFound: true,
  },

  images: {
    formats: ["image/avif", "image/webp"],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // Content-hashed, immutable Next.js build assets: safe to cache
        // forever. The live site sent no Cache-Control at all on these.
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:all*(svg|jpg|jpeg|png|webp|avif|ico)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
