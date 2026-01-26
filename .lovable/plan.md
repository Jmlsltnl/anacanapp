
# Tam Ekran Native Tətbiq Planı

## Problem Analizi
Hazırda yuxarı və aşağı zonalarda narıncı boşluq görünür çünki:
1. `capacitor.config.json`-da `backgroundColor: "#F97316"` təyin olunub
2. `contentInset: "always"` WebView-a əlavə padding əlavə edir
3. CSS-də `paddingTop/paddingBottom` safe-area ilə ikiqat padding yaranır

## Həll Yolu

### 1. Capacitor Konfiqurasiyası
`contentInset: "never"` təyin etmək - WebView-un özünün safe-area padding əlavə etməsini dayandıracaq. Sonra CSS ilə özümüz idarə edəcik. `backgroundColor`-u səhifə fonuna uyğun `#faf7f4` (beige) etmək.

### 2. Ana Layout Strukturu
`Index.tsx`-da:
- Əsas konteynerə `fixed inset-0` tətbiq etmək (tam ekran)
- Safe-area padding-i silmək ana konteynerdən
- Header zonası üçün ayrıca div yaratmaq (status bar rəngi üçün)
- Footer zonası üçün BottomNav-a safe-area padding əlavə etmək

### 3. Yeni Layout Strukturu
```text
┌─────────────────────────────┐
│ Status Bar Arxa Planı      │ ← bg-card rəngi (header fonu)
│ (safe-area-inset-top)      │
├─────────────────────────────┤
│                             │
│     Scrollable Content      │ ← flex-1 overflow-y-auto
│                             │
├─────────────────────────────┤
│ Bottom Navigation           │ ← bg-card rəngi
│ (safe-area-inset-bottom)   │
└─────────────────────────────┘
```

### 4. BottomNav Dəyişiklikləri
- `pb-[env(safe-area-inset-bottom)]` əlavə etmək ki, home indicator zonası nav fonu ilə dolsun.

### 5. Digər Səhifələr
AuthScreen, SplashScreen, AppIntroduction və digər tam-ekran səhifələr üçün yoxlamaq və lazım olsa düzəltmək ki, onlar da eyni prinsipi izləsin.

---

## Texniki Dəyişikliklər

### capacitor.config.json
- `contentInset`: `"always"` → `"never"`
- `backgroundColor`: `"#F97316"` → `"#faf7f4"` (beige - səhifə fonu)

### src/pages/Index.tsx
Əsas return blokunu yenidən strukturlaşdırmaq:
```tsx
<div className="fixed inset-0 flex flex-col bg-background overflow-hidden">
  {/* Yuxarı safe-area (card fonu ilə) */}
  <div 
    className="bg-card flex-shrink-0" 
    style={{ height: 'env(safe-area-inset-top)' }} 
  />
  
  {/* Əsas scrollable məzmun */}
  <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-none">
    <AnimatePresence mode="wait">
      {renderContent()}
    </AnimatePresence>
  </div>
  
  {/* Bottom nav (safe-area daxil) */}
  <BottomNav ... />
</div>
```

### src/components/BottomNav.tsx
- Nav konteynerinə `pb-[env(safe-area-inset-bottom)]` əlavə etmək

### src/index.css
- `html` və `body`-ə `position: fixed` və `inset: 0` əlavə etmək
- `#root`-u da eyni şəkildə nizamlamaq

### index.html
- Body background rəngini `#faf7f4` saxlamaq (artıq var)

### Digər səhifələr
AuthScreen, SplashScreen, AppIntroduction-da safe-area idarəetməsini yoxlamaq.

---

## Nəticə
Bu dəyişikliklərdən sonra:
- Status bar zonası header/content fonu ilə dolacaq
- Home indicator zonası navigation fonu ilə dolacaq
- Heç bir "artıq" narıncı rəng görünməyəcək
- Tətbiq tam ekran native tətbiq kimi görünəcək

Build etdikdən sonra `npx cap sync ios && npx cap sync android` çalışdırmaq lazımdır.
