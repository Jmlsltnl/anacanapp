import { motion } from 'framer-motion';
import { tr } from '@/lib/tr';
import { Calendar, TrendingUp, Clock, Activity, BarChart3 } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { getCurrentDateLocale } from '@/lib/date-utils';
import { useCycleHistory, useCycleStats, CycleHistory } from '@/hooks/useCycleHistory';

const FlowCycleStats = () => {
  const { data: cycles = [], isLoading } = useCycleHistory();
  const stats = useCycleStats();

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-4 border border-border animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-4" />
        <div className="space-y-3">
          <div className="h-16 bg-muted rounded" />
          <div className="h-16 bg-muted rounded" />
        </div>
      </div>);

  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-4 border border-border">
      
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-500" />
          {tr("flowcyclestats_tsikl_statistikasi_e8cbea", "Tsikl Statistikas\u0131")}
        </h3>
        <span className="text-xs text-muted-foreground">{tr("flowcyclestats_tsikl_count", "{count} tsikl").replace("{count}", String(stats.totalCycles))}</span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-muted-foreground">{tr("untranslated_orta_tsikl_vxzcvs", "Orta Tsikl")}</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.averageCycleLength}</p>
          <p className="text-xs text-muted-foreground">{tr("flowcyclestats_gun_54e78d", "gün")}</p>
        </div>

        <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-pink-500" />
            <span className="text-xs text-muted-foreground">{tr("untranslated_orta_period_tvx5me", "Orta Period")}</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.averagePeriodLength}</p>
          <p className="text-xs text-muted-foreground">{tr("flowcyclestats_gun_54e78d", "gün")}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-xs text-muted-foreground">{tr("untranslated_diapazon_dgfplg", "Diapazon")}</span>
          </div>
          <p className="text-xl font-bold text-foreground">
            {stats.shortestCycle}-{stats.longestCycle}
          </p>
          <p className="text-xs text-muted-foreground">{tr("flowcyclestats_gun_54e78d", "gün")}</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-muted-foreground">{tr("untranslated_variasiya_nbjh0m", "Variasiya")}</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.cycleVariation}</p>
          <p className="text-xs text-muted-foreground">{tr("flowcyclestats_gun_ferq_d595f3", "gün fərq")}</p>
        </div>
      </div>

      {/* Recent Cycles */}
      {cycles.length > 0 &&
      <div>
          <h4 className="text-sm font-medium text-foreground mb-3">{tr("flowcyclestats_son_tsikller_7e7eb6", "Son Tsikllər")}</h4>
          <div className="space-y-2">
            {cycles.slice(0, 3).map((cycle, index) =>
          <div
            key={cycle.id}
            className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
            
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">#{cycle.cycle_number}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {format(parseISO(cycle.start_date), 'd MMM', { locale: getCurrentDateLocale() })}
                      {cycle.end_date &&
                  <span className="text-muted-foreground">
                          {' - '}
                          {format(parseISO(cycle.end_date), 'd MMM', { locale: getCurrentDateLocale() })}
                        </span>
                  }
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {cycle.cycle_length ? tr("flowcyclestats_gun_tsikl_f123bc", "{length} gün tsikl").replace("{length}", String(cycle.cycle_length)) : tr("flowcyclestats_davam_edir_f842cd", "Davam edir")}
                    </p>
                  </div>
                </div>
                {cycle.period_length &&
            <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded-full">
                    {cycle.period_length} {tr("flowcyclestats_gun_54e78d", "g\xFCn")}
                  </span>
            }
              </div>
          )}
          </div>
        </div>
      }

      {cycles.length === 0 &&
      <div className="text-center py-6">
          <Calendar className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {tr("flowcyclestats_tsikl_tarixi_yoxdur_b78f8c", "Tsikl tarixi yoxdur")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {tr("flowcyclestats_period_gunlerini_qeyd_etdikde__f44b96", "Period g\xFCnl\u0259rini qeyd etdikd\u0259 tarix yaranacaq")}
          </p>
        </div>
      }
    </motion.div>);

};

export default FlowCycleStats;