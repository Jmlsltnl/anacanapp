# İngilis dili dəstəyini tamamlama planı

İnfrastruktur hazırdır (feature flag, `en.json` 627 açar, `LanguageSelector`, `_en` sütunlar, `user_preferences.language`). İndi qalan işləri tamamlayırıq.

## Görüləcək işlər

### 1. UI-da dil seçicisi
- `SettingsScreen.tsx`-ə `<LanguageSelector />` əlavə et (Tənzimləmələr → Dil / Language bölməsi).

### 2. DB kontentinin EN-ə tərcüməsi (Gemini batch)
Aşağıdakı cədvəllərin `_en` sütunlarını AI ilə dolduran bir defalıq admin skripti / edge function:
- `mommy_daily_messages` (title, message)
- `baby_daily_info` (title, content, tips)
- `flow_reminders` (title, message)
- `pregnancy_daily_content` (title, content)
- `daily_notifications` (title, body)  → əvvəlcə `_en` sütun əlavə
- `partner_daily_tips` (title, content) → `_en` sütun əlavə
- `tool_configs` (label, description) → `_en` sütun əlavə
- `app_branding` / hero banner mətnləri → `_en` sütun əlavə

Helper: `getLocalized(row, field)` → cari dilə görə `field` və ya `field_en` qaytarır. Boş olsa AZ-ə fallback.

### 3. Edge function-lar (AI cavabları)
Bu funksiyalara `lang` parametri ötürülməsini və system prompt-un dilə uyğunlaşdırılmasını təmin et:
- `dr-anacan-chat`
- `safety-ai-lookup`
- `generate-fairy-tale`
- `analyze-horoscope`
- `generate-baby-photoshoot` (caption)
- `weather-indoor-advice`

Frontend tərəfdə `supabase.functions.invoke` çağırışlarına `lang: currentLang` əlavə.

### 4. Push notification cron-ları
- `send-daily-notifications`, `send-flow-reminders`, `send-vitamin-reminders`, `send-mommy-daily`, `send-partner-tips` funksiyaları hər istifadəçinin `user_preferences.language` dəyərinə əsasən AZ və ya EN mətni seçsin.

### 5. Hardcoded AZ stringlərinin sarınması (~5700 sətir)
Avtomatik skript ilə komponent fayllarında AZ stringlərini aşkar et, `tr('key')` ilə sarı, açarları `en.json` və `translations` cədvəlinə Gemini tərcüməsi ilə əlavə et.

Mərhələli yanaşma (prioritet sırası):
1. `src/components/screens/*` — əsas ekranlar
2. `src/components/tools/*` — alətlər
3. `src/components/community/*`, `src/components/partner/*`
4. `src/components/admin/*` (yalnız admin gördüyü üçün ən sonda)

### 6. QA və rollback
- `language_switcher_enabled = false` ⇒ seçici dərhal gizlənir, hamı AZ-də qalır.
- EN-ə keçəndə boş açar üçün AZ fallback (artıq i18n.ts-də var).
- Test: bir neçə ekranda EN/AZ keçidi, push notif (manual trigger), AI chat cavabları.

## Texniki qeydlər

- Tərcümə batch-ləri 50 açarlıq qruplarda göndərilir, Gemini 3 Flash istifadə olunur.
- DB content tərcümələri admin paneldə əl ilə düzəliş üçün açıq qalır.
- AZ mətn dəyişəndə EN avtomatik yenilənmir — admin paneldə "Re-translate" düyməsi əlavə oluna bilər (opsional, indi yox).
- Bütün dəyişikliklər mövcud AZ axınına toxunmur; flag söndürülsə tam əvvəlki davranışa qayıdılır.

## Təxmini həcm

- UI sarınma: ~5700 sətir, avtomatik, ~1 saat batch
- DB tərcümələri: ~1500 sətir, ~30 dəq batch
- Edge function düzəlişləri: 6 funksiya
- Cron funksiyalar: 5 funksiya
