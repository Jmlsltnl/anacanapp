
## Anacan Platform — Tam Audit Hesabatı (bug-lar, problemlər, işləməyən funksiyalar)

Aşağıda kod, verilənlər bazası, edge funksiyaları və native konfiqurasiya üzərində apardığım analiz nəticəsində aşkarladığım **bütün real problemlər kateqoriyalar üzrə** sıralanıb. Hər bənddə nə ilə bağlı olduğu, riski və harada yerləşdiyi göstərilib.

---

### A. KRİTİK — istifadəçi axınını birbaşa pozur

1. **523 profildən 157-sində push token YOXDUR (~30%)** — bu istifadəçilər heç bir push (statik/dinamik) ala bilmir. Səbəbi: köhnə `useDeviceToken` delete-then-insert məntiqi (artıq düzəldilib) və iOS-da entitlements yoxluğu store build-lərində.
2. **523 profildən 90-da `user_preferences` yoxdur (~17%)** — bu istifadəçilər üçün `daily_push_enabled`, `silent_hours`, `push_enabled` default qəbul edilir. Onboarding zamanı `user_preferences` row yaradılmır → yeni qoşulan istifadəçilər notifikasiya seçimlərini açıb-bağlaya bilmir.
3. **11 profildə `life_stage` boş, 1 bump istifadəçinin `last_period_date`-i yoxdur, 2 mommy istifadəçinin uşağı yoxdur** — bu istifadəçilər üçün Dashboard hesablamaları (hamiləlik həftəsi, körpə yaşı) NaN/səhv göstərilir, dinamik push gəlmir.
4. **Bugün `notification_send_log`-da 366 qeyd var** — manual test çağırışları və köhnə cron işləri dedup blokajı yaradır; sabahkı cron eyni `source_id` üçün təkrar göndərə bilmir, hətta migration ilə təmizlənsə də gələcəkdə yenidən yığılacaq (dedup açarına tarix əlavə edilməsə).
5. **iOS store build-də `aps-environment` entitlement yox idi** — yeni əlavə edildi, amma user **Xcode-də Push Notifications capability-sini əl ilə qoşmalıdır**, əks halda yeni build-də də iOS push işləməyəcək.
6. **Android `POST_NOTIFICATIONS` icazəsi əlavə edildi**, amma istifadəçilərin əksəri köhnə build-də olduğu üçün Android 13+ cihazlarda banner görünmür — yeni build məcburidir.

### B. YÜKSƏK RİSK — gizli bug-lar

7. **111 yerdə `.single()` istifadəsi** — `.single()` 0 və ya 2+ row-da error atır (PGRST116). Bir çox hooks (məs: `useUserPreferences`, `useChildren`, `useProfile`) bu xətanı `.maybeSingle()` ilə əvəzləməli — əks halda yeni istifadəçilərdə "fetch failed" xətası yaranır.
8. **174 yerdə `as any` və `@ts-ignore` istifadəsi** — TypeScript tipləri keçir, amma runtime-da `undefined` propertilərə müraciət crash yaradır. Ən təhlükəlilər: `useAdminMentalHealth`, `useAdminOnboarding`, `useBabyDailyInfo`, `useAppSettings` (dinamik insert/update zamanı schema mismatch).
9. **`dr-anacan-chat` edge function** — `lifeStage` default `"bump"` götürülür əgər göndərilməsə. Flow/mommy istifadəçilərinin context-i `bump` kimi qiymətləndirilərsə cavablar yanlış olur. `usePartnerConfig` və ya `AIChatScreen`-də life_stage göndərilməyəndə bu bug aktivləşir.
10. **Streaming AI cavabları** — `dr-anacan-chat` Gemini SSE-ni OpenAI formatına çevirir, lakin `[DONE]` markeri `done=true` halında göndərilir; əgər şəbəkə kəsilsə (`reader.read()` exception) `[DONE]` heç vaxt göndərilmir → frontend "yazılır..." statusunda ilişib qalır (köhnə "cavab yarımçıq" şikayətinin kökü).
11. **`PushDiagnosticsCard`**-da admin "send to me" düyməsi user-ə bütün eligibility yoxlamalarından keçirir; admin `life_stage` `bump`/`mommy` deyilsə, heç nə göndərmir — admin bunu "işləmir" zənn edir.
12. **`crash_reports` cədvəlində 0 qeyd** — bu o deməkdir ki, store build (v7) crash reporter-i hələ deploy olunmayıb (yeni build lazımdır), və ya `INSERT` üçün anonymous role icazə verilməyib. RLS yoxlanmalıdır.

