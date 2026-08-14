# Anacan Website — anacan.az

Anacan analıq superappinin çoxdilli, SEO-mükəmməl marketinq saytı.
Multilingual, SEO-perfect marketing website for the Anacan motherhood superapp.

**Stack:** Astro 5 (statik) · vanilla CSS dizayn sistemi · satori + sharp (OG şəkillər) · node-html-parser (SEO audit)

---

## Əmrlər / Commands

| Əmr | Nə edir |
|---|---|
| `npm install` | Asılılıqları quraşdırır |
| `npm run dev` | Dev server (localhost:4321) |
| `npm run build` | **Tam pipeline:** OG şəkillər → sayt build → SEO audit |
| `npm run build:fast` | Yalnız Astro build (audit-siz) |
| `npm run og` / `npm run og:force` | OG şəkillərini yaradır (force = hamısını yenidən) |
| `npm run blog:sync` | **Bloqları app-in bazasından çəkir** (Supabase `blog_posts`) — sonra dev serveri restart edin |
| `npm run seo:audit` | `dist/` üzərində SEO auditi → seo-report.json + SEO-REPORT.md |
| `npm run add:lang -- <kod>` | Yeni dil skafoldu (məs. `npm run add:lang -- uz "Oʻzbekcha" Uzbek`) |
| `npm run preview` | Build olunmuş saytın önizləməsi |

Sayt URL-ni dəyişmək üçün: `SITE_URL=https://your-domain npm run build`

---

## Dillər / Languages

Hazırda: **az** (kök `/`), **en**, **ru**, **tr**, **kk** — app ilə eyni.

### Yeni dil əlavə etmək (app-ə yeni dil gələndə)

```bash
npm run add:lang -- uz "Oʻzbekcha" Uzbek
```

Skript bunları hazırlayır:
1. `src/i18n/uz.json` — en.json-un kopyası (tərcümə edin; çatışmayan açarlar avtomatik az-a düşür)
2. `src/content/blog/uz/` — bloq qovluğu (postları eyni `translationKey` ilə əlavə edin)
3. `src/config/languages.ts` — reyestr qeydi (bcp47/ogLocale dəyərlərini yoxlayın)

**Qalan hər şey avtomatikdir:** routing, hreflang, sitemap.xml, RSS, llms.txt,
OG şəkillər, dil seçicisi, footer, SEO panel matrisi.

İstəyə bağlı: `src/config/pages.ts`-də lokallaşdırılmış slug əlavə edin
(yoxdursa ingilis slug-a düşür).

---

## Bloq — mənbə: app-in bazası

Bloqlar **mobil app ilə eyni mənbədən** gəlir: Supabase `blog_posts` cədvəli.

```bash
npm run blog:sync     # 57 post × 5 dil → src/content/blog/<dil>/<slug>.md
npm run og            # yeni postlar üçün OG kartları
npm run build         # (dev server açıqdırsa restart edin!)
```

Sync məntiqi (app ilə birəbir):
- **az** → base sütunlar (`title/excerpt/content`) · **en/ru/tr** → `*_en/_ru/_tr`
- **kk** → app-dəki kimi fallback: `kk → ru → base`
- `life_stage` → sayt kateqoriyası: bump→hamiləlik, mommy→analıq, flow→tsikl, all→sağlamlıq
- DB slug-ları ASCII-yə transliterasiya olunur (URL üçün), orijinal slug `translationKey`-də qalır
- Cover şəkilləri (`cover_image_url`) kartlarda və məqalə başında göstərilir
- Content sanitizasiya: script/style/onclick təmizlənir, h1→h2, şəkillərə lazy+ölçü əlavə olunur
- Title tag 65 simvola qısaldılır (H1 tam qalır), description 70–160 simvola normallaşdırılır

Yeni məqalə axını: **App admin CMS-də yaz → `npm run blog:sync` → build/deploy.**
Generated fayllar `# generated: anacan-app-db` işarəlidir — əllə redaktə etməyin.

---

## Alətlər və müqayisə səhifələri

| Səhifə | URL (az) | Nə üçün |
|---|---|---|
| Ovulyasiya kalkulyatoru | `/ovulyasiya-kalkulyatoru/` | İnteraktiv alət (JS tarix hesablaması), yüksək axtarış həcmli açar söz |
| Hamiləlik əlamətləri | `/hamilelik-elamtleri/` | 12 erkən əlamət + PMS müqayisə cədvəli, yüksək axtarış həcmli açar söz |
| Müqayisələr hub-u | `/muqayise/` | Anacan vs 8 qlobal rəqib (Flo, Clue, Ovia Health, What to Expect, Pregnancy+, BabyCenter, Natural Cycles, Peanut) — hər biri 5 dildə |

