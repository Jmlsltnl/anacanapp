
# Partnyor Endirim Sistemi — Plan

## Məqsəd
Anacan tətbiqində premium istifadəçilərə spa, idman zalı, pilates və s. partnyor məkanlarda özəl endirim. İstifadəçi tətbiqdə QR yaradır → məkan kamerada oxuyur → `partner.anacan.az/verify/...` açılır → təsdiq + PIN ilə redemption qeyd olunur.

---

## 1) Verilənlər bazası (yeni cədvəllər)

### `partner_venues` (əsas məkan kataloqu)
- `id`, `name`, `slug`, `category` (spa / gym / pilates / beauty / other)
- `description`, `logo_url`, `cover_url`, `gallery_urls[]`
- `address`, `city`, `district`, `latitude`, `longitude`, `phone`, `website`, `instagram`
- `working_hours` (jsonb)
- `discount_label` (məs. "20% endirim"), `discount_value`, `discount_terms`
- `redemption_cooldown_hours` (məkana özəl, məs. 24 / 168 / 720)
- `redemption_lifetime_limit` (nullable — ümumi limit, məs. 1)
- `qr_ttl_seconds` (default 300 — 5 dəq)
- `pin_hash` (partnyorun "Təsdiqlə" düyməsi üçün PIN — bcrypt)
- `is_active`, `is_featured`, `sort_order`, `created_at`, `updated_at`

### `partner_redemptions` (hər QR / istifadə)
- `id`, `venue_id`, `user_id`
- `token` (random, unique, indexed) — QR-da gedir
- `status`: `pending` | `verified` | `expired` | `cancelled`
- `created_at`, `expires_at`, `verified_at`, `verified_ip`
- `client_meta` (jsonb — UA və s.)

### `partner_venue_categories` (admin idarə edə bilsin)
- `id`, `key`, `label_az`, `icon`, `sort_order`, `is_active`

**RLS xülasəsi:**
- `partner_venues`: SELECT — authenticated (yalnız `is_active=true`); admin tam idarə.
- `partner_redemptions`: user yalnız öz `user_id`-sini görür/yaradır; admin hamısı; verify edge function service-role ilə update edir.
- GRANT-lar bütün cədvəllər üçün təlimata uyğun əlavə olunur.

---

## 2) Edge funksiyalar

### `partner-create-redemption` (POST, JWT validation)
- Input: `venue_id`
- Yoxlayır: istifadəçi **premium**, məkan aktiv, cooldown və lifetime limit keçilməyib.
- Yeni `partner_redemptions` sətri yaradır (`pending`, `expires_at = now + qr_ttl_seconds`).
- Cavab: `token`, `verify_url = https://app.anacan.az/p/v/<token>`, `expires_at`.

### `partner-verify-redemption` (POST, public)
- Input: `token`, `pin`
- Tokeni tapır, expired/already verified yoxlayır, PIN-i məkanın `pin_hash`-i ilə müqayisə edir.
- Uğurla: status=`verified`, `verified_at=now`, IP qeyd.
- Cavab: user adı (mask), premium status, endirim mətni, məkan adı.

### `partner-redemption-status` (GET, public)
- `token` üçün cari status — portal səhifəsi polling-siz ilkin yükləmə üçün.

Bütün funksiyalar `verify_jwt = false` (PIN flow public), `partner-create-redemption` istisna — orda JWT manual yoxlanılır.

---

## 3) İstifadəçi (mobil) tərəfi

**Yeni route:** `/partnyorlar` (tab "Kəşf et" və ya `tools` menyusunda).

Komponentlər:
- `PartnersScreen.tsx` — kateqoriya filterləri, axtarış, məkan kart grid.
- `PartnerVenueDetailScreen.tsx` — şəkillər, ünvan, xəritə linki, "Endirimi al" düyməsi.
- `RedemptionQRSheet.tsx` — Bottom sheet: böyük QR (qrcode.react), geri sayım taymeri, expire-də "Yenilə" düyməsi.
- Premium deyil → mövcud `PaywallSheet`-ə yönləndirilir.
- Hook: `usePartnerVenues`, `useCreateRedemption`.

