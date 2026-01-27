import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Droplets, Moon, Utensils, Activity, Plus, TrendingUp, Heart, Sparkles, 
  Bell, ChevronRight, Flame, Target, Calendar, Zap, Sun, Cloud, Wind,
  ThermometerSun, Pill, Baby, Footprints, Scale, Clock, Star, Award,
  MessageCircle, Check, Lightbulb, BookOpen
} from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useTimerStore } from '@/store/timerStore';
import { FRUIT_SIZES } from '@/types/anacan';
import { hapticFeedback } from '@/lib/native';
import { useToast } from '@/hooks/use-toast';
import { useDailyLogs } from '@/hooks/useDailyLogs';
import { useBabyLogs } from '@/hooks/useBabyLogs';
import { useAuth } from '@/hooks/useAuth';
import { useKickSessions } from '@/hooks/useKickSessions';
import { useWeightEntries } from '@/hooks/useWeightEntries';
import { useBabyMilestones } from '@/hooks/useBabyMilestones';
import { useAchievements } from '@/hooks/useAchievements';
import { useWeeklyTips } from '@/hooks/useDynamicContent';
import { usePregnancyContentByDay } from '@/hooks/usePregnancyContent';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useNotifications } from '@/hooks/useNotifications';
import { useFruitImages, getDynamicFruitData } from '@/hooks/useFruitData';
import { useTrimesterTips } from '@/hooks/useTrimesterTips';
import { useFlowSymptoms, useFlowPhaseTips, useFlowInsights } from '@/hooks/useFlowData';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { formatDateAz } from '@/lib/date-utils';
import FeedingHistoryPanel from '@/components/baby/FeedingHistoryPanel';

// Fetus images by month
import FetusMonth1 from '@/assets/fetus/month-1.svg';
import FetusMonth2 from '@/assets/fetus/month-2.svg';
import FetusMonth3 from '@/assets/fetus/month-3.svg';
import FetusMonth4 from '@/assets/fetus/month-4.svg';
import FetusMonth5 from '@/assets/fetus/month-5.svg';
import FetusMonth6 from '@/assets/fetus/month-6.svg';
import FetusMonth7 from '@/assets/fetus/month-7.svg';
import FetusMonth8 from '@/assets/fetus/month-8.svg';
import FetusMonth9 from '@/assets/fetus/month-9.svg';

const FETUS_IMAGES: { [key: number]: string } = {
  1: FetusMonth1,
  2: FetusMonth2,
  3: FetusMonth3,
  4: FetusMonth4,
  5: FetusMonth5,
  6: FetusMonth6,
  7: FetusMonth7,
  8: FetusMonth8,
  9: FetusMonth9,
};

interface QuickActionProps {
  icon: any;
  label: string;
  color: string;
  value?: string;
  onClick?: () => void;
}

const QuickActionButton = ({ icon: Icon, label, color, value, onClick }: QuickActionProps) => (
  <motion.button 
    onClick={async () => {
      await hapticFeedback.light();
      onClick?.();
    }}
    className={`${color} p-3 rounded-xl flex flex-col items-center gap-1 shadow-card relative overflow-hidden`}
    whileHover={{ scale: 1.05, y: -2 }}
    whileTap={{ scale: 0.95 }}
  >
    <Icon className="w-5 h-5" />
    <span className="text-[10px] font-bold">{label}</span>
    {value && (
      <span className="absolute top-1.5 right-1.5 text-[9px] font-bold bg-white/30 px-1 py-0.5 rounded-full">
        {value}
      </span>
    )}
  </motion.button>
);

// Animated Progress Ring
const ProgressRing = ({ progress, size = 100, strokeWidth = 8, color = "stroke-primary" }: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        className="stroke-muted"
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        className={color}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: "easeOut" }}
        style={{ strokeDasharray: circumference }}
      />
    </svg>
  );
};

