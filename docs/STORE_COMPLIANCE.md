# Store Compliance — Anacan

> Health inteqrasiyası (oxuma + menstruasiya yazma) əlavə olunduqdan sonra
> hər iki mağaza formasında YENİLƏNMƏ MÜTLƏQDİR. Əks halda review reject riski var.

---

## 1. Google Play — Data Safety formu

Play Console → App content → Data safety → yenilə:

### Health Connect bölməsi (Play Console ayrıca soruşur)
- **"Does your app access Health Connect?"** → **Yes**
- İstifadə olunan icazələr (AndroidManifest ilə üst-üstə düşməlidir):
  - `READ_STEPS` — addım sayı göstərmək
  - `READ_ACTIVE_CALORIES_BURNED` — aktiv kalori göstərmək
  - `READ_DISTANCE` — məsafə
  - `READ_EXERCISE` — məşq siyahısı
  - `READ_HEART_RATE` — ürək ritmi (məşq konteksti)
  - `WRITE_MENSTRUATION` — istifadəçinin period qeydlərini Health Connect-ə yazmaq
- İstifadə məqsədi: **App functionality** (fitness/wellness göstəriciləri istifadəçiyə göstərilir)
- **Health Connect data serverə göndərilmir** — yalnız cihazda emal olunur → formada "data is processed ephemerally / on device" seçin

### Data types (ümumi bölmə)
| Data type | Collected? | Shared? | Purpose |
|---|---|---|---|
| Health info (cycle, hamiləlik, simptomlar — Supabase-ə yazılan) | Yes | No | App functionality |
| Fitness info (Health Connect: steps/calories) | Yes (on-device) | No | App functionality |
| Name, Email | Yes | No | App functionality, Account management |
| User IDs | Yes | Yes (Firebase/RevenueCat/Facebook) | Analytics, App functionality |
| Device IDs (advertising ID — Facebook SDK) | Yes | Yes | Advertising/Marketing, Analytics |
| Photos | Yes | No | App functionality |
| Approx/Precise location | Yes | No | App functionality (hava/xəritə) |
| Purchase history | Yes | Yes (RevenueCat) | App functionality |
| Crash logs / Diagnostics | Yes | No | Analytics |
- Encryption in transit: **Yes** · Deletion request: **Yes** (tətbiqdaxili hesab silmə var)

### Health apps declaration (2024+ tələbi)
Play Console → App content → **Health apps** → "My app is a health & fitness app" →
kateqoriya: **Reproductive health / cycle tracking** seçin.

---

## 2. App Store — Privacy & Health Disclosure

### App Privacy (App Store Connect → App Privacy)
`PrivacyInfo.xcprivacy` ilə uyğun olmalıdır:
- **Health & Fitness** → Collected, Linked to user, App Functionality
- Contact Info (Name, Email) → Linked, App Functionality
- Identifiers (User ID / Device ID) → Linked; Device ID → **Used for Tracking = YES** (Facebook SDK)
- Photos, Location (Precise), Purchase History, Crash & Performance Data → App Functionality/Analytics
- Tracking sualına: **Yes** (ATT dialoqu mövcuddur — `NSUserTrackingUsageDescription`)

### HealthKit tələbləri (App Review Guideline 5.1.3)
- Review Notes-a əlavə edin:
  > "The app reads steps/workouts/active energy from HealthKit to display the user's
  > activity, and (optionally, with explicit user consent via an in-app toggle)
  > writes the user's menstruation records to HealthKit. Health data is processed
  > on-device only and is never uploaded to our servers, never used for advertising,
  > and never shared with third parties."
- App Store təsvirində HealthKit istifadəsini qeyd edin (1 cümlə kifayətdir).
- Privacy Policy səhifəsinə HealthKit/Health Connect bölməsi əlavə edin:
  nə oxunur, nə yazılır, harada saxlanır (yalnız cihazda), 3-cü tərəflə paylaşılMIR.

### Yoxlama siyahısı (hər iki mağaza)
- [ ] Privacy Policy-də health data bölməsi yeniləndi
- [ ] Play Data Safety formu yeniləndi (Health Connect + WRITE_MENSTRUATION)
- [ ] Play "Health apps" declaration dolduruldu
- [ ] App Store Privacy labels yeniləndi
- [ ] App Review notes-a HealthKit izahı yazıldı
- [ ] PrivacyInfo.xcprivacy target-ə əlavə olundu (Xcode)
