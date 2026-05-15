# Anacan – Yeni dəyişikliklər planı

Bu planda 6 ayrı dəyişiklik var. Hamısı bir-birindən asılı olmayan kiçik təkmilləşdirmələrdir.

---

## 1) Anacan.AI tonu və scroll problemi

**Problem 1 — Ton:** AI bəzən "Ay [ad]", "əziz ana", "rəfiqənizəm" kimi qeyri-formal müraciətlər istifadə edir. Daha peşəkar olmalıdır.

**Problem 2 — Scroll:** Yeni mesaj yazılanda ekran "ən başa" sıçrayır. Səbəb: `AIChatScreen.tsx`-da `motion.div` üçün `transition={{ delay: index * 0.05 }}` hər mesaj üçün təxir verir, və yeni mesaj əlavə olunanda bütün mesajlar yenidən aşağıdan-yuxarı animasiya ilə render olunur — bu vizual "yuxarıya qaçma" hissi yaradır.

**Düzəliş:**
- `supabase/functions/dr-anacan-chat/prompts.ts` — system prompt-da "Ay", "əziz ana", "canım", "rəfiqə" kimi söz/müraciətləri qadağan et; "siz" formasında, peşəkar tonda cavab vermək tələbi əlavə et.
- `src/components/AIChatScreen.tsx`:
  - Welcome mesajlarından "əziz ana", "sağlamlıq rəfiqənizəm", "AI rəfiqənizəm" sözlərini çıxart, neytral peşəkar formaya gətir.
  - `motion.div`-dən `transition={{ delay: index * 0.05 }}` çıxar — sadəcə qısa fade-in qalsın.
  - Eyni dəyişikliyi `PartnerAIChatScreen.tsx`-də də et.

---

## 2) Bütün alətləri Premium et

**Problem:** Hazırda yalnız bəzi alətlər premiumdur. Sizin istəyiniz: **Alətlər bölməsindəki bütün alətlər premium** olsun, premium olmayanlar istifadə edə bilməsinlər və hər yerdə (ana ekran, dashboard widget, daxili giriş nöqtələri) premium nişanı görünsün.

**Düzəliş:**
- `tool_configs` cədvəlində bütün alətləri tək migrasiya ilə `is_premium = true` et.
- `useDynamicTools` hook-u onsuz da `is_premium` oxuyur; `ToolsScreen` və alət kartları üçün premium kilid göstərir — kodda əlavə dəyişiklik tələb olunmur, sadəcə DB yenilənməsi.
- Əgər hansısa alət `useDynamicTools`-dan kənar (sabit/hardcoded) açılırsa, onu da `usePremiumGate` (və ya mövcud `useSubscription`) yoxlaması ilə qoru.

---

## 3) Partnyor profili onboarding görməməlidir

**Problem:** `life_stage = 'partner'` olan istifadəçi standart bump/mommy/flow onboarding-lərini görür.

**Düzəliş:**
- `OnboardingScreen` (və ya əsas onboarding router) içində `lifeStage === 'partner'` olduqda **hər hansı onboarding addımı göstərmədən** birbaşa partnyor ana ekranına yönləndir.
- Partnyor üçün ayrı tip onboarding əgər varsa, onu da skip et — partnyor heç bir onboarding görməməlidir.

---

## 4) Cəmiyyət iconu üzərində oxunmamış post sayı (qırmızı badge)

**Problem:** Yeni cəmiyyət postları gəldikdə bottom-nav-dakı "Cəmiyyət" iconunda heç bir göstərici yoxdur.

**Düzəliş:**
- Yeni hook: `useUnreadCommunityPosts` — istifadəçinin son `community_posts.last_seen_at` (yeni `user_preferences` sütunu) tarixindən sonra yaradılmış postların sayını qaytarır.
- Migrasiya: `user_preferences` cədvəlinə `community_last_seen_at timestamptz` sütunu əlavə et.
- `BottomNav.tsx`-da Cəmiyyət iconunun üst sağında qırmızı yuvarlaq badge (sayla) göstər; say > 99 olarsa "99+".
- İstifadəçi Cəmiyyət ekranını açanda `community_last_seen_at` indi vaxtına yenilənir → say sıfırlanır.

---

## 5) Cəmiyyətdə "Qruplar" tab-ını müvəqqəti gizlət

**Düzəliş:**
- `CommunityScreen.tsx`-da Qruplar tab/section-ını gizlət (silmə, sadəcə şərt ilə render etmə — `const SHOW_GROUPS = false;` flag).
- Default açılış tab-ı "Feed" olsun.
- `GroupsList`, `GroupFeed` faylları silinmir — gələcəkdə flag ilə açıla bilər.

---

## 6) Dashboard – "İnkişaf mərhələləri" və "Bugünkü Xülasə" widget yerlərini dəyişmək

**Problem:** Hazırda `Dashboard.tsx`-da əvvəlcə "İnkişaf mərhələləri" (sətr ~1634), sonra "Today's Summary" (sətr ~1718) gəlir. Sizin istəyiniz: yerlər dəyişdirilsin — əvvəlcə Xülasə, sonra İnkişaf mərhələləri.

**Düzəliş:**
- `Dashboard.tsx`-da iki bloku yerini dəyişdir (Today's Summary blokunu Milestones-dən yuxarı çək).

---

## Texniki qeydlər

- Migrasiyalar (DB):
  1. `UPDATE tool_configs SET is_premium = true;`
  2. `ALTER TABLE user_preferences ADD COLUMN community_last_seen_at timestamptz;`
- Edge function `dr-anacan-chat` avtomatik yenidən deploy olunur.
- Yoxlama: APK/preview-də (a) AI welcome mesajı, (b) yeni mesaj scroll davranışı, (c) alətlərin kilidli görünüşü, (d) Cəmiyyət badge-i, (e) Dashboard widget sırası.
