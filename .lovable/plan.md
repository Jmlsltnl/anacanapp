
# P1 — Partnyor Modulu: Kritik Düzəlişlər

Bu mərhələdə yalnız **dağıdıcı / istifadəçinin gözünə çarpan** problemləri həll edirik. Refaktor və yeni funksiyalar (P2/P3) sonrakı mərhələlərə saxlanılır.

---

## 1. Mərhələ-spesifik Hero Card (ən vacib)

**Problem:** Hazırda `PartnerHeroCard` yalnız `bump` üçün düzgün məlumat göstərir. `mommy` mərhələsində qadın üçün "X həftəlik hamilə" və ya boş meyvə kartı görünə bilər; `flow` mərhələsi isə tamamilə nəzərə alınmır.

**Həll:**
- `PartnerHeroCard.tsx` daxilində `lifeStage`-ə görə üç ayrı görünüş bloku:
  - **bump** → mövcud həftə + meyvə + due date geri sayım (qalır)
  - **mommy** → körpə adı, yaşı (ay/gün — `getRealCalendarAge`), körpə cinsiyyət emoji-si, "Bu gün anaya necə dəstək olum?" CTA
  - **flow** → tsikl günü / faza (menstruasiya/follikulyar/ovulyasiya/luteal), növbəti menstruasiyaya neçə gün, dəstək tövsiyəsi
- `PartnerDashboard.tsx`-də `babyAgeDays` artıq hesablanır — sadəcə hero-ya ötürürük; tsikl günü üçün `usePartnerData`-ya `getCycleDay()` köməkçisi əlavə edilir (mövcud `pregnancy-utils` məntiqindən istifadə edərək).

## 2. Mərhələyə uyğun olmayan widget-lərin gizlədilməsi

**Problem:** "Xəstəxana çantası" (`PartnerHospitalBagScreen`), hamiləliyə aid `LiveActivityCard`, və "Doğuşa hazırlıq" tipli kartlar `mommy` istifadəçisinin partnyoruna da göstərilir — mənasızdır.

**Həll:** `PartnerDashboard.tsx` daxilində `home` tab render-ində `lifeStage`-ə əsasən şərti göstərilmə:
- `bump` → Xəstəxana çantası, həftəlik inkişaf, doğuşa hazırlıq
- `mommy` → Körpə günlük xülasəsi (yuxu/qidalanma sayı), bez xatırlatması, "Ana üçün istirahət təklifi"
- `flow` → Tsikl xülasəsi, simptomlar əsaslı dəstək tövsiyələri

## 3. Brend rəngi uyğunlaşdırması (bənövşəyi → Coral Orange)

**Problem:** `from-partner` (bənövşəyi-mavi gradient) tətbiqin əsas brendi olan **Coral Orange (#F28155)** ilə ziddiyyət təşkil edir.

**Həll:** Partnyor səhifələrindəki gradient-ləri brend rənginə uyğun isti palitra ilə əvəz edirik:
- Hero arxa fon: `from-[#F28155] via-[#FF9A6C] to-[#FFB088]` (Coral Orange + soft peach)
- Aksent: müvafiq olaraq `text-orange-50`, `border-white/20` saxlanılır
- Tab bar aktiv vəziyyəti: `from-partner` → `from-[#F28155] to-[#FF9A6C]`
- `PartnerMissionsCard`, `PartnerQuickStats`, `SyncedFeaturesGrid` faylları da yenilənir

> Qeyd: `from-partner` Tailwind dəyişənini saxlayırıq, sadəcə `tailwind.config.ts`-də onu Coral Orange tonuna yenidən təyin edirik — bu, bütün partnyor UI-ı bir dəfəyə yeniləyir və regressiya riskini azaldır.

## 4. Realtime subscription performans düzəlişi

**Problem:** `usePartnerData.ts` daxilindəki realtime kanal `daily_logs` cədvəlinin **bütün** dəyişikliklərini dinləyir — başqa istifadəçilərin loqları da partnyorun fetch-ini tetikləyir (lazımsız trafik və yanlış re-render).

**Həll:** Subscription-a server-side filter əlavə edirik:
```ts
{ event: '*', schema: 'public', table: 'daily_logs', filter: `user_id=eq.${partnerData.user_id}` }
```
Eyni şəkildə `usePartnerStats.ts`-də `partner_messages` və `partner_missions` üçün də `sender_id`/`user_id` filtri əlavə olunur.

## 5. Boş vəziyyət (partnyor bağlı deyil)

**Problem:** `linked_partner_id` yoxdursa, dashboard "Həyat yoldaşın" + boş data ilə qarışıq görünür.

**Həll:** Əgər `profile.linked_partner_id` yoxdursa, yalnız bağlama təlimatı (mövcud partnyor kodu paylaşma axını ilə) və brend-uyğun boş vəziyyət kartı göstərilir; digər widget-lər tamamilə gizlədilir.

---

## Toxunulacaq fayllar

1. `src/components/partner/PartnerHeroCard.tsx` — mərhələ-spesifik render
2. `src/components/PartnerDashboard.tsx` — şərti widget göstərmə + boş vəziyyət
3. `src/hooks/usePartnerData.ts` — realtime filter + `getCycleDay()` köməkçisi
4. `src/hooks/usePartnerStats.ts` — realtime filter
5. `tailwind.config.ts` — `partner` rəngini Coral Orange-a uyğunlaşdırma

---

## Bu planda **OLMAYAN** (sonraya saxlanılır)

- ❌ `PartnerDashboard.tsx`-in 580 sətirdən modullara bölünməsi (P2)
- ❌ Onboarding tour (P2)
- ❌ AI Bələdçi partnyor üçün (P3)
- ❌ Xatirələr / Memories timeline (P3)
- ❌ Points/Levels üçün vahid hook (P2)

Təsdiq verirsinizsə, default rejimə keçərək bu 5 faylı tətbiq edim.
