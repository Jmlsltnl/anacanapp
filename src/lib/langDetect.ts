// ============================================================
// langDetect — cəmiyyət postları üçün yüngül dil aşkarlama (az/en/ru/tr/kk/uz/de).
// Prinsip:
//   1. Kiril mətnində özbək-spesifik hərflər (ў/ҳ) varsa → uz;
//      qazax-spesifik hərflər (ә/ғ/қ/ң/ө/ұ/ү/һ/і) varsa → kk
//   2. Qalan kiril üstünlüyü → ru
//   3. "ə" hərfi varsa → az ("ə" az dilinin ən çox işlənən hərfidir; tr/en/ru-da yoxdur)
//   4. Alman-spesifik: ß varsa → de; ä varsa (ə-siz mətndə) → de
//   5. "ə"-siz, amma türk-spesifik hərflər (ğ/ş/ı/ç) varsa:
//        q/x da varsa → az (türk əlifbasında q/x yoxdur), yoxsa → tr
//        (ö/ü tək başına türk sayılmır — almanda da var; stop-söz sayğacı həll edir)
//   6. Stop-söz sayğacı (de vs tr vs en) → qalan latın mətnlər üçün
//   7. Qısa/qeyri-müəyyən mətn → fallback (UI dili)
// Qeyd: bu YALNIZ ilkin təxmindir — istifadəçi compose-da dil çipi ilə düzəldə bilər.
// ============================================================

export type FeedLang = 'az' | 'en' | 'ru' | 'tr' | 'kk' | 'uz' | 'de' | 'ar';

/** Feed linzasında göstərilən sıra ilə bütün dəstəklənən dillər */
export const FEED_LANGS: FeedLang[] = ['az', 'ru', 'tr', 'kk', 'uz', 'de', 'ar', 'en'];

export function isFeedLang(v: unknown): v is FeedLang {
  return typeof v === 'string' && (FEED_LANGS as string[]).includes(v);
}

/** Massivi təmizlə: yalnız dəstəklənən dillər, dublikatsız; boşdursa fallback */
export function sanitizeFeedLangs(input: unknown, fallback: FeedLang[]): FeedLang[] {
  const arr = Array.isArray(input) ? input.filter(isFeedLang) : [];
  const uniq = [...new Set(arr)];
  return uniq.length > 0 ? uniq : fallback;
}

// Diakritikasız da yazıla bilən stop-sözlər (tr klaviaturasız yazanlar üçün)
const TR_STOPWORDS = new Set([
  've', 'bir', 'bu', 'su', 'icin', 'için', 'cok', 'çok', 'ama', 'fakat', 'gibi', 'daha',
  'mi', 'mı', 'mu', 'mü', 'ne', 'evet', 'hayır', 'hayir', 'ben', 'sen', 'biz', 'siz',
  'degil', 'değil', 'var', 'yok', 'ile', 'olarak', 'bebek', 'bebeğim', 'hamile', 'anne',
]);
const EN_STOPWORDS = new Set([
  'the', 'and', 'is', 'are', 'was', 'were', 'to', 'of', 'in', 'on', 'my', 'your', 'for',
  'with', 'have', 'has', 'it', 'this', 'that', 'baby', 'you', 'i', 'am', 'be', 'not',
  'so', 'but', 'we', 'she', 'he', 'her', 'his', 'do', 'does', 'what', 'how',
]);
const DE_STOPWORDS = new Set([
  'der', 'die', 'das', 'und', 'ist', 'nicht', 'ein', 'eine', 'ich', 'du', 'wir', 'ihr',
  'mein', 'meine', 'dein', 'mit', 'für', 'fur', 'auf', 'aus', 'bei', 'nach', 'wenn',
  'aber', 'auch', 'schon', 'noch', 'sehr', 'kann', 'hat', 'haben', 'sind', 'wird',
  'schlafen', 'schläft', 'monate', 'wochen', 'stillen', 'schwanger', 'mütter', 'mutter',
]);

