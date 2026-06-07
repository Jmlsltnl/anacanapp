## Peyvənd Təqvimi — Plan

### Məqsəd
Ana (mommy) modulunda hər uşaq üçün rəsmi, peşəkar Peyvənd təqvimi. Azərbaycan SN-nin Milli İmmunizasiya Qrafiki əsasında doldurulur. Ölkə dəyişəndə həmin ölkənin qrafiki avtomatik istifadə olunur. Admin panel hər ölkə üçün peyvəndləri tam redaktə edə bilir.

---

### 1. Verilənlər bazası (3 yeni cədvəl)

**`vaccine_countries`** — dəstəklənən ölkələr
- `code` (text, unik — məs. `AZ`, `TR`, `RU`, `US`)
- `name_az`, `name_en`, `flag_emoji`
- `is_active`, `is_default` (yalnız 1 default — AZ)
- `source_url` (rəsmi qaynaq linki), `source_label`

**`vaccines`** — ölkə üzrə peyvənd kataloqu (admin redaktə edir)
- `country_code` (FK → vaccine_countries.code)
- `code` (məs. `BCG`, `HEPB`, `DTP`, `MMR`, `IPV`, `OPV`, `HIB`, `PCV`, `ROTA`, `VARICELLA`, `HEPA`, `HPV`)
- `name_az`, `name_en`, `short_description_az`, `full_description_az` (uzun mətn — nə üçün, nə qoruyur)
- `disease_az` (qarşısını aldığı xəstəlik), `route_az` (əzələdaxili / oral / dərialtı)
- `side_effects_az` (mümkün yan təsirlər), `contraindications_az` (əks-göstərişlər)
- `is_mandatory` (məcburi / könüllü), `is_active`
- `sort_order`, `color_hex` (UI üçün)

**`vaccine_schedules`** — qrafikdəki hər doza (admin redaktə edir)
- `vaccine_id` (FK → vaccines.id)
- `country_code` (denormalize — sürətli sorğu üçün)
- `dose_number` (1, 2, 3...), `dose_label_az` (məs. "1-ci doza", "Bustər")
- `recommended_age_days` (yaş — günlə, məs. 0 = doğulanda, 60 = 2 ay, 1825 = 5 yaş)
- `age_label_az` (UI üçün — "Doğulanda", "2 aylıq", "12 aylıq", "6 yaş")
- `min_age_days`, `max_age_days` (pəncərə)
- `notes_az` (xüsusi qeydlər)

**`child_vaccinations`** — istifadəçinin uşağı üçün status izləyici
- `child_id` (FK), `user_id` (FK)
- `vaccine_schedule_id` (FK), `country_code`
- `administered_at` (date | null), `is_skipped` (bool), `skip_reason`
- `location_az` (harada vurulub), `batch_number`, `notes`
- `reminder_sent_at`

**RLS**: `vaccine_countries`, `vaccines`, `vaccine_schedules` — hamı (authenticated) oxuya bilər, yalnız admin yaza bilər. `child_vaccinations` — istifadəçi yalnız öz uşaqları üçün CRUD.

**Seed**: Azərbaycan Səhiyyə Nazirliyinin Milli İmmunizasiya Qrafiki tam doldurulur (BCG, Hep B, DTP/HiB/Polio, Rotavirus, PCV, MMR, Hep A, Varicella, HPV — 0 gün - 16 yaş diapazonu).

---

### 2. Frontend — `VaccineCalendar.tsx` aləti (mommy)

`src/components/tools/VaccineCalendar.tsx`:
- Header: uşaq adı + yaşı + ölkə bayrağı (ChildSelector mövcuddur)
- **Ölkə seçici** dropdown — istifadəçi öz ölkəsini dəyişə bilər (default `AZ`); seçim `children.country_code` sütununda saxlanır
- **Üç tab**:
  - **Yaxınlaşan** — növbəti 3 doza (yaşa görə)
  - **Tam qrafik** — yaşa görə qruplanmış timeline (Doğulanda → 16 yaş), hər doza üçün: ad, yaş etiketi, status badge (✅ Vuruldu / ⏰ Gözləmədə / ⚠️ Gecikdi / ⊘ Buraxılıb)
  - **Tamamlanmış** — vurulmuş peyvəndlər
