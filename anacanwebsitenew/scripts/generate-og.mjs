/**
 * OG image generator — builds 1200×630 social cards for:
 *   • every language homepage  -> public/og/og-<lang>.png
 *   • every blog post          -> public/og/blog/<lang>/<slug>.png
 *
 * Uses satori (layout+text -> SVG) and sharp (SVG -> PNG).
 * Fonts: bundled Noto Sans (full Latin-ext + Cyrillic coverage for az/en/ru/tr/kk).
 *
 * Usage:  node scripts/generate-og.mjs [--force]
 * Skips files that already exist unless --force is passed.
 */
import { readFile, writeFile, mkdir, readdir, access } from 'node:fs/promises';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const FORCE = process.argv.includes('--force');

const W = 1200;
const H = 630;

const THEME = {
  flow: { color: '#E84D6F', soft: '#FFD9E4' },
  bump: { color: '#8C5BD9', soft: '#E9DDFC' },
  mommy: { color: '#2FA985', soft: '#DDF3E3' },
  partner: { color: '#F97316', soft: '#FFE4D1' },
  brand: { color: '#FF5A5F', soft: '#FFDCDD' },
};

const exists = (p) => access(p).then(() => true, () => false);

async function loadFonts() {
  const regular = await readFile(join(__dirname, 'assets/fonts/NotoSans-Regular.ttf'));
  const bold = await readFile(join(__dirname, 'assets/fonts/NotoSans-Bold.ttf'));
  return [
    { name: 'Noto Sans', data: regular, weight: 400, style: 'normal' },
    { name: 'Noto Sans', data: bold, weight: 700, style: 'normal' },
  ];
}

async function loadLogo() {
  const buf = await readFile(join(root, 'public/icon-192.png'));
  return `data:image/png;base64,${buf.toString('base64')}`;
}