const FlowDashboard = () => {
  const { getCycleData, name } = useUserStore();
  const { toast } = useToast();
  const { todayLog, updateWaterIntake, updateSymptoms, loading: logsLoading } = useDailyLogs();
  const cycleData = getCycleData();
  
  // Fetch dynamic data from database
  const { data: dbSymptoms = [] } = useFlowSymptoms();
  const { data: dbPhaseTips = [] } = useFlowPhaseTips(cycleData?.phase);
  const { data: dbInsights = [] } = useFlowInsights(cycleData?.phase);
  
  // Use data from DB or defaults
  const waterCount = todayLog?.water_intake || 0;
  const selectedSymptoms = todayLog?.symptoms || [];

  if (!cycleData) return null;

  const phaseData = {
    menstrual: { 
      message: 'Menstruasiya dövrünüzdesiniz. Özünüzə qulluq edin 💕',
      emoji: '🌸',
      color: 'from-rose-500 to-pink-600',
      phaseName: 'Menstruasiya'
    },
    follicular: { 
      message: 'Enerji artır! Yeni layihələrə başlamaq üçün əla vaxtdır ✨',
      emoji: '🌱',
      color: 'from-emerald-500 to-teal-600',
      phaseName: 'Follikulyar'
    },
    ovulation: { 
      message: 'Fertil günlərinizdəsiniz. Enerji ən yüksək səviyyədədir! 🌟',
      emoji: '✨',
      color: 'from-amber-500 to-orange-600',
      phaseName: 'Ovulyasiya'
    },
    luteal: { 
      message: 'Sakit qalın, PMS yaxınlaşır. Özünüzə yumşaq olun 🌸',
      emoji: '🌙',
      color: 'from-violet-500 to-purple-600',
      phaseName: 'Luteal'
    },
  };

  const currentPhase = phaseData[cycleData.phase];
  const progress = (cycleData.currentDay / cycleData.cycleLength) * 100;

  // Use DB symptoms if available, else fallback
  const symptoms = dbSymptoms.length > 0 
    ? dbSymptoms.map(s => ({ id: s.symptom_id, label: s.label_az || s.label, emoji: s.emoji }))
    : [
        { id: 'headache', label: 'Baş ağrısı', emoji: '🤕' },
        { id: 'tired', label: 'Yorğunluq', emoji: '😴' },
        { id: 'cramps', label: 'Sancı', emoji: '😣' },
        { id: 'mood', label: 'Əsəbilik', emoji: '😤' },
        { id: 'bloating', label: 'Şişkinlik', emoji: '🎈' },
        { id: 'acne', label: 'Sızanaq', emoji: '😔' },
      ];

  // Use DB tips if available
  const phaseTips = dbPhaseTips.length > 0
    ? dbPhaseTips.map(t => ({ text: t.tip_text_az || t.tip_text, emoji: t.emoji }))
    : [];

  const toggleSymptom = async (symptomId: string) => {
    await hapticFeedback.light();
    const newSymptoms = selectedSymptoms.includes(symptomId) 
      ? selectedSymptoms.filter(s => s !== symptomId)
      : [...selectedSymptoms, symptomId];
    await updateSymptoms(newSymptoms);
  };

  const addWater = async () => {
    await hapticFeedback.medium();
    await updateWaterIntake(1);
    toast({
      title: "Su əlavə edildi! 💧",
      description: `${waterCount + 1}/8 stəkan`,
    });
  };

  return (
    <div className="space-y-2">
      {/* Main Cycle Card with Progress Ring */}
      <motion.div 
        className="relative overflow-hidden rounded-2xl gradient-primary p-4 text-white shadow-elevated"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-white/5 blur-xl" />
        
        <div className="relative z-10 flex items-center gap-4">
          {/* Progress Ring */}
          <div className="relative">
            <ProgressRing progress={progress} size={90} strokeWidth={8} color="stroke-white" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black">{cycleData.currentDay}</span>
              <span className="text-[10px] text-white/70">/ {cycleData.cycleLength}</span>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-2xl">{currentPhase.emoji}</span>
              <span className="text-xs font-bold uppercase tracking-wider text-white/80">
                {currentPhase.phaseName}
              </span>
            </div>
            <p className="text-white/90 text-xs leading-relaxed">{currentPhase.message}</p>
          </div>
        </div>
      </motion.div>

      {/* Daily Goals */}
      <motion.div 
        className="grid grid-cols-3 gap-1.5"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <motion.button
          onClick={addWater}
          className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl p-2.5 text-white text-center relative overflow-hidden"
          whileTap={{ scale: 0.95 }}
        >
          <div className="absolute inset-0 bg-white/10" style={{ height: `${(waterCount / 8) * 100}%`, bottom: 0, top: 'auto' }} />
          <div className="relative z-10">
            <Droplets className="w-5 h-5 mx-auto mb-0.5" />
            <p className="text-lg font-black">{waterCount}</p>
            <p className="text-[9px] text-white/80">/8 stəkan</p>
          </div>
        </motion.button>

        <div className="bg-gradient-to-br from-violet-400 to-purple-600 rounded-xl p-2.5 text-white text-center">
          <Moon className="w-5 h-5 mx-auto mb-0.5" />
          <p className="text-lg font-black">7.5</p>
          <p className="text-[9px] text-white/80">saat yuxu</p>
          <p className="text-[8px] text-white/60 mt-0.5">tövsiyə edilir</p>
        </div>

        <div className="bg-gradient-to-br from-amber-400 to-orange-600 rounded-xl p-2.5 text-white text-center">
          <Flame className="w-5 h-5 mx-auto mb-0.5" />
          <p className="text-lg font-black">1,850</p>
          <p className="text-[9px] text-white/80">kalori</p>
          <p className="text-[8px] text-white/60 mt-0.5">tövsiyə edilir</p>
        </div>
      </motion.div>

      {/* Symptoms Selection - From Database */}
      <motion.div 
        className="bg-card rounded-xl p-3 shadow-card border border-border/50"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-foreground">Bugünkü simptomlar</h3>
          <span className="text-[10px] text-primary font-bold">{selectedSymptoms.length} seçildi</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {symptoms.map((symptom) => (
            <motion.button 
              key={symptom.id}
              onClick={() => toggleSymptom(symptom.id)}
              className={`px-3 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                selectedSymptoms.includes(symptom.id)
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-muted text-muted-foreground hover:bg-primary/10'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-sm">{symptom.emoji}</span>
              {symptom.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Phase Tips - From Database */}
      {phaseTips.length > 0 && (
        <motion.div 
          className="bg-gradient-to-r from-flow/10 to-flow-light/10 dark:from-flow/20 dark:to-flow-light/20 rounded-xl p-3 border border-flow/20"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-flow" />
            <h4 className="text-xs font-bold text-foreground">{currentPhase.phaseName} fazası üçün tövsiyələr</h4>
          </div>
          <div className="space-y-1">
            {phaseTips.slice(0, 4).map((tip, index) => (
              <motion.div 
                key={index}
                className="flex items-center gap-2 p-2 bg-card/60 dark:bg-card/80 rounded-lg"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <span className="text-sm">{tip.emoji}</span>
                <span className="text-xs text-foreground">{tip.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Health Insights - From Database */}
      {dbInsights.length > 0 && (
        <motion.div 
          className="bg-card rounded-xl p-3 shadow-card border border-border/50"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <BookOpen className="w-3.5 h-3.5 text-flow" />
            <h4 className="text-xs font-bold text-foreground">Sağlamlıq məsləhətləri</h4>
          </div>
          <div className="space-y-2">
            {dbInsights.slice(0, 2).map((insight, index) => (
              <motion.div 
                key={insight.id}
                className="p-3 bg-muted/50 dark:bg-muted/30 rounded-lg"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 + index * 0.1 }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{insight.emoji}</span>
                  <h5 className="text-sm font-bold text-foreground">{insight.title_az || insight.title}</h5>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {insight.content_az || insight.content}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Next Period Prediction */}
      <motion.div 
        className="bg-card rounded-xl p-3 shadow-card border border-border/50"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Növbəti menstruasiya</p>
            <p className="text-base font-bold text-foreground mt-0.5">
              {formatDateAz(cycleData.nextPeriodDate)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Qalır</p>
            <p className="text-base font-bold text-flow">
              {Math.max(0, Math.ceil((cycleData.nextPeriodDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} gün
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const BumpDashboard = ({ onNavigateToTool }: { onNavigateToTool?: (tool: string) => void }) => {
  const { getPregnancyData } = useUserStore();
  const { toast } = useToast();
  const pregData = getPregnancyData();
  const { todayLog, updateWaterIntake, updateMood } = useDailyLogs();
  const { getTodayStats, addSession } = useKickSessions();
  const { entries: weightEntries } = useWeightEntries();
  const { data: fruitImages = [] } = useFruitImages();
  
  // Calculate current pregnancy day (1-280)
  const pregnancyDay = pregData?.dueDate 
    ? Math.max(1, 280 - Math.ceil((pregData.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 1;
  
  // Fetch weekly tip from database
  const { data: weeklyTips = [] } = useWeeklyTips(pregData?.currentWeek, 'bump');
  const currentWeekTip = weeklyTips[0];
  
  // Fetch dynamic pregnancy content by day
  const { data: dayContent } = usePregnancyContentByDay(pregnancyDay);
  
  // Fetch dynamic trimester tips from database
  const { data: dynamicTrimesterTips = [] } = useTrimesterTips(pregData?.trimester);
  
  const todayStats = getTodayStats();
  const kickCount = todayStats.totalKicks;
  const waterCount = todayLog?.water_intake || 0;
  const currentMood = todayLog?.mood || 0;
  
  // Calculate weight gain from first entry
  const latestWeight = weightEntries[0]?.weight;
  const firstWeight = weightEntries[weightEntries.length - 1]?.weight;
  const weightGain = latestWeight && firstWeight ? (latestWeight - firstWeight).toFixed(1) : '0';

  if (!pregData) return null;
  
  // Trimester color scheme
  const getTrimesterColors = (trimester: number) => {
    switch (trimester) {
      case 1:
        return {
          bg: 'from-green-500/10 via-green-400/5 to-green-500/10 dark:from-green-500/20 dark:via-green-400/10 dark:to-green-500/20',
          border: 'border-green-500/20',
          accent: 'bg-green-500/10 dark:bg-green-500/20',
          text: 'text-green-600 dark:text-green-400',
          badge: 'bg-green-500/10 text-green-600 dark:text-green-400',
          progress: 'bg-green-500',
          icon: 'text-green-600 dark:text-green-400',
        };
      case 2:
        return {
          bg: 'from-amber-500/10 via-amber-400/5 to-amber-500/10 dark:from-amber-500/20 dark:via-amber-400/10 dark:to-amber-500/20',
          border: 'border-amber-500/20',
          accent: 'bg-amber-500/10 dark:bg-amber-500/20',
          text: 'text-amber-600 dark:text-amber-400',
          badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
          progress: 'bg-amber-500',
          icon: 'text-amber-600 dark:text-amber-400',
        };
      case 3:
      default:
        return {
          bg: 'from-primary/10 via-primary/5 to-primary/10 dark:from-primary/20 dark:via-primary/10 dark:to-primary/20',
          border: 'border-primary/20',
          accent: 'bg-primary/10 dark:bg-primary/20',
          text: 'text-primary',
          badge: 'bg-primary/10 text-primary',
          progress: 'bg-primary',
          icon: 'text-primary',
        };
    }
  };
  
  const trimesterColors = getTrimesterColors(pregData.trimester);
  
  // Trimester info for display
  const getTrimesterInfo = (trimester: number) => {
    switch (trimester) {
      case 1:
        return { title: '1-ci Trimester Tövsiyələri', emoji: '🌱' };
      case 2:
        return { title: '2-ci Trimester Tövsiyələri', emoji: '🌸' };
      case 3:
      default:
        return { title: '3-cü Trimester Tövsiyələri', emoji: '🍼' };
    }
  };
  
  const trimesterInfo = getTrimesterInfo(pregData.trimester);
  
  // Get mood emoji
  const getMoodEmoji = (mood: number) => {
    if (mood >= 4) return '😊';
    if (mood >= 3) return '🙂';
    if (mood >= 2) return '😐';
    if (mood >= 1) return '😔';
    return '❓';
  };

  // Get fruit data from unified hook - priority: pregnancy_daily_content > fruit_size_images > static
  const getFruitData = () => {
    return getDynamicFruitData(
      fruitImages,
      pregnancyDay,
      pregData.currentWeek,
      dayContent
    );
  };
  
  const weekData = getFruitData();
  
  const daysLeft = dayContent?.days_until_birth ?? (pregData.dueDate ? Math.ceil((pregData.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0);
  const totalDays = 280;
  const daysElapsed = totalDays - daysLeft;
  const progressPercent = (daysElapsed / totalDays) * 100;

  // Dynamic baby message from database
  const babyMessage = dayContent?.baby_message || "Salam ana! Bu gün çox böyüdüm. 💕";

  const weeklyDevelopment = {
    eyes: pregData.currentWeek >= 8,
    ears: pregData.currentWeek >= 16,
    fingers: pregData.currentWeek >= 10,
    kicks: pregData.currentWeek >= 18,
    hair: pregData.currentWeek >= 22,
  };

  const addKick = async () => {
    await hapticFeedback.medium();
    // Add a quick single-kick session for tracking
    await addSession(1, 0);
    toast({
      title: "Təpik qeyd edildi! 👶",
      description: `Bu gün ${kickCount + 1} təpik`,
    });
  };

  const addWater = async () => {
    await hapticFeedback.light();
    await updateWaterIntake(1);
    toast({
      title: "Su əlavə edildi! 💧",
      description: `${waterCount + 1}/8 stəkan`,
    });
  };

  return (
    <div className="space-y-2">
      {/* Baby Development Hero Section - Trimester colored */}
      <motion.div 
        className={`relative overflow-hidden bg-gradient-to-br ${trimesterColors.bg} rounded-2xl p-4 shadow-card ${trimesterColors.border}`}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className={`absolute -top-12 -right-12 w-36 h-36 rounded-full ${trimesterColors.accent} blur-2xl`} />
        <div className={`absolute bottom-0 left-0 w-24 h-24 rounded-full ${trimesterColors.accent} blur-xl opacity-50`} />
        
        <div className="relative z-10 flex flex-col items-center">
          {/* Fetus Image with subtle motion */}
          <motion.div 
            className="w-28 h-28 mb-3 relative"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              y: [0, -4, 0],
            }}
            transition={{ 
              scale: { delay: 0.2, type: "spring" },
              opacity: { delay: 0.2 },
              y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <img 
              src={FETUS_IMAGES[Math.min(Math.ceil(pregData.currentWeek / 4.4), 9)] || FETUS_IMAGES[1]} 
              alt={`${pregData.currentWeek} həftəlik körpə`}
              className="w-full h-full object-contain drop-shadow-lg"
            />
            <motion.div
              className={`absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-card shadow-lg flex items-center justify-center overflow-hidden border-2 ${trimesterColors.border}`}
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              {weekData.imageUrl ? (
                <img 
                  src={weekData.imageUrl} 
                  alt={weekData.fruit}
                  className="w-7 h-7 object-cover rounded-full"
                />
              ) : (
                <span className="text-lg">{weekData.emoji}</span>
              )}
            </motion.div>
          </motion.div>
          
          {/* Main Text - "Anacan hazırda meyvə boydayam" */}
          <div className="text-center">
            <p className="text-lg font-bold text-foreground mb-1">
              Anacan, hazırda <span className={trimesterColors.text}>{weekData.fruit}</span> boydayam
            </p>
            <p className="text-xs text-muted-foreground font-medium">
              {pregData.currentWeek}. həftə, {pregData.currentDay}. gün • <span className={`font-semibold ${trimesterColors.text}`}>{pregData.trimester}-{pregData.trimester === 1 ? 'ci' : pregData.trimester === 2 ? 'ci' : 'cü'} Trimester</span>
            </p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className={`text-xs font-semibold ${trimesterColors.badge} px-2 py-0.5 rounded-full`}>
                {weekData.lengthCm} sm
              </span>
              <span className={`text-xs font-semibold ${trimesterColors.badge} px-2 py-0.5 rounded-full`}>
                {weekData.weightG}g
              </span>
              <span className={`text-xs font-semibold ${trimesterColors.badge} px-2 py-0.5 rounded-full`}>
                {daysLeft} gün qaldı
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full mt-3 space-y-1">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Başlanğıc</span>
              <span className={`${trimesterColors.text} font-semibold`}>{Math.round(progressPercent)}%</span>
              <span>Doğuş</span>
            </div>
            <div className={`h-2 ${trimesterColors.accent} rounded-full overflow-hidden`}>
              <motion.div 
                className={`h-full ${trimesterColors.progress} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, delay: 0.3 }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Trimester Tips Section */}
      {dynamicTrimesterTips.length > 0 && (
        <motion.div 
          className={`relative overflow-hidden ${trimesterColors.accent} rounded-xl p-3 ${trimesterColors.border}`}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <div className="absolute -right-6 -top-6 text-7xl opacity-10">{trimesterInfo.emoji}</div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-7 h-7 rounded-full ${trimesterColors.accent} flex items-center justify-center`}>
                <span className="text-lg">{trimesterInfo.emoji}</span>
              </div>
              <h3 className={`text-sm font-bold ${trimesterColors.text}`}>{trimesterInfo.title}</h3>
            </div>
            <div className="space-y-1.5">
              {dynamicTrimesterTips.map((tip, index) => (
                <motion.div 
                  key={tip.id}
                  className="flex items-start gap-2 bg-card/50 rounded-lg p-2"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                >
                  <span className="text-sm flex-shrink-0">{tip.icon}</span>
                  <p className="text-xs text-foreground/90 leading-relaxed">{tip.tip_text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Grid - Show kick counter only after week 16 */}
      <div className={`grid ${pregData.currentWeek >= 16 ? 'grid-cols-3' : 'grid-cols-2'} gap-1.5`}>
        <motion.div 
          className={`${trimesterColors.accent} rounded-xl p-2.5 shadow-card ${trimesterColors.border} text-center`}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Calendar className={`w-4 h-4 ${trimesterColors.icon} mx-auto mb-0.5`} />
          <p className="text-lg font-black text-foreground">{daysLeft}</p>
          <p className="text-[9px] text-muted-foreground">gün qaldı</p>
        </motion.div>

        {/* Only show kick counter after week 16 */}
        {pregData.currentWeek >= 16 && (
          <motion.button 
            onClick={addKick}
            className={`${trimesterColors.accent} rounded-xl p-2.5 shadow-card ${trimesterColors.border} text-center`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            whileTap={{ scale: 0.95 }}
          >
            <Footprints className={`w-4 h-4 ${trimesterColors.icon} mx-auto mb-0.5`} />
            <p className="text-lg font-black text-foreground">{kickCount}</p>
            <p className="text-[9px] text-muted-foreground">təpik</p>
          </motion.button>
        )}

        <motion.div 
          className={`${trimesterColors.accent} rounded-xl p-2.5 shadow-card ${trimesterColors.border} text-center`}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Scale className={`w-4 h-4 ${trimesterColors.icon} mx-auto mb-0.5`} />
          <p className="text-lg font-black text-foreground">+{weightGain}</p>
          <p className="text-[9px] text-muted-foreground">kq çəki</p>
        </motion.div>
      </div>

      {/* Baby Development - Static Icons */}
      <motion.div 
        className="bg-primary/5 dark:bg-primary/10 rounded-xl p-3 shadow-card border border-primary/20"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        <h3 className="text-sm font-bold text-foreground mb-2">Körpənin inkişafı</h3>
        <div className="flex justify-around">
          {[
            { icon: '👀', label: 'Göz', active: weeklyDevelopment.eyes },
            { icon: '👂', label: 'Qulaq', active: weeklyDevelopment.ears },
            { icon: '✋', label: 'Barmaq', active: weeklyDevelopment.fingers },
            { icon: '🦶', label: 'Təpik', active: weeklyDevelopment.kicks },
            { icon: '💇', label: 'Saç', active: weeklyDevelopment.hair },
          ].map((item, index) => (
            <motion.div 
              key={item.label}
              className="text-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg mb-0.5 ${
                item.active ? 'bg-primary/20' : 'bg-muted opacity-40'
              }`}>
                {item.icon}
              </div>
              <span className={`text-[10px] ${item.active ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Daily Content Cards - Separated */}
      {dayContent && (
        <div className="space-y-1.5">
          {/* Baby Message Card */}
          {dayContent.baby_message && (
            <motion.div 
              className="relative overflow-hidden bg-primary/5 dark:bg-primary/10 rounded-xl p-3 border border-primary/20"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="absolute -right-4 -top-4 text-6xl opacity-10">💬</div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-sm">👶</span>
                </div>
                <div>
                <p className="text-xs text-primary font-bold uppercase tracking-wider">Körpədən Mesaj</p>
                  <p className="text-[10px] text-muted-foreground">Gün {pregnancyDay} / 280</p>
                </div>
              </div>
              <p className="text-foreground font-medium text-sm leading-relaxed">
                "{dayContent.baby_message}"
              </p>
            </motion.div>
          )}

          {/* Body Changes Card */}
          {dayContent.body_changes && (
            <motion.div 
              className="relative overflow-hidden bg-primary/5 dark:bg-primary/10 rounded-xl p-3 border border-primary/20"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              <div className="absolute -right-4 -top-4 text-6xl opacity-10">🤰</div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-sm">🤰</span>
                </div>
                <p className="text-xs text-primary font-bold uppercase tracking-wider">Bədəndəki Dəyişikliklər</p>
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed">
                {dayContent.body_changes}
              </p>
            </motion.div>
          )}

          {/* Baby Development Card */}
          {dayContent.baby_development && (
            <motion.div 
              className="relative overflow-hidden bg-primary/5 dark:bg-primary/10 rounded-xl p-3 border border-primary/20"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="absolute -right-4 -top-4 text-6xl opacity-10">🌱</div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-sm">🌱</span>
                </div>
                <p className="text-xs text-primary font-bold uppercase tracking-wider">Körpənin İnkişafı</p>
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed">
                {dayContent.baby_development}
              </p>
            </motion.div>
          )}

          {/* Daily Tip Card */}
          {dayContent.daily_tip && (
            <motion.div 
              className="relative overflow-hidden bg-primary/5 dark:bg-primary/10 rounded-xl p-3 border border-primary/20"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.45 }}
            >
              <div className="absolute -right-4 -top-4 text-6xl opacity-10">💡</div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-sm">💡</span>
                </div>
                <p className="text-xs text-primary font-bold uppercase tracking-wider">Günün Tövsiyəsi</p>
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed">
                {dayContent.daily_tip}
              </p>
            </motion.div>
          )}
        </div>
      )}

      {/* Weekly Tip from Database */}
      {currentWeekTip && (
        <motion.div 
          className="bg-primary/5 dark:bg-primary/10 rounded-xl p-3 border border-primary/20"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
              <Lightbulb className="w-3 h-3 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-primary font-bold uppercase tracking-wider">Həftə {pregData?.currentWeek} Tövsiyəsi</p>
              <h4 className="font-bold text-foreground text-sm">{currentWeekTip.title}</h4>
            </div>
          </div>
          <p className="text-xs text-foreground/80 leading-relaxed">{currentWeekTip.content}</p>
        </motion.div>
      )}

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-4 gap-1.5">
        <QuickActionButton 
          icon={Droplets} 
          label="Su" 
          color="bg-primary/10 dark:bg-primary/20 text-primary" 
          value={`${waterCount}/8`}
          onClick={addWater}
        />
        <QuickActionButton 
          icon={Pill} 
          label="Vitamin" 
          color="bg-primary/10 dark:bg-primary/20 text-primary" 
          onClick={() => {
            toast({
              title: "Vitamin Xatırlatması 💊",
              description: "Prenatal vitamininizi günlük qəbul etməyi unutmayın. Folat, D vitamini və dəmir vacibdir!",
            });
            if (onNavigateToTool) onNavigateToTool('nutrition');
          }}
        />
        <QuickActionButton 
          icon={Activity} 
          label="Məşq" 
          color="bg-primary/10 dark:bg-primary/20 text-primary" 
          onClick={() => {
            if (onNavigateToTool) onNavigateToTool('exercises');
          }}
        />
        <QuickActionButton 
          icon={Heart} 
          label="Əhval" 
          color="bg-primary/10 dark:bg-primary/20 text-primary" 
          value={currentMood ? getMoodEmoji(currentMood) : undefined}
          onClick={() => {
            if (onNavigateToTool) onNavigateToTool('mood-diary');
          }}
        />
      </div>
    </div>
  );
};

// Daily fun facts about baby - changes every day
const BABY_FUN_FACTS = [
  "Bu gün əlləri ilə əşyaları tutmağı öyrənir! 🤲",
  "Səsləri tanımaq qabiliyyəti artır 🎵",
  "Bu gün gülüşləri daha mənalı olacaq 😊",
  "Rəngləri daha aydın görməyə başlayır 🌈",
  "Hərəkətləri daha koordinasiyalı olur 🏃",
  "Bu gün yeni dadlar kəşf edə bilər 🍎",
  "Emosiyalarını daha yaxşı ifadə edir 💕",
  "Diqqət müddəti artmağa davam edir 👀",
  "Yatma qaydaları daha müntəzəm olur 😴",
  "Ətrafı tanımaq bacarığı inkişaf edir 🌍",
  "Əlaqə qurma bacarıqları güclənir 🤝",
  "Körpənin yaddaşı hər gün güclənir 🧠",
  "Bu gün yeni səslər çıxara bilər 🗣️",
  "Hərəkət koordinasiyası inkişaf edir ⚡",
  "Mimikalar daha zəngin olur 😮",
  "Ətrafdakılara diqqət artır 👁️",
  "Gülümsəmələri daha tez-tez olur 😍",
  "Oyun zamanı daha aktiv olur 🎮",
  "Valideynləri tanıma güclənir 👨‍👩‍👧",
  "Yeni nailiyyətlərə doğru irəliləyir 🌟",
  "Bu gün əlləri ağzına apara bilər 🖐️",
  "Şəkillərə baxmağı xoşlayır 🖼️",
  "Musiqi dinləməkdən zövq alır 🎶",
  "Ayaqlarını hərəkət etdirməyi sevir 🦶",
  "Yuxu zamanı yuxu görə bilər 💭",
  "Üzlərə baxmağı çox xoşlayır 👶",
  "Bu gün qıcıqlanmaya reaksiya artır 🤭",
  "Toxunma hissi daha həssas olur 🤚",
  "Barmaqlarını kəşf etməyə davam edir ✋",
  "Ətraf səslərə daha çox reaksiya verir 👂",
];

const getBabyDailyFunFact = (ageInDays: number): string => {
  // Use age + current day to get a rotating fact
  const dayOfYear = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const factIndex = (ageInDays + dayOfYear) % BABY_FUN_FACTS.length;
  return BABY_FUN_FACTS[factIndex];
};

const MommyDashboard = () => {
  const { getBabyData } = useUserStore();
  const { toast } = useToast();
  const babyData = getBabyData();
  const { isMilestoneAchieved, toggleMilestone, getMilestoneDate, MILESTONES } = useBabyMilestones();
  const { unlockAchievement, getTotalPoints } = useAchievements();
  const { activeTimers, startTimer, stopTimer, getElapsedSeconds, getActiveTimer } = useTimerStore();
  const { todayLogs, addLog, getTodayStats, refetch } = useBabyLogs();
  
  // Current time for timer display
  const [, setTick] = useState(0);
  
  // Milestone carousel state
  const [milestonePageIndex, setMilestonePageIndex] = useState(0);
  
  // Get today's stats from database
  const todayStats = getTodayStats();
  
  // Sleep tracking
  const sleepTimer = getActiveTimer('sleep');
  
  // Feeding tracking with live timer
  const [showFeedingModal, setShowFeedingModal] = useState(false);
  const leftFeedTimer = getActiveTimer('feeding', 'left');
  const rightFeedTimer = getActiveTimer('feeding', 'right');
  
  // Diaper tracking
  const [showDiaperModal, setShowDiaperModal] = useState(false);

  // Update timer display every second
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!babyData) return null;

  // Use all dynamic milestones from hook - with carousel if > 5
  const allMilestones = MILESTONES.map(m => ({
    ...m,
    achieved: isMilestoneAchieved(m.id),
    achievedDate: getMilestoneDate(m.id),
  }));
  
  // Paginate milestones (5 per page)
  const milestonesPerPage = 5;
  const totalMilestonePages = Math.ceil(allMilestones.length / milestonesPerPage);
  const displayMilestones = allMilestones.slice(
    milestonePageIndex * milestonesPerPage, 
    (milestonePageIndex + 1) * milestonesPerPage
  );
  const hasMoreMilestones = allMilestones.length > milestonesPerPage;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleSleep = async () => {
    await hapticFeedback.medium();
    if (sleepTimer) {
      // End sleep - save to database
      const result = stopTimer(sleepTimer.id);
      if (result) {
        await addLog({
          log_type: 'sleep',
          start_time: new Date(Date.now() - result.durationSeconds * 1000).toISOString(),
          end_time: new Date().toISOString(),
        });
        toast({ title: "Yuxu bitdi! ☀️", description: `${formatDuration(result.durationSeconds)} yatdı` });
      }
    } else {
      // Start sleep
      startTimer('sleep');
      toast({ title: "Yuxu başladı! 😴", description: "Bitirmək üçün yenidən basın" });
    }
  };

  const toggleFeeding = async (type: 'left' | 'right') => {
    await hapticFeedback.medium();
    const activeTimer = type === 'left' ? leftFeedTimer : rightFeedTimer;
    
    if (activeTimer) {
      // Stop feeding - save to database
      const result = stopTimer(activeTimer.id);
      if (result) {
        await addLog({
          log_type: 'feeding',
          feed_type: type === 'left' ? 'breast_left' : 'breast_right',
          start_time: new Date(Date.now() - result.durationSeconds * 1000).toISOString(),
          end_time: new Date().toISOString(),
        });
        toast({ 
          title: `${type === 'left' ? 'Sol' : 'Sağ'} sinə bitti!`, 
          description: `Müddət: ${formatDuration(result.durationSeconds)}` 
        });
        
        // Check for achievement
        if (todayStats.feedingCount >= 9) {
          unlockAchievement('feeding_pro', 'mommy');
        }
      }
    } else {
      // Start feeding
      startTimer('feeding', type);
      setShowFeedingModal(false);
    }
  };

  const addFeeding = async (type: 'formula' | 'solid') => {
    await hapticFeedback.medium();
    await addLog({
      log_type: 'feeding',
      feed_type: type,
    });
    setShowFeedingModal(false);
    
    const typeLabels = {
      formula: 'Süd əvəzedicisi 🍼',
      solid: 'Əlavə qida 🥣'
    };
    toast({ title: `${typeLabels[type]} qeyd edildi!` });
  };

  const addDiaper = async (type: 'wet' | 'dirty' | 'both') => {
    await hapticFeedback.medium();
    await addLog({
      log_type: 'diaper',
      diaper_type: type === 'both' ? 'mixed' : type,
    });
    setShowDiaperModal(false);
    
    const typeEmojis = {
      wet: '💧',
      dirty: '💩',
      both: '💧💩'
    };
    toast({ title: `Bez dəyişmə: ${typeEmojis[type]}` });
    
    // Check for achievement
    if (todayStats.diaperCount >= 9) {
      unlockAchievement('diaper_hero', 'mommy');
    }
  };

  const getFeedingIcon = (type: string) => {
    switch (type) {
      case 'left': return '🤱L';
      case 'right': return '🤱R';
      case 'formula': return '🍼';
      case 'solid': return '🥣';
      default: return '🍼';
    }
  };

  const getDiaperIcon = (type: string) => {
    switch (type) {
      case 'wet': return '💧';
      case 'dirty': return '💩';
      case 'both': return '💧💩';
      default: return '👶';
    }
  };

  const handleMilestoneClick = async (milestoneId: string) => {
    await hapticFeedback.medium();
    await toggleMilestone(milestoneId);
    
    // Check for milestone achievements
    const achievedCount = displayMilestones.filter(m => isMilestoneAchieved(m.id)).length;
    if (achievedCount === 0) {
      unlockAchievement('milestone_first', 'mommy');
    } else if (achievedCount >= 4) {
      unlockAchievement('milestone_5', 'mommy');
    }
  };

  return (
    <div className="space-y-2">
      {/* Baby Hero Card */}
      <motion.div 
        className="relative overflow-hidden rounded-[1.5rem] gradient-primary p-5 text-white shadow-elevated"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <motion.div 
              className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-5xl"
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {babyData.gender === 'boy' ? '👶🏻' : '👶🏻'}
            </motion.div>
            <div>
              <h2 className="text-2xl font-black">{babyData.name}</h2>
              <p className="text-white/90 mt-0.5 font-medium text-base">
                {babyData.ageInMonths > 0 ? `${babyData.ageInMonths} aylıq` : `${babyData.ageInDays} günlük`}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-xs text-white/80">{getBabyDailyFunFact(babyData.ageInDays)}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Sleep Tracker */}
      <motion.div
        className="bg-card rounded-2xl p-4 shadow-card border border-border/50"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center">
              <Moon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Yuxu İzləmə</h3>
              <p className="text-xs text-muted-foreground">Bu gün: {todayStats.sleepHours} saat</p>
            </div>
          </div>
          <motion.button
            onClick={toggleSleep}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs ${
              sleepTimer 
                ? 'bg-amber-500 text-white' 
                : 'bg-violet-100 text-violet-700'
            }`}
            whileTap={{ scale: 0.95 }}
            animate={sleepTimer ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 1, repeat: sleepTimer ? Infinity : 0 }}
          >
            {sleepTimer ? `☀️ ${formatDuration(getElapsedSeconds(sleepTimer.id))}` : '😴 Yatdı'}
          </motion.button>
        </div>
        
        {sleepTimer && (
          <motion.div 
            className="bg-violet-50 rounded-xl p-3 flex items-center gap-3"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            <div className="w-3 h-3 rounded-full bg-violet-500 animate-pulse" />
            <span className="text-sm text-violet-700 font-medium">
              Yuxu davam edir: {formatDuration(getElapsedSeconds(sleepTimer.id))}
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* Feeding Tracker */}
      <motion.div
        className="bg-card rounded-2xl p-4 shadow-card border border-border/50"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
              <Baby className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Qidalanma</h3>
              <p className="text-xs text-muted-foreground">Bu gün: {todayStats.feedingCount} dəfə</p>
            </div>
          </div>
          <motion.button
            onClick={() => setShowFeedingModal(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-100 text-amber-700 font-bold text-xs"
            whileTap={{ scale: 0.95 }}
          >
            + Əlavə et
          </motion.button>
        </div>
        
        <AnimatePresence>
          {showFeedingModal && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-2 gap-2 mb-3"
            >
              <motion.button
                onClick={() => toggleFeeding('left')}
                className={`p-3 rounded-xl flex flex-col items-center gap-1 ${
                  leftFeedTimer 
                    ? 'bg-pink-500 border-2 border-pink-600 text-white' 
                    : 'bg-pink-50 border-2 border-pink-200'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-2xl">🤱</span>
                <span className={`text-sm font-medium ${leftFeedTimer ? 'text-white' : 'text-pink-700'}`}>
                  {leftFeedTimer ? formatDuration(getElapsedSeconds(leftFeedTimer.id)) : 'Sol Sinə'}
                </span>
              </motion.button>
              <motion.button
                onClick={() => toggleFeeding('right')}
                className={`p-3 rounded-xl flex flex-col items-center gap-1 ${
                  rightFeedTimer 
                    ? 'bg-pink-500 border-2 border-pink-600 text-white' 
                    : 'bg-pink-50 border-2 border-pink-200'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-2xl">🤱</span>
                <span className={`text-sm font-medium ${rightFeedTimer ? 'text-white' : 'text-pink-700'}`}>
                  {rightFeedTimer ? formatDuration(getElapsedSeconds(rightFeedTimer.id)) : 'Sağ Sinə'}
                </span>
              </motion.button>
              <motion.button
                onClick={() => addFeeding('formula')}
                className="p-3 rounded-xl bg-blue-50 border-2 border-blue-200 flex flex-col items-center gap-1"
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-xl">🍼</span>
                <span className="text-xs font-medium text-blue-700">Süd Əvəzedicisi</span>
              </motion.button>
              <motion.button
                onClick={() => addFeeding('solid')}
                className="p-3 rounded-xl bg-orange-50 border-2 border-orange-200 flex flex-col items-center gap-1"
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-xl">🥣</span>
                <span className="text-xs font-medium text-orange-700">Əlavə Qida</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Active feeding timer indicator */}
        {(leftFeedTimer || rightFeedTimer) && !showFeedingModal && (
          <motion.div 
            className="bg-pink-50 rounded-lg p-2 flex items-center justify-between mb-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-pink-500 animate-pulse" />
              <span className="text-sm text-pink-700 font-medium">
                {leftFeedTimer ? 'Sol sinə' : 'Sağ sinə'}: {formatDuration(getElapsedSeconds((leftFeedTimer || rightFeedTimer)!.id))}
              </span>
            </div>
            <motion.button
              onClick={() => toggleFeeding(leftFeedTimer ? 'left' : 'right')}
              className="px-3 py-1 bg-pink-500 text-white rounded-lg text-sm font-medium"
              whileTap={{ scale: 0.95 }}
            >
              Bitir
            </motion.button>
          </motion.div>
        )}
      </motion.div>

      {/* Diaper Tracker */}
      <motion.div
        className="bg-card rounded-2xl p-4 shadow-card border border-border/50"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Bez Dəyişmə</h3>
              <p className="text-xs text-muted-foreground">Bu gün: {todayStats.diaperCount} dəfə</p>
            </div>
          </div>
          <motion.button
            onClick={() => setShowDiaperModal(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-100 text-emerald-700 font-bold text-xs"
            whileTap={{ scale: 0.95 }}
          >
            + Əlavə et
          </motion.button>
        </div>
        
        <AnimatePresence>
          {showDiaperModal && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-3 gap-2 mb-3"
            >
              <motion.button
                onClick={() => addDiaper('wet')}
                className="p-3 rounded-xl bg-blue-50 border-2 border-blue-200 flex items-center justify-center"
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-2xl">💧</span>
              </motion.button>
              <motion.button
                onClick={() => addDiaper('dirty')}
                className="p-3 rounded-xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center"
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-2xl">💩</span>
              </motion.button>
              <motion.button
                onClick={() => addDiaper('both')}
                className="p-3 rounded-xl bg-purple-50 border-2 border-purple-200 flex items-center justify-center"
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-xl">💧💩</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Recent Diapers */}
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
          {todayStats.diaperLogs.slice(-5).reverse().map((log) => (
            <div 
              key={log.id}
              className="flex-shrink-0 px-2 py-1.5 rounded-lg bg-muted/50 flex items-center gap-1.5"
            >
              <span className="text-lg">{getDiaperIcon(log.diaper_type || 'wet')}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(log.start_time).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Milestones with Carousel */}
      <motion.div 
        className="bg-card rounded-2xl p-4 shadow-card border border-border/50"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-foreground">İnkişaf mərhələləri</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-primary font-bold">
              {allMilestones.filter(m => m.achieved).length}/{allMilestones.length}
            </span>
            {/* Carousel navigation */}
            {hasMoreMilestones && (
              <div className="flex gap-1">
                <motion.button
                  onClick={() => setMilestonePageIndex(p => Math.max(0, p - 1))}
                  disabled={milestonePageIndex === 0}
                  className="w-6 h-6 rounded-full bg-muted flex items-center justify-center disabled:opacity-40"
                  whileTap={{ scale: 0.9 }}
                >
                  <ChevronRight className="w-3 h-3 rotate-180" />
                </motion.button>
                <motion.button
                  onClick={() => setMilestonePageIndex(p => Math.min(totalMilestonePages - 1, p + 1))}
                  disabled={milestonePageIndex === totalMilestonePages - 1}
                  className="w-6 h-6 rounded-full bg-muted flex items-center justify-center disabled:opacity-40"
                  whileTap={{ scale: 0.9 }}
                >
                  <ChevronRight className="w-3 h-3" />
                </motion.button>
              </div>
            )}
          </div>
        </div>
        
        {/* Page indicator */}
        {hasMoreMilestones && (
          <div className="flex justify-center gap-1 mb-3">
            {Array.from({ length: totalMilestonePages }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === milestonePageIndex ? 'w-4 bg-primary' : 'w-1.5 bg-muted'
                }`}
              />
            ))}
          </div>
        )}
        
        <div className="flex justify-between overflow-hidden">
          {displayMilestones.map((milestone, index) => (
            <motion.button 
              key={milestone.id}
              onClick={() => handleMilestoneClick(milestone.id)}
              className="text-center flex-1"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.05 + index * 0.05 }}
              whileTap={{ scale: 0.9 }}
            >
              <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center text-lg mb-1 relative ${
                milestone.achieved 
                  ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg' 
                  : 'bg-muted opacity-60'
              }`}>
                {milestone.emoji}
                {milestone.achieved && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>
              <span className={`text-[10px] line-clamp-1 ${
                milestone.achieved ? 'text-foreground font-medium' : 'text-muted-foreground'
              }`}>
                {milestone.label}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Today's Summary */}
      <motion.div 
        className="bg-card rounded-2xl p-4 shadow-card border border-border/50"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-base font-bold text-foreground mb-3">Bugünkü xülasə</h3>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between p-2.5 bg-violet-50 dark:bg-violet-500/15 rounded-xl border border-violet-100 dark:border-violet-500/20">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              <span className="text-xs font-medium text-foreground">Yuxu</span>
            </div>
            <span className="text-xs font-bold text-violet-600 dark:text-violet-400">{todayStats.sleepHours} saat</span>
          </div>
          
          {/* Enhanced Feeding History Panel */}
          <FeedingHistoryPanel />
          <div className="flex items-center justify-between p-2.5 bg-emerald-50 dark:bg-emerald-500/15 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-medium text-foreground">Bez dəyişmə</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">
                💧{todayStats.wetCount}
                💩{todayStats.dirtyCount}
                💧💩{todayStats.bothCount}
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{todayStats.diaperCount} dəfə</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Development Tip */}
      <motion.div 
        className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-500/15 dark:to-emerald-500/15 rounded-2xl p-4 border border-teal-100 dark:border-teal-500/20"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35 }}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-500/20 flex items-center justify-center text-xl">
            💡
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-foreground">Bu həftənin tövsiyəsi</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {babyData.ageInMonths < 3 
                ? 'Tummy time məşqləri körpənin boyun əzələlərini gücləndirir. Gündə 3-5 dəqiqə ilə başlayın!'
                : 'Körpənizlə danışmaq dil inkişafı üçün çox vacibdir. Hər fəaliyyəti şərh edin!'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

interface DashboardProps {
  onOpenChat?: () => void;
  onNavigateToTool?: (tool: string) => void;
}

const Dashboard = ({ onOpenChat, onNavigateToTool }: DashboardProps) => {
  const { lifeStage, name } = useUserStore();
  const { profile } = useAuth();
  const { unreadCount } = useUnreadMessages();
  const { unreadCount: notificationCount } = useNotifications();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Sabahınız xeyir';
    if (hour < 18) return 'Günortanız xeyir';
    return 'Axşamınız xeyir';
  };

  const hasPartner = !!profile?.linked_partner_id;

  return (
    <div className="pb-4 pt-2 px-3">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between mb-2"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div>
          <p className="text-xs text-muted-foreground font-medium">{getGreeting()}</p>
          <h1 className="text-lg font-black text-foreground">{name || 'Xanım'} 👋</h1>
        </div>
        <div className="flex items-center gap-2">
          {hasPartner && (
            <motion.button 
              onClick={onOpenChat}
              className="w-9 h-9 rounded-xl bg-partner/10 flex items-center justify-center relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <MessageCircle className="w-4 h-4 text-partner" />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </motion.button>
          )}
          <motion.button 
            className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bell className="w-4 h-4 text-primary" />
            {notificationCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-[9px] font-bold text-white flex items-center justify-center"
              >
                {notificationCount > 9 ? '9+' : notificationCount}
              </motion.span>
            )}
          </motion.button>
        </div>
      </motion.div>

      {lifeStage === 'flow' && <FlowDashboard />}
      {lifeStage === 'bump' && <BumpDashboard onNavigateToTool={onNavigateToTool} />}
      {lifeStage === 'mommy' && <MommyDashboard />}
    </div>
  );
};

export default Dashboard;
