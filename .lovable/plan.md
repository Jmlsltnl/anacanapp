

# Anacan Çoxdilli Lokalizasiya Planı

## Məqsəd
Mövcud Azərbaycan versiyasına toxunmadan, arxa fonda i18n infrastrukturu qurmaq. Admin paneldən dillər və bölgələr idarə olunacaq. Hər şey hazır olanda admin dili aktivləşdirəcək.

---

## Arxitektura

```text
┌─────────────────────────────────────────────┐
│  app_languages (DB table)                   │
│  ─────────────────────────────────────       │
│  code: az | en | tr | ru                    │
│  name: Azərbaycan | English | Türkçe | Русский │
│  is_active: false (default, az=true)        │
│  regions: ["AZ"] | ["US","GB"] | ["TR"] ... │
│  disabled_tools: ["cakes","maternity"]      │
│  sort_order, icon_url                       │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  translations (DB table)                    │
│  ─────────────────────────────────────       │
│  key: "nav.home" | "tools.kick_counter"     │
│  lang: "en" | "tr" | "ru"                   │
│  value: "Home" | "Araçlar" | "Главная"      │
│  namespace: "common" | "tools" | "dashboard"│
│  (unique: key + lang)                       │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Frontend: useTranslation() hook            │
│  ─────────────────────────────────────       │
│  const { t } = useTranslation();            │
│  t('nav.home') → "Əsas" (az) / "Home" (en) │
│  Fallback: key-in öz dəyəri (Azərbaycan)   │
└─────────────────────────────────────────────┘
```

---

## Addımlar

### 1. Verilənlər bazası — 2 yeni cədvəl

**`app_languages`** — Dəstəklənən dillər və bölgələr
- `id`, `code` (unique), `name`, `native_name`, `is_active` (default false), `regions` (jsonb array), `disabled_tools` (jsonb array), `sort_order`
- Az dili default olaraq `is_active: true` ilə seed ediləcək
- RLS: hər kəs oxuya bilər, yalnız admin yaza bilər

**`translations`** — Tərcümə cədvəli
- `id`, `key` (varchar), `lang` (varchar, FK → app_languages.code), `value` (text), `namespace` (varchar), `created_at`, `updated_at`
- Unique constraint: `(key, lang)`
- RLS: hər kəs oxuya bilər, yalnız admin yaza bilər

### 2. Frontend — Lokalizasiya infrastrukturu

**`src/lib/i18n.ts`** — Mərkəzi tərcümə sistemi
- Azərbaycan dilindəki bütün mövcud string-ləri default dəyər kimi saxlayır (hardcoded fallback)
- DB-dən tərcümələri yükləyir və cache-ləyir
- `t(key, defaultValue)` funksiyası: əgər aktiv dil `az`-dırsa, `defaultValue`-nu qaytarır (heç nə dəyişmir); başqa dildədirsə, DB-dən tərcüməni qaytarır

**`src/hooks/useTranslation.ts`** — React hook
- Aktiv dili `userStore`-dan və ya `localStorage`-dan oxuyur
- `t()` funksiyasını qaytarır
- Dil `az` olanda — birbaşa default (hardcoded) dəyərləri qaytarır, DB sorğusu yoxdur

**`src/hooks/useLanguage.ts`** — Dil seçimi hook
- Aktiv dilləri `app_languages`-dən çəkir
- Dil dəyişmə funksiyası
- Bölgəyə görə auto-detect (navigator.language + region)

**`src/store/userStore.ts`** — Yeni `language` field
- Default: `'az'`
- Profildə saxlanılır

### 3. Admin Panel — Dil İdarəetməsi

**`AdminLanguages`** — Yeni admin bölməsi
- Dillərin siyahısı, aktivləşdirmə/deaktivləşdirmə
- Hər dil üçün hansı bölgələr, hansı alətlər deaktiv
- Tərcümə tərəqqi göstəricisi (neçə key tərcümə olunub)

**`AdminTranslations`** — Tərcümə redaktoru
- Namespace-lərə görə qruplaşdırılmış key-lər
- Sol tərəfdə Azərbaycan (orijinal), sağ tərəfdə seçilmiş dil
- CSV import/export (toplu tərcümə üçün)
- Boş tərcümələri filtrləmə

### 4. Mövcud kodu qorumaq — Tədricən keçid

**Kritik prinsip**: Heç bir mövcud Azərbaycan string-i silinmir və ya dəyişdirilmir.

Yanaşma:
- `t('nav.home', 'Əsas')` — ikinci parametr mövcud Azərbaycan mətnidir
- Dil `az` olanda, `t()` sadəcə ikinci parametri qaytarır
- Bu o deməkdir ki, komponentləri tədricən `t()` ilə wrap edə bilərik, amma Azərbaycan versiyası üçün heç nə dəyişmir
- İlk mərhələdə yalnız əsas UI elementlərini (BottomNav, ToolsHub, Dashboard başlıqları) wrap edirik

### 5. Alətlərin bölgəyə görə gizlədilməsi

`ToolsHub.tsx`-də mövcud `useToolConfigs` hook-una əlavə filtr:
- `app_languages` cədvəlindən aktiv dilin `disabled_tools` siyahısını oxu
- Həmin alətləri siyahıdan çıxar

### 6. AI Chat promptlarının lokalizasiyası

`dr-anacan-chat/prompts.ts`-də aktiv dilə görə prompt seçimi:
- DB-dən `translations` cədvəlindən `namespace: 'ai_prompts'` ilə çək
- Azərbaycan üçün mövcud promptlar olduğu kimi qalır

---

## İcra Sırası (Prioritet)

1. **DB cədvəlləri yaradılması** + seed data (az dili aktiv)
2. **`useTranslation` hook** + `i18n.ts` utility (fallback mexanizmi ilə)
3. **Admin Languages & Translations** paneli
4. **BottomNav, ToolsHub, Dashboard** — `t()` wrap (Azərbaycan dəyişməz qalır)
5. **Alət filtrləmə** bölgəyə görə
6. **Dil seçimi UI** (Settings ekranında, yalnız aktiv dillər görsənir)

---

## Nə dəyişmir
- Mövcud Azərbaycan string-ləri olduğu kimi qalır
- Mövcud komponentlər funksional olaraq dəyişmir
- Admin panelin mövcud bölmələri toxunulmaz
- DB-dəki mövcud cədvəllər dəyişmir
- Edge function-lar dəyişmir (hələlik)

