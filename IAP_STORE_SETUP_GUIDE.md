# Anacan Premium IAP - Store Quraşdırma Bələdçisi

**App ID:** `com.atlasoon.anacan`  
**Product IDs:**
- Aylıq: `com.atlasoon.anacan.premium.monthly`
- İllik: `com.atlasoon.anacan.premium.yearly`

---

## 📱 iOS - App Store Connect Quraşdırması

### Addım 1: Apple Developer Hesabı
1. https://developer.apple.com/account/ açın
2. Apple Developer Program-a qoşulun ($99/il)
3. Ödəniş və vergi məlumatlarını doldurun (Agreements, Tax, and Banking)

### Addım 2: App Store Connect-da Tətbiq Yaradın
1. https://appstoreconnect.apple.com/ açın
2. **My Apps** → **+** → **New App**
3. Məlumatları daxil edin:
   - **Platform:** iOS
   - **Name:** Anacan
   - **Primary Language:** Azerbaijani (və ya English)
   - **Bundle ID:** `com.atlasoon.anacan`
   - **SKU:** `anacan-ios-001`

### Addım 3: In-App Purchases (Subscriptions) Yaradın
1. Tətbiqinizi seçin → **Features** → **In-App Purchases**
2. **Manage** yanındakı **+** düyməsini basın
3. **Auto-Renewable Subscription** seçin

#### Subscription Group yaradın:
- **Reference Name:** Anacan Premium
- **Subscription Group Localization:** 
  - Display Name: Premium Abunəlik

#### Aylıq Abunəlik:
1. **+** → **Create Subscription**
2. Məlumatları daxil edin:
   - **Reference Name:** Premium Monthly
   - **Product ID:** `com.atlasoon.anacan.premium.monthly`
   - **Subscription Duration:** 1 Month
   - **Subscription Price:** $9.99 (və ya uyğun AZN)
3. **Localization** əlavə edin:
   - **Display Name:** Premium Aylıq
   - **Description:** Bütün premium funksiyalara limitsiz giriş

#### İllik Abunəlik:
1. **+** → **Create Subscription**
2. Məlumatları daxil edin:
   - **Reference Name:** Premium Yearly
   - **Product ID:** `com.atlasoon.anacan.premium.yearly`
   - **Subscription Duration:** 1 Year
   - **Subscription Price:** $79.99 (və ya uyğun AZN)
3. **Localization** əlavə edin:
   - **Display Name:** Premium İllik
   - **Description:** Bütün premium funksiyalara limitsiz giriş - 33% qənaət!

### Addım 4: App-Specific Shared Secret (Server Validation üçün)
1. **App Information** → **App-Specific Shared Secret**
2. **Generate** basın
3. Bu secret-i kopyalayın - server-side validation üçün lazımdır

### Addım 5: Sandbox Test İstifadəçiləri
1. **Users and Access** → **Sandbox** → **Testers**
2. **+** ilə test istifadəçisi əlavə edin
3. Test email və parol yaradın (real email olmaya bilər)

### Addım 6: Xcode Konfiqurasiyası
1. Xcode-da proyekti açın
2. **Signing & Capabilities** → **+ Capability** → **In-App Purchase** əlavə edin
3. Team-inizi seçin və Bundle ID-nin `com.atlasoon.anacan` olduğunu yoxlayın

### Addım 7: StoreKit Configuration (Lokal Test üçün)
1. Xcode → **File** → **New** → **File**
2. **StoreKit Configuration File** seçin
3. İki subscription əlavə edin (yuxarıdakı Product ID-lərlə)
4. **Scheme** → **Edit Scheme** → **Run** → **Options** → **StoreKit Configuration** seçin

---

## 🤖 Android - Google Play Console Quraşdırması

### Addım 1: Google Play Developer Hesabı
1. https://play.google.com/console/ açın
2. Developer hesabı yaradın ($25 birdəfəlik)
3. Merchant hesabı quraşdırın (ödəniş almaq üçün)

### Addım 2: Tətbiq Yaradın
1. **All apps** → **Create app**
2. Məlumatları daxil edin:
   - **App name:** Anacan
   - **Default language:** Azerbaijani
   - **App or game:** App
   - **Free or paid:** Free
3. Bəyannamələri qəbul edin

### Addım 3: İlk APK/AAB Yükləyin
⚠️ **Vacib:** Subscription yaratmaq üçün əvvəlcə ən azı bir AAB/APK yükləməlisiniz!

1. Android Studio-da proyekti açın
2. **Build** → **Generate Signed Bundle / APK**
3. **Android App Bundle** seçin
4. Keystore yaradın (ilk dəfə) və ya mövcud olanı istifadə edin:
   ```
   Key store path: /path/to/anacan-release.keystore
   Key store password: [güclü parol]
   Key alias: anacan-key
   Key password: [güclü parol]
   ```
