

# iOS Live Activity və Android Widget Quraşdırma Planı

## Vacib Qeyd

iOS Live Activities və Android Widgets **native kod** tələb edir (Swift / Kotlin). Bu funksionallıq **Lovable web redaktorunda tam həyata keçirilə bilməz** — native faylları yarada bilərik, amma onları işlətmək üçün **Xcode (iOS)** və **Android Studio (Android)** lazımdır.

---

## Alternativ: Capacitor Local Notifications (Dərhal işləyən həll)

Timer aktiv olduqda **persistent notification** göstərmək — bu, Live Activity-yə oxşar təcrübə verir və yeni build-lər ilə dərhal işləyir.

**Nə edəcəyik:**
- Timer başlayanda local notification göstərmək (ongoing/persistent)
- Timer dayandığında notification-u silmək
- Notification-a klik edəndə app-ə qayıtmaq

Bu üsul iOS və Android-də eyni cür işləyir, native kod tələb etmir.

---

## Tam Native Həll (Step-by-step)

Əgər həqiqi Live Activity / Widget istəyirsinizsə, aşağıdakı addımları **yerli kompüterdə** etməlisiniz:

### iOS Live Activity

**Addım 1: Xcode-da Widget Extension yaradın**
- Xcode-da layihəni açın
- File - New - Target - Widget Extension seçin
- "Include Live Activity" işarəsini qoyun
- Ad: "AnacanTimerWidget"

**Addım 2: ActivityAttributes yaradın (Swift)**
- `AnacanTimerAttributes.swift` faylı yaradılacaq
- Timer tipi (yuxu/əmizdirmə/bez), başlama vaxtı, etiket saxlanacaq

**Addım 3: Live Activity UI dizayn edin (SwiftUI)**
- Lock screen və Dynamic Island görünüşləri
- Timer geri sayımı, ikon, rəng

**Addım 4: Capacitor Plugin yaradın**
- Web tərəfdən Live Activity-ni başlatmaq/dayandırmaq üçün bridge
- `startLiveActivity(type, label)` və `stopLiveActivity()` metodları

**Addım 5: Web kodunda inteqrasiya**
- `timerStore.ts`-də timer başlayanda plugin çağırılacaq
- Timer dayandığında Live Activity bağlanacaq

### Android Widget

**Addım 1: Android Studio-da Widget yaradın**
- New - Widget - App Widget seçin
- Ad: "TimerWidget"

**Addım 2: Widget layout (XML)**
- Timer tipi, keçən vaxt, dayandırma düyməsi

**Addım 3: Widget Service (Kotlin)**
- Hər saniyə yenilənən foreground service
- Timer məlumatlarını SharedPreferences-dən oxumaq

**Addım 4: Capacitor Plugin (eyni plugin)**
- Android tərəfdə widget-i yeniləmək üçün bridge

---

## Tövsiyə

**Persistent Local Notification** həllini tətbiq edək — bu, Lovable-da tam işləyir, hər iki platformada eynidir və istifadəçi təcrübəsi Live Activity-yə yaxındır. Sonradan yerli kompüterdə native Live Activity əlavə edə bilərsiniz.

---

## Texniki Detallar

### Persistent Notification həlli üçün dəyişikliklər:

1. **`src/store/timerStore.ts`** — Timer başlayanda/dayandığında `LocalNotifications` API çağırılacaq
2. **`src/utils/timerNotifications.ts`** (yeni fayl) — Notification idarəetmə utility:
   - `showTimerNotification(type, label)` — ongoing notification göstər
   - `updateTimerNotification(type, elapsed)` — vaxtı yenilə
   - `clearTimerNotification()` — notification sil
3. **`src/components/FloatingTimerWidget.tsx`** — Background-da da notification aktiv olacaq
4. **`capacitor.config.json`** — LocalNotifications plugin artıq konfiqurasiya edilib

### Native Live Activity üçün lazım olan fayllar (yerli kompüterdə yaradılmalı):

- `ios/App/AnacanTimerWidget/` — Widget extension qovluğu
- `ios/App/AnacanTimerWidget/AnacanTimerAttributes.swift` — Data model
- `ios/App/AnacanTimerWidget/AnacanTimerWidgetLiveActivity.swift` — UI
- `ios/App/App/Plugins/LiveActivityPlugin.swift` — Capacitor bridge
- `android/app/src/main/java/.../TimerWidget.kt` — Android widget
- `android/app/src/main/java/.../TimerWidgetService.kt` — Update service

