import { motion } from 'framer-motion';
import { Sparkles, ChevronRight, Check } from 'lucide-react';
import { useTeething } from '@/hooks/useTeething';
import { useChildren } from '@/hooks/useChildren';
import { Progress } from '@/components/ui/progress';

interface TeethingWidgetProps {
  onOpen: () => void;
}

const TeethingWidget = ({ onOpen }: TeethingWidgetProps) => {
  const { selectedChild, getChildAge, hasChildren } = useChildren();
  const { emergedCount, totalTeeth, progress, teeth, loading } = useTeething();

  // Don't render if no children or still loading
  if (loading) {
    return (
      <div className="bg-card rounded-2xl p-4 animate-pulse">
        <div className="h-20 bg-muted rounded-xl" />
      </div>
    );
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
  const getNextTeethInfo = (months: number): { name: string; timeframe: string } | null => {
    if (months < 6) return { name: 'Alt mərkəzi kəsicilər', timeframe: '6-10 ay' };
    if (months < 8) return { name: 'Yuxarı mərkəzi kəsicilər', timeframe: '8-12 ay' };
    if (months < 10) return { name: 'Yan kəsicilər', timeframe: '9-16 ay' };
    if (months < 14) return { name: 'Birinci azı dişlər', timeframe: '13-19 ay' };
    if (months < 18) return { name: 'Köpək dişləri', timeframe: '16-23 ay' };
    if (months < 24) return { name: 'İkinci azı dişlər', timeframe: '23-33 ay' };
    if (emergedCount < 20) return { name: 'Son süd dişləri', timeframe: 'Tezliklə' };
    return null;
  };

  const nextTeeth = getNextTeethInfo(ageMonths);
  
  // Determine status
  const isOnTrack = emergedCount >= expectedTeeth - 2;
  const statusColor = isOnTrack ? 'text-emerald-600' : 'text-amber-600';
  const statusBg = isOnTrack ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-amber-50 dark:bg-amber-950/30';

  // Render mini teeth visualization
  const renderMiniTeeth = () => {
    const upperTeeth = teeth.filter(t => t.position === 'upper').slice(0, 5);
    const lowerTeeth = teeth.filter(t => t.position === 'lower').slice(0, 5);
    
    return (
      <div className="flex flex-col gap-0.5">
        <div className="flex justify-center gap-0.5">
          {upperTeeth.map((tooth) => {
            const emerged = emergedCount > 0; // simplified check
            return (
              <div
                key={tooth.id}
                className={`w-2 h-3 rounded-sm ${
                  emerged ? 'bg-pink-400' : 'bg-muted-foreground/20'
                }`}
              />
            );
          })}
        </div>
        <div className="flex justify-center gap-0.5">
          {lowerTeeth.map((tooth) => (
            <div
              key={tooth.id}
              className="w-2 h-3 rounded-sm bg-muted-foreground/20"
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <motion.button
      onClick={onOpen}
      className="w-full text-left"
      whileTap={{ scale: 0.98 }}
    >
      <div className="bg-gradient-to-br from-pink-50 via-rose-50 to-fuchsia-50 dark:from-pink-950/30 dark:via-rose-950/30 dark:to-fuchsia-950/30 rounded-2xl p-4 border border-pink-100/50 dark:border-pink-900/30 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-pink-200/30 to-transparent rounded-full blur-2xl" />
        
        <div className="relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Diş Çıxarma</h3>
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
              <span className="text-xs text-muted-foreground">Çıxan dişlər</span>
              <span className="text-sm font-bold text-pink-600">{emergedCount} / {totalTeeth}</span>
            </div>
            <Progress value={progress} className="h-2 bg-pink-100 dark:bg-pink-900/30" />
          </div>

          {/* Stats Row */}
          <div className="flex gap-2">
            {/* Status Badge */}
            <div className={`flex-1 rounded-xl p-2.5 ${statusBg}`}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Check className={`w-3.5 h-3.5 ${statusColor}`} />
                <span className={`text-xs font-medium ${statusColor}`}>
                  {isOnTrack ? 'Normal inkişaf' : 'Diqqət'}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {ageMonths} aylıq üçün ~{expectedTeeth} diş gözlənilir
              </p>
            </div>

            {/* Next Teeth */}
            {nextTeeth && (
              <div className="flex-1 rounded-xl p-2.5 bg-muted/50">
                <p className="text-[10px] text-muted-foreground mb-0.5">Növbəti:</p>
                <p className="text-xs font-medium line-clamp-1">{nextTeeth.name}</p>
                <p className="text-[10px] text-muted-foreground">{nextTeeth.timeframe}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  );
};

export default TeethingWidget;