export function detectLang(text: string, fallback: FeedLang = 'az'): FeedLang {
  // URL, @mention və #hashtag-ları aşkarlamadan çıxar (onlar dil daşımır)
  const t = (text || '')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/[@#]\S+/g, ' ');

  // 0) Ərəb qrafikası — ən etibarlı marker (başqa heç bir dəstəklənən dildə yoxdur)
  const arb = (t.match(/[\u0600-\u06FF\u0750-\u077F]/g) || []).length;
  const cyr = (t.match(/[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІіЎўҲҳ]/g) || []).length;
  const lat = (t.match(/[A-Za-zƏəĞğIıİÖöŞşÜüÇç]/g) || []).length;
  const totalLetters = arb + cyr + lat;

  // Çox qısa mətn (emoji, "ok" və s.) — təxmin etmə, UI dilini götür
  if (totalLetters < 6) return fallback;

  if (arb > totalLetters * 0.3) return 'ar';

  // 1) Kiril üstünlüyü → uz (özbək-spesifik hərf varsa), kk (qazax-spesifik hərf varsa) və ya ru
  if (cyr > totalLetters * 0.4) {
    // ў ҳ — rus/qazax əlifbasında yoxdur, özbək kiril mətninin etibarlı göstəricisidir
    if (/[ЎўҲҳ]/.test(t)) return 'uz';
    // ә ғ қ ң ө ұ ү һ і — rus əlifbasında yoxdur, qazax mətninin etibarlı göstəricisidir
    return /[ӘәҒғҚқҢңӨөҰұҮүҺһІі]/.test(t) ? 'kk' : 'ru';
  }

  // 2) "ə" → az (praktikada hər az cümləsində var: və, mən, gələcək...)
  if (/[Əə]/.test(t)) return 'az';

  // 2a) Özbək latın markeri: oʻ/gʻ digrafları (apostrof variantları ilə) —
  //     az/tr/en/de-də bu ardıcıllıq işlənmir; yalnız ilkin təxmindir, çiplə düzəldilə bilər
  if (/[OoGg][ʻʼ'’‘`]/.test(t)) return 'uz';

  // 3) Alman-spesifik: ß yalnız almandadır; ä (ə-siz mətndə) az/tr-də yoxdur
  if (/[ßÄä]/.test(t)) return 'de';

  // 4) Türk-spesifik hərflər ("ə"-siz). DİQQƏT: adi böyük "I" ingilis dilində də var —
  //    yalnız nöqtəsiz "ı" və nöqtəli böyük "İ" türk-spesifikdir.
  //    ö/ü almanda da olduğu üçün tək başına türk sayılmır — ğ/ş/ı/ç/İ tələb olunur.
  const hasStrongTurkic = /[ĞğıİŞşÇç]/.test(t);
  const hasQX = /[QqXx]/.test(t.replace(/[^A-Za-z]/g, ''));
  if (hasStrongTurkic) {
    // q/x türk əlifbasında yoxdur → az yazısıdır (ə-siz qısa az mətni)
    return hasQX ? 'az' : 'tr';
  }

  // 5) Saf latın mətn — stop-söz sayğacı (de vs tr vs en)
  const words = t.toLowerCase().split(/[^a-zäöüßçğıə]+/i).filter(Boolean);
  let trHits = 0;
  let enHits = 0;
  let deHits = 0;
  for (const w of words) {
    if (TR_STOPWORDS.has(w)) trHits++;
    if (EN_STOPWORDS.has(w)) enHits++;
    if (DE_STOPWORDS.has(w)) deHits++;
  }
  if (deHits > enHits && deHits > trHits && deHits >= 2) return 'de';
  if (enHits > trHits && enHits >= 1) return 'en';
  if (trHits > enHits && trHits >= 2) return 'tr';
  // ö/ü var amma stop-söz həll etmədi → türkcəyə meyl (bölgə reallığı)
  if (/[ÖöÜü]/.test(t) && trHits > 0) return 'tr';

  // 6) Qeyri-müəyyən → UI dili
  return fallback;
}
