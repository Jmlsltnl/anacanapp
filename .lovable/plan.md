# Flow Modulu Genişləndirmə Planı

Aşağıdakı 7 funksiyanı qurub Anacan-ın menstruasiya modulunu Flo səviyyəsinə yaxınlaşdıracağıq. Sonda 9 və 10-cu bəndlər üçün izahat var (kod yazılmayacaq).

---

## 1. Dr. Anacan AI — Cycle Phase Context

**Problem:** `dr-anacan-chat` edge function `cyclePhase` və `cycleDay` parametrlərini qəbul edir, amma frontend göndərmir. AI menstruasiya mərhələsini bilmir.

**Həll:**
- `src/components/AIChatScreen.tsx` (və ya Dr.Anacan chat komponenti) içində `useUserStore`-dan `lastPeriodDate`, `cycleLength` götürüb `getCyclePhase()` (yeni `src/lib/cycle-utils.ts` helper-i) ilə cari fazanı hesabla: `menstruation | follicular | ovulation | luteal`.
- Edge function-a göndərilən payload-a `cyclePhase`, `cycleDay`, `daysUntilNextPeriod` əlavə et.
- Flow modulunda istifadəçi olduqda sistem promptu artıq fazaya uyğun cavab verəcək.

---

## 2. Cycle Length Trend Graph + Anomaliya Aşkarlama

**Yer:** `src/components/tools/MenstrualCalendar.tsx` (və ya Flow ana ekranı) — yeni "İnsightlər" tab/section.

**Komponentlər:**
- `src/components/flow/CycleTrendChart.tsx` — Recharts LineChart, son 6-12 dövr `cycle_history`-dən, X: dövr №, Y: gün uzunluğu, ortalama xətti ilə.
- `src/components/flow/CycleAnomalyBanner.tsx` — ACOG normalarına görə (21-35 gün norma):
  - <21 gün: "Qısa dövr — həkimə müraciət tövsiyə"
  - >35 gün: "Gecikmiş dövr — pregnancy test və ya həkim"
  - Variation >7 gün: "Düzənsiz dövr"
- Mövcud `useCycleStats()` hook-undan istifadə.

---

## 3. Həb/Kontrasepsiya Xatırlatma UI

**Status:** `flow_reminders` cədvəlində `pill` tipi artıq var, edge function `send-flow-reminders` də işləyir. Yalnız UI yoxdur.

**Yer:** `src/components/flow/FlowRemindersSettings.tsx` (yeni və ya mövcud reminder səhifəsinə əlavə).

**Funksionallıq:**
- "Həb Xatırlatması" tab/card
- Gündəlik vaxt seçici (`time_of_day`)
- Açıq/bağlı toggle
- Başlıq və mesajı redaktə (default: "Həbinizi qəbul edin 💊")
- LocalNotifications ilə cihazda təkrarlanan bildiriş qur (Capacitor)
- `useSaveFlowReminder({ reminder_type: 'pill' })` çağırışı

---

## 4. Period Gecikmə Aşkarlama + AI Auto-Mesaj

**Məntiq:** `Dashboard.tsx` flow modulunda hər yükləmədə:
- `daysSinceLastPeriod = today - lastPeriodDate`
- Əgər `daysSinceLastPeriod > avgCycleLength + 3` → "Period gecikir" banner
- Banner-də: "Hamiləlik testi etməyi düşün" + "Dr. Anacan-dan soruş" CTA
- AI-ya context-li link (`?prompt=period_delay&days=X`)
- Notification Center-ə avto-mesaj əlavə et (24 saatda 1 dəfə, throttled — `useUserPreferences`-də `last_delay_notification_at` flag)

**Yer:**
- `src/components/flow/PeriodDelayBanner.tsx` (yeni)
- `src/components/Dashboard.tsx` — flow stage condition altında render

---

## 5. Simptom Pattern Analysis (Premium)

**Yer:** `src/components/flow/SymptomPatternReport.tsx` (yeni premium tool).

**Logic:**
- `flow_daily_logs`-dan son 3 dövrlük data oxu
- Hər simptom üçün hesabla: hansı cycle day-də ən tez-tez baş verir
- Heat-map və ya bar chart: "Baş ağrısı adətən 14-16-cı gündə (ovulyasiya)"
- Top 5 pattern göstər
- Premium gating: `useSubscription` → `is_premium` yoxla, deyilsə Paywall

**Tool config:** `tool_configs`-də yeni entry `symptom_pattern_report`, `requires_premium: true`.

---

## 6. Gündəlik Story Cards

**Konsept:** Flo-nun "Today" tab-ı kimi — hər gün üçün faza-spesifik 3-5 card (təhsil, məsləhət, simptom proqnozu).

**Cədvəl:** `flow_insights` artıq var (`phase`, `title_az`, `content_az`, `emoji`).

**Komponent:** `src/components/flow/DailyStoryCards.tsx`
- Horizontal scroll snap carousel (Instagram story tərzi mini kartlar — story DEYIL, kart)
- Hər kart: emoji + başlıq + 2 sətr preview
- Tap → full-screen modal `StoryDetailSheet`
- Daily deterministic seed (date + user_id) ilə eyni gün eyni kartlar
- Faza filtri: cari `cyclePhase`-ə uyğun + ümumi (phase=null) qarışıq

**Yer:** Dashboard flow stage-də ən üstə.

---

## 8. Flow üçün Partner Mode

**Mövcud:** Partner mode hazırda yalnız bump/mommy üçündür (memory: partner-mode-scope).

**Genişləndirmə:**
- `partner_config`-də yeni flag `flow_enabled: boolean`
- `usePartnerData` hook-una flow məlumatı əlavə:
  - Cari faza
  - Növbəti period proqnozu
  - PMS xəbərdarlığı (3 gün əvvəl)
  - "Trying to conceive" rejimi (fertile window)
