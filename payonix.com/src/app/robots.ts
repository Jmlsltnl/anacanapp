import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

/** Real robots.txt (the live site served an HTML soft-404 here - finding T3). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
