

# Persistent Timer Notification + Native Widget Faylları

## Hissə 1: Persistent Local Notifications (Lovable-da tam işləyəcək)

Timer başlayanda native notification göstəriləcək, background-da da görünəcək. Timer dayandığında notification silinəcək.

### Yeni fayl: `src/utils/timerNotifications.ts`
- `showTimerNotification(timerId, type, label)` — Timer başlayanda ongoing notification göstərir
- `clearTimerNotification(timerId)` — Timer dayandığında notification silir
- `clearAllTimerNotifications()` — Bütün timer notification-ları silir
- Timer tipinə görə fərqli başlıq və ikon (Yuxu, Əmizdirmə, Bez, Küy Səsi)

### Dəyişiklik: `src/store/timerStore.ts`
- `startTimer()` — Timer başlayanda `showTimerNotification()` çağırılacaq
- `stopTimer()` — Timer dayandığında `clearTimerNotification()` çağırılacaq
- `clearAllTimers()` — `clearAllTimerNotifications()` çağırılacaq

### Dəyişiklik: `src/components/FloatingTimerWidget.tsx`
- Background-a keçəndə notification aktiv qalacaq (artıq timerStore-dan avtomatik işləyəcək)

---

## Hissə 2: Native Fayllar (Yerli kompüterdə istifadə üçün)

Bu faylları Lovable-da yarada bilərik, amma onları işlətmək üçün Xcode/Android Studio lazımdır.

### iOS Live Activity faylları:
1. `ios/App/AnacanTimerWidget/AnacanTimerAttributes.swift` — ActivityAttributes data modeli
2. `ios/App/AnacanTimerWidget/AnacanTimerWidgetLiveActivity.swift` — Lock screen + Dynamic Island UI
3. `ios/App/App/Plugins/LiveActivityPlugin.swift` — Capacitor bridge plugin
4. `ios/App/App/Plugins/LiveActivityPlugin.m` — Objective-C bridge header

### Android Widget faylları:
1. `android/app/src/main/java/com/atlasoon/anacan/TimerWidgetProvider.kt` — Widget provider
2. `android/app/src/main/java/com/atlasoon/anacan/TimerWidgetPlugin.kt` — Capacitor bridge
3. `android/app/src/main/res/layout/widget_timer.xml` — Widget layout
4. `android/app/src/main/res/xml/timer_widget_info.xml` — Widget metadata

### Web inteqrasiya:
5. `src/plugins/LiveActivityPlugin.ts` — Capacitor plugin TypeScript interface (iOS + Android)
6. `src/store/timerStore.ts` — Plugin çağırışları əlavə ediləcək

---

## Texniki Detallar

### timerNotifications.ts strukturu:
```typescript
import { LocalNotifications } from '@capacitor/local-notifications';
import { isNative } from '@/lib/native';

// Notification ID-ləri: timer hash-indən generasiya
// Timer başlayanda: schedule notification (ongoing=true Android-də)
// Timer dayandığında: cancel notification by id
```

### LiveActivityPlugin.ts strukturu:
```typescript
import { registerPlugin } from '@capacitor/core';

interface LiveActivityPlugin {
  startActivity(options: { type: string; label: string; startTime: number }): Promise<void>;
  stopActivity(): Promise<void>;
}

const LiveActivity = registerPlugin<LiveActivityPlugin>('LiveActivity');
export default LiveActivity;
```

### Quraşdırma addımları (native fayllar üçün):
1. `npm run build && npx cap sync`
2. **iOS:** Xcode-da Widget Extension target-i əl ilə yaradılmalıdır (File > New > Target > Widget Extension)
3. **iOS:** Yaradılan Swift fayllarını Widget Extension target-ə köçürün
4. **Android:** `AndroidManifest.xml`-ə widget receiver əlavə edin
5. Yenidən build edin