### C. DATABASE & TƏHLÜKƏSİZLİK

13. **Linter: 2 RLS policy `USING (true)` və ya `WITH CHECK (true)` ilə** — UPDATE/DELETE/INSERT-də hər kəsə açıq. Hansı cədvəllər olduğunu yoxlamaq və sərtləşdirmək lazımdır.
14. **4 public storage bucket "list" icazəsi açıqdır** (`baby-photos`, `chat-media`, `community-media`, `pregnancy-album` və/və ya `baby-album`) — istənilən şəxs URL bilmədən bütün faylları siyahılaya bilər. Şəxsi körpə şəkilləri risk altındadır.
15. **Leaked Password Protection söndürülüb** — istifadəçilər məşhur sızdırılmış parollardan istifadə edə bilir.
16. **`handle_new_user` trigger-i exception-ları udur** (`RETURN NEW`) — profile yaradılmasa belə user signup uğurlu sayılır; sonra user app-a girir, profile yoxdur, hər səhifə crash verir.
17. **Storage cleanup yoxdur** — silinmiş album/post-ların şəkilləri storage-da qalır (köhnə memory-də qeyd var, amma kod tam tətbiq edilməyib).

### D. LOCALIZATION (i18n)

18. **453 hardcoded AZ string `placeholder=` və `toast()`-larda** (`src/components/` daxilində) — `useTranslation()` istifadə edilmir. App tam tərcümə üçün hazırlanan Excel faylındakı 3,477 string-in əksəri komponentlərə bağlanmayıb. **i18n infrastrukturu var, amma 90%-i bağlanmayıb** — istifadəçi dili dəyişəndə yalnız bəzi yerlər tərcümə olunur.
19. **`useTranslation` fallback** — açar tapılmasa, açarın özünü göstərir (məs: `dashboard_welcome_back`) → "abracadabra" effekti.

### E. NATIVE & MOBİL

20. **`assetlinks.json`-da `YOUR_SHA256_FINGERPRINT` placeholder qalıb** — Android App Links işləmir, deeplinks brauzerdə açılır, app-da yox.
21. **`androidPushAutoRegister`** flag default `false`-dur — yalnız `VITE_ANDROID_PUSH_AUTO_REGISTER=true` ilə build edilməyibsə, Android-də bəzi cihazlarda push auto-register olunmur.
22. **iOS `App.entitlements`** indi yaradılıb, lakin Xcode project file-ə bağlanmayıb (`CODE_SIGN_ENTITLEMENTS` build setting yoxdur) — sadəcə fayl yaratmaq kifayət deyil.

### F. EDGE FUNCTIONS

23. **`send-vitamin-reminders`** hər dəqiqə (cron) işləyir, hər dəfə "No vitamin reminders to send" çıxır → boş yerə compute xərci. Ya cron interval-ı 5 dəqiqəyə qaldırılmalı, ya da reminder-lər varsa erkən exit edilməli.
24. **`send-bulk-push`, `send-flow-reminders`, `send-push-notification`** — bu funksiyalarda hələ də delete-on-error məntiqi tam audit edilməyib (yalnız əsas `send-daily-notifications` təmizləndi).
25. **`generate-baby-photo`, `generate-fairy-tale`, `analyze-cry`, `analyze-poop`, `analyze-horoscope`** — hamısı eyni Gemini fallback məntiqindən istifadə edir, amma timeout və retry strategiyası yoxdur. Gemini 503 verəndə user-ə yalnız 500 qaytarılır.
26. **`epoint-payment` callback URL** — istehsalat domeninə bağlı; preview-də ödəniş test edilə bilməz.
27. **`apple-auth-notifications`** funksiyası mövcuddur, amma sosial login deaktiv olduğu üçün istifadə olunmur (ölü kod).

