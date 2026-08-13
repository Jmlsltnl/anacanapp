import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw, Loader2, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';
import PremiumModal from '@/components/PremiumModal';
import { tr, getPersistedLanguage } from '@/lib/tr';

/**
 * TrackerAIInsight — Yuxu / Qidalanma / Bez kartlarının altında AI norma analizi.
 * Bir hook (useBabyInsight) valideyn komponentdə BİR dəfə çağırılır və 3 bölmə
 * eyni cavabı paylaşır (1 şəbəkə çağırışı). Nəticə stats-hash üzrə keşlənir —
 * eyni göstəricilər üçün təkrar AI çağırışı olmur.
 */

export type InsightSection = 'sleep' | 'feeding' | 'diaper';
type SectionStatus = 'normal' | 'low' | 'high' | 'watch';

interface SectionInsight { status: SectionStatus; note: string; }
export interface BabyInsight { sleep: SectionInsight; feeding: SectionInsight; diaper: SectionInsight; }

export interface BabyInsightStats {
  sleepMinutes: number;
  sleepCount: number;
  feedingCount: number;
  breastCount: number;
  formulaCount: number;
  formulaMl: number;
  solidCount: number;
  diaperCount: number;
  wetCount: number;
  dirtyCount: number;
  mixedCount: number;
}

export interface BabyInsightChild {
  id: string;
  ageMonths: number;
  ageDays: number;
  gender?: string;
}

export interface BabyInsightApi {
  insight: BabyInsight | null;
  loading: boolean;
  error: boolean;
  stale: boolean;         // göstərilən nəticə köhnə statistikaya aiddir
  limitReached: boolean;  // pulsuz gündəlik limit bitib
  request: () => void;    // AI analizini işə sal / yenilə
}

const CACHE_KEY = 'anacan-baby-insight';

const readCache = (): { hash: string; insight: BabyInsight } | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.hash === 'string' && parsed.insight) return parsed;
  } catch { /* boş */ }
  return null;
};

export const useBabyInsight = (
  stats: BabyInsightStats | null,
  child: BabyInsightChild | null
): BabyInsightApi => {
  const [insight, setInsight] = useState<BabyInsight | null>(null);
  const [cachedHash, setCachedHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const { checkAndConsume } = useSubscription();

  const hash = useMemo(() => {
    if (!stats || !child) return null;
    const day = new Date().toISOString().split('T')[0];
    return [
      child.id, day, getPersistedLanguage(),
      stats.sleepMinutes, stats.sleepCount,
      stats.feedingCount, stats.breastCount, stats.formulaCount, stats.formulaMl, stats.solidCount,
      stats.diaperCount, stats.wetCount, stats.dirtyCount, stats.mixedCount,
    ].join('|');
  }, [stats, child]);

  // Keşdən oxu — eyni gün + eyni statistika üçün AI-ya təkrar getmirik
  useEffect(() => {
    const cached = readCache();
    if (cached) {
      setInsight(cached.insight);
      setCachedHash(cached.hash);
    }
  }, []);

  const request = useCallback(async () => {
    if (!stats || !child || !hash || loading) return;
    if (cachedHash === hash && insight) return; // artıq aktualdır

    // Gündəlik pulsuz limit (premium → limitsiz); keş vuruşları limitə sayılmır
    const { allowed } = await checkAndConsume('baby_insight');
    if (!allowed) {
      setLimitReached(true);
      return;
    }

    setLoading(true);
    setError(false);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('baby-insight', {
        body: {
          language: getPersistedLanguage(),
          child: { ageMonths: child.ageMonths, ageDays: child.ageDays, gender: child.gender },
          stats: { ...stats, localHour: new Date().getHours() },
        },
      });
      if (fnError || !data?.success || !data?.insight) throw fnError || new Error('no insight');
      setInsight(data.insight as BabyInsight);
      setCachedHash(hash);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ hash, insight: data.insight })); } catch { /* boş */ }
    } catch (e) {
      console.error('baby-insight request failed:', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [stats, child, hash, loading, cachedHash, insight, checkAndConsume]);

  return {
    insight,
    loading,
    error,
    stale: !!insight && !!hash && cachedHash !== hash,
    limitReached,
    request,
  };
};

