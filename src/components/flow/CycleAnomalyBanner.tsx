import { tr } from "@/lib/tr";import { motion } from 'framer-motion';
import { AlertTriangle, Info } from 'lucide-react';
import { useCycleStats, useCycleHistory } from '@/hooks/useCycleHistory';

const CycleAnomalyBanner = () => {
  const stats = useCycleStats();
  const { data: cycles = [] } = useCycleHistory();

  if (cycles.length < 3) return null;

  const anomalies: {severity: 'warn' | 'info';title: string;message: string;}[] = [];

  if (stats.shortestCycle > 0 && stats.shortestCycle < 21) {
    anomalies.push({
      severity: 'warn',
      title: tr("cycleanomalybanner_qisa_tsikl_askar_edildi_b0e734", "Qısa tsikl aşkar edildi"),
      message: tr("flow_shortest_cycle_msg", "Ən qısa tsikliniz {days} gündür. 21 gündən az tsikllər həkim müraciəti tələb edə bilər.").replace("{days}", String(stats.shortestCycle))
    });
  }

  if (stats.longestCycle > 35) {
    anomalies.push({
      severity: 'warn',
      title: tr("cycleanomalybanner_uzun_tsikl_askar_edildi_14479e", "Uzun tsikl aşkar edildi"),
      message: tr("flow_longest_cycle_msg", "Ən uzun tsikliniz {days} gündür. 35 gündən uzun tsikllər PCOS və ya hormonal disbalans əlaməti ola bilər.").replace("{days}", String(stats.longestCycle))
    });
  }

  if (stats.cycleVariation > 7) {
    anomalies.push({
      severity: 'info',
      title: tr("cycleanomalybanner_duzensiz_tsikl_7b2693", "Düzənsiz tsikl"),
      message: tr("flow_cycle_diff_msg", "Tsikllər arasında {days} gün fərq var. Bu stress, çəki dəyişikliyi və ya tireoid problemlərlə bağlı ola bilər.").replace("{days}", String(stats.cycleVariation))
    });
  }

  if (anomalies.length === 0) return null;

  return (
    <div className="space-y-2">
      {anomalies.map((a, i) => {
        const isWarn = a.severity === 'warn';
        const Icon = isWarn ? AlertTriangle : Info;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl p-3 border ${
            isWarn ?
            'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' :
            'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'}`
            }>
            
            <div className="flex items-start gap-2">
              <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isWarn ? 'text-amber-600' : 'text-blue-600'}`} />
              <div className="flex-1">
                <p className={`text-sm font-semibold ${isWarn ? 'text-amber-900 dark:text-amber-200' : 'text-blue-900 dark:text-blue-200'}`}>
                  {a.title}
                </p>
                <p className={`text-xs mt-0.5 ${isWarn ? 'text-amber-800 dark:text-amber-300' : 'text-blue-800 dark:text-blue-300'}`}>
                  {a.message}
                </p>
              </div>
            </div>
          </motion.div>);

      })}
    </div>);

};

export default CycleAnomalyBanner;