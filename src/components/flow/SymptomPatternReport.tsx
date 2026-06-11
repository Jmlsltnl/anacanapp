import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Lock } from 'lucide-react';
import { useFlowDailyLogs, useFlowSymptoms } from '@/hooks/useFlowDailyLogs';
import { useUserStore } from '@/store/userStore';
import { useSubscription } from '@/hooks/useSubscription';
import { getCycleDayForDate, getPhaseInfoForDate } from '@/lib/cycle-utils';
import { format, subDays } from 'date-fns';
import { Button } from '@/components/ui/button';

interface Props {
  onUpgrade?: () => void;
}

const PHASE_LABEL: Record<string, { label: string; emoji: string }> = {
  menstrual: { label: 'Menstruasiya', emoji: '🩸' },
  follicular: { label: 'Follikular', emoji: '🌱' },
  ovulation: { label: 'Ovulyasiya', emoji: '🌸' },
  luteal: { label: 'Lutein', emoji: '🌙' },
};

const SymptomPatternReport = ({ onUpgrade }: Props) => {
  const { isPremium } = useSubscription();
  const { lastPeriodDate, cycleLength, periodLength } = useUserStore();
  const start = format(subDays(new Date(), 90), 'yyyy-MM-dd');
  const end = format(new Date(), 'yyyy-MM-dd');
  const { data: logs = [], isLoading } = useFlowDailyLogs(start, end);
  const { data: symptomsList = [] } = useFlowSymptoms();

  const patterns = useMemo(() => {
    if (!lastPeriodDate || logs.length === 0) return [];
    const lpd = new Date(lastPeriodDate);
    const counts: Record<string, { phase: Record<string, number>; total: number }> = {};

    logs.forEach(log => {
      if (!log.symptoms || log.symptoms.length === 0) return;
      const date = new Date(log.log_date);
      const phaseInfo = getPhaseInfoForDate(date, lpd, cycleLength || 28, periodLength || 5);
      log.symptoms.forEach(sym => {
        if (!counts[sym]) counts[sym] = { phase: {}, total: 0 };
        counts[sym].phase[phaseInfo.phase] = (counts[sym].phase[phaseInfo.phase] || 0) + 1;
        counts[sym].total += 1;
      });
    });

    return Object.entries(counts)
      .map(([sym, data]) => {
        const dominantPhase = Object.entries(data.phase).sort((a, b) => b[1] - a[1])[0];
        const symInfo = symptomsList.find(s => s.symptom_key === sym);
        return {
          symptom: sym,
          label: symInfo?.label_az || symInfo?.label || sym,
          emoji: symInfo?.emoji || '•',
          dominantPhase: dominantPhase?.[0] || 'unknown',
          dominantCount: dominantPhase?.[1] || 0,
          total: data.total,
          percentage: dominantPhase ? Math.round((dominantPhase[1] / data.total) * 100) : 0,
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [logs, lastPeriodDate, cycleLength, periodLength, symptomsList]);

  if (!isPremium) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-800"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            Simptom Pattern Analizi
          </h3>
          <Lock className="w-4 h-4 text-amber-600" />
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Simptomlarınızın tsikl mərhələləri üzrə paylanmasını görün. Hansı simptomun hansı fazada baş verdiyini AI ilə kəşf edin.
        </p>
        <Button size="sm" onClick={onUpgrade} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
          Premium-a keç
        </Button>
      </motion.div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-4 border border-border animate-pulse">
        <div className="h-6 bg-muted rounded w-1/2 mb-4" />
        <div className="space-y-2">
          <div className="h-12 bg-muted rounded" />
          <div className="h-12 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (patterns.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-4 border border-border">
        <h3 className="font-bold text-foreground flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-fuchsia-500" />
          Simptom Pattern Analizi
        </h3>
        <p className="text-xs text-muted-foreground">
          Hələ kifayət qədər data yoxdur. Gündəlik simptomlarınızı qeyd edin və 1-2 tsikldən sonra burada paylanma görəcəksiniz.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-4 border border-border"
    >
      <h3 className="font-bold text-foreground flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-fuchsia-500" />
        Simptom Pattern Analizi
      </h3>
      <p className="text-xs text-muted-foreground mb-3">Son 90 gün üzrə top 5 simptom və dominant faza:</p>

      <div className="space-y-2">
        {patterns.map(p => {
          const phase = PHASE_LABEL[p.dominantPhase] || { label: p.dominantPhase, emoji: '•' };
          return (
            <div key={p.symptom} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
              <span className="text-xl">{p.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{p.label}</p>
                <p className="text-xs text-muted-foreground">
                  {p.total} dəfə • {p.percentage}% {phase.emoji} {phase.label}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/30 flex items-center justify-center">
                <span className="text-xs font-bold text-fuchsia-700 dark:text-fuchsia-300">{p.percentage}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default SymptomPatternReport;
