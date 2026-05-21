# Tətbiqin İngilis dilinə tərcüməsi

Hibrid yanaşma: UI mətnləri + ən kritik DB cədvəlləri AI ilə tərcümə olunur. AZ default qalır, EN feature-flag ilə açılır, problem olarsa bir kliklə söndürülür.

## Nə dəyişir

### 1. Feature flag (təhlükəsizlik üçün)
- `app_settings` cədvəlində `language_switcher_enabled` (default: `true`) əlavə olunur.
- Söndürüldükdə: Settings ekranında dil seçici görünmür, istifadəçinin dili avtomatik AZ-a sıfırlanır. Heç bir kod silinmir.
- `app_languages.is_active` flag-ı EN üçün `true` edilir.

### 2. UI mətnlərinin tərcüməsi (627 mövcud key + yeniləri)
Kod artıq `tr("key", "AZ default")` strukturuna sahibdir. Plan:
- DB-dəki 627 AZ key avtomatik EN-ə tərcümə olunur (Gemini batch script).
- Kodda hələ `tr()` ilə wrap olunmamış AZ stringlər skanlanır (~5700 sətr), onlara da key verilib tr() ilə wrap olunur (məhdudlaşdırılmış: yalnız user-facing komponentlər; admin paneli sonraya buraxılır).
- Bütün yeni key-lər `translations` cədvəlinə həm AZ həm EN ilə yazılır.

### 3. Kritik DB kontentinin tərcüməsi
Aşağıdakı cədvəllərə `_en` sufiksli sütunlar əlavə olunur və avtomatik doldurulur:
- `daily_notifications` (push mətnləri)
- `mommy_daily_messages` (gündəlik mommy mesajları)
- `flow_reminders` (flow xatırlatmaları)
- `partner_daily_tips` (partner məsləhətləri)
- `pregnancy_daily_content` (hamiləlik gündəlik kontent)
- `baby_daily_info` (uşaq gündəlik info)
- `development_tips`, `phase_tips`, `trimester_tips`
- `tool_configs` (alət adları və təsvirləri)
- `app_branding` / banners (hero başlıqları)

Read-helper əlavə olunur: cari dilə görə avtomatik `name` və ya `name_en` qaytarılır.

Blog, reseptlər, hekayələr, baby crisis periods – bu mərhələdə tərcümə olunmur (admin əl ilə zəng edə bilər). Boş `_en` olarsa AZ fallback işləyir.

### 4. AI cavabları (chat & tools)
Edge function-lar (`dr-anacan-chat`, `safety-ai-lookup`, `generate-fairy-tale`, `analyze-horoscope`, `weather-clothing`, `analyze-cry`, `analyze-poop`, `generate-baby-photo`) request body-yə `lang` parametri qəbul edir; system prompt cari dilə görə dəyişir. Klient hər çağırışda `useUserStore.language` göndərir.

### 5. Push notification cron-ları
`send-daily-notifications`, `send-flow-reminders`, `send-vitamin-reminders` funksiyaları hər istifadəçi üçün onun `user_preferences.language` (yeni sütun) dəyərinə görə AZ və ya EN versiyasını seçir.

### 6. Settings ekranında dil seçici
`SettingsScreen.tsx`-də yeni "Dil / Language" bölməsi: AZ / English seçimi. Seçim dərhal tətbiq olunur (`changeLanguage()` çağırır), `userStore`-da persist olunur.

## Geri qayıtma planı

İki səviyyəli:
1. **Tez geri qayıtma**: Admin paneldə `language_switcher_enabled = false` → bütün istifadəçilər AZ-a qayıdır, kod toxunulmur. Anlıq.
2. **Tam geri qayıtma**: Git ilə commit-i revert. DB-dəki `_en` sütunları və EN translations qalır – heç bir AZ məlumat itmir.

AZ məlumatlar heç bir mərhələdə dəyişdirilmir, yalnız əlavə sütunlar/sətirlər yaradılır. AZ versiya tam toxunulmaz qalır.

## Texniki detallar

```text
İcra ardıcıllığı:
  1. Migration: app_settings.language_switcher_enabled,
                user_preferences.language,
                _en sütunları (8-10 DB cədvəlində)
  2. EN-i app_languages-də aktivləşdir
  3. Script: 627 mövcud translations.az → EN tərcümə (Gemini, batch)
  4. Script: hələ wrap olunmamış AZ strings → tr() wrap + DB-yə yaz
  5. Script: DB content cədvəllərinin _en sütunlarını doldur
  6. Edge functions: lang parametri dəstəyi
  7. SettingsScreen: dil seçici UI
  8. Feature flag yoxlaması (LanguageSelector görünmə şərti)
```

Tərcümə üçün Gemini 3 Flash (sürətli + ucuz) istifadə olunur. Hər key/sətir üçün AZ → EN konteksti ilə tərcümə. Yekun yoxlama üçün admin panelə "Translation Review" bölməsi əlavə oluna bilər (sonra).

Tərcümənin gözlənilən həcmi:
- ~627 UI key (mövcud)
- ~2000-3000 yeni UI key (kodu wrap etdikdən sonra)
- ~500-1500 DB content sətri (10 cədvəl)
- Cəmi ~1-2 saat batch icra (rate limit ilə)

## Açıq sual

Tərcümə işi başlandıqdan sonra AZ key adları sabit qalmalıdır. Əgər gələcəkdə AZ default mətni dəyişdirilərsə, EN tərcümə avtomatik yenilənmir – həmin key-i admin panelindən yenidən tərcümə etmək lazımdır. Bu, davam etmək üçün məqbuldur?
