import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ChevronRight, Calendar, Clock, Sparkles, X, Check, Lightbulb } from 'lucide-react';
import { useBabyCrisisPeriods, BabyCrisisPeriod, useCurrentBabyCrisis, useUpcomingBabyCrises } from '@/hooks/useBabyCrisisPeriods';
import { hapticFeedback } from '@/lib/native';

interface BabyCrisisWidgetProps {
  babyAgeWeeks: number;
  babyName: string;
}

const severityConfig = {
  mild: { 
    color: 'from-amber-400 to-yellow-500', 
    bgColor: 'bg-amber-50 dark:bg-amber-500/10',
    borderColor: 'border-amber-200 dark:border-amber-500/30',
    textColor: 'text-amber-700 dark:text-amber-400',
    label: 'Yüngül'
  },
  medium: { 
    color: 'from-orange-400 to-amber-500', 
    bgColor: 'bg-orange-50 dark:bg-orange-500/10',
    borderColor: 'border-orange-200 dark:border-orange-500/30',
    textColor: 'text-orange-700 dark:text-orange-400',
    label: 'Orta'
  },
  intense: { 
    color: 'from-rose-400 to-red-500', 
    bgColor: 'bg-rose-50 dark:bg-rose-500/10',
    borderColor: 'border-rose-200 dark:border-rose-500/30',
    textColor: 'text-rose-700 dark:text-rose-400',
    label: 'İntensiv'
  },
};

