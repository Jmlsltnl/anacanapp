

# Plan: Multiple UI/UX Fixes and Features

This plan addresses 9 distinct issues across the application.

---

## 1. Horoscope Calendar Not Fully Visible

**Problem**: The `DatePickerWheel` calendar modal renders day cells at fixed `w-10 h-10` which can overflow on smaller screens or within the horoscope's constrained layout.

**Fix**: Change day cells from fixed `w-10 h-10` to responsive `w-full aspect-square` within the 7-column grid, ensuring the calendar adapts to container width. The modal container (`inset-x-4 max-w-sm`) should be sufficient but the inner grid cells need to be flexible.

**Files**: `src/components/ui/date-picker-wheel.tsx`

---

## 2. Weather Analysis Accuracy

**Problem**: The edge function uses Open-Meteo API which can differ from Apple Weather (which uses proprietary data sources). The real weather values (temperature, feels_like, wind) are passed correctly from Open-Meteo but the AI (Gemini) regenerates them in JSON output, potentially returning different numbers than the actual API data.

**Fix**: After parsing Gemini's JSON response, overwrite the numeric weather fields (`temperature`, `feelsLike`, `humidity`, `windSpeed`, `uvIndex`) with the actual Open-Meteo values instead of trusting Gemini's output. This ensures displayed weather data matches the real API data.

**Files**: `supabase/functions/weather-clothing/index.ts`

---

## 3. First Aid (Həyat Qurtaran SOS) - More Compact Layout

**Problem**: Scenario cards use large `w-16 h-16` icons, `text-lg` titles, generous padding, and large step icons (`w-28 h-28`).

**Fix**: Reduce icon sizes (`w-12 h-12`), title fonts (`text-base`), padding (`p-3`), and step display icon (`w-20 h-20`). Make the overall layout more compact while keeping readability.

**Files**: `src/components/tools/FirstAidGuide.tsx`

---

## 4. White Noise Persistent Playback Across Pages

**Problem**: When navigating away from WhiteNoise, the audio stops because the component unmounts and the `AudioContext`/`AudioBufferSourceNode` are destroyed.

**Fix**:
- Create a global `whiteNoiseStore` (zustand, persisted) that manages a singleton `AudioContext` and active sound state at app level
- Move audio playback logic (AudioContext, gain node, source node) into a global service/store that persists across navigation
- Add WhiteNoise to the `FloatingTimerWidget` — when a white-noise timer is active, show a minimal floating widget with play/pause and stop controls
- When user clicks the floating widget, navigate back to WhiteNoise screen

**Files**: 
- `src/store/whiteNoiseStore.ts` (new)
- `src/components/tools/WhiteNoise.tsx` (refactor to use store)
- `src/components/FloatingTimerWidget.tsx` (add white-noise playback controls)
- `src/App.tsx` or root layout (mount audio engine globally)

---

## 5. Pregnancy Album in Main Section + Baby Monthly Album + Physical Album Orders

**Problem**: Pregnancy Album only accessible from tools. Need: (a) accessible from main dashboard, (b) baby monthly photo album for post-birth, (c) "Order Physical Album" button in both, (d) admin management for album orders with same payment methods as cakes.

**Fix**:
- Add Pregnancy Album card/widget to Dashboard for `bump` users
- Create `BabyMonthlyAlbum` component for `mommy` users (upload monthly photos, months 1-12+)
- Add "Fiziki Albom Sifariş Et" button to both album screens
- Create `album_orders` DB table with same structure as cake orders
- Create admin section `AdminAlbumOrders` for managing orders
- Reuse cake payment methods for album orders

**Files**:
- `src/components/Dashboard.tsx` (add album widget)
- `src/components/baby/BabyMonthlyAlbum.tsx` (new)
- `src/components/tools/PregnancyAlbum.tsx` (add order button)
- `src/components/shop/AlbumOrderScreen.tsx` (new)
- `src/components/admin/AdminAlbumOrders.tsx` (new)
- `src/components/admin/AdminLayout.tsx`, `AdminPanel.tsx` (add menu item)
- DB migration: `album_orders` table + RLS

---

## 6. Shop Screen - More Compact + Fix Back Button

**Problem**: Header back arrow overlaps iOS safe area. Layout has generous spacing.

**Fix**: Add `safe-area-top` padding to the shop header, reduce font sizes (`text-xl` instead of `text-2xl`), reduce spacing (`mb-4` instead of `mb-6`), make product cards more compact.

**Files**: `src/components/ShopScreen.tsx`

---

## 7. Legal/Policy Pages - Compact Fonts + Replace "Atlasoon MMC"

**Problem**: Policy pages need smaller fonts. "Atlasoon MMC" text exists in database content.

**Fix**:
- In `LegalScreen.tsx`, add `text-sm` or `prose-xs` to the document content area
- For "Atlasoon MMC" → "Anacan MMC": This text is in the database `legal_documents` table content. Will need a data UPDATE query to replace all occurrences.

**Files**: 
- `src/components/LegalScreen.tsx`
- DB data update: `UPDATE legal_documents SET content = REPLACE(content, 'Atlasoon MMC', 'Anacan MMC'), content_az = REPLACE(content_az, 'Atlasoon MMC', 'Anacan MMC')`

---

## 8. AI Chat - Input Area Below Footer Fix

**Problem**: The AI chat input area uses `height: calc(100dvh - 80px)` which may not account for the bottom navigation bar correctly, causing the input to be hidden.

**Fix**: Adjust the height calculation to properly account for bottom nav + safe area. Use `pb-safe` and ensure the input area has proper `sticky bottom-0` positioning with z-index above the bottom nav, or adjust the container height to exclude the bottom nav.

**Files**: `src/components/AIChatScreen.tsx`

---

## 9. "Atlasoon MMC" → "Anacan MMC" in Code

**Problem**: Only found in `src/lib/iap.ts` as app ID references (com.atlasoon.anacan) — these are package IDs and shouldn't be changed. The "Atlasoon MMC" company name text is in the database legal documents.

**Fix**: Database UPDATE to replace company name in legal documents content.

---

## Implementation Order

1. Quick UI fixes (calendar, first aid, shop, legal, AI chat) — parallel
2. Weather accuracy fix (edge function)  
3. White noise persistence (most complex, new store + refactor)
4. Album features + ordering system (DB + multiple new components)
5. Database content update for company name

## Estimated Scope
- ~12 files modified/created
- 1 DB migration (album_orders table)
- 1 DB data update (legal documents)
- 1 edge function update

