

## Reverse Trial Funnel — Yenilənmiş Plan

Onboarding bitdikdən sonra, Dashboard-dan əvvəl göstəriləcək psixoloji əsaslı satış qıfı. Yalnız dev/web-də aktiv (native-də skip). Partnyor xaric hər üç mərhələ (flow, bump, mommy) üçün fərdi məzmun.

---

### Əsas Prinsip: Bildiyimizi Soruşmuruq

Store-da artıq olan məlumatlar (hamiləlik həftəsi, tsikl uzunluğu, körpə yaşı, ad, cins) **birbaşa əks olunur** — sual kimi soruşulmur. Quiz yalnız **emosional/psixoloji** suallardan ibarətdir.

---

### Axın (9 addım)

**Mərhələ 1: Emosional Bağ (Quiz)**

3-4 psixoloji sual, hər biri `lifeStage`-ə uyğun:

**bump:**
- "Hamiləliyiniz haqqında ən çox nə narahat edir?" → Doğuş qorxusu / Körpənin sağlamlığı / Bədən dəyişiklikləri / Maddi məsələlər
- "Gecələr yuxunuz necədir?" → Rahat yatıram / Tez-tez oyanıram / Demək olar yata bilmirəm
- "Ətrafınızdan kifayət qədər dəstək alırsınız?" → Bəli, çox / Qismən / Demək olar heç
- "Gündəlik stres səviyyəniz necədir?" → Aşağı / Orta / Yüksək / Çox yüksək

**mommy:**
- "Analıqda ən çox hansı mövzu sizi yorur?" → Yuxusuzluq / Tənhalıq hissi / Körpənin qidalanması / Öz vaxtımın olmaması
- "Doğuşdan sonra özünüzü emosional olaraq necə hiss edirsiniz?" → Güclü və xoşbəxt / Bəzən çətin / Çox çətin günlərim olur
- "Körpənizin inkişafı haqqında narahatlıqlarınız var?" → Xeyr, hər şey yaxşıdır / Bəzi suallarım var / Ciddi narahatlıqlarım var

**flow:**
- "Menstruasiya dövründə ən çox nə sizi narahat edir?" → Fiziki ağrılar / Əhval dəyişiklikləri / Qeyri-müntəzəmlik / Heç biri
- "Reproduktiv sağlamlığınızla bağlı məlumatlılıq səviyyəniz?" → Çox bilirəm / Orta / Az bilirəm
- "Tsiklinizi düzgün izləmək sizin üçün nə qədər vacibdir?" → Çox vacib / Orta / O qədər də yox

---

**Mərhələ 2: Analiz Animasiyası (3-4 saniyə)**

Fake loading: "Məlumatlarınız analiz edilir..." ilə fırlanan animasiya. Store-dan gələn real data (ad, həftə/yaş) birbaşa göstərilir:
- bump: "{Ad}, {X}-ci həftə, {trimester}-ci trimester"
- mommy: "{Ad}, {körpə adı} — {X} aylıq"  
- flow: "{Ad}, tsikl: {X} gün"

CSS keyframe animasiyası: progress 0% → 30% → 80% → 100%, sonra avtomatik keçid.

---

**Mərhələ 3: Fərdi Nəticələr (Diaqnoz)**

Quiz cavablarına əsasən **real statistika ilə diaqnoz**:

Nümunə (bump, "Yuxusuzluq" + "Yüksək stres" seçilib):
> "{Ad}, {X}-ci həftədə olan hamilə qadınların 78%-i yuxu problemləri yaşayır. Stress səviyyəniz yüksəkdir — bu, 3-cü trimestrdə çox yayılmış haldır. Siz tək deyilsiniz."

Hər simptom/cavab kombinasiyası üçün əvvəlcədən hazırlanmış 2-3 cümlə. Barnum effekti ilə empati yaradır.

---

**Mərhələ 4: Tətbiq Necə Kömək Edir**

Quiz-dən gələn "ağrı nöqtələri"nə 1:1 həll mapping-i. Hər həll real app funksiyasıdır:

| Ağrı nöqtəsi | Premium Həll | tool_id |
|---|---|---|
| Yuxusuzluq | Yuxu Səsləri + Ağ Küy | white-noise |
| Stres/Narahatlıq | 24/7 Anacan.AI Asistan | ai-chat |
| Bədən dəyişiklikləri | Çəki İzləyicisi | weight-tracker |
| Doğuş qorxusu | Xəstəxana Çantası + Həkim Hesabatı | hospital-bag |
| Qidalanma | Vitamin İzləyicisi + Qidalanma | vitamin-tracker |
| Körpə inkişafı | İnkişaf İzləyicisi | baby-growth |
| Tənhalıq | Ana Cəmiyyəti + Partnyor Bağlantısı | community |
| Əhval dəyişikliyi | Əhval Gündəliyi + Mental Sağlamlıq | mood-diary |
| Qeyri-müntəzəm tsikl | Period Təqvimi + Tsikl Analizi | flow-calendar |

