import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, Droplets } from 'lucide-react';
import { format, addDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isAfter } from 'date-fns';
import { az } from 'date-fns/locale';
import { useUserStore } from '@/store/userStore';
import { usePeriodDayLogs, useTogglePeriodDay } from '@/hooks/usePeriodDayLogs';
import { getPhaseInfoForDate } from '@/lib/cycle-utils';
import { toast } from 'sonner';

const FLOW_OPTIONS = [
  { key: 'light', label: 'Yüngül', emoji: '💧', color: 'bg-red-200 dark:bg-red-900/30' },
  { key: 'medium', label: 'Orta', emoji: '💧💧', color: 'bg-red-300 dark:bg-red-800/40' },
  { key: 'heavy', label: 'Güclü', emoji: '💧💧💧', color: 'bg-red-400 dark:bg-red-700/50' },
];

const FlowPeriodCalendar = () => {
  const { cycleLength, periodLength, getCycleData } = useUserStore();
  const cycleData = getCycleData();
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showFlowPicker, setShowFlowPicker] = useState(false);

  const { data: periodLogs = [] } = usePeriodDayLogs(calendarMonth);
  const toggleMutation = useTogglePeriodDay();

  const lastPeriodDate = cycleData?.lastPeriodDate
    ? new Date(cycleData.lastPeriodDate)
    : new Date();

  // Set of logged period day strings for fast lookup
  const loggedPeriodDays = useMemo(() => {
    const set = new Set<string>();
    periodLogs.forEach(log => set.add(log.log_date));
    return set;
  }, [periodLogs]);

  // Get flow intensity for a date
  const getFlowIntensity = (dateStr: string) => {
    return periodLogs.find(l => l.log_date === dateStr)?.flow_intensity || null;
  };

  const calendarDays = useMemo(() => {
    const start = startOfMonth(calendarMonth);
    const end = endOfMonth(calendarMonth);
    return eachDayOfInterval({ start, end });
  }, [calendarMonth]);

  const getDayInfo = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const isLogged = loggedPeriodDays.has(dateStr);
    const phaseInfo = getPhaseInfoForDate(date, lastPeriodDate, cycleLength, periodLength);
    const isPredictedPeriod = !isLogged && phaseInfo.isPeriodDay;
    const isFutureDate = isAfter(date, new Date());

    return {
      dateStr,
      isLogged,
      isPredictedPeriod,
      isFertile: phaseInfo.isFertileDay && !isLogged,
      isOvulation: phaseInfo.isOvulationDay && !isLogged,
      flowIntensity: getFlowIntensity(dateStr),
      isFutureDate,
    };
  };

  const handleDayTap = (date: Date) => {
    if (isAfter(date, new Date())) return; // Can't log future
    const dateStr = format(date, 'yyyy-MM-dd');
    const isLogged = loggedPeriodDays.has(dateStr);

    if (isLogged) {
      // Remove directly
      toggleMutation.mutate({ date }, {
        onSuccess: () => {
          toast.success('Period günü silindi', {
            description: format(date, 'd MMMM', { locale: az }),
          });
        },
      });
    } else {
      // Show flow intensity picker
      setSelectedDate(date);
      setShowFlowPicker(true);
    }
  };

  const handleFlowSelect = (intensity: string) => {
    if (!selectedDate) return;
    toggleMutation.mutate({ date: selectedDate, flowIntensity: intensity }, {
      onSuccess: () => {
        toast.success('Period günü qeyd edildi 🩸', {
          description: format(selectedDate, 'd MMMM', { locale: az }),
        });
        setShowFlowPicker(false);
        setSelectedDate(null);
      },
    });
  };

  const getFlowDotColor = (intensity: string | null) => {
    switch (intensity) {
      case 'light': return 'bg-red-300';
      case 'heavy': return 'bg-red-600';
      default: return 'bg-red-400';
    }
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="bg-card rounded-2xl p-4 border border-border"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Period Təqvimi
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
            className="p-1.5 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium min-w-[110px] text-center">
            {format(calendarMonth, 'MMMM yyyy', { locale: az })}
          </span>
          <button
            onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
            className="p-1.5 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Instruction */}
      <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
        <Droplets className="w-3.5 h-3.5" />
        Günə toxunaraq period günlərini qeyd edin
      </p>

      {/* Day Labels */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['B', 'BE', 'Ç', 'ÇA', 'C', 'C', 'Ş'].map((day, i) => (
          <div key={i} className="text-center text-xs text-muted-foreground font-medium py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: calendarDays[0]?.getDay() || 0 }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {calendarDays.map((day) => {
          const info = getDayInfo(day);
          const isToday = isSameDay(day, new Date());

          return (
            <motion.button
              key={day.toISOString()}
              onClick={() => handleDayTap(day)}
              disabled={info.isFutureDate || toggleMutation.isPending}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-medium relative transition-all ${
                isToday ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''
              } ${
                info.isLogged
                  ? info.flowIntensity === 'heavy'
                    ? 'bg-red-500/90 text-white dark:bg-red-600/80'
                    : info.flowIntensity === 'light'
                    ? 'bg-red-200 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                    : 'bg-red-400/80 text-white dark:bg-red-500/60'
                  : info.isPredictedPeriod
                  ? 'bg-red-100/60 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-dashed border-red-300 dark:border-red-700'
                  : info.isOvulation
                  ? 'bg-pink-200 text-pink-800 dark:bg-pink-800/40 dark:text-pink-300'
                  : info.isFertile
                  ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'
                  : info.isFutureDate
                  ? 'text-muted-foreground/40'
                  : 'text-foreground hover:bg-muted active:bg-muted/80'
              }`}
              whileTap={!info.isFutureDate ? { scale: 0.85 } : undefined}
            >
              {format(day, 'd')}
              {/* Flow intensity dot */}
              {info.isLogged && (
                <span className={`absolute bottom-0.5 w-1.5 h-1.5 rounded-full ${getFlowDotColor(info.flowIntensity)}`} />
              )}
              {/* Predicted period indicator */}
              {info.isPredictedPeriod && !info.isLogged && (
                <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-red-300 dark:bg-red-600" />
              )}
              {info.isOvulation && (
                <span className="absolute -top-0.5 -right-0.5 text-[8px]">🌸</span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-4 pt-3 border-t border-border">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <span className="text-[10px] text-muted-foreground">Qeyd edilən</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-200 border border-dashed border-red-300" />
          <span className="text-[10px] text-muted-foreground">Proqnoz</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-pink-300" />
          <span className="text-[10px] text-muted-foreground">Məhsuldar</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs">🌸</span>
          <span className="text-[10px] text-muted-foreground">Ovulyasiya</span>
        </div>
      </div>

      {/* Flow Intensity Picker Bottom Sheet */}
      <AnimatePresence>
        {showFlowPicker && selectedDate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
            onClick={() => { setShowFlowPicker(false); setSelectedDate(null); }}
          >
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-card rounded-t-3xl p-6 pb-24"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-4" />
              <h4 className="font-bold text-foreground text-center mb-1">
                🩸 {format(selectedDate, 'd MMMM yyyy', { locale: az })}
              </h4>
              <p className="text-sm text-muted-foreground text-center mb-5">
                Axıntı intensivliyini seçin
              </p>

              <div className="grid grid-cols-3 gap-3">
                {FLOW_OPTIONS.map((option) => (
                  <motion.button
                    key={option.key}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleFlowSelect(option.key)}
                    disabled={toggleMutation.isPending}
                    className={`${option.color} rounded-2xl p-4 flex flex-col items-center gap-2 transition-all hover:opacity-80`}
                  >
                    <span className="text-2xl">{option.emoji}</span>
                    <span className="text-xs font-semibold text-foreground">{option.label}</span>
                  </motion.button>
                ))}
              </div>

              <button
                onClick={() => { setShowFlowPicker(false); setSelectedDate(null); }}
                className="w-full mt-4 text-sm text-muted-foreground py-2"
              >
                Ləğv et
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FlowPeriodCalendar;
