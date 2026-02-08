import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Droplets, Heart, Moon, Sun, Sparkles, 
  ChevronRight, ChevronLeft, TrendingUp, Zap, 
  Apple, Dumbbell, Brain, Flame
} from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { usePhaseTips, PHASE_INFO, CATEGORY_INFO, MenstrualPhase, TipCategory } from '@/hooks/usePhaseTips';
import { format, addDays, subDays, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval } from 'date-fns';
import { az } from 'date-fns/locale';

const FlowDashboard = () => {
  const { getCycleData } = useUserStore();
  const cycleData = getCycleData();
  
  const [selectedCategory, setSelectedCategory] = useState<TipCategory | 'all'>('all');
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // Current phase from cycle data
  const currentPhase: MenstrualPhase = cycleData?.phase || 'follicular';
  const currentDay = cycleData?.currentDay || 1;
  const cycleLength = cycleData?.cycleLength || 28;
  const periodLength = cycleData?.periodLength || 5;
  const lastPeriodDate = cycleData?.lastPeriodDate ? new Date(cycleData.lastPeriodDate) : new Date();
  const nextPeriodDate = cycleData?.nextPeriodDate ? new Date(cycleData.nextPeriodDate) : addDays(lastPeriodDate, cycleLength);
  const fertileStart = cycleData?.fertileWindow?.start ? new Date(cycleData.fertileWindow.start) : addDays(lastPeriodDate, 10);
  const fertileEnd = cycleData?.fertileWindow?.end ? new Date(cycleData.fertileWindow.end) : addDays(lastPeriodDate, 16);

  // Fetch tips for current phase
  const { data: tips = [], isLoading: tipsLoading } = usePhaseTips(currentPhase);

  // Filter tips by category
  const filteredTips = selectedCategory === 'all' 
    ? tips 
    : tips.filter(t => t.category === selectedCategory);

  // Calculate days until next period
  const daysUntilPeriod = differenceInDays(nextPeriodDate, new Date());

  // Get phase progress percentage
  const getPhaseProgress = () => {
    const phaseDays = {
      menstrual: periodLength,
      follicular: 8,
      ovulation: 3,
      luteal: 12
    };
    const phaseStart = {
      menstrual: 1,
      follicular: periodLength + 1,
      ovulation: 14,
      luteal: 17
    };
    const daysInPhase = currentDay - phaseStart[currentPhase] + 1;
    return Math.min(100, (daysInPhase / phaseDays[currentPhase]) * 100);
  };

  // Calendar days
  const calendarDays = useMemo(() => {
    const start = startOfMonth(calendarMonth);
    const end = endOfMonth(calendarMonth);
    return eachDayOfInterval({ start, end });
  }, [calendarMonth]);

  // Get day type for calendar
  const getDayType = (date: Date) => {
    const daysDiff = differenceInDays(date, lastPeriodDate);
    const cycleDay = ((daysDiff % cycleLength) + cycleLength) % cycleLength + 1;

    if (cycleDay <= periodLength) return 'period';
    if (isWithinInterval(date, { start: fertileStart, end: fertileEnd })) return 'fertile';
    if (cycleDay === 14 || cycleDay === 15) return 'ovulation';
    return 'normal';
  };

  const categories: (TipCategory | 'all')[] = ['all', 'nutrition', 'exercise', 'selfcare', 'mood'];

  const categoryIcons: Record<string, any> = {
    all: Sparkles,
    nutrition: Apple,
    exercise: Dumbbell,
    selfcare: Heart,
    mood: Brain
  };

  return (
    <div className="space-y-5">
      {/* Current Phase Hero Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative overflow-hidden rounded-3xl p-5"
        style={{ backgroundColor: PHASE_INFO[currentPhase].color }}
      >
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/10 translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/70 text-sm font-medium mb-1">Hal-hazırda</p>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <span className="text-3xl">{PHASE_INFO[currentPhase].emoji}</span>
                {PHASE_INFO[currentPhase].labelAz}
              </h2>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-xs">Sikl günü</p>
              <p className="text-4xl font-bold text-white">{currentDay}</p>
            </div>
          </div>

          {/* Phase Progress */}
          <div className="bg-white/20 rounded-full h-2 mb-4">
            <motion.div
              className="bg-white rounded-full h-2"
              initial={{ width: 0 }}
              animate={{ width: `${getPhaseProgress()}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/15 rounded-xl p-3 text-center">
              <Droplets className="w-5 h-5 text-white mx-auto mb-1" />
              <p className="text-white text-lg font-bold">{daysUntilPeriod > 0 ? daysUntilPeriod : 0}</p>
              <p className="text-white/70 text-[10px]">gün qaldı</p>
            </div>
            <div className="bg-white/15 rounded-xl p-3 text-center">
              <Calendar className="w-5 h-5 text-white mx-auto mb-1" />
              <p className="text-white text-lg font-bold">{cycleLength}</p>
              <p className="text-white/70 text-[10px]">gün sikl</p>
            </div>
            <div className="bg-white/15 rounded-xl p-3 text-center">
              <Heart className="w-5 h-5 text-white mx-auto mb-1" />
              <p className="text-white text-lg font-bold">{periodLength}</p>
              <p className="text-white/70 text-[10px]">gün period</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mini Calendar */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-2xl p-4 border border-border"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Təqvim
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCalendarMonth(subDays(calendarMonth, 30))}
              className="p-1 hover:bg-muted rounded-lg"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium min-w-[100px] text-center">
              {format(calendarMonth, 'MMMM yyyy', { locale: az })}
            </span>
            <button
              onClick={() => setCalendarMonth(addDays(calendarMonth, 30))}
              className="p-1 hover:bg-muted rounded-lg"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

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
          {/* Empty cells for start of month */}
          {Array.from({ length: calendarDays[0]?.getDay() || 0 }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          
          {calendarDays.map((day) => {
            const dayType = getDayType(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <motion.div
                key={day.toISOString()}
                className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium relative ${
                  isToday ? 'ring-2 ring-primary ring-offset-1' : ''
                } ${
                  dayType === 'period' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                  dayType === 'fertile' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' :
                  dayType === 'ovulation' ? 'bg-pink-200 text-pink-800 dark:bg-pink-800/40 dark:text-pink-300' :
                  'text-foreground hover:bg-muted'
                }`}
                whileHover={{ scale: 1.1 }}
              >
                {format(day, 'd')}
                {dayType === 'ovulation' && (
                  <span className="absolute -top-0.5 -right-0.5 text-[8px]">🌸</span>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <span className="text-xs text-muted-foreground">Period</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-pink-400" />
            <span className="text-xs text-muted-foreground">Məhsuldar</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm">🌸</span>
            <span className="text-xs text-muted-foreground">Ovulyasiya</span>
          </div>
        </div>
      </motion.div>

      {/* Phase Tips Section */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-2xl p-4 border border-border"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5" style={{ color: PHASE_INFO[currentPhase].color }} />
            Bu Faza Üçün Məsləhətlər
          </h3>
          <span 
            className="text-xs font-medium px-2 py-1 rounded-full"
            style={{ 
              backgroundColor: `${PHASE_INFO[currentPhase].color}20`,
              color: PHASE_INFO[currentPhase].color
            }}
          >
            {PHASE_INFO[currentPhase].labelAz}
          </span>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {categories.map(cat => {
            const Icon = categoryIcons[cat];
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat === 'all' ? 'Hamısı' : CATEGORY_INFO[cat].labelAz}
              </button>
            );
          })}
        </div>

        {/* Tips List */}
        {tipsLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredTips.slice(0, 5).map((tip, index) => (
                <motion.div
                  key={tip.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-muted/50 rounded-xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{tip.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-foreground text-sm">
                          {tip.title_az || tip.title}
                        </h4>
                        <span 
                          className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{ 
                            backgroundColor: `${PHASE_INFO[currentPhase].color}15`,
                            color: PHASE_INFO[currentPhase].color
                          }}
                        >
                          {CATEGORY_INFO[tip.category].labelAz}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {tip.content_az || tip.content}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredTips.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">Bu kateqoriyada məsləhət yoxdur</p>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Upcoming Events */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-card rounded-2xl p-4 border border-border"
      >
        <h3 className="font-bold text-foreground flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          Qarşıdan Gələnlər
        </h3>

        <div className="space-y-3">
          {/* Next Period */}
          <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
              <Droplets className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground text-sm">Növbəti Period</p>
              <p className="text-xs text-muted-foreground">
                {format(nextPeriodDate, 'd MMMM', { locale: az })} • {daysUntilPeriod > 0 ? `${daysUntilPeriod} gün qaldı` : 'Bu gün'}
              </p>
            </div>
          </div>

          {/* Fertile Window */}
          <div className="flex items-center gap-3 bg-pink-50 dark:bg-pink-900/20 rounded-xl p-3">
            <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center">
              <Heart className="w-5 h-5 text-pink-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground text-sm">Məhsuldar Pəncərə</p>
              <p className="text-xs text-muted-foreground">
                {format(fertileStart, 'd MMMM', { locale: az })} - {format(fertileEnd, 'd MMMM', { locale: az })}
              </p>
            </div>
          </div>

          {/* Ovulation */}
          <div className="flex items-center gap-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground text-sm">Ovulyasiya Günü</p>
              <p className="text-xs text-muted-foreground">
                {format(addDays(lastPeriodDate, 14), 'd MMMM', { locale: az })}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Daily Insights */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-2xl p-4 border border-orange-100 dark:border-orange-800/30">
          <Flame className="w-6 h-6 text-orange-500 mb-2" />
          <p className="font-bold text-foreground text-lg">
            {currentPhase === 'follicular' || currentPhase === 'ovulation' ? 'Yüksək' : 'Normal'}
          </p>
          <p className="text-xs text-muted-foreground">Enerji Səviyyəsi</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-4 border border-blue-100 dark:border-blue-800/30">
          <Moon className="w-6 h-6 text-blue-500 mb-2" />
          <p className="font-bold text-foreground text-lg">
            {currentPhase === 'luteal' ? '8-9 saat' : '7-8 saat'}
          </p>
          <p className="text-xs text-muted-foreground">Tövsiyə Edilən Yuxu</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-4 border border-green-100 dark:border-green-800/30">
          <Apple className="w-6 h-6 text-green-500 mb-2" />
          <p className="font-bold text-foreground text-lg">
            {currentPhase === 'menstrual' ? 'Dəmir' : currentPhase === 'luteal' ? 'Maqnezium' : 'Protein'}
          </p>
          <p className="text-xs text-muted-foreground">Fokus Qida</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-2xl p-4 border border-purple-100 dark:border-purple-800/30">
          <Dumbbell className="w-6 h-6 text-purple-500 mb-2" />
          <p className="font-bold text-foreground text-lg">
            {currentPhase === 'menstrual' ? 'Yüngül' : currentPhase === 'ovulation' ? 'İntensiv' : 'Orta'}
          </p>
          <p className="text-xs text-muted-foreground">Məşq İntensivliyi</p>
        </div>
      </motion.div>
    </div>
  );
};

export default FlowDashboard;
