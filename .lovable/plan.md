## Məqsəd

Flow modulunda aşağıdakı 4 funksiyanı tam işlək hala gətirmək. Əvvəlki iclasda fayllar yaradılsa da, sən "heç nə qurulmayıb" dedin — ona görə hər birini sıfırdan audit edib, görünən/işləyən hala gətirəcəm.

---

## 2. Tsikl Uzunluğu Trend Qrafiki + Anomaliya Aşkarlama

**Fayllar:** `src/components/flow/CycleTrendChart.tsx`, `src/components/flow/CycleAnomalyBanner.tsx`

- **Trend Chart:** Son 12 tsiklin uzunluğunu Recharts LineChart ilə göstər. ACOG normal diapazon xətləri (21–35 gün), orta uzunluq referans xətti, tooltip.
- **Anomaliya Banner:** `useCycleStats` əsasında avtomatik yoxla:
  - `<21 gün` → "Qısa tsikl" xəbərdarlığı (qırmızı)
  - `>35 gün` → "Uzun tsikl" xəbərdarlığı (narıncı)
  - `variation >7 gün` → "Nizamsız tsikl" (sarı)
  - Hər biri üçün AI-yə sual göndər düyməsi (`navigate('/ai-chat?context=cycle_anomaly')`).
- **Şərtlər:** Ən azı 2 tamamlanmış tsikl olmalıdır (yoxsa render olunmasın).

## 3. Həb / Kontrasepsiya Xatırlatması

**Fayl:** `src/components/flow/PillReminderCard.tsx`

- `flow_reminders` cədvəlində `reminder_type='pill'` qeydi.
- UI: Switch (aktiv/passiv), başlıq + vaxt redaktəsi, Capacitor `LocalNotifications` ilə hər gün təkrarlanan bildiriş.
- Yaddaşda saxla → `useSaveFlowReminder` upsert.
- Native olmayan platformada DB-də saxla, lakin bildiriş planlaşdırma atla.

## 4. Period Gecikməsi Aşkarlama + AI Avtomatik Mesaj

**Fayl:** `src/components/flow/PeriodDelayBanner.tsx`

- Hesablama: `daysSinceLastPeriod > avgCycleLength + 3` → banner görünsün.
- Banner məzmunu: gecikmə günü, "Hamiləlik testi etməyi düşünün" məsləhəti, "Anacan.AI ilə danış" CTA.
- Throttle: `user_preferences.last_delay_notification_at` sahəsi ilə 24 saatda bir lokal bildiriş.
- AI link: `?context=period_delay&days=X` parametrləri ilə.

## 5. Simptom Pattern Analizi (Premium)

**Fayl:** `src/components/flow/SymptomPatternReport.tsx`

- Son 3 tsiklin `flow_daily_logs` qeydlərini analiz et.
- Hər faza (menstrual/follicular/ovulation/luteal) üzrə top 5 simptomu say.
- Bar chart və ya heat-map ilə vizuallaşdır.
- `useSubscription` ilə premium-gating → premium olmayan istifadəçiyə blur + "Premium-a keç" CTA.

---

## Yoxlama

- FlowDashboard.tsx-da 4 komponentin doğru sırada göründüyünə əmin ol.
- Hər birini DB datasız (boş state) və data ilə test et.
- Bütün UI Azərbaycan dilində, Coral Orange + Warm Beige palitrası ilə.
- Anacan.AI tonu: medical disclaimer "Anacan.AI" alt-mətnində, "Canım/Əzizim" yoxdur.

## Technical Details

- Recharts artıq quraşdırılıb (CycleTrendChart-da istifadə olunur).
- `@capacitor/local-notifications` artıq layihədə var.
- `flow_reminders` cədvəli `reminder_type` TEXT — `'pill'` dəyəri əlavə miqrasiya tələb etmir.
- `user_preferences.last_delay_notification_at` sütunu artıq miqrasiya ilə əlavə olunub (`20260609094030`).
- Premium status: `useSubscription().isPremium`.

İclas başlayanda hər faylı yenidən oxuyub itkin/yarıq hissələri tamamlayacam, sonra preview-də vizual yoxlama edəcəm.