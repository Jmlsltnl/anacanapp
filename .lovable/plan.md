

# iOS Firebase Konfiqurasiya Problemi Həlli

## Problem
iOS tətbiqi açılanda **crash** edir çünki:
1. `GoogleService-Info.plist` faylı yoxdur
2. `FirebaseApp.configure()` çağırılmır

## Həll Yolu

### Addım 1: Firebase Console-da iOS tətbiqi qeydiyyatı

1. **Firebase Console**-a daxil ol: https://console.firebase.google.com
2. Mövcud Firebase proyektini aç (və ya yeni yarat)
3. **Project Settings** → **General** → **Your apps** bölməsinə get
4. **Add app** → **iOS** seç
5. **Bundle ID** olaraq daxil et: `com.atlasoon.anacan`
6. App nickname: `Anacan iOS`
7. **Register app** düyməsini bas

### Addım 2: GoogleService-Info.plist yüklə

1. Firebase Console `GoogleService-Info.plist` faylını yükləməyi təklif edəcək
2. Bu faylı yüklə
3. Faylı iOS proyektinə əlavə et:

```text
ios/App/App/GoogleService-Info.plist
```

Xcode-da:
- Xcode-u aç: `npx cap open ios`
- `GoogleService-Info.plist` faylını **App** qovluğuna drag-drop et
- "Copy items if needed" seçimini işarələ
- Target-ə əlavə olunduğundan əmin ol

### Addım 3: AppDelegate.swift-i yenilə

`ios/App/App/AppDelegate.swift` faylına Firebase initialization əlavə et:

```swift
import UIKit
import Capacitor
import FirebaseCore  // Bu sətri əlavə et

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Firebase-i konfiqurasiya et
        FirebaseApp.configure()  // Bu sətri əlavə et
        
        return true
    }
    
    // ... qalan metodlar
}
```

### Addım 4: Firebase SDK-nı Podfile-a əlavə et

`ios/App/Podfile` faylına əlavə et:

```ruby
target 'App' do
  capacitor_pods
  # Firebase pods
  pod 'FirebaseCore'
  pod 'FirebaseAnalytics'
end
```

Sonra terminal-da:
```bash
cd ios/App
pod install
```

### Addım 5: Proyekti yenidən sync et

```bash
npx cap sync ios
cd ios/App
pod install
npx cap open ios
```

---

## Alternativ: Firebase olmadan build etmək

Əgər Firebase Analytics-ə **hələ ehtiyac yoxdursa**, `@capacitor-firebase/analytics` plugin-ini müvəqqəti olaraq deaktiv edə bilərik:

### Dəyişiklik 1: native.ts-də push registration-ı şərtli et

Hazırda Android üçün artıq şərt var, iOS üçün də Firebase yoxlama əlavə ediləcək.

### Dəyişiklik 2: Analytics-i optional et

Firebase konfiqurasiya edilməyibsə, analytics çağırışları sadəcə skip olunacaq (artıq belə işləyir web-də).

---

## Tam Addımlar (Firebase ilə)

| # | Addım | Harada |
|---|-------|--------|
| 1 | Firebase Console-da iOS app yarat | Firebase Console |
| 2 | Bundle ID: `com.atlasoon.anacan` daxil et | Firebase Console |
| 3 | `GoogleService-Info.plist` yüklə | Firebase Console |
| 4 | Faylı `ios/App/App/` qovluğuna əlavə et | Xcode |
| 5 | `AppDelegate.swift`-ə `FirebaseApp.configure()` əlavə et | Xcode |
| 6 | Podfile-a Firebase pods əlavə et | Terminal |
| 7 | `pod install` işlət | Terminal |
| 8 | Build və test et | Xcode |

---

## Qeyd

Bu dəyişikliklər **native iOS fayllarında** edilməlidir - Lovable-da yox. Çünki:
- `GoogleService-Info.plist` binary fayldır
- `AppDelegate.swift` native Swift kodudur
- `Podfile` CocoaPods konfiqurasiyasıdır

Bu fayllar `npx cap add ios` əmri ilə yaradılır və Xcode-da redaktə edilir.