Hər kart: emoji + gradient + 1 cümlə izah. `is_premium` olan funksiyalar Crown icon ilə işarələnir.

---

**Mərhələ 5: Rəylər (Sosial Sübut)**

`lifeStage`-ə uyğun hardcoded rəylər (3 ədəd, karusel):

bump: "27 həftədə başladım, Anacan sayəsində hamiləliyimi stressiz keçirdim" — Günel, 32 həftə ★★★★★
mommy: "Körpəmin yuxu cədvəlini izləmək həyatımı dəyişdi" — Aytən, 4 aylıq ana ★★★★★
flow: "Tsiklimi izləməyə başlayandan bəri bədənimi daha yaxşı tanıyıram" — Ləman ★★★★★

---

**Mərhələ 6: Funksiyalar Vitrin**

Tətbiqin 4 unikal xüsusiyyəti, phone-frame mockup stilində:
1. AI Fotosessiya — körpənizin professional fotolarını yaradın
2. Partnyor Hesabı — həyat yoldaşınızı bağlayın, birlikdə izləyin
3. 24/7 AI Asistan — istənilən sualınıza cavab
4. Həftəlik İnkişaf — körpənizin/hamiləliyin həftəlik hesabatı

Hər biri gradient kart + böyük emoji + 1 cümlə. Swipe karusel.

---

**Mərhələ 7: Fərdi Plan**

Store-dan ad + lifeStage data istifadə edərək vizual roadmap:

> "{Ad}, sizin üçün hazırladığımız plan:"

SVG/CSS xətt qrafiki: Sol (indi — stressli) → Sağ (6 ay sonra — rahat). 3 milestone nöqtəsi:
- Həftə 1: "Tsikl/hamiləlik izləməyə başla"
- Ay 1: "Stres səviyyəsini azalt"
- Ay 3: "Tam nəzarətdə ol"

Böyük CTA: "Planımı Əldə Et"

---

**Mərhələ 8: Paywall**

Mövcud `PremiumModal` məntiqini yenidən istifadə edir (`usePremiumConfig` + `usePaywallConfig`):
- İllik plan xüsusi çərçivədə ("Ən sərfəli")
- Aylıq plan standart
- "İstədiyin an ləğv et" zəmanət yazısı
- "3 gün pulsuz sına" (əgər `free_trial_enabled`)
- X düyməsinə basıldıqda → Mərhələ 9

---

**Mərhələ 9: Exit-Intent (Endirimli Paywall)**

Paywall-dan çıxmağa cəhd edəndə popup:
> "Gözləyin! Yalnız bu gün üçün — ilk 3 gün tamamilə pulsuz!"

FOMO elementi: "Bu təklif yalnız 1 dəfə göstərilir"
İki düymə:
- "Pulsuz Başla" → purchase flow
- "Xeyr, davam et" → `setFunnelCompleted(true)`, Dashboard-a keçid

---

### Texniki Detallar

**Yeni fayllar:**
- `src/components/funnel/ReverseTrialFunnel.tsx` — 9 addımlı wrapper, AnimatePresence
- `src/components/funnel/steps/QuizStep.tsx`
- `src/components/funnel/steps/AnalysisStep.tsx`
- `src/components/funnel/steps/ResultsStep.tsx`
- `src/components/funnel/steps/HowAppHelpsStep.tsx`
- `src/components/funnel/steps/ReviewsStep.tsx`
- `src/components/funnel/steps/FeaturesStep.tsx`
- `src/components/funnel/steps/CustomPlanStep.tsx`
- `src/components/funnel/steps/PaywallStep.tsx`
- `src/components/funnel/steps/DiscountedPaywallStep.tsx`
- `src/components/funnel/funnelData.ts` — quiz sualları, simptom→feature mapping, rəylər

**Store dəyişikliyi (`userStore.ts`):**
- `hasCompletedFunnel: boolean` (persist)
- `setFunnelCompleted(v: boolean)`

**Routing (`Index.tsx`):**
```text
if (isOnboarded && !hasCompletedFunnel && !isNative && role !== 'partner') {
  return <ReverseTrialFunnel onComplete={() => setFunnelCompleted(true)} />;
}
```

**Dizayn:** Coral Orange (#F28155), Warm Beige (#FAF7F4), framer-motion keçidləri, progress bar, safe-area padding, max-w-md mx-auto, mobile-first.

