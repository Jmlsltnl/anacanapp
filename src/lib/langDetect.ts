// ============================================================
// langDetect — cəmiyyət postları üçün yüngül dil aşkarlama (az/en/ru/tr/kk).
// Prinsip:
//   1. Kiril mətnində qazax-spesifik hərflər (ә/ғ/қ/ң/ө/ұ/ү/һ/і) varsa → kk
//   2. Qalan kiril üstünlüyü → ru
//   3. "ə" hərfi varsa → az ("ə" az dilinin ən çox işlənən hərfidir; tr/en/ru-da yoxdur)
//   4. "ə"-siz, amma türk-spesifik hərflər (ğ/ş/ı/ö/ü/ç) varsa:
//        q/x da varsa → az (türk əlifbasında q/x yoxdur), yoxsa → tr
//   5. Stop-söz sayğacı (tr vs en) → qalan latın mətnlər üçün
//   6. Qısa/qeyri-müəyyən mətn → fallback (UI dili)
// Qeyd: bu YALNIZ ilkin təxmindir — istifadəçi compose-da dil çipi ilə düzəldə bilər.
// ============================================================

export type FeedLang = 'az' | 'en' | 'ru' | 'tr' | 'kk';

/** Feed linzasında göstərilən sıra ilə bütün dəstəklənən dillər */
export const FEED_LANGS: FeedLang[] = ['az', 'ru', 'tr', 'kk', 'en'];

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

export function detectLang(text: string, fallback: FeedLang = 'az'): FeedLang {
  // URL, @mention və #hashtag-ları aşkarlamadan çıxar (onlar dil daşımır)
  const t = (text || '')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/[@#]\S+/g, ' ');

  const cyr = (t.match(/[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі]/g) || []).length;
  const lat = (t.match(/[A-Za-zƏəĞğIıİÖöŞşÜüÇç]/g) || []).length;
  const totalLetters = cyr + lat;

  // Çox qısa mətn (emoji, "ok" və s.) — təxmin etmə, UI dilini götür
  if (totalLetters < 6) return fallback;

  // 1) Kiril üstünlüyü → kk (qazax-spesifik hərf varsa) və ya ru
  if (cyr > totalLetters * 0.4) {
    // ә ғ қ ң ө ұ ү һ і — rus əlifbasında yoxdur, qazax mətninin etibarlı göstəricisidir
    return /[ӘәҒғҚқҢңӨөҰұҮүҺһІі]/.test(t) ? 'kk' : 'ru';
  }

  // 2) "ə" → az (praktikada hər az cümləsində var: və, mən, gələcək...)
  if (/[Əə]/.test(t)) return 'az';

  // 3) Türk-spesifik hərflər ("ə"-siz). DİQQƏT: adi böyük "I" ingilis dilində də var —
  //    yalnız nöqtəsiz "ı" və nöqtəli böyük "İ" türk-spesifikdir.
  const hasTurkicChars = /[ĞğıİÖöŞşÜüÇç]/.test(t);
  const hasQX = /[QqXx]/.test(t.replace(/[^A-Za-z]/g, ''));
  if (hasTurkicChars) {
    // q/x türk əlifbasında yoxdur → az yazısıdır (ə-siz qısa az mətni)
    return hasQX ? 'az' : 'tr';
  }

  // 4) Saf latın mətn — stop-söz sayğacı
  const words = t.toLowerCase().split(/[^a-zçğıöşüə]+/i).filter(Boolean);
  let trHits = 0;
  let enHits = 0;
  for (const w of words) {
    if (TR_STOPWORDS.has(w)) trHits++;
    if (EN_STOPWORDS.has(w)) enHits++;
  }
  if (enHits > trHits && enHits >= 1) return 'en';
  if (trHits > enHits && trHits >= 2) return 'tr';

  // 5) Qeyri-müəyyən → UI dili
  return fallback;
}