// ── Status görünüşü ────────────────────────────────────────────
const STATUS_CONF: Record<SectionStatus, { color: string; bg: string; labelKey: string; labelAz: string }> = {
  normal: { color: 'var(--a-green-ink)', bg: 'rgba(28, 122, 77, 0.12)', labelKey: 'babyai_status_normal', labelAz: 'Normal' },
  low: { color: 'var(--a-yellow-ink)', bg: 'rgba(148, 98, 0, 0.12)', labelKey: 'babyai_status_low', labelAz: 'Az' },
  high: { color: 'var(--a-yellow-ink)', bg: 'rgba(148, 98, 0, 0.12)', labelKey: 'babyai_status_high', labelAz: 'Çox' },
  watch: { color: '#b3261e', bg: 'rgba(179, 38, 30, 0.12)', labelKey: 'babyai_status_watch', labelAz: 'Diqqət' },
};

interface TrackerAIInsightProps {
  section: InsightSection;
  api: BabyInsightApi;
}

const TrackerAIInsight = ({ section, api }: TrackerAIInsightProps) => {
  const data = api.insight?.[section] ?? null;
  const [showModal, setShowModal] = useState(false);

  return (
    <div
      style={{
        marginTop: 10,
        padding: '9px 11px',
        borderRadius: 12,
        background: 'var(--a-surface-soft)',
        border: '1px solid var(--a-line)',
      }}>

      {!data && !api.loading && api.limitReached &&
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 w-full"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <Crown size={13} style={{ color: '#b8860b', flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--a-accent-ink)' }}>
            {tr('babyai_limit_cta', 'Gündəlik pulsuz analiz bitdi — Premium ilə limitsiz')}
          </span>
        </button>
      }

      {!data && !api.loading && !api.limitReached &&
      <button
        onClick={api.request}
        className="flex items-center gap-2 w-full"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <Sparkles size={13} style={{ color: 'var(--a-accent-ink)', flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--a-accent-ink)' }}>
            {api.error ?
          tr('babyai_error_retry', 'AI analiz alınmadı — yenidən cəhd et') :
          tr('babyai_check', 'AI ilə yoxla — bu göstəricilər normaldır?')}
          </span>
        </button>
      }

      {api.loading && !data &&
      <div className="flex items-center gap-2">
          <Loader2 size={13} className="animate-spin" style={{ color: 'var(--a-accent-ink)', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--a-ink-soft)' }}>{tr('babyai_loading', 'AI analiz edir...')}</span>
        </div>
      }

      {data &&
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
            <Sparkles size={12} style={{ color: 'var(--a-accent-ink)', flexShrink: 0 }} />
            <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--a-ink-soft)' }}>
              {tr('babyai_title', 'AI Analiz')}
            </span>
            <span
            style={{
              fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 999,
              color: STATUS_CONF[data.status]?.color ?? STATUS_CONF.normal.color,
              background: STATUS_CONF[data.status]?.bg ?? STATUS_CONF.normal.bg,
            }}>
              {tr(STATUS_CONF[data.status]?.labelKey ?? 'babyai_status_normal', STATUS_CONF[data.status]?.labelAz ?? 'Normal')}
            </span>
            {(api.stale || api.loading) &&
          <button
            onClick={() => api.limitReached ? setShowModal(true) : api.request()}
            disabled={api.loading}
            aria-label={tr('babyai_refresh', 'Yenilə')}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--a-ink-soft)' }}>
                {api.loading ?
            <Loader2 size={12} className="animate-spin" /> :
            api.limitReached ? <Crown size={12} style={{ color: '#b8860b' }} /> : <RefreshCw size={12} />}
              </button>
          }
          </div>
          <p style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--a-ink)' }}>{data.note}</p>
        </motion.div>
      }

      <PremiumModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        feature="baby_insight" />
    </div>);

};

export default TrackerAIInsight;
