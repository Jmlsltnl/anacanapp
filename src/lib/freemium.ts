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
 *  - first-aid free saxlanılıb (təcili tibbi məlumat — etik + App Store review).
 *    danger-signs istifadəçi qərarı ilə premium edildi.
 */

const FREE_TOOL_IDS = new Set<string>([
// Shop / kommersiya (cari vəziyyətdə qalır)
'cakes',
'secondhand-market', 'second-hand-market',
'affiliate', 'affiliate-products',
'blog',
// Təhlükəsizlik istisnası
'first-aid']
);

/** Alət free siyahısındadır? */
export const isToolFree = (toolId: string): boolean => FREE_TOOL_IDS.has(toolId);