- Partner ekranında yeni card: `PartnerFlowStatusCard.tsx`
- Partner push: PMS başlayanda "Partneriniz PMS dövründədir, dəstək göstərin 💕"
- Premium gating saxlanılır

**Memory update:** partner-mode-scope memo-su flow stage-i daxil edəcək şəkildə yenilənəcək.

---

## Texniki Detallar (qısaca)

```text
Yeni fayllar:
- src/lib/cycle-utils.ts → getCyclePhase(lpd, cycleLen, today)
- src/components/flow/CycleTrendChart.tsx
- src/components/flow/CycleAnomalyBanner.tsx
- src/components/flow/PeriodDelayBanner.tsx
- src/components/flow/SymptomPatternReport.tsx
- src/components/flow/DailyStoryCards.tsx
- src/components/flow/PartnerFlowStatusCard.tsx
- src/components/flow/PillReminderCard.tsx

Dəyişdiriləcək:
- src/components/AIChatScreen.tsx (cyclePhase göndər)
- src/components/Dashboard.tsx (flow widget-lərini əlavə)
- src/hooks/usePartnerData.ts (flow datası)
- supabase/functions/dr-anacan-chat/prompts.ts (faza promptları zənginləşdir)

Migration:
- partner_config.flow_enabled (boolean, default false)
- tool_configs entry: symptom_pattern_report
- user_preferences.last_delay_notification_at (timestamptz)
```

---

# 9 və 10: Necə Edəcəyimizin İzahı (qurulmayacaq)

## 9. Apple Health / Health Connect Sync

**Texnoloji yanaşma:**
- **iOS:** `@capacitor-community/health` plugin (HealthKit wrapper). Native side-da `NSHealthShareUsageDescription` və `NSHealthUpdateUsageDescription` `Info.plist`-ə.
- **Android:** Health Connect SDK — `androidx.health.connect:connect-client`. Manifest-ə `android.permission.health.READ_MENSTRUATION` və `WRITE_MENSTRUATION`.
- Capacitor plugin: ya mövcud `capacitor-health-connect`, ya da custom bridge yaz.

**Sync axını:**
1. Settings → "Sağlamlıq tətbiqi ilə sinxronlaşdır" toggle
2. İlk açılış: permission dialogu (oxu/yaz menstruation, ovulation, basal body temperature)
3. **Pull (oxu):** Health-dən son 6 ay menstruation cycle datasını çək → `period_day_logs` və `cycle_history`-yə upsert (deduplication tarix əsasında)
4. **Push (yaz):** İstifadəçi Anacan-da period log etdikdə → Health-ə `MenstrualFlowSample` yaz
5. Background sync: `@capacitor/background-runner` ilə gündə 1 dəfə

**Çətinliklər:**
- iOS App Review: HealthKit istifadəsi üçün ayrıca justification lazım, screencast tələb olunur
- Android: Health Connect yalnız Android 14+ native, köhnə versiyalarda Play Store-dan ayrı APK
- Web fallback yox — yalnız native build-də işləyəcək (`Capacitor.isNativePlatform()` guard)

**Təxmini iş həcmi:** 2-3 gün (plugin inteqrasiyası + sync logic + permission UI + App Store/Play Store sənədləri).

---

## 10. PMDD/PCOS/Endometriosis Təhsil Moduları

**Yanaşma:** Mövcud blog/learn infrastrukturundan istifadə + spesifik symptom-based pathways.

**Komponentlər:**
1. **Yeni cədvəl:** `health_conditions` (key, name_az, description_az, symptoms[], risk_factors[], when_to_see_doctor, screening_questions jsonb)
2. **Screening Quiz:** Hər kondisiya üçün 8-10 sual (məs. PMDD üçün DRSP scale qısa versiyası). Cavablara görə risk skoru.
3. **Educational Content:** Blog tipli uzun məqalələr (markdown), `blog_posts` cədvəlində `category: health_condition` ilə.
4. **Smart Detection:** `flow_daily_logs`-dakı simptomları analiz et:
   - PCOS: düzənsiz dövrlər (>35 gün, variation >9), acne, hair issues simptomları
   - Endometriosis: pain_level >7 mütəmadi, painful periods
   - PMDD: lutein fazada mood <3 ardıcıl 3 dövr
5. **Trigger:** Pattern aşkar olunanda banner: "Simptomlarınız [X]-ə uyğun ola bilər. Screening edək?"
6. **CTA:** Quiz → nəticə → təhsil materialı → "Həkimə müraciət üçün hazırlıq" PDF/checklist

**UI:**
- `src/pages/HealthConditions.tsx` — ana hub
- `src/components/health/ConditionQuiz.tsx` — generic quiz engine
- `src/components/health/ConditionDetectionBanner.tsx` — flow dashboard-da

**Məzmun istehsalı:**
- Admin panel-də `health_conditions` CRUD
- İlkin seed: PMDD, PCOS, Endometriosis (AZ dilində, həkim review tələb olunur)
- Hər birinə 3-5 məqalə (səbəblər, simptomlar, müalicə variantları, life with…)

**Hüquqi:**
- Hər səhifədə güclü medical disclaimer (artıq mövcud `MedicalDisclaimer` komponenti)
- "Bu diaqnoz deyil, screening-dir" mesajı vurğulanmalı
- Google Play Health Content policy üçün məcburi

**Təxmini iş həcmi:** 3-4 gün (məzmun olmadan), məzmunla 1-2 həftə (həkim review daxil).

---

## Sual

1-6 və 8-i sırayla qurmağa başlayım? Yoxsa hansısa prioritet dəyişiklik var?
