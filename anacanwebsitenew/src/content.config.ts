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
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