/** Minimal frontmatter parser (title/theme/category only). */
function parseFrontmatter(md) {
  md = md.replace(/^\uFEFF/, '');
  const match = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const out = {};
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    if (value.startsWith('"')) {
      /* JSON-escaped scalar (written by sync-blog) */
      try {
        value = JSON.parse(value);
      } catch {
        value = value.replace(/^["']|["']$/g, '');
      }
    } else {
      value = value.replace(/^["']|["']$/g, '');
    }
    out[m[1]] = value;
  }
  return out;
}

const el = (type, style, children) => ({ type, props: { style, ...(children !== undefined ? { children } : {}) } });
const img = (src, style) => ({ type: 'img', props: { src, style } });

function baseFrame(theme, children) {
  return el(
    'div',
    {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#FFF7F3',
      backgroundImage: `radial-gradient(circle at 88% -10%, ${theme.soft} 0%, rgba(255,255,255,0) 46%), radial-gradient(circle at -8% 110%, ${theme.soft} 0%, rgba(255,255,255,0) 42%)`,
      padding: '56px 64px',
      fontFamily: 'Noto Sans',
      color: '#2E2430',
      position: 'relative',
    },
    children,
  );
}

function brandRow(logoSrc, label) {
  return el(
    'div',
    { display: 'flex', alignItems: 'center', gap: '18px' },
    [
      img(logoSrc, { width: '72px', height: '72px', borderRadius: '20px' }),
      el('div', { display: 'flex', fontSize: '44px', fontWeight: 700 }, 'Anacan'),
      el(
        'div',
        {
          display: 'flex',
          marginLeft: '8px',
          fontSize: '22px',
          fontWeight: 700,
          color: '#9E2B2E',
          backgroundColor: '#FFDCDD',
          padding: '8px 22px',
          borderRadius: '999px',
        },
        label,
      ),
    ],
  );
}

function footerRow(theme, rightLabel) {
  return el(
    'div',
    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' },
    [
      el(
        'div',
        {
          display: 'flex',
          fontSize: '26px',
          fontWeight: 700,
          color: '#FFFFFF',
          backgroundColor: theme.color,
          padding: '12px 30px',
          borderRadius: '999px',
        },
        'anacan.az',
      ),
      el('div', { display: 'flex', fontSize: '24px', fontWeight: 700, color: '#A08D96' }, rightLabel),
    ],
  );
}

async function renderPng(node, fonts, outPath) {
  const svg = await satori(node, { width: W, height: H, fonts });
  await mkdir(dirname(outPath), { recursive: true });
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(outPath);
}

async function main() {
  const fonts = await loadFonts();
  const logoSrc = await loadLogo();

  const i18nDir = join(root, 'src/i18n');
  const langs = (await readdir(i18nDir)).filter((f) => f.endsWith('.json')).map((f) => basename(f, '.json'));

  let generated = 0;
  let skipped = 0;

  /* ── per-language home cards ─────────────────────────────────────────── */
  for (const lang of langs) {
    const out = join(root, `public/og/og-${lang}.png`);
    if (!FORCE && (await exists(out))) {
      skipped++;
      continue;
    }
    const dict = JSON.parse(await readFile(join(i18nDir, `${lang}.json`), 'utf8'));
    const title = `${dict.hero.titleA} ${dict.hero.titleEm} ${dict.hero.titleB}`;
    const stats = (dict.hero.stats ?? []).slice(0, 4);
    const theme = THEME.brand;

    const node = baseFrame(theme, [
      brandRow(logoSrc, dict.hero.badge ?? 'Anacan'),
      el(
        'div',
        {
          display: 'flex',
          fontSize: '64px',
          fontWeight: 700,
          lineHeight: 1.15,
          marginTop: '48px',
          maxWidth: '1000px',
        },
        title,
      ),
      el(
        'div',
        { display: 'flex', gap: '14px', marginTop: '40px', flexWrap: 'wrap' },
        stats.map((s) =>
          el(
            'div',
            {
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: '#FFFFFF',
              borderRadius: '18px',
              padding: '14px 24px',
              boxShadow: '0 10px 30px rgba(217,108,74,0.18)',
            },
            [
              el('div', { display: 'flex', fontSize: '30px', fontWeight: 700, color: theme.color }, s.value),
              el('div', { display: 'flex', fontSize: '22px', color: '#6E5A63' }, s.label),
            ],
          ),
        ),
      ),
      footerRow(theme, lang.toUpperCase()),
    ]);

    await renderPng(node, fonts, out);
    generated++;
    console.log(`og  ✓ og-${lang}.png`);
  }

  /* ── per-post cards ──────────────────────────────────────────────────── */
  const blogDir = join(root, 'src/content/blog');
  for (const lang of langs) {
    const langDir = join(blogDir, lang);
    if (!(await exists(langDir))) continue;
    const dict = JSON.parse(await readFile(join(i18nDir, `${lang}.json`), 'utf8'));

    const files = (await readdir(langDir)).filter((f) => f.endsWith('.md'));
    for (const file of files) {
      const slug = basename(file, '.md');
      const out = join(root, `public/og/blog/${lang}/${slug}.png`);
      if (!FORCE && (await exists(out))) {
        skipped++;
        continue;
      }
      const fm = parseFrontmatter(await readFile(join(langDir, file), 'utf8'));
      const theme = THEME[fm.theme] ?? THEME.brand;
      const category = dict.blog?.categories?.[fm.category] ?? fm.category ?? 'Blog';
      const title = fm.title ?? slug;

      const node = baseFrame(theme, [
        brandRow(logoSrc, dict.blog?.eyebrow ?? 'Anacan Blog'),
        el(
          'div',
          {
            display: 'flex',
            marginTop: '44px',
            fontSize: '22px',
            fontWeight: 700,
            color: theme.color,
            backgroundColor: theme.soft,
            padding: '8px 22px',
            borderRadius: '999px',
            alignSelf: 'flex-start',
            textTransform: 'uppercase',
            letterSpacing: '2px',
          },
          category,
        ),
        el(
          'div',
          {
            display: 'flex',
            fontSize: title.length > 70 ? '48px' : '56px',
            fontWeight: 700,
            lineHeight: 1.18,
            marginTop: '22px',
            maxWidth: '1030px',
          },
          title,
        ),
        footerRow(theme, lang.toUpperCase()),
      ]);

      await renderPng(node, fonts, out);
      generated++;
      console.log(`og  ✓ blog/${lang}/${slug}.png`);
    }
  }

  console.log(`\nOG images: ${generated} generated, ${skipped} skipped (already exist).`);
}

main().catch((err) => {
  console.error('[generate-og] failed:', err);
  process.exit(1);
});
