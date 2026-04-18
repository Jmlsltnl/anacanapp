
## Plan: dinamik push bildirişlərini tam bərpa et

### Problemin kökü (audit nəticəsi)

1. **Token itkisi (ən kritik)** — `useDeviceToken.saveTokenToDatabase` hər dəfə eyni platforma üçün **bütün köhnə tokenləri silib yenisini insert edir**. Əgər Firebase eyni token qaytarırsa amma "exists" yoxlaması (`.single()` PGRST116) səhv qiymətləndirilirsə, delete uğur qazanır → insert duplicate xətası → token itir. Eyni zamanda `send-*` funksiyalar `UNREGISTERED` və hətta `INVALID_ARGUMENT` xətalarında token silir; `INVALID_ARGUMENT` müvəqqəti FCM xətalarında da tetiklənə bilər və canlı tokenlər silinir.

2. **Dedup blokaji** — `notification_send_log` cədvəlindəki `(user_id, source_type, source_notification_id)` qeydləri **heç vaxt təmizlənmir**, yalnız "today" filtrlənir. Manual test çağırışları log yaradır; sonra cron eyni gün üçün təkrar göndərmir. Əgər Baku/UTC tarix sərhədi səhv hesablanırsa, dünənki log da bu günü blok edə bilər (`todayStart` UTC ilə qurulub, Baku ilə deyil).

3. **Slot pəncərəsi çox dar** — `send-daily-notifications` cron 09:00/14:00-da işləyir, amma yalnız ±5 dəqiqə pəncərə qəbul edir. Cron gecikməsi və ya soyuq başlanğıc 6+ dəqiqə çəksə, "Not a notification time slot" qaytarır → o gün heç nə getmir.

4. **iOS Aps Environment yoxdur** — `ios/App/App/` qovluğunda `.entitlements` faylı yoxdur (`aps-environment` tapılmadı). Store build (production APNs) ilə Firebase cihaza birbaşa gediş alır, amma APNs token Firebase-ə bağlı olmaya bilər → store-da push çatmır, dev-də işləyir.

5. **Android POST_NOTIFICATIONS icazəsi yoxdur** — `AndroidManifest.xml`-də yalnız `INTERNET` icazəsi var. Android 13+ (API 33+) üçün `POST_NOTIFICATIONS` runtime icazəsi olmadan sistem bildirişləri **göstərmir**, FCM gəlsə də banner çıxmır.

6. **Aggressive delete-by-platform** logic eyni cihazda Firebase token yenilənəndə əvvəlki tokeni dərhal silir; əgər yeni insert RLS/duplicate üzündən uğursuz olursa istifadəçi bütün gün tokensiz qalır.

### Həll planı (kod dəyişikliyi)

**A. Token saxlama məntiqini bərpa et (`src/hooks/useDeviceToken.ts`)**
- "Delete then insert" əvəzinə **upsert** istifadə et (`onConflict: 'user_id,token'`).
- Köhnə tokenləri YALNIZ yeni token uğurla saxlanandan SONRA və YALNIZ fərqli olanları sil.
- Hər app açılışında (tab focus + auth dəyişikliyində) tokeni yenidən yoxla, lakin database-də artıq mövcuddursa toxunma.

**B. FCM xəta klassifikasiyasını sərtləşdir (`supabase/functions/_shared/fcm.ts`)**
- Token YALNIZ `UNREGISTERED` və `NOT_FOUND` halında silinsin. `INVALID_ARGUMENT`, `QUOTA_EXCEEDED`, `UNAVAILABLE`, `INTERNAL` müvəqqəti hesab edilsin (silmə).
- Detallı log: status code + error code + token suffiksi.

**C. Dedup pəncərəsini düzəlt (`send-daily-notifications`)**
- `todayStart`-ı **Baku vaxtı ilə (UTC+4)** hesabla, UTC yox.
- Slot pəncərəsini ±5 dəq → ±15 dəq genişləndir (cron gecikmələri üçün).
- Manual triggerda dedup-ı isteğe bağlı olaraq atla (test rejimi).
- "Outside notification hours" şərtini 09:00–22:00 et (köhnə "<24" hər saatı qəbul edirdi, amma cron yenə də skip edirdi).