### G. UX & UI

28. **351 yerdə `console.error`** — istehsalatda görünür, performansa təsir edir, və crash reporter-ə yönləndirilməyib.
29. **`Dashboard.tsx`-də 818, 843, 855 sətirlərində ardıcıl 3 `useEffect`** — dependency-lər səhv qurulsa, "infinite loop" və ya dublikat fetch-lər yaradır.
30. **`AIChatScreen.tsx`** — empty `catch { /* ignore */ }` blokları var; xəta baş verir, amma user heç nə görmür → "AI cavab vermir" şikayətinin başqa bir səbəbi.
31. **`AppIntroduction.tsx`**-də empty `catch (e) {}` — Haptics xətası udulur, amma user üçün vacib deyil; struktur yaxşıdır.
32. **`ProfileScreen` placeholder `ANACAN-XXXX`** — istifadəçi öz partner kodunu görmədən düz placeholder görür (profile fetch edilməyibsə).
33. **`AuthScreen`-də xüsusi simvol input bug-u** — köhnə memory-də qeyd olunub, useRef ilə həll edilib, amma yenə də bəzi Android keyboard-larda IME çakışmaları ola bilər.

### H. ANALYTİKA & MONITORING

34. **Firebase Analytics web-də konfiqurasiya edilməyib** — console-da "Firebase Analytics not configured" warning-i hər səhifə yüklənməsində 5+ dəfə çıxır. `setUserId`, `setUserProperties`, `logScreenView` boş işə düşür.
35. **`analytics_events` cədvəlinə insert var, amma admin paneldə görünüş yoxdur** — analitika toplanır, lakin görüntülənmir.
36. **Mixpanel EU integration** — memory-də qeyd olunub, amma kod-da bağlandığı yer yoxdur (yalnız Firebase warning-ləri görünür).

### I. KÖHNƏ / DEAD CODE

37. **`apple-auth-notifications`** edge function — istifadə edilmir.
38. **`useDr...` adlandırma** — `dr-anacan-chat` funksiyasının adı hələ də "dr"-dır, amma persona "Anacan.AI"-yə dəyişib (memory). Migration tələb olunur.
39. **`MotherChatScreen.tsx`** — `MessagesScreen.tsx` ilə dublikat görünür (unified messaging memory ilə ziddiyyət).

---

### Tövsiyə olunan prioritet sıralaması

**Birinci dalğa (bu həftə):**
- A1, A4, A5, A6 (push axını tam bərpası — yeni native build-lər)
- B7 (`.single()` → `.maybeSingle()` toplu refaktor)
- C13, C14, C15 (RLS və storage təhlükəsizliyi)

**İkinci dalğa:**
- B9, B10, G30 (AI chat tam stabilizasiyası)
- D18 (i18n bağlama — komponent-bə-komponent)
- E20 (Android App Links SHA256)

**Üçüncü dalğa:**
- F23 (cron tezliyi optimallaşdırması)
- H34 (Firebase Analytics konfiqurasiyası və ya silinməsi)
- I37, I38, I39 (dead code təmizliyi)

---

### Sonrakı addım

Hansı kateqoriyadan başlamaq istəyirsən? Hamısını eyni anda etmək böyük dəyişikliklər tələb edir; məsləhətim **A + B7 + C** ilə başlamaqdır (təhlükəsizlik və axın stabilliyi). Təsdiqlədikdən sonra konkret həll planı təqdim edəcəm.
