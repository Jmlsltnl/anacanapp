/**
 * Freemium siyasəti — bu BUILD-dən etibarən qüvvədədir.
 *
 * VACİB: Gating tamamilə klient kodundadır (DB flag-ları DƏYİŞMİR) —
 * köhnə versiyanı daşıyan cihazlara HEÇ BİR təsir yoxdur. Yeni siyasət
 * yalnız store update-dən sonra aktivləşir.
 *
 * FREE qalanlar (istifadəçi qərarı):
 *  - AI Chat, Community, Bloglar (tab/ekran səviyyəsində onsuz da açıqdır)
 *  - Daily infolar (hər 3 modulun dashboard məzmunu)
 *  - Bump dashboard: hero, tövsiyələr, bədən dəyişiklikləri, körpə inkişafı, trimester
 *  - Flow: hero, bugün üçün, gecikmə, period təqvimi, faza məsləhətləri, qarşıdan gələnlər
 *  - Alətlər: shop (ikinci əl), cakes, tövsiyə məhsullar, blog
 *  - TƏHLÜKƏSİZLİK İSTİSNASI: danger-signs + first-aid free saxlanılıb —
 *    təcili tibbi məlumatı paywall arxasına qoymaq həm etik, həm də
 *    App Store review riskidir. (İstəsəniz siyahıdan çıxarın.)
 */

const FREE_TOOL_IDS = new Set<string>([
// Shop / kommersiya (cari vəziyyətdə qalır)
'cakes',
'secondhand-market', 'second-hand-market',
'affiliate', 'affiliate-products',
'blog',
// Təhlükəsizlik istisnası
'danger-signs',
'first-aid']
);

/** Alət free siyahısındadır? */
export const isToolFree = (toolId: string): boolean => FREE_TOOL_IDS.has(toolId);