**D. iOS aps-environment əlavə et**
- `ios/App/App/App.entitlements` faylı yarat (`aps-environment = production`).
- `App.xcodeproj` build configuration-larına entitlements faylının yolunu qoş (Xcode tərəfində user lokal olaraq ediləcək — addım-addım təlimat verəcəm).

**E. Android POST_NOTIFICATIONS icazəsi**
- `AndroidManifest.xml`-ə `<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />` və default notification channel meta-data əlavə et.
- `useDeviceToken` Android-də `FirebaseMessaging.requestPermissions()` çağırır — sistem icazə dialoqu manifestdə icazə olduqda işləyir.

**F. Diaqnostika aləti (admin)**
- `AdminPushNotifications.tsx`-ə "Send test push to my device" düyməsi əlavə et: cari admin user-ə real cron pipeline-dan keçərək push göndərir və tam edge function logunu UI-da göstərir.
- `send-daily-notifications`-i həm istifadəçi ID parametri ilə də çağırmağa imkan ver (yalnız o user-i emal et) — dynamic push-u tək istifadəçidə debug etmək üçün.

**G. Köhnə "blokaji yaradan" log qeydlərini təmizlə**
- Bu günə aid `notification_send_log`-u silən bir migration (yalnız test/manual qeydləri) və dedup açarına gün də əlavə et: `user_id|source_type|source_id|YYYY-MM-DD`.

### Heç bir push GÖNDƏRİLMƏYƏCƏK (test üçün)

İcra zamanı yalnız **kod və konfiqurasiya** dəyişdiriləcək. Heç bir bulk və ya manual `send-*` funksiyası işə salınmayacaq, heç bir istifadəçiyə push getməyəcək. Test üçün admin paneldə "send to me" düyməsi sənin tək cihazına yönəliklidir.

### Native build addımları (sənin üçün — addım-addım)

Kod dəyişiklikləri Lovable-də avtomatik tətbiq olunacaq, lakin **App Store / Play Store-da işləməsi üçün yeni build lazımdır**:
1. `git pull` → öz GitHub repo-ndan layihəni çək.
2. Terminalda: `npm install`, sonra `npm run build`, sonra `npx cap sync ios && npx cap sync android`.
3. **iOS (Xcode)**: `App.xcworkspace`-i aç → "App" target → "Signing & Capabilities" → "+ Capability" → "Push Notifications" əlavə et. Bu, `App.entitlements`-i avtomatik bağlayacaq.
4. **Android (Android Studio)**: heç nə əl ilə etmək lazım deyil — yeni manifest avtomatik tətbiq olunur.
5. Yeni TestFlight / Internal Testing build yüklə → bir dəfə aç (token yenilənsin) → 09:00 və ya 14:00 Bakı vaxtını gözlə, və ya admin "send to me" düyməsindən test et.

### Dəyişdiriləcək / yaradılacaq fayllar

- `src/hooks/useDeviceToken.ts` (token upsert məntiqi)
- `supabase/functions/_shared/fcm.ts` (xəta klassifikasiyası)
- `supabase/functions/send-daily-notifications/index.ts` (Baku timezone, slot ±15dq, optional userId)
- `supabase/functions/send-push-notification/index.ts` (token silmə qoruması)
- `supabase/functions/send-bulk-push/index.ts` (eyni qoruma)
- `supabase/functions/send-flow-reminders/index.ts` (eyni qoruma)
- `android/app/src/main/AndroidManifest.xml` (POST_NOTIFICATIONS + channel meta)
- `ios/App/App/App.entitlements` (yeni — aps-environment)
- `src/components/admin/AdminPushNotifications.tsx` ("Send test to me" düyməsi + canlı log paneli)
- Yeni migration: dedup açarına tarix əlavə + bugünkü test log-larını sil

Təsdiqlədikdən sonra default mode-a keçib bütün dəyişiklikləri tətbiq edəcəyəm.