const BabyCrisisWidget = ({ babyAgeWeeks, babyName }: BabyCrisisWidgetProps) => {
  const [showFullCalendar, setShowFullCalendar] = useState(false);
  const [selectedCrisis, setSelectedCrisis] = useState<BabyCrisisPeriod | null>(null);
  
  const { data: allCrisisPeriods = [], isLoading } = useBabyCrisisPeriods();
  const currentCrises = useCurrentBabyCrisis(babyAgeWeeks);
  const upcomingCrises = useUpcomingBabyCrises(babyAgeWeeks, 2);
  
  const isInCrisis = currentCrises.length > 0;
  const currentCrisis = currentCrises[0];
  
  const openFullCalendar = async () => {
    await hapticFeedback.light();
    setShowFullCalendar(true);
  };

  const openCrisisDetail = async (crisis: BabyCrisisPeriod) => {
    await hapticFeedback.light();
    setSelectedCrisis(crisis);
  };

  if (isLoading || allCrisisPeriods.length === 0) {
    return null;
  }

  const getSeverityConfig = (severity: string) => {
    return severityConfig[severity as keyof typeof severityConfig] || severityConfig.mild;
  };

  const getProgressInCrisis = () => {
    if (!currentCrisis) return 0;
    const totalWeeks = currentCrisis.week_end - currentCrisis.week_start + 1;
    const currentWeekInCrisis = babyAgeWeeks - currentCrisis.week_start + 1;
    return Math.min(100, (currentWeekInCrisis / totalWeeks) * 100);
  };

  return (
    <>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35 }}
      >
        {isInCrisis ? (
          // Active Crisis Alert Card
          <motion.div
            className={`rounded-2xl p-4 shadow-card border ${getSeverityConfig(currentCrisis.severity).borderColor} ${getSeverityConfig(currentCrisis.severity).bgColor}`}
            onClick={openFullCalendar}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <motion.div 
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getSeverityConfig(currentCrisis.severity).color} flex items-center justify-center text-xl`}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {currentCrisis.emoji}
                </motion.div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className={`w-3.5 h-3.5 ${getSeverityConfig(currentCrisis.severity).textColor}`} />
                    <span className={`text-xs font-bold uppercase tracking-wide ${getSeverityConfig(currentCrisis.severity).textColor}`}>
                      Aktiv Kriz Dövrü
                    </span>
                  </div>
                  <h3 className="font-bold text-foreground mt-0.5">
                    {currentCrisis.title_az || currentCrisis.title}
                  </h3>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>

            {/* Progress bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">
                  Həftə {currentCrisis.week_start}-{currentCrisis.week_end}
                </span>
                <span className={`font-medium ${getSeverityConfig(currentCrisis.severity).textColor}`}>
                  {Math.round(getProgressInCrisis())}% keçdi
                </span>
              </div>
              <div className="h-2 bg-white/50 dark:bg-black/20 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full bg-gradient-to-r ${getSeverityConfig(currentCrisis.severity).color} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${getProgressInCrisis()}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {currentCrisis.description_az || currentCrisis.description}
            </p>

            {/* Quick symptoms */}
            {currentCrisis.symptoms_az && currentCrisis.symptoms_az.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {currentCrisis.symptoms_az.slice(0, 3).map((symptom, i) => (
                  <span 
                    key={i}
                    className="px-2 py-1 rounded-full bg-white/60 dark:bg-black/20 text-[10px] font-medium text-foreground"
                  >
                    {symptom}
                  </span>
                ))}
                {currentCrisis.symptoms_az.length > 3 && (
                  <span className="px-2 py-1 text-[10px] text-muted-foreground">
                    +{currentCrisis.symptoms_az.length - 3}
                  </span>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          // No Active Crisis - Show Calendar Preview
          <motion.div
            className="bg-card rounded-2xl p-4 shadow-card border border-border/50"
            onClick={openFullCalendar}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Kriz Təqvimi</h3>
                  <p className="text-xs text-muted-foreground">
                    {upcomingCrises.length > 0 
                      ? `Növbəti: ${upcomingCrises[0].week_start}. həftə`
                      : 'Yaxınlaşan kriz yoxdur'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>

            {/* Upcoming crises preview */}
            {upcomingCrises.length > 0 && (
              <div className="space-y-2">
                {upcomingCrises.map((crisis, index) => (
                  <div 
                    key={crisis.id}
                    className={`flex items-center gap-3 p-2 rounded-xl ${getSeverityConfig(crisis.severity).bgColor}`}
                  >
                    <span className="text-xl">{crisis.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {crisis.title_az || crisis.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Həftə {crisis.week_start}-{crisis.week_end} • {crisis.week_start - babyAgeWeeks} həftə sonra
                      </p>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getSeverityConfig(crisis.severity).bgColor} ${getSeverityConfig(crisis.severity).textColor}`}>
                      {getSeverityConfig(crisis.severity).label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Full Calendar Modal */}
      <AnimatePresence>
        {showFullCalendar && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowFullCalendar(false)}
            />
            <motion.div
              className="relative bg-background rounded-t-3xl w-full max-h-[90vh] overflow-hidden"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {/* Header */}
              <div className="sticky top-0 bg-background/95 backdrop-blur-lg border-b border-border/50 px-4 py-4 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Kriz Təqvimi</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {babyName} • {babyAgeWeeks}. həftə
                    </p>
                  </div>
                  <motion.button
                    onClick={() => setShowFullCalendar(false)}
                    className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Timeline */}
              <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-4 pb-8">
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />
                  
                  {/* Current position indicator */}
                  <motion.div 
                    className="absolute left-3 w-5 h-5 rounded-full bg-primary border-4 border-background shadow-lg z-10"
                    style={{ 
                      top: `${Math.min(95, (babyAgeWeeks / 80) * 100)}%` 
                    }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  
                  <div className="space-y-4">
                    {allCrisisPeriods.map((crisis, index) => {
                      const isPast = babyAgeWeeks > crisis.week_end;
                      const isCurrent = babyAgeWeeks >= crisis.week_start && babyAgeWeeks <= crisis.week_end;
                      const isFuture = babyAgeWeeks < crisis.week_start;
                      
                      return (
                        <motion.div
                          key={crisis.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="relative pl-12"
                        >
                          {/* Timeline dot */}
                          <div className={`absolute left-3 w-5 h-5 rounded-full flex items-center justify-center ${
                            isCurrent 
                              ? `bg-gradient-to-br ${getSeverityConfig(crisis.severity).color} animate-pulse shadow-lg`
                              : isPast
                                ? 'bg-muted'
                                : 'bg-muted/50 border-2 border-dashed border-muted-foreground/30'
                          }`}>
                            {isPast && <Check className="w-3 h-3 text-muted-foreground" />}
                          </div>

                          {/* Card */}
                          <motion.button
                            onClick={() => openCrisisDetail(crisis)}
                            className={`w-full text-left p-4 rounded-2xl border transition-all ${
                              isCurrent 
                                ? `${getSeverityConfig(crisis.severity).bgColor} ${getSeverityConfig(crisis.severity).borderColor} shadow-md`
                                : isPast
                                  ? 'bg-muted/30 border-border/30 opacity-60'
                                  : 'bg-card border-border/50 hover:border-primary/30'
                            }`}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-2xl">{crisis.emoji}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className={`font-bold ${isCurrent ? getSeverityConfig(crisis.severity).textColor : 'text-foreground'}`}>
                                    {crisis.title_az || crisis.title}
                                  </h3>
                                  {isCurrent && (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/50 dark:bg-black/20 ${getSeverityConfig(crisis.severity).textColor}`}>
                                      İNDİ
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  <span>Həftə {crisis.week_start}-{crisis.week_end}</span>
                                  <span>•</span>
                                  <span className={`font-medium ${getSeverityConfig(crisis.severity).textColor}`}>
                                    {getSeverityConfig(crisis.severity).label}
                                  </span>
                                </div>
                                {isCurrent && (
                                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                    {crisis.description_az || crisis.description}
                                  </p>
                                )}
                              </div>
                              <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                            </div>
                          </motion.button>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Crisis Detail Modal */}
      <AnimatePresence>
        {selectedCrisis && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setSelectedCrisis(null)}
            />
            <motion.div
              className="relative bg-background rounded-t-3xl w-full max-h-[85vh] overflow-hidden"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {/* Header with gradient */}
              <div className={`bg-gradient-to-br ${getSeverityConfig(selectedCrisis.severity).color} px-4 py-6 relative`}>
                <motion.button
                  onClick={() => setSelectedCrisis(null)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5 text-white" />
                </motion.button>
                
                <div className="flex items-center gap-4">
                  <motion.div 
                    className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-4xl"
                    animate={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    {selectedCrisis.emoji}
                  </motion.div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {selectedCrisis.title_az || selectedCrisis.title}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3.5 h-3.5 text-white/80" />
                      <span className="text-sm text-white/90">
                        Həftə {selectedCrisis.week_start}-{selectedCrisis.week_end}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs text-white font-medium">
                        {getSeverityConfig(selectedCrisis.severity).label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(85vh-140px)] p-4 space-y-4">
                {/* Description */}
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-sm text-foreground leading-relaxed">
                    {selectedCrisis.description_az || selectedCrisis.description}
                  </p>
                </div>

                {/* Symptoms */}
                {selectedCrisis.symptoms_az && selectedCrisis.symptoms_az.length > 0 && (
                  <div className={`rounded-xl p-4 ${getSeverityConfig(selectedCrisis.severity).bgColor} border ${getSeverityConfig(selectedCrisis.severity).borderColor}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className={`w-4 h-4 ${getSeverityConfig(selectedCrisis.severity).textColor}`} />
                      <h3 className={`font-bold text-sm ${getSeverityConfig(selectedCrisis.severity).textColor}`}>
                        Əlamətlər
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {selectedCrisis.symptoms_az.map((symptom, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${getSeverityConfig(selectedCrisis.severity).textColor.replace('text-', 'bg-')}`} />
                          <span className="text-sm text-foreground">{symptom}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tips */}
                {selectedCrisis.tips_az && selectedCrisis.tips_az.length > 0 && (
                  <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-4 border border-primary/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="w-4 h-4 text-primary" />
                      <h3 className="font-bold text-sm text-primary">Tövsiyələr</h3>
                    </div>
                    <div className="space-y-2">
                      {selectedCrisis.tips_az.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-foreground">{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default BabyCrisisWidget;
