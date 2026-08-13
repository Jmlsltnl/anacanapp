# Kilid Ekranı Taymer Widget-ləri — Quraşdırma Təlimatı

Süd vermə / yuxu taymerləri başlayanda telefonun kilid ekranında canlı sayğac göstərilir:
- **iOS 16.1+**: Live Activity (Lock Screen + Dynamic Island). iOS 17+-da widget üzərində **Dayandır** düyməsi.
- **Android 8+**: Foreground Service xronometr bildirişi — kilid ekranında görünür, **Dayandır** düyməsi və toxunuşla tətbiqə keçid.

Widget-dən dayandırılan sessiya itmir: native tərəf "pending stop" yazır, tətbiq növbəti açılışda/resume-da onu oxuyub `baby_logs`-a qeyd edir.

---

## Android — heç bir manual addım YOXDUR ✅

Hər şey kodda hazırdır: `TimerForegroundService.kt`, `TimerWidgetPlugin.kt`, manifest icazələri
(`FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_SPECIAL_USE`) və MainActivity qeydiyyatı.
Sadəcə:
```
npx cap sync android
```
və build. (Android 13+ üçün bildiriş icazəsi onsuz da soruşulur — mövcud axın dəyişməyib.)

---

## iOS — Xcode-da 6 addım (bir dəfəlik, ~10 dəqiqə)

Fayllar artıq repo-dadır: `ios/App/AnacanTimerWidget/` (4 swift fayl) və
`ios/App/App/Plugins/LiveActivityPlugin.swift|.m`. `Info.plist`-ə `NSSupportsLiveActivities`
əlavə olunub. Qalan yalnız target-lərin yaradılması:

### 1) Widget Extension target-i yarat
Xcode → File → New → Target… → **Widget Extension**
- Product Name: `AnacanTimerWidget`
- **Include Live Activity**: ✅ (varsa)
- **Include Configuration App Intent**: ❌
- Team/Bundle: `com.atlasoon.anacan.AnacanTimerWidget`
- "Activate scheme?" → Activate

### 2) Xcode-un generasiya etdiyi şablon faylları sil
Yeni target qovluğunda Xcode-un yaratdığı `AnacanTimerWidget.swift`,
`AnacanTimerWidgetBundle.swift`, `AnacanTimerWidgetLiveActivity.swift` və s. şablonları
**silin** (Move to Trash) — bizim fayllarımız onları əvəz edir.

### 3) Repo-dakı faylları target-lərə əlavə et
`ios/App/AnacanTimerWidget/` qovluğundakı 4 faylı Xcode-a sürüklə (Add Files…):

| Fayl | App target | AnacanTimerWidget target |
|---|---|---|
| `AnacanTimerWidgetBundle.swift` | ❌ | ✅ |
| `AnacanTimerWidgetLiveActivity.swift` | ❌ | ✅ |
| `AnacanTimerAttributes.swift` | ✅ | ✅ *(hər ikisi — vacib!)* |
| `AnacanTimerStopIntent.swift` | ✅ | ✅ *(hər ikisi — vacib!)* |

Həmçinin `ios/App/App/Plugins/LiveActivityPlugin.swift` və `.m` fayllarının **App**
target-inə üzv olduğunu yoxla (Plugins qovluğu artıq layihədədirsə avtomatik olacaq;
deyilsə Add Files ilə əlavə et).

### 4) App Group əlavə et (hər iki target-ə)
Signing & Capabilities → **+ Capability → App Groups** →
`group.com.atlasoon.anacan`
- **App** target-inə ✅
- **AnacanTimerWidget** target-inə ✅
(Apple Developer portalda App Group ID-ni yaratmaq lazım gələ bilər.)

### 5) Widget target deployment
AnacanTimerWidget target → General → Minimum Deployments: **iOS 16.1**

### 6) Build
```
npx cap sync ios
```
Xcode-da App scheme ilə build & run.

### Yoxlama
1. Tətbiqdə yuxu və ya əmizdirmə taymerini başlat
2. Telefonu kilidlə → kilid ekranında canlı sayğac görünməlidir
3. iOS 17+: qırmızı ■ düyməsi ilə dayandır → tətbiqi aç → sessiya tarixçədə olmalıdır
4. Widget-ə toxun → tətbiq açılır

### Problemlərdə
- Live Activity görünmür → Settings → Anacan → **Live Activities** açıq olmalıdır
- "Dayandır" işləmir (iOS 17) → `AnacanTimerStopIntent.swift` hər iki target-də olmalıdır
- Sessiya yadda qalmır → App Group hər iki target-də eyni ID ilə olmalıdır
- Köhnə iOS (16.0-) → avtomatik fallback: adi davamlı bildiriş göstərilir
