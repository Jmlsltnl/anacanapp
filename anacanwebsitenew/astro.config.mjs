// @ts-check
import { defineConfig } from 'astro/config';

/**
 * Anacan marketing website.
 *
 * SEO-critical settings:
 *  - `site`: absolute origin used for canonical URLs, hreflang, sitemap, OG, RSS, llms.txt
 *  - `trailingSlash: 'always'` + `build.format: 'directory'`: one canonical URL shape everywhere
 *  - `inlineStylesheets: 'always'`: zero render-blocking CSS -> best possible LCP
 */
export default defineConfig({
  site: process.env.SITE_URL || 'https://anacan.az',
  output: 'static',
  trailingSlash: 'always',
  compressHTML: true,
  build: {
    format: 'directory',
    inlineStylesheets: 'always',
  },
  image: {
    // Local images only; sharp is the default service.
  },
  devToolbar: { enabled: false },
});
