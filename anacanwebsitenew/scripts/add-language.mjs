/**
 * Scaffolds a new site language in one command — mirrors adding a language
 * to the Anacan app.
 *
 *   npm run add:lang -- <code> [nativeName] [englishName]
 *   e.g. npm run add:lang -- uz "Oʻzbekcha" Uzbek
 *
 * What it does:
 *   1. src/i18n/<code>.json        — copies en.json as a translation template
 *   2. src/content/blog/<code>/    — creates the blog folder (+ README hint)
 *   3. src/config/languages.ts     — appends a registry entry (TODO-marked)
 *
 * Everything else (routes, hreflang, sitemap.xml, RSS, llms.txt, OG images,
 * language switcher, SEO panel matrix) derives automatically on next build.
 */
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const exists = (p) => access(p).then(() => true, () => false);

const [code, nativeName, englishName] = process.argv.slice(2);

if (!code || !/^[a-z]{2,3}$/.test(code)) {
  console.error('Usage: npm run add:lang -- <iso-code> [nativeName] [englishName]\n  e.g. npm run add:lang -- uz "Oʻzbekcha" Uzbek');
  process.exit(1);
}

const native = nativeName || code.toUpperCase();
const english = englishName || code.toUpperCase();

async function main() {
  /* 1. dictionary */
  const dictPath = join(root, `src/i18n/${code}.json`);
  if (await exists(dictPath)) {
    console.log(`• src/i18n/${code}.json already exists — skipped`);
  } else {
    const en = await readFile(join(root, 'src/i18n/en.json'), 'utf8');
    await writeFile(dictPath, en);
    console.log(`✓ src/i18n/${code}.json created (copy of en.json — translate the values)`);
  }

  /* 2. blog folder */
  const blogDir = join(root, `src/content/blog/${code}`);
  await mkdir(blogDir, { recursive: true });
  console.log(`✓ src/content/blog/${code}/ ready (add translated posts with matching translationKey)`);

  /* 3. registry entry */
  const regPath = join(root, 'src/config/languages.ts');
  let reg = await readFile(regPath, 'utf8');
  if (new RegExp(`code:\\s*'${code}'`).test(reg)) {
    console.log(`• languages.ts already contains '${code}' — skipped`);
  } else {
    const entry = `  {
    // TODO(new-language): verify bcp47/ogLocale/dateLocale values
    code: '${code}',
    bcp47: '${code}-${code.toUpperCase()}',
    nativeName: '${native}',
    englishName: '${english}',
    ogLocale: '${code}_${code.toUpperCase()}',
    dateLocale: '${code}',
    dir: 'ltr',
    flag: '🌐',
  },
];`;
    reg = reg.replace(/\n\];/, `\n${entry}`);
    await writeFile(regPath, reg);
    console.log(`✓ src/config/languages.ts — '${code}' registry entry appended`);
  }

  console.log(`
Next steps:
  1. Translate src/i18n/${code}.json (missing keys fall back to az automatically)
  2. Optional: add localized page slugs in src/config/pages.ts (falls back to en slugs)
  3. Add translated blog posts to src/content/blog/${code}/
  4. npm run og:force && npm run build   → routes, hreflang, sitemap, RSS, llms.txt, OG all update automatically
  5. Check /seo-panel/ → Hreflang matrix to verify coverage
`);
}

main();