- Hər kartda klik → **detallı sheet**: tam təsvir, qarşısı alınan xəstəlik, yan təsirlər, əks-göstərişlər, rəsmi qaynaq linki
- Status əməliyyatları: "Vuruldu" (tarix + qeyd), "Buraxıldı" (səbəb), "Bərpa et"
- Tərəqqi göstəricisi: ümumi `{n}/{total}` + faiz dairəsi
- Print/PDF export (sadə browser print)
- `useChildren` ilə inteqrasiya; uşaqda `country_code` yoxdursa default `AZ`

`src/hooks/useVaccines.ts` — `useQuery` ilə ölkə-spesifik qrafik + `child_vaccinations` join.

### 3. Mommy modulu inteqrasiyası
- `ToolsHub.tsx`-də lazy import + `case 'vaccine-calendar':` route
- `tool_configs`-da yeni entry: `tool_key='vaccine-calendar'`, stage=mommy, icon=`Syringe`
- Dashboard mommy bölümündə kiçik widget: "Növbəti peyvənd: 2 aylıq — DTP/HiB/Polio — 12 gün sonra"
- Push reminder — `send-daily-notifications` cron-a vaccine yoxlaması əlavə (3 gün, 1 gün qabaq)

### 4. Admin panel — `AdminVaccines.tsx`
`src/components/admin/AdminVaccines.tsx` + `AdminLayout`-da menyu:
- **Ölkələr tab**: list + add/edit/delete + active/default toggle
- **Peyvəndlər tab**: ölkə seçiciyə görə filter, peyvənd CRUD (bütün AZ/EN sahələr, mətn redaktoru ilə uzun təsvir)
- **Qrafik tab**: ölkə + peyvənd seçiciyə görə dozalar — yaş, etiket, pəncərə, qeyd
- **Köçürmə**: "Bu ölkəni başqa ölkəyə kopyala" düyməsi — bir ölkə üçün hazır qrafiki yeni ölkəyə şablon kimi köçürür, sonra redaktə olunur
- Bütün sahələr inline-edit; sıralama drag-and-drop və ya sort_order input

### 5. Çoxdilli & ölkə dəyişikliyi
- `children` cədvəlinə `country_code text default 'AZ'` əlavə (migration)
- İstifadəçi UI-da ölkəni dəyişdikdə → `children.country_code` yenilənir → bütün sorğular həmin ölkə üçün yenidən fetch olunur
- `child_vaccinations` köhnə ölkə üçün saxlanılır (silinmir) — istifadəçi geri dönsə tarixçə qalır
- AZ üçün default qrafik onsuz da seed olunur; digər ölkələr admin tərəfindən doldurulduqca aktivləşir; admin doldurmayıbsa istifadəçiyə "Bu ölkə üçün qrafik hələ hazırlanmayıb" mesajı

---

### Texniki detallar

```text
ölkə (UI) ──► children.country_code ──► useVaccines(country_code)
                                              │
                                              ├─► vaccine_schedules (qrafik şablonu)
                                              └─► child_vaccinations (status, child_id-yə bağlı)
```

- Yaş hesablanması: `getRealCalendarAge(child.birth_date)` ilə günə çevrilir, sonra `recommended_age_days` ilə müqayisə (Baku UTC+4 qaydası)
- Realtime: lazım deyil — `invalidateQueries` ilə kifayət

### Çatdırılma sırası
1. Migration (4 cədvəl + GRANT + RLS) + AZ seed
2. `useVaccines` hook + `VaccineCalendar.tsx` (3 tab + detal sheet)
3. ToolsHub + tool_configs qeydiyyat
4. AdminVaccines panel
5. Mommy dashboard widget + push reminder (cron-a kiçik əlavə)

Təsdiq edin, başlayım.