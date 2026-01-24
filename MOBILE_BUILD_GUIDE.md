# Anacan Mobile App Build Guide

## 📱 Tələblər

### Ümumi:
- Node.js 18+
- Git
- Lovable proyektinin GitHub-a export edilməsi

### iOS üçün:
- macOS kompüter
- Xcode 15+
- Apple Developer hesabı ($99/il)
- CocoaPods

### Android üçün:
- Android Studio (Arctic Fox+)
- JDK 17+
- Google Play Developer hesabı ($25 birdəfəlik)

---

## 🚀 Addım-addım Quruluş

### 1. Proyekti GitHub-dan yükləyin

```bash
git clone https://github.com/YOUR_USERNAME/anacan-app.git
cd anacan-app
npm install
```

### 2. Native platformları əlavə edin

```bash
# iOS əlavə et
npx cap add ios

# Android əlavə et
npx cap add android
```

### 3. Proyekti build edin

```bash
npm run build
npx cap sync
```

### 4. Native ikonlar və splash screen yaradın

```bash
# Əvvəlcə icon.png (1024x1024) və splash.png (2732x2732) hazırlayın
# public/ qovluğuna qoyun

npx @capacitor/assets generate
```

---

## 📲 iOS Build

### Development:

```bash
npx cap open ios
```

Xcode-da:
1. Signing & Capabilities → Team seçin
2. Bundle Identifier: `app.lovable.anacan`
3. Product → Run

### Production Build:

1. Xcode → Product → Archive
2. Distribute App → App Store Connect
3. App Store Connect-da test edin

### IAP Quraşdırması:

1. App Store Connect → Subscriptions
2. Subscription Group yaradın: "Anacan Premium"
3. Məhsullar əlavə edin:
   - `app.lovable.anacan.premium.monthly` - $9.99/ay
   - `app.lovable.anacan.premium.yearly` - $79.99/il
4. Sandbox testçilər əlavə edin

---

## 🤖 Android Build

### Development:

```bash
npx cap open android
```

Android Studio-da:
1. Sync Gradle
2. Run → Select Device/Emulator

### Production Build:

1. Build → Generate Signed Bundle/APK
2. AAB (Android App Bundle) seçin
3. Keystore yaradın və saxlayın
4. Play Console-a yükləyin

### IAP Quraşdırması:

1. Play Console → Products → Subscriptions
2. Məhsullar əlavə edin:
   - Product ID: `app.lovable.anacan.premium.monthly`
   - Base Plan ID: `monthly-plan`
   - Qiymət: $9.99/ay
   
   - Product ID: `app.lovable.anacan.premium.yearly`
   - Base Plan ID: `yearly-plan`
   - Qiymət: $79.99/il
3. Internal Testing track-ə testçilər əlavə edin

---

## 🔧 capacitor.config.json

Hal-hazırda hot-reload üçün konfiqurasiya edilib. **Production build-dən əvvəl** `server` bölməsini silin:

```json
{
  "appId": "app.lovable.anacan",
  "appName": "Anacan",
  "webDir": "dist"
}
```

---

## 🔐 Environment Variables

Production üçün `.env` faylında:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

---

## 📋 Checklist

### Release öncəsi:

- [ ] capacitor.config.json-dan server URL-i silmək
- [ ] App ikonları (1024x1024)
- [ ] Splash screen (2732x2732)
- [ ] Privacy Policy URL
- [ ] Terms of Service URL
- [ ] App Store / Play Store açıqlama mətnləri
- [ ] Screenshots (iOS: 6.5", 5.5" | Android: phone, tablet)
- [ ] IAP məhsulları yaradılıb
- [ ] Sandbox/Internal testing tamamlanıb

---

## 🆘 Problemlər

### iOS "No signing certificate" xətası:
- Xcode → Preferences → Accounts → Apple ID əlavə edin
- Signing & Capabilities-də Team seçin

### Android "SDK location not found":
- `android/local.properties` faylı yaradın
- `sdk.dir=/path/to/Android/sdk` əlavə edin

### IAP "Product not found":
- Bundle ID / Package name düzgün olmalıdır
- Məhsullar aktiv olmalıdır
- Test hesabı əlavə edilməlidir

---

## 📚 Əlavə Resurslar

- [Capacitor Docs](https://capacitorjs.com/docs)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Google Play Console](https://play.google.com/console)
- [Lovable Blog - Native App Guide](https://docs.lovable.dev/tips/native-mobile-apps)