5. **release** build type seçin
6. AAB faylını Play Console-a yükləyin:
   - **Release** → **Production** (və ya **Internal testing**) → **Create new release**

### Addım 4: Subscriptions Yaradın
1. **Monetize** → **Products** → **Subscriptions**
2. **Create subscription**

#### Aylıq Abunəlik:
1. **Product ID:** `com.atlasoon.anacan.premium.monthly`
2. **Name:** Premium Aylıq
3. **Description:** Bütün premium funksiyalara limitsiz giriş
4. **Add a base plan:**
   - **Base plan ID:** `monthly-plan`
   - **Renewal type:** Auto-renewing
   - **Billing period:** 1 month
   - **Price:** $9.99

#### İllik Abunəlik:
1. **Product ID:** `com.atlasoon.anacan.premium.yearly`
2. **Name:** Premium İllik
3. **Description:** Bütün premium funksiyalara limitsiz giriş - 33% qənaət!
4. **Add a base plan:**
   - **Base plan ID:** `yearly-plan`
   - **Renewal type:** Auto-renewing
   - **Billing period:** 1 year
   - **Price:** $79.99

5. Hər subscription üçün **Activate** edin

### Addım 5: License Testing (Test Alışları)
1. **Settings** → **License testing**
2. Test edəcəyiniz Gmail hesablarını əlavə edin
3. **License response:** `RESPOND_NORMALLY` seçin

### Addım 6: Internal Testing Track
1. **Release** → **Testing** → **Internal testing**
2. **Testers** → **Create email list**
3. Test edəcək Gmail-ləri əlavə edin
4. AAB yükləyin və release yaradın
5. Test linkini kopyalayın və testçilərə göndərin

---

## 🔧 Capacitor/Native Konfiqurasiya

### capacitor.config.json (Production üçün)
```json
{
  "appId": "com.atlasoon.anacan",
  "appName": "Anacan",
  "webDir": "dist",
  "plugins": {
    "PushNotifications": {
      "presentationOptions": ["badge", "sound", "alert"]
    }
  }
}
```

⚠️ **Production build üçün `server` blokunu SİLİN!**

### Android: build.gradle Yoxlama
`android/app/build.gradle` faylında:
```gradle
android {
    defaultConfig {
        applicationId "com.atlasoon.anacan"
        // ...
    }
}
```

### iOS: Info.plist
Bundle identifier: `com.atlasoon.anacan`

---

## 🔐 Server-Side Validation (Supabase Edge Function)

### iOS üçün Apple Shared Secret:
1. App Store Connect-dan kopyaladığınız secret-i Supabase-ə əlavə edin
2. Secret adı: `APPLE_SHARED_SECRET`

### Android üçün Google Service Account:
1. Google Cloud Console → Service Accounts
2. Yeni service account yaradın
3. JSON key faylını yükləyin
4. Google Play Console → API Access → Service Account əlavə edin
5. Secret adı: `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`

---

## ✅ Test Checklist

### iOS:
- [ ] Apple Developer hesabı aktivdir
- [ ] Tətbiq App Store Connect-da yaradılıb
- [ ] Subscription-lar yaradılıb və aktivdir
- [ ] Sandbox tester əlavə edilib
- [ ] Xcode-da In-App Purchase capability əlavə edilib
- [ ] Bundle ID düzgündür: `com.atlasoon.anacan`

### Android:
- [ ] Google Play Developer hesabı aktivdir
- [ ] Tətbiq Play Console-da yaradılıb
- [ ] İlk AAB yüklənib
- [ ] Subscription-lar yaradılıb və aktivdir
- [ ] License testing email-ləri əlavə edilib
- [ ] Application ID düzgündür: `com.atlasoon.anacan`

---

## 🚀 Build və Test

### iOS:
```bash
npm run build
npx cap sync ios
npx cap open ios
# Xcode-da Sandbox hesabı ilə test edin
```

### Android:
```bash
npm run build
npx cap sync android
npx cap open android
# License testing hesabı ilə test edin
```

---

## ❓ Tez-tez Verilən Suallar

**S: "Product not found" xətası alıram**
C: Product ID-lər Store Console-dakı ilə tam eyni olmalıdır. Subscription-ların aktiv olduğunu yoxlayın.

**S: Android-da subscription görünmür**
C: Ən azı bir AAB yüklənməli və internal testing-ə release edilməlidir.

**S: iOS-da alış işləmir**
C: Sandbox tester hesabı ilə daxil olun. Real Apple ID ilə sandbox test etmək olmur.

**S: Ödəniş alınmır (real pul)**
C: Test rejimində real pul alınmır. Production-a çıxdıqdan sonra real alışlar başlayacaq.
