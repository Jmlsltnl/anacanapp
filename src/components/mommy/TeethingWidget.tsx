import { motion } from 'framer-motion';
import { tr } from '@/lib/tr';
import { Sparkles, ChevronRight, Check, Clock } from 'lucide-react';
import { useTeething } from '@/hooks/useTeething';
import { useChildren } from '@/hooks/useChildren';
import { Progress } from '@/components/ui/progress';

interface TeethingWidgetProps {
  onOpen: () => void;
}

const TeethingWidget = ({ onOpen }: TeethingWidgetProps) => {
  const { selectedChild, getChildAge, hasChildren, loading: childrenLoading } = useChildren();
  const { emergedCount, totalTeeth, progress, loading: teethingLoading } = useTeething();

  // Don't render if still loading
  if (childrenLoading || teethingLoading) {
    return (
      <div className="bg-card rounded-2xl p-4 animate-pulse">
        <div className="h-20 bg-muted rounded-xl" />
      </div>);

  }

  // Don't show widget if no child is selected
  if (!hasChildren || !selectedChild) {
    return null;
  }

  const childAge = getChildAge(selectedChild);
  const ageMonths = childAge.months;

  // Get expected teeth count for age
  const getExpectedTeeth = (months: number): number => {
    if (months < 6) return 0;
    if (months < 8) return 2;
    if (months < 10) return 4;
    if (months < 12) return 6;
    if (months < 14) return 8;
    if (months < 18) return 12;
    if (months < 24) return 16;
    return 20;
  };

  const expectedTeeth = getExpectedTeeth(ageMonths);

  // Get next expected teeth
  const getNextTeethInfo = (months: number): {name: string;timeframe: string;} | null => {
    if (months < 6) return { name: tr("teethingwidget_alt_merkezi_kesiciler_63d8b0", "Alt mərkəzi kəsicilər"), timeframe: tr('teethingwidget_timeframe_6_10', '6-10 ay') };
    if (months < 8) return { name: tr("teethingwidget_yuxari_merkezi_kesiciler_456b8c", "Yuxarı mərkəzi kəsicilər"), timeframe: tr('teethingwidget_timeframe_8_12', '8-12 ay') };
    if (months < 10) return { name: tr("teethingwidget_yan_kesiciler_c75ada", "Yan kəsicilər"), timeframe: tr('teethingwidget_timeframe_9_16', '9-16 ay') };
    if (months < 14) return { name: tr("teethingwidget_birinci_azi_disler_eccbbc", "Birinci azı dişlər"), timeframe: tr('teethingwidget_timeframe_13_19', '13-19 ay') };
    if (months < 18) return { name: tr("teethingwidget_kopek_disleri_a86ac1", "Köpək dişləri"), timeframe: tr('teethingwidget_timeframe_16_23', '16-23 ay') };
    if (months < 24) return { name: tr("teethingwidget_ikinci_azi_disler_861654", "İkinci azı dişlər"), timeframe: tr('teethingwidget_timeframe_23_33', '23-33 ay') };
    if (emergedCount < 20) return { name: tr("teethingwidget_son_sud_disleri_c43b8c", "Son süd dişləri"), timeframe: tr('teethingwidget_timeframe_soon', 'Tezliklə') };
    return null;
  };

  const nextTeeth = getNextTeethInfo(ageMonths);

  // Determine status
  const isOnTrack = emergedCount >= expectedTeeth - 2;
  const statusColor = isOnTrack ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400';
  const statusBg = isOnTrack ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-amber-50 dark:bg-amber-950/30';

  return (
    <motion.button
      onClick={onOpen}
      className="w-full text-left"
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}>
      
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10 dark:from-primary/15 dark:via-primary/10 dark:to-primary/15 rounded-2xl p-4 border border-primary/20 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl" />
        
        <div className="relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{tr("teethingwidget_dis_cixarma_ca53f7", "Diş Çıxarma")}</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedChild.name} • {childAge.displayText}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>

          {/* Progress */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">{tr("teethingwidget_cixan_disler_a9eadd", "Çıxan dişlər")}</span>
              <span className="text-sm font-bold text-primary">{emergedCount} / {totalTeeth}</span>
            </div>
            <Progress value={progress} className="h-2 bg-primary/10" />
          </div>

          {/* Stats Row */}
          <div className="flex gap-2">
            {/* Status Badge */}
            <div className={`flex-1 rounded-xl p-2.5 ${statusBg}`}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Check className={`w-3.5 h-3.5 ${statusColor}`} />
                <span className={`text-xs font-medium ${statusColor}`}>
                  {isOnTrack ? tr('teethingwidget_normal_development', 'Normal inkişaf') : tr("teethingwidget_diqqet_764567", "Diqq\u0259t")}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {tr('teethingwidget_expected_teeth', '{n} aylıq üçün ~{t} diş gözlənilir').replace('{n}', String(ageMonths)).replace('{t}', String(expectedTeeth))}
              </p>
            </div>

            {/* Next Teeth */}
            {nextTeeth &&
            <div className="flex-1 rounded-xl p-2.5 bg-muted/50">
                <div className="flex items-center gap-1 mb-0.5">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <p className="text-[10px] text-muted-foreground">{tr("teethingwidget_novbeti_0fff9a", "Növbəti:")}</p>
                </div>
                <p className="text-xs font-medium line-clamp-1">{nextTeeth.name}</p>
                <p className="text-[10px] text-muted-foreground">{nextTeeth.timeframe}</p>
              </div>
            }
          </div>
        </div>
      </div>
    </motion.button>);

};

export default TeethingWidget;