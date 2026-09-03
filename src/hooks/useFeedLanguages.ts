// ============================================================
// feedLanguagePriority — cəmiyyət qlobal feed-i üçün ölkəyə-görə avtomatik
// DİL PRİORİTETİ (SIRALAMA, FİLTR DEYİL).
//
// !!! DƏYİŞİKLİK (istifadəçi tələbi): əvvəllər bu fayl "Feed dilləri" adlı
// istifadəçi-idarə edilən FİLTR idi (user_preferences.feed_languages-də
// saxlanılan, seçilməyən dildəki postları TAMAMİLƏ GİZLƏDƏN bir mexanizm,
// görünən UI pill-ləri ilə CommunityScreen.tsx-də). Bu, real problemə səbəb
// olurdu: istifadəçi linzasına düşməyən dildəki postlar/şərhlər ÜMUMİYYƏTLƏ
// görünmürdü.
//
// İndi: HEÇ bir post filtrlənmir/gizlədilmir — bütün qlobal postlar hər
// istifadəçiyə göstərilir, sadəcə istifadəçinin ÖLKƏSİNƏ görə həmin dildəki
// postlar SIRANIN ÖNÜNƏ çəkilir (bax useCommunity.ts-də useGroupPosts-un
// sort məntiqi). Heç bir görünən UI seçici YOXDUR — tamamilə avtomatikdir.
// ============================================================
import { FeedLang, isFeedLang } from '@/lib/langDetect';

// Rus dilinin default prioritetə daxil edildiyi ölkələr (UZ ayrıca uz+ru branch-ı ilə idarə olunur)
const RU_DEFAULT_COUNTRIES = new Set(['RU', 'BY', 'UA', 'KG', 'TJ', 'TM', 'AM', 'GE', 'MD']);
// Ərəbdilli ölkələr
const AR_COUNTRIES = new Set(['SA', 'AE', 'EG', 'QA', 'KW', 'BH', 'OM', 'JO', 'IQ', 'SY', 'LB', 'PS', 'YE', 'LY', 'TN', 'DZ', 'MA', 'SD', 'MR', 'SO', 'DJ', 'KM']);

/**
 * Ölkə + UI dilinə görə dil prioritet sırası (ən yüksək prioritetdən aşağıya).
 * Nəticə YALNIZ sıralama üçündür — bu siyahıda olmayan dillər filtrlənmir,
 * sadəcə siyahının sonuna (ən aşağı prioritetə) düşür.
 */
export function defaultFeedLanguages(countryCode: string | null | undefined, uiLang: string): FeedLang[] {
  const ui: FeedLang = isFeedLang(uiLang) ? uiLang : 'az';
  const cc = (countryCode || '').toUpperCase();
  let langs: FeedLang[];
  if (cc === 'AZ' || !cc) langs = ['az', 'ru', 'tr']; // AZ bazarı — ölkə seçməyənlər də bura
  else if (cc === 'TR') langs = ['tr'];
  else if (cc === 'KZ') langs = ['kk', 'ru']; // Qazaxıstan — qazax + rus
  else if (cc === 'UZ') langs = ['uz', 'ru']; // Özbəkistan — özbək + rus
  else if (cc === 'DE' || cc === 'AT' || cc === 'CH' || cc === 'LI') langs = ['de']; // almandilli region
  else if (AR_COUNTRIES.has(cc)) langs = ['ar']; // ərəbdilli region
  else if (RU_DEFAULT_COUNTRIES.has(cc)) langs = ['ru'];
  else langs = ['en'];
  if (!langs.includes(ui)) langs = [ui, ...langs];
  return langs;
}
