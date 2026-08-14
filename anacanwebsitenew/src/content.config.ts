import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Blog collection.
 * File layout: src/content/blog/<lang>/<localized-slug>.md
 *  - entry id  -> "<lang>/<slug>"
 *  - file name -> the localized URL slug
 *  - translationKey groups the same article across languages (drives hreflang)
 */
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string().max(120),
    description: z.string().min(50).max(220),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    category: z.enum(['pregnancy', 'motherhood', 'cycle', 'partner', 'health']),
    tags: z.array(z.string()).default([]),
    author: z.string().optional(),
    /** Groups translations of the same article (hreflang + language switcher) */
    translationKey: z.string(),
    /** Visual theme of the cover card */
    theme: z.enum(['flow', 'bump', 'mommy', 'partner']).default('bump'),
    emoji: z.string().default('💛'),
    /** Real cover image URL (synced from the app's database) */
    cover: z.string().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

/**
 * Competitor comparison collection ("Anacan vs X").
 * File layout: src/content/competitors/<lang>/anacan-vs-<competitorSlug>.md
 *  - competitorSlug is IDENTICAL across every language (brand name + "vs" is
 *    universal), so translationKey == competitorSlug, no per-lang mapping needed.
 */
const competitors = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/competitors' }),
  schema: z.object({
    title: z.string().max(140),
    description: z.string().min(50).max(220),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    /** Display name of the competitor, e.g. "Flo" */
    competitor: z.string(),
    /** Stable id used for file naming + translationKey, e.g. "flo" */
    competitorSlug: z.string(),
    competitorWebsite: z.string().url(),
    category: z.enum(['period-tracker', 'pregnancy-tracker', 'parenting-community', 'fertility']),
    translationKey: z.string(),
    theme: z.enum(['flow', 'bump', 'mommy', 'partner']).default('bump'),
    emoji: z.string().default('⚖️'),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog, competitors };
