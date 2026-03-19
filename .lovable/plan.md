

# Cəmiyyət Səhifəsinin Tam Yenidən Dizaynı

## Məqsəd
Cəmiyyət bölməsini sıfırdan premium, müasir UI/UX ilə yenidən hazırlamaq — Instagram/Threads/Flo-dan ilham alaraq.

## Dəyişiklik Ediləcək Fayllar

### 1. `CommunityScreen.tsx` — Ana Ekran
- **Header**: Daha minimal, başlıq + subtitle arasında daha yaxşı kontrast. Glassmorphism `backdrop-blur-3xl` ilə.
- **Axtarış**: Pill-formasında (`rounded-2xl`), ikon animasiyalı, focus zamanı genişlənən effekt.
- **Tablar**: Underline-style tab indikatoru (pill əvəzinə). `layoutId` ilə animasiyalı alt xətt. Daha minimalist görünüş.
- **FAB düyməsi**: Gradient glow effekti ilə, `shadow-[0_8px_32px]` kölgə. Kiçik label əlavəsi ("Paylaş").
- **Stories hissəsi**: Header-ə inteqrasiya olunmuş, ayrıca separator olmadan.

### 2. `PostCard.tsx` — Post Kartları
- **Kart dizaynı**: `shadow-[0_1px_3px_rgba(0,0,0,0.04)]` yumşaq kölgə, `rounded-2xl`, hover zamanı subtle lift.
- **Avatar**: `w-10 h-10`, online indikatoru (yaşıl nöqtə).
- **Ad + vaxt**: Bir sətirdə, aralarında `·` separator.
- **Mətn**: `text-[13px] leading-[1.7]`, daha oxunaqlı.
- **Media**: `rounded-2xl` ilə, kart kənarlarına qədər uzanan (edge-to-edge within card).
- **Aksiya sırası**: Like (say ilə birlikdə), Comment (say ilə), Share — Instagram stilində. İkon + say yanyana.
- **Like animasiyası**: Double-tap to like + heart burst effekti.
- **Şərhlər bölməsi**: Daha təmiz separator, avatar + bubble stil şərhlər.

### 3. `StoriesBar.tsx` — Hekayələr
- **Ölçü**: `w-[62px] h-[62px]` dairəvi (`rounded-full`) — Instagram-a daha yaxın.
- **Gradient ring**: Baxılmamış olanlar üçün canlı gradient, baxılmışlar üçün `border-2 border-muted/30`.
- **Ad**: `text-[10px]` ilə aşağıda, bir sətir.
- **"Əlavə et" düyməsi**: Mavi gradient `+` ikonu ilə.

### 4. `GroupsList.tsx` — Qruplar
- **Kart formatı**: Horizontal kart, sol tərəfdə böyük emoji (`w-12 h-12`), sağda info + aksiya.
- **Üzv sayı**: Avatar stack (3 kiçik avatar üst-üstə) + say.
- **Qoşul düyməsi**: Daha cəlbedici, `rounded-full` pill forması.
- **Kateqoriya başlıqları**: Sol xətt ilə (left border accent), daha vizual.

### 5. `PostSearchFilter.tsx` — Sort Düymələri
- **Stil**: Underline-style tabs (pill əvəzinə), daha minimalist.

### 6. `CommentReply.tsx` — Şərhlər
- **Bubble dizaynı**: Daha yumşaq `bg-muted/12`, `rounded-2xl`.
- **Thread xətti**: Sol tərəfdə vertikal bağlantı xətti (reply thread line).
- **Aksiyalar**: Daha kompakt, `text-[9px]`.

### 7. `GroupFeed.tsx` — Qrup Feed
- **Header**: Blur header, qrupun böyük emoji + üzv sayı.
- **Empty state**: Lottie-style illustration (CSS ilə), daha cəlbedici.

### 8. `CreatePostModal.tsx` — Yeni Post
- **Bottom sheet formatı**: Dialog əvəzinə aşağıdan sürüşən panel (mövcud cihaz ölçüsünə uyğun).
- **Textarea**: Daha böyük, placeholder ilə.
- **Media düymələri**: Dairəvi ikonlar sırası.
- **Anonim toggle**: Daha kompakt switch.

### 9. `GroupPresenceBar.tsx` — Online İstifadəçilər
- **Daha kompakt**: Avatarlar kiçik, typing indikatoru inline.

## Texniki Qeydlər
- Bütün `framer-motion` animasiyaları saxlanılır, spring konfiqurasiyaları təkmilləşdirilir.
- Mövcud hook-lar və data axını dəyişməz qalır — yalnız vizual layer yenilənir.
- Tailwind utility klassları ilə, əlavə CSS lazım deyil.
- 390px viewport-a (mobil) optimallaşdırılmış.
- Dark/light mode uyğunluğu qorunur.

