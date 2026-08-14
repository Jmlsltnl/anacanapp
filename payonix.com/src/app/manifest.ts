import type { MetadataRoute } from "next";

/**
 * Web app manifest (was a soft-404 on the live site - finding T12).
 * Note: icons currently reference the SVG logo; add 192/512px PNG icons
 * for maximum Android install-banner compatibility when brand PNGs exist.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Payonix",
    short_name: "Payonix",
    description:
      "Kartlar, QR ödənişlər, Ani Kredit və əmək haqqı avansı — bir tətbiqdə.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#171717",
    icons: [
      {
        src: "/logo.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