Hər iki alət səhifəsi **eyni URL-lə** köhnə saytdan köçürülüb (SEO davamlılığı üçün).
Müqayisə səhifələri `src/content/competitors/<dil>/anacan-vs-<slug>.md` — yeni rəqib əlavə etmək üçün:
1. `src/config/competitors.ts`-ə fakt qeydi əlavə edin
2. 5 dildə `anacan-vs-<slug>.md` yazın (mövcud fayllardan birini şablon kimi istifadə edin)
3. `npm run og && npm run build`

## SEO arxitekturası

| Səth | Yer |
|---|---|
| Canonical + hreflang (x-default ilə) | `src/layouts/Base.astro` |
| JSON-LD graph (Organization, WebSite, MobileApplication, WebPage, BreadcrumbList, BlogPosting) | `src/utils/seo.ts` + Base |
| sitemap.xml (xhtml:link alternates + image) | `src/pages/sitemap.xml.ts` |
| robots.txt (AI crawler-lərə açıq) | `src/pages/robots.txt.ts` |
| llms.txt / llms-full.txt | `src/pages/llms*.txt.ts` |
| RSS (hər dil) | `src/pages/rss.xml.ts` + `[lang]/rss.xml.ts` |
| OG şəkillər (dil + post başına) | `scripts/generate-og.mjs` |
| Meta title/description | `src/i18n/<dil>.json` → `meta.*` |
| Lokallaşdırılmış page slug-ları | `src/config/pages.ts` |

Performans: inline CSS (render-blocking yoxdur), self-hosted variable fontlar
(latin-ext + kiril), minimal JS (~4KB), şəkillərdə width/height + lazy.

---

## SEO Panel + claude-seo inteqrasiyası

**Panel:** `/seo-panel/` (noindex, robots-da bağlı) — `seo-report.json`-u vizuallaşdırır:
Health Score, kateqoriya balları, prioritetlər (falsifiability + leading indicator ilə),
yoxlamalar, səhifə cədvəli, **hreflang matrisi** və claude-seo körpüsü.

**Audit mühərriki:** `scripts/seo-audit.mjs` — hər build-dən sonra `dist/`-i skan edir.
[claude-seo](https://github.com/AgriciDaniel/claude-seo) metodologiyası ilə uyğundur:

- Eyni çəkilər: Technical 22% · Content 23% · On-Page 20% · Schema 10% · Performance 10% · AI 10% · Images 5%
- Keyfiyyət qapıları: INP (FID yox), HowTo/deprecated schema qadağası, FAQPage = yalnız Info,
  səhifə tipinə görə thin-content hədləri, sual-başlıqlar + cavab blokları
- Hər tövsiyədə: falsifiability yoxlaması + leading indicator

**Deploy-dan sonra tam crawl-əsaslı audit** (Claude Code-da):

```
/plugin marketplace add AgriciDaniel/claude-seo
/plugin install claude-seo@agricidaniel-claude-seo
/seo setup

/seo audit https://anacan.az
/seo geo https://anacan.az
/seo hreflang https://anacan.az
/seo schema https://anacan.az
/seo sitemap https://anacan.az/sitemap.xml
/seo drift baseline https://anacan.az
```

---

## Struktur

```
anacanwebsitenew/
├─ astro.config.mjs            # site URL, trailing slash, inline CSS
├─ scripts/
│  ├─ generate-og.mjs          # satori+sharp OG generatoru
│  ├─ seo-audit.mjs            # claude-seo-uyğun audit mühərriki
│  └─ add-language.mjs         # yeni dil skafoldu
├─ public/                     # favicon, ikonlar, og/, manifest
└─ src/
   ├─ config/
   │  ├─ languages.ts          # ★ DİL REYESTRİ (tək mənbə)
   │  ├─ pages.ts              # ★ səhifə reyestri + lokallaşdırılmış slug-lar
   │  └─ site.ts               # brend, app linkləri, qiymətlər
   ├─ i18n/                    # <dil>.json lüğətlər + loader (az fallback)
   ├─ content/blog/<dil>/      # postlar (fayl adı = slug)
   ├─ layouts/Base.astro       # bütün SEO head + JSON-LD + JS
   ├─ components/              # Header, Footer, Hero, Stages, Tools, AI, FAQ…
   ├─ views/                   # səhifə görünüşləri (dildən asılısız)
   ├─ utils/                   # i18n, blog, seo helper-ləri
   └─ pages/
      ├─ [...path].astro       # ★ bütün dillər × bütün səhifələr + postlar
      ├─ sitemap.xml.ts, robots.txt.ts, llms.txt.ts, llms-full.txt.ts
      ├─ rss.xml.ts, [lang]/rss.xml.ts, 404.astro
      └─ seo-panel/index.astro # SEO idarə paneli
```

## Deploy

Statik çıxış (`dist/`) — istənilən statik hostinqə (Netlify, Vercel, Cloudflare
Pages, S3+CloudFront) birbaşa qoyula bilər. Tələblər:

- `SITE_URL` env dəyişəni ilə build edin (default: `https://anacan.az`)
- 404 səhifəsi: `404.html` (hostinq avtomatik tanıyır)
- Heç bir server funksiyası tələb olunmur
