import type { APIRoute } from 'astro';

/**
 * robots.txt — everything crawlable except the internal SEO panel & reports.
 * AI crawlers are explicitly welcomed (AI-SEO / GEO posture).
 */
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('/sitemap.xml', site).href;

  const body = `# anacan.az — robots.txt
# Everything public is crawlable. AI assistants are welcome.

User-agent: *
Allow: /
Disallow: /seo-panel/
Disallow: /seo-report.json
Disallow: /SEO-REPORT.md

# ── AI / LLM crawlers — explicitly allowed ─────────────────────────
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: CCBot
Allow: /

User-agent: meta-externalagent
Allow: /

User-agent: Bytespider
Allow: /

# ── Discovery ───────────────────────────────────────────────────────
Sitemap: ${sitemap}

# LLM-friendly site summaries:
# ${new URL('/llms.txt', site).href}
# ${new URL('/llms-full.txt', site).href}
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