---

## 4) Partnyor veb-portalı (`/p/v/:token`)

Yeni route — login tələb etmir, amma PIN tələb edir.

- `PartnerVerifyPage.tsx`:
  1. Tokenin statusunu çəkir.
  2. Əgər `pending` və müddəti bitməyib → məkan logosu + "PIN daxil edin" + "Təsdiqlə" düyməsi.
  3. PIN düz → tam ekran yaşıl: ✓ "Təsdiqləndi — Premium İstifadəçi — 20% endirim" + istifadəçi adı (mask: "Aysel M.") və saat.
  4. Səhv/expired → qırmızı ekran ilə səbəb.
- Mobile-first, böyük tipoqrafiya (kassir oxusun).
- Route `App.tsx`-də public marshrut kimi qeyd olunur.

---

## 5) Admin paneli

Yeni 2 tab `AdminPanel.tsx`-ə əlavə olunur:

### `AdminPartnerVenues.tsx`
- CRUD: ad, kateqoriya, ünvan, koordinatlar, şəkillər (storage upload), endirim mətni/dəyəri, terms, cooldown saatları, lifetime limit, QR TTL, PIN (yeniləmə zamanı bcrypt hash).
- Toggle: aktiv / featured.
- Excel/CSV ixrac yoxdur (gələcəkdə).

### `AdminPartnerRedemptions.tsx`
- Filter: məkan, status, tarix aralığı.
- Cədvəl: tarix, məkan, istifadəçi (ad+email), status, IP.
- KPI kartları: bu gün/həftə/ay verified sayı, məkan üzrə top-5.

### `AdminPartnerCategories.tsx` (kiçik — kateqoriya idarəsi)

`AdminPanel.tsx`-ə üç yeni `case` (partner-venues / partner-redemptions / partner-categories) və sidebar girişləri.

---

## 6) Premium gating & analitika
- `usePremium` hook ilə "Endirimi al" düyməsi qıfıllı göstərilir.
- `analytics.track('partner_redeem_initiated', { venue_id })` və `partner_redeem_verified` (verify edge funksiyada DB-də qeyd ki, frontend bilməsə də sayılsın).

---

## 7) Texniki detallar (geliştirici üçün)

- QR token: `crypto.randomUUID().replace(/-/g,'')` + `random_bytes(8)` → 40 simvol; cədvəldə unique index.
- PIN hash: `bcrypt` (deno-da `https://deno.land/x/bcrypt`).
- Cooldown yoxlaması: `SELECT max(verified_at) FROM partner_redemptions WHERE user_id=? AND venue_id=? AND status='verified'` → indi - max < cooldown_hours.
- Lifetime limit: count(verified) >= limit → 429 cavab.
- `partner.anacan.az` ayrı subdomen yox — `app.anacan.az/p/v/:token` kifayətdir (sizin `public/.well-known` artıq mövcuddur). İstənilsə gələcəkdə subdomain yönləndirməsi əlavə olunar.
- Yeni `mem://features/partner-venues-discount` memorisi əlavə olunacaq (premium-only, cooldown məkana özəl, hibrid PIN+QR).

---

## 8) İş bölgüsü (faza-faza)

1. **Migration**: 3 cədvəl + RLS + GRANT + 1 helper funksiya (`can_redeem(venue, user)`).
2. **Edge functions**: 3 funksiya (create / verify / status).
3. **User UI**: route + 3 komponent + 2 hook.
4. **Verify portal**: 1 public səhifə.
5. **Admin**: 3 yeni admin ekran + sidebar entry-ləri.
6. **Analytics + memory + sənədləşmə**.

---

## Açıq sual (təsdiqlədikdən sonra qərar verə bilərik, plan üçün blocker deyil)
- Hələ partnyor məkanları siyahısı yoxdursa, ilk admin dəstəyi üçün bir test məkanı seed edək?
- PIN unutqanlığı üçün admin paneldən "PIN sıfırla" düyməsi (yenidən qoymaq) kifayətdir, ayrı email lazım deyil — razıyıq?

