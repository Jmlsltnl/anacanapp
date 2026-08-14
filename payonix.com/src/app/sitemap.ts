import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getPathname } from "@/i18n/navigation";
import { SITE_URL } from "@/lib/constants";

type RouteKey = keyof typeof routing.pathnames;

function url(href: RouteKey, locale: (typeof routing.locales)[number]) {
  return new URL(getPathname({ href, locale }), SITE_URL).toString();
}

/**
 * XML sitemap covering every page in every locale, with hreflang alternates
 * per entry (the live site had no sitemap at all - audit finding T4).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = Object.keys(routing.pathnames) as RouteKey[];
  const lastModified = new Date();

  return routes.map((href) => {
    const priority = href === "/" ? 1 : href === "/instant-loan" || href === "/instant-advance" ? 0.9 : 0.7;
    const changeFrequency: "weekly" | "monthly" = href === "/" ? "weekly" : "monthly";
    return {
      url: url(href, routing.defaultLocale),
      lastModified,
      changeFrequency,
      priority,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((locale) => [locale, url(href, locale)]),
        ),
      },
    };
  });
}
