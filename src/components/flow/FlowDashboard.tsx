import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Droplets, Heart, Moon, Sparkles, 
  TrendingUp,
  Apple, Dumbbell, Brain, Flame, CircleDot
} from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { usePhaseTips, PHASE_INFO, CATEGORY_INFO, MenstrualPhase, TipCategory } from '@/hooks/usePhaseTips';
import { format, addDays, differenceInDays } from 'date-fns';
import { az } from 'date-fns/locale';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import FlowDailyLogger from './FlowDailyLogger';
import FlowMoodChart from './FlowMoodChart';
import FlowCycleStats from './FlowCycleStats';
import FlowRemindersCard from './FlowRemindersCard';
import FlowPeriodCalendar from './FlowPeriodCalendar';
import { getPhaseInfoForDate, getNextPeriodDate, getFertileWindow } from '@/lib/cycle-utils';
const FlowDashboard = () => {
  const { getCycleData, cycleLength, periodLength, setLastPeriodDate } = useUserStore();
  const cycleData = getCycleData();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedCategory, setSelectedCategory] = useState<TipCategory | 'all'>('all');
  const [showPeriodConfirm, setShowPeriodConfirm] = useState(false);
  const [showPeriodEndConfirm, setShowPeriodEndConfirm] = useState(false);
  const [markingPeriod, setMarkingPeriod] = useState(false);
  const [periodStartDate, setPeriodStartDate] = useState<Date>(new Date());
  const [periodEndDate, setPeriodEndDate] = useState<Date>(new Date());

  const handleMarkPeriodStarted = async () => {
    setMarkingPeriod(true);
    try {
      const selectedDay = new Date(periodStartDate);
      selectedDay.setHours(0, 0, 0, 0);
      
      // Update local store
      setLastPeriodDate(selectedDay);

      // Sync to database
      if (user?.id) {
        const dateStr = selectedDay.toISOString().split('T')[0];
        
        // Update profile
        await supabase
          .from('profiles')
          .update({ last_period_date: todayStr })
          .eq('user_id', user.id);

        // Log to cycle_history
        const { data: lastCycle } = await supabase
          .from('cycle_history')
          .select('cycle_number, start_date')
          .eq('user_id', user.id)
          .order('cycle_number', { ascending: false })
          .limit(1)
          .single();

        const nextCycleNumber = (lastCycle?.cycle_number || 0) + 1;
        
        // Close previous cycle if exists
        if (lastCycle?.start_date) {
          const prevStart = new Date(lastCycle.start_date);
          const cycleLengthCalc = differenceInDays(today, prevStart);
          await supabase
            .from('cycle_history')
            .update({ 
              end_date: todayStr, 
              cycle_length: cycleLengthCalc > 0 ? cycleLengthCalc : null 
            })
            .eq('user_id', user.id)
            .eq('cycle_number', lastCycle.cycle_number);
        }

        // Insert new cycle
        await supabase
          .from('cycle_history')
          .insert({
            user_id: user.id,
            cycle_number: nextCycleNumber,
            start_date: todayStr,
            period_length: periodLength,
          });

        queryClient.invalidateQueries({ queryKey: ['cycle-history'] });
      }

      toast.success('Period başlanğıcı qeyd edildi! 🩸', {
        description: format(today, 'd MMMM yyyy', { locale: az }),
      });
    } catch (error) {
      console.error('Error marking period:', error);
      toast.error('Xəta baş verdi, yenidən cəhd edin');
    } finally {
      setMarkingPeriod(false);
      setShowPeriodConfirm(false);
    }
  };

  const handleMarkPeriodEnded = async () => {
    setMarkingPeriod(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (user?.id && cycleData?.lastPeriodDate) {
        const lastPeriod = new Date(cycleData.lastPeriodDate);
        const actualPeriodLength = differenceInDays(today, lastPeriod) + 1;

        // Update profile period_length
        await supabase
          .from('profiles')
          .update({ period_length: actualPeriodLength })
          .eq('user_id', user.id);

        // Update current cycle's period_length in cycle_history
        const { data: currentCycle } = await supabase
          .from('cycle_history')
          .select('cycle_number')
          .eq('user_id', user.id)
          .order('cycle_number', { ascending: false })
          .limit(1)
          .single();

        if (currentCycle) {
          await supabase
            .from('cycle_history')
            .update({ period_length: actualPeriodLength })
            .eq('user_id', user.id)
            .eq('cycle_number', currentCycle.cycle_number);
        }

        // Update local store
        useUserStore.getState().setPeriodLength(actualPeriodLength);

        queryClient.invalidateQueries({ queryKey: ['cycle-history'] });

        toast.success('Period bitişi qeyd edildi! ✅', {
          description: `Period ${actualPeriodLength} gün davam etdi`,
        });
      }
    } catch (error) {
      console.error('Error marking period end:', error);
      toast.error('Xəta baş verdi, yenidən cəhd edin');
    } finally {
      setMarkingPeriod(false);
      setShowPeriodEndConfirm(false);
    }
  };

  // Fetch upcoming labels from app_settings
  const { data: upcomingLabels } = useQuery({
    queryKey: ['flow-upcoming-labels'],
    queryFn: async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['flow_label_next_period', 'flow_label_fertile_window', 'flow_label_ovulation_day']);
      const labels: Record<string, string> = {};
      data?.forEach(item => {
        const val = typeof item.value === 'string' ? item.value : JSON.stringify(item.value);
        labels[item.key] = val.replace(/^"|"$/g, '');
      });
      return labels;
    },
    staleTime: 5 * 60 * 1000,
  });

  const labelNextPeriod = upcomingLabels?.flow_label_next_period || 'Növbəti Period';
  const labelFertileWindow = upcomingLabels?.flow_label_fertile_window || 'Reproduktiv Dövr';
  const labelOvulationDay = upcomingLabels?.flow_label_ovulation_day || 'Ovulyasiya Günü';

  // Get last period date
  const lastPeriodDate = cycleData?.lastPeriodDate 
    ? new Date(cycleData.lastPeriodDate) 
    : new Date();

  // Calculate current phase using accurate utility
  const today = new Date();
  const currentPhaseInfo = getPhaseInfoForDate(today, lastPeriodDate, cycleLength, periodLength);
  const currentPhase: MenstrualPhase = currentPhaseInfo.phase;
  const currentDay = currentPhaseInfo.dayInCycle;

  // Calculate next period and fertile window
  const nextPeriodDate = getNextPeriodDate(lastPeriodDate, cycleLength);
  const fertileWindowData = getFertileWindow(lastPeriodDate, cycleLength);
  const fertileStart = fertileWindowData.start;
  const fertileEnd = fertileWindowData.end;

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
              <p className="text-white/70 text-xs">Tsikl günü</p>
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
              <p className="text-white/70 text-[10px]">gün tsikl</p>
            </div>
            <div className="bg-white/15 rounded-xl p-3 text-center">
              <Heart className="w-5 h-5 text-white mx-auto mb-1" />
              <p className="text-white text-lg font-bold">{periodLength}</p>
              <p className="text-white/70 text-[10px]">gün period</p>
            </div>
          </div>

          {/* Period Action Buttons */}
          <div className="mt-4 flex gap-2">
            <motion.div className="flex-1" whileTap={{ scale: 0.97 }}>
              <Button
                onClick={() => setShowPeriodConfirm(true)}
                className="w-full bg-white/20 hover:bg-white/30 backdrop-blur text-white border-0 rounded-xl h-12 text-sm font-bold gap-2"
                variant="outline"
              >
                <CircleDot className="w-5 h-5" />
                Periodum başladı
              </Button>
            </motion.div>
            {currentPhase === 'menstrual' && (
              <motion.div className="flex-1" whileTap={{ scale: 0.97 }}>
                <Button
                  onClick={() => setShowPeriodEndConfirm(true)}
                  className="w-full bg-white/30 hover:bg-white/40 backdrop-blur text-white border-0 rounded-xl h-12 text-sm font-bold gap-2"
                  variant="outline"
                >
                  ✅ Periodum bitdi
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Interactive Period Calendar (Apple Health style) */}
      <FlowPeriodCalendar />

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
              <p className="font-semibold text-foreground text-sm">{labelNextPeriod}</p>
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
              <p className="font-semibold text-foreground text-sm">{labelFertileWindow}</p>
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
              <p className="font-semibold text-foreground text-sm">{labelOvulationDay}</p>
              <p className="text-xs text-muted-foreground">
                {format(addDays(lastPeriodDate, 14), 'd MMMM', { locale: az })}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Daily Logger */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <FlowDailyLogger compact />
      </motion.div>

      {/* Mood Chart */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <FlowMoodChart />
      </motion.div>

      {/* Cycle Stats */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <FlowCycleStats />
      </motion.div>

      {/* Reminders */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <FlowRemindersCard />
      </motion.div>

      {/* Daily Insights */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
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

      {/* Period Start Confirmation Dialog */}
      <AlertDialog open={showPeriodConfirm} onOpenChange={setShowPeriodConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>🩸 Periodum başladı</AlertDialogTitle>
            <AlertDialogDescription>
              Bu gün ({format(new Date(), 'd MMMM yyyy', { locale: az })}) period başlanğıcı olaraq qeyd edilsin? 
              Bu, tsikl hesablamalarınızı yeniləyəcək.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={markingPeriod}>Ləğv et</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleMarkPeriodStarted}
              disabled={markingPeriod}
              className="bg-red-500 hover:bg-red-600"
            >
              {markingPeriod ? 'Qeyd edilir...' : 'Bəli, qeyd et'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Period End Confirmation Dialog */}
      <AlertDialog open={showPeriodEndConfirm} onOpenChange={setShowPeriodEndConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>✅ Periodum bitdi</AlertDialogTitle>
            <AlertDialogDescription>
              Periodunuz bu gün ({format(new Date(), 'd MMMM yyyy', { locale: az })}) bitdi olaraq qeyd edilsin?
              {cycleData?.lastPeriodDate && (
                <> Period müddəti: <strong>{differenceInDays(new Date(), new Date(cycleData.lastPeriodDate)) + 1} gün</strong></>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={markingPeriod}>Ləğv et</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleMarkPeriodEnded}
              disabled={markingPeriod}
              className="bg-green-600 hover:bg-green-700"
            >
              {markingPeriod ? 'Qeyd edilir...' : 'Bəli, bitdi'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FlowDashboard;
