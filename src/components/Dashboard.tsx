import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Droplets, Moon, Utensils, Activity, Plus, TrendingUp, Heart, Sparkles, 
  Bell, ChevronRight, Flame, Target, Calendar, Zap, Sun, Cloud, Wind,
  ThermometerSun, Pill, Baby, Footprints, Scale, Clock, Star, Award,
  MessageCircle, Check, Lightbulb
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
import { useBabyMilestones, MILESTONES } from '@/hooks/useBabyMilestones';
import { useAchievements } from '@/hooks/useAchievements';
import { useWeeklyTips } from '@/hooks/useDynamicContent';
import { usePregnancyContentByDay } from '@/hooks/usePregnancyContent';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

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
    className={`${color} p-4 rounded-2xl flex flex-col items-center gap-2 shadow-card relative overflow-hidden`}
    whileHover={{ scale: 1.05, y: -2 }}
    whileTap={{ scale: 0.95 }}
  >
    <Icon className="w-6 h-6" />
    <span className="text-xs font-bold">{label}</span>
    {value && (
      <span className="absolute top-2 right-2 text-[10px] font-bold bg-white/30 px-1.5 py-0.5 rounded-full">
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
  
  // Use data from DB or defaults
  const waterCount = todayLog?.water_intake || 0;
  const selectedSymptoms = todayLog?.symptoms || [];

  if (!cycleData) return null;

  const phaseData = {
    menstrual: { 
      message: 'Menstruasiya dövrünüzdesiniz. Özünüzə qulluq edin 💕',
      emoji: '🌸',
      color: 'from-rose-500 to-pink-600',
      tips: ['Dəmir zəngin qidalar qəbul edin', 'İsti su torbası istifadə edin', 'Yüngül məşqlər edin']
    },
    follicular: { 
      message: 'Enerji artır! Yeni layihələrə başlamaq üçün əla vaxtdır ✨',
      emoji: '🌱',
      color: 'from-emerald-500 to-teal-600',
      tips: ['Yeni layihələrə başlayın', 'Sosial fəaliyyətlər planlaşdırın', 'İntensiv məşqlər edin']
    },
    ovulation: { 
      message: 'Fertil günlərinizdəsiniz. Enerji ən yüksək səviyyədədir! 🌟',
      emoji: '✨',
      color: 'from-amber-500 to-orange-600',
      tips: ['Enerji səviyyəniz yüksəkdir', 'Kommunikasiya bacarıqlarınız güclüdür', 'Hamiləlik planlaşdırırsınızsa ideal vaxtdır']
    },
    luteal: { 
      message: 'Sakit qalın, PMS yaxınlaşır. Özünüzə yumşaq olun 🌸',
      emoji: '🌙',
      color: 'from-violet-500 to-purple-600',
      tips: ['Maqnezium qəbul edin', 'Stress azaldın', 'Yetərli yuxu alın']
    },
  };

  const currentPhase = phaseData[cycleData.phase];
  const progress = (cycleData.currentDay / cycleData.cycleLength) * 100;

  const symptoms = [
    { id: 'headache', label: 'Baş ağrısı', emoji: '🤕' },
    { id: 'tired', label: 'Yorğunluq', emoji: '😴' },
    { id: 'cramps', label: 'Sancı', emoji: '😣' },
    { id: 'mood', label: 'Əsəbilik', emoji: '😤' },
    { id: 'bloating', label: 'Şişkinlik', emoji: '🎈' },
    { id: 'acne', label: 'Sızanaq', emoji: '😔' },
  ];

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
    <div className="space-y-6">
      {/* Main Cycle Card with Progress Ring */}
      <motion.div 
        className="relative overflow-hidden rounded-[2rem] gradient-flow p-6 text-white shadow-elevated"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/5 blur-xl" />
        
        <div className="relative z-10 flex items-center gap-6">
          {/* Progress Ring */}
          <div className="relative">
            <ProgressRing progress={progress} size={110} strokeWidth={10} color="stroke-white" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black">{cycleData.currentDay}</span>
              <span className="text-xs text-white/70">/ {cycleData.cycleLength}</span>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">{currentPhase.emoji}</span>
              <span className="text-sm font-bold uppercase tracking-wider text-white/80">
                {cycleData.phase === 'menstrual' ? 'Menstruasiya' :
                 cycleData.phase === 'follicular' ? 'Follikulyar' :
                 cycleData.phase === 'ovulation' ? 'Ovulyasiya' : 'Luteal'}
              </span>
            </div>
            <p className="text-white/90 text-sm leading-relaxed">{currentPhase.message}</p>
          </div>
        </div>
      </motion.div>

      {/* Daily Goals */}
      <motion.div 
        className="grid grid-cols-3 gap-3"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <motion.button
          onClick={addWater}
          className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-4 text-white text-center relative overflow-hidden"
          whileTap={{ scale: 0.95 }}
        >
          <div className="absolute inset-0 bg-white/10" style={{ height: `${(waterCount / 8) * 100}%`, bottom: 0, top: 'auto' }} />
          <div className="relative z-10">
            <Droplets className="w-8 h-8 mx-auto mb-2" />
            <p className="text-2xl font-black">{waterCount}</p>
            <p className="text-[10px] text-white/80">/8 stəkan</p>
          </div>
        </motion.button>

        <div className="bg-gradient-to-br from-violet-400 to-purple-600 rounded-2xl p-4 text-white text-center">
          <Moon className="w-8 h-8 mx-auto mb-2" />
          <p className="text-2xl font-black">7.5</p>
          <p className="text-[10px] text-white/80">saat yuxu</p>
        </div>

        <div className="bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl p-4 text-white text-center">
          <Flame className="w-8 h-8 mx-auto mb-2" />
          <p className="text-2xl font-black">1,850</p>
          <p className="text-[10px] text-white/80">kalori</p>
        </div>
      </motion.div>

      {/* Symptoms Selection */}
      <motion.div 
        className="bg-card rounded-3xl p-5 shadow-card border border-border/50"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">Bugünkü simptomlar</h3>
          <span className="text-xs text-primary font-bold">{selectedSymptoms.length} seçildi</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {symptoms.map((symptom) => (
            <motion.button 
              key={symptom.id}
              onClick={() => toggleSymptom(symptom.id)}
              className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                selectedSymptoms.includes(symptom.id)
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-muted text-muted-foreground hover:bg-primary/10'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <span>{symptom.emoji}</span>
              {symptom.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Phase Tips */}
      <motion.div 
        className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-3xl p-5 border border-orange-100"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h4 className="font-bold text-foreground">Bu faza üçün tövsiyələr</h4>
        </div>
        <div className="space-y-2">
          {currentPhase.tips.map((tip, index) => (
            <motion.div 
              key={index}
              className="flex items-center gap-3 p-3 bg-white/60 rounded-xl"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <Star className="w-3 h-3 text-primary" />
              </div>
              <span className="text-sm text-foreground">{tip}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Next Period Prediction */}
      <motion.div 
        className="bg-card rounded-3xl p-5 shadow-card border border-border/50"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Növbəti menstruasiya</p>
            <p className="text-xl font-bold text-foreground mt-1">
              {cycleData.nextPeriodDate.toLocaleDateString('az-AZ', { day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Qalır</p>
            <p className="text-xl font-bold text-flow">
              {Math.ceil((cycleData.nextPeriodDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} gün
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
  
  // Calculate current pregnancy day (1-280)
  const pregnancyDay = pregData?.dueDate 
    ? Math.max(1, 280 - Math.ceil((pregData.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 1;
  
  // Fetch weekly tip from database
  const { data: weeklyTips = [] } = useWeeklyTips(pregData?.currentWeek, 'bump');
  const currentWeekTip = weeklyTips[0];
  
  // Fetch dynamic pregnancy content by day
  const { data: dayContent } = usePregnancyContentByDay(pregnancyDay);
  
  const todayStats = getTodayStats();
  const kickCount = todayStats.totalKicks;
  const waterCount = todayLog?.water_intake || 0;
  const currentMood = todayLog?.mood || 0;
  
  // Calculate weight gain from first entry
  const latestWeight = weightEntries[0]?.weight;
  const firstWeight = weightEntries[weightEntries.length - 1]?.weight;
  const weightGain = latestWeight && firstWeight ? (latestWeight - firstWeight).toFixed(1) : '0';

  if (!pregData) return null;
  
  // Get mood emoji
  const getMoodEmoji = (mood: number) => {
    if (mood >= 4) return '😊';
    if (mood >= 3) return '🙂';
    if (mood >= 2) return '😐';
    if (mood >= 1) return '😔';
    return '❓';
  };

  // Use dynamic content if available, fallback to static
  const weekData = dayContent ? {
    fruit: dayContent.baby_size_fruit || FRUIT_SIZES[pregData.currentWeek]?.fruit || 'Meyvə',
    emoji: '🍎',
    lengthCm: dayContent.baby_size_cm || FRUIT_SIZES[pregData.currentWeek]?.lengthCm || 0,
    weightG: dayContent.baby_weight_gram || FRUIT_SIZES[pregData.currentWeek]?.weightG || 0,
  } : FRUIT_SIZES[pregData.currentWeek] || FRUIT_SIZES[12];
  
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
    <div className="space-y-6">
      {/* Baby Size Hero Card */}
      <motion.div 
        className="relative overflow-hidden rounded-[2rem] gradient-bump p-6 text-white shadow-elevated"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 blur-xl" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/80 text-sm font-medium">Hamiləlik həftəsi</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-5xl font-black">{pregData.currentWeek}</span>
                <span className="text-lg text-white/70">həftə {pregData.currentDay} gün</span>
              </div>
            </div>
            <motion.div 
              className="text-7xl"
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              {weekData.emoji}
            </motion.div>
          </div>

          <div className="bg-white/10 rounded-2xl p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/80 text-sm">Körpənin ölçüsü: {weekData.fruit}</span>
              <span className="text-white font-bold">{weekData.lengthCm} sm</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/80 text-sm">Təxmini çəki</span>
              <span className="text-white font-bold">{weekData.weightG}g</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-white/70">
              <span>Başlanğıc</span>
              <span>{Math.round(progressPercent)}%</span>
              <span>Doğuş</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-white rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, delay: 0.3 }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Baby Development Image Section */}
      <motion.div 
        className="bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 dark:from-pink-950/30 dark:via-rose-950/20 dark:to-purple-950/20 rounded-3xl p-6 shadow-card border border-pink-100/50 dark:border-pink-800/30"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex flex-col items-center">
          {/* Fetus Image */}
          <motion.div 
            className="w-48 h-48 mb-4 relative"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <img 
              src={FETUS_IMAGES[Math.min(Math.ceil(pregData.currentWeek / 4.4), 9)] || FETUS_IMAGES[1]} 
              alt={`${pregData.currentWeek} həftəlik körpə`}
              className="w-full h-full object-contain drop-shadow-lg"
            />
            <motion.div
              className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-2xl">{weekData.emoji}</span>
            </motion.div>
          </motion.div>
          
          {/* Week and Day Info */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground font-medium mb-1">Hazırki vəziyyət</p>
            <p className="text-2xl font-black text-foreground">
              {pregData.currentWeek}. həftə, {pregData.currentDay}. gün
            </p>
            <p className="text-sm text-primary font-medium mt-1">
              {weekData.fruit} boyunda • {weekData.lengthCm} sm • {weekData.weightG}g
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid - Show kick counter only after week 16 */}
      <div className={`grid ${pregData.currentWeek >= 16 ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
        <motion.div 
          className="bg-card rounded-2xl p-4 shadow-card border border-border/50 text-center"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <Calendar className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="text-2xl font-black text-foreground">{daysLeft}</p>
          <p className="text-xs text-muted-foreground">gün qaldı</p>
        </motion.div>

        {/* Only show kick counter after week 16 */}
        {pregData.currentWeek >= 16 && (
          <motion.button 
            onClick={addKick}
            className="bg-card rounded-2xl p-4 shadow-card border border-border/50 text-center"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            whileTap={{ scale: 0.95 }}
          >
            <Footprints className="w-6 h-6 text-pink-500 mx-auto mb-2" />
            <p className="text-2xl font-black text-foreground">{kickCount}</p>
            <p className="text-xs text-muted-foreground">təpik</p>
          </motion.button>
        )}

        <motion.div 
          className="bg-card rounded-2xl p-4 shadow-card border border-border/50 text-center"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <Scale className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
          <p className="text-2xl font-black text-foreground">+{weightGain}</p>
          <p className="text-xs text-muted-foreground">kq çəki</p>
        </motion.div>
      </div>

      {/* Baby Development - Static Icons */}
      <motion.div 
        className="bg-card rounded-3xl p-5 shadow-card border border-border/50"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        <h3 className="text-lg font-bold text-foreground mb-4">Körpənin inkişafı</h3>
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
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-1 ${
                item.active ? 'bg-primary/20' : 'bg-muted opacity-40'
              }`}>
                {item.icon}
              </div>
              <span className={`text-xs ${item.active ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Daily Content Cards - Separated */}
      {dayContent && (
        <div className="space-y-4">
          {/* Baby Message Card */}
          {dayContent.baby_message && (
            <motion.div 
              className="relative overflow-hidden bg-gradient-to-br from-violet-100 via-purple-50 to-pink-50 dark:from-violet-950/50 dark:via-purple-950/30 dark:to-pink-950/20 rounded-3xl p-5 border border-violet-200/50 dark:border-violet-700/50"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="absolute -right-6 -top-6 text-8xl opacity-10">💬</div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                  <span className="text-xl">👶</span>
                </div>
                <div>
                  <p className="text-xs text-violet-600 dark:text-violet-400 font-bold uppercase tracking-wider">Körpədən Mesaj</p>
                  <p className="text-[10px] text-muted-foreground">Gün {pregnancyDay} / 280</p>
                </div>
              </div>
              <p className="text-foreground font-medium italic text-base leading-relaxed">
                "{dayContent.baby_message}"
              </p>
            </motion.div>
          )}

          {/* Body Changes Card */}
          {dayContent.body_changes && (
            <motion.div 
              className="relative overflow-hidden bg-gradient-to-br from-rose-100 via-pink-50 to-orange-50 dark:from-rose-950/50 dark:via-pink-950/30 dark:to-orange-950/20 rounded-3xl p-5 border border-rose-200/50 dark:border-rose-700/50"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              <div className="absolute -right-6 -top-6 text-8xl opacity-10">🤰</div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
                  <span className="text-xl">🤰</span>
                </div>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider">Bədəndəki Dəyişikliklər</p>
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed">
                {dayContent.body_changes}
              </p>
            </motion.div>
          )}

          {/* Baby Development Card */}
          {dayContent.baby_development && (
            <motion.div 
              className="relative overflow-hidden bg-gradient-to-br from-blue-100 via-cyan-50 to-teal-50 dark:from-blue-950/50 dark:via-cyan-950/30 dark:to-teal-950/20 rounded-3xl p-5 border border-blue-200/50 dark:border-blue-700/50"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="absolute -right-6 -top-6 text-8xl opacity-10">🌱</div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <span className="text-xl">🌱</span>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">Körpənin İnkişafı</p>
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed">
                {dayContent.baby_development}
              </p>
            </motion.div>
          )}

          {/* Daily Tip Card */}
          {dayContent.daily_tip && (
            <motion.div 
              className="relative overflow-hidden bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-50 dark:from-amber-950/50 dark:via-yellow-950/30 dark:to-orange-950/20 rounded-3xl p-5 border border-amber-200/50 dark:border-amber-700/50"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.45 }}
            >
              <div className="absolute -right-6 -top-6 text-8xl opacity-10">💡</div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <span className="text-xl">💡</span>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">Günün Tövsiyəsi</p>
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
          className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-3xl p-5 border border-amber-100 dark:border-amber-800"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">Həftə {pregData?.currentWeek} Tövsiyəsi</p>
              <h4 className="font-bold text-foreground">{currentWeekTip.title}</h4>
            </div>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">{currentWeekTip.content}</p>
        </motion.div>
      )}

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-4 gap-3">
        <QuickActionButton 
          icon={Droplets} 
          label="Su" 
          color="bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400" 
          value={`${waterCount}/8`}
          onClick={addWater}
        />
        <QuickActionButton 
          icon={Pill} 
          label="Vitamin" 
          color="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400" 
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
          color="bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400" 
          onClick={() => {
            if (onNavigateToTool) onNavigateToTool('exercises');
          }}
        />
        <QuickActionButton 
          icon={Heart} 
          label="Əhval" 
          color="bg-pink-50 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400" 
          value={currentMood ? getMoodEmoji(currentMood) : undefined}
          onClick={() => {
            if (onNavigateToTool) onNavigateToTool('mood-diary');
          }}
        />
      </div>
    </div>
  );
};

const MommyDashboard = () => {
  const { getBabyData } = useUserStore();
  const { toast } = useToast();
  const babyData = getBabyData();
  const { isMilestoneAchieved, toggleMilestone, getMilestoneDate } = useBabyMilestones();
  const { unlockAchievement, getTotalPoints } = useAchievements();
  const { activeTimers, startTimer, stopTimer, getElapsedSeconds, getActiveTimer } = useTimerStore();
  
  // Current time for timer display
  const [, setTick] = useState(0);
  
  // Sleep tracking
  const [totalSleepHours, setTotalSleepHours] = useState(8.5);
  const sleepTimer = getActiveTimer('sleep');
  
  // Feeding tracking with live timer
  const [feedingLogs, setFeedingLogs] = useState<Array<{id: string; type: 'left' | 'right' | 'formula' | 'solid'; time: Date; durationSeconds?: number}>>([
    { id: '1', type: 'left', time: new Date(Date.now() - 3600000), durationSeconds: 900 },
    { id: '2', type: 'right', time: new Date(Date.now() - 7200000), durationSeconds: 720 },
  ]);
  const [showFeedingModal, setShowFeedingModal] = useState(false);
  const leftFeedTimer = getActiveTimer('feeding', 'left');
  const rightFeedTimer = getActiveTimer('feeding', 'right');
  
  // Diaper tracking with types
  const [diaperLogs, setDiaperLogs] = useState<Array<{id: string; type: 'wet' | 'dirty' | 'both'; time: Date}>>([
    { id: '1', type: 'wet', time: new Date(Date.now() - 1800000) },
    { id: '2', type: 'both', time: new Date(Date.now() - 5400000) },
  ]);
  const [showDiaperModal, setShowDiaperModal] = useState(false);

  // Update timer display every second
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!babyData) return null;

  // Use dynamic milestones from hook
  const displayMilestones = MILESTONES.slice(0, 5).map(m => ({
    ...m,
    achieved: isMilestoneAchieved(m.id),
    achievedDate: getMilestoneDate(m.id),
  }));

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleSleep = async () => {
    await hapticFeedback.medium();
    if (sleepTimer) {
      // End sleep
      const result = stopTimer(sleepTimer.id);
      if (result) {
        const hours = result.durationSeconds / 3600;
        setTotalSleepHours(prev => prev + hours);
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
      // Stop feeding
      const result = stopTimer(activeTimer.id);
      if (result) {
        setFeedingLogs(prev => [...prev, { 
          id: Date.now().toString(), 
          type, 
          time: new Date(),
          durationSeconds: result.durationSeconds
        }]);
        toast({ 
          title: `${type === 'left' ? 'Sol' : 'Sağ'} sinə bitti!`, 
          description: `Müddət: ${formatDuration(result.durationSeconds)}` 
        });
        
        // Check for achievement
        if (feedingLogs.length >= 99) {
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
    setFeedingLogs(prev => [...prev, { 
      id: Date.now().toString(), 
      type, 
      time: new Date(),
    }]);
    setShowFeedingModal(false);
    
    const typeLabels = {
      formula: 'Süd əvəzedicisi 🍼',
      solid: 'Əlavə qida 🥣'
    };
    toast({ title: `${typeLabels[type]} qeyd edildi!` });
  };

  const addDiaper = async (type: 'wet' | 'dirty' | 'both') => {
    await hapticFeedback.medium();
    setDiaperLogs(prev => [...prev, { id: Date.now().toString(), type, time: new Date() }]);
    setShowDiaperModal(false);
    
    const typeEmojis = {
      wet: '💧',
      dirty: '💩',
      both: '💧💩'
    };
    toast({ title: `Bez dəyişmə: ${typeEmojis[type]}` });
    
    // Check for achievement
    if (diaperLogs.length >= 99) {
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
    <div className="space-y-6">
      {/* Baby Hero Card */}
      <motion.div 
        className="relative overflow-hidden rounded-[2rem] gradient-mommy p-6 text-white shadow-elevated"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-6">
            <motion.div 
              className="w-24 h-24 rounded-3xl bg-white/20 flex items-center justify-center text-6xl"
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {babyData.gender === 'boy' ? '👶🏻' : '👶🏻'}
            </motion.div>
            <div>
              <h2 className="text-3xl font-black">{babyData.name}</h2>
              <p className="text-white/90 mt-1 font-medium text-lg">
                {babyData.ageInMonths > 0 ? `${babyData.ageInMonths} aylıq` : `${babyData.ageInDays} günlük`}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Award className="w-4 h-4" />
                <span className="text-sm text-white/80">3 nailiyyət əldə edildi</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Sleep Tracker */}
      <motion.div
        className="bg-card rounded-3xl p-5 shadow-card border border-border/50"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center">
              <Moon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Yuxu İzləmə</h3>
              <p className="text-sm text-muted-foreground">Bu gün: {totalSleepHours} saat</p>
            </div>
          </div>
          <motion.button
            onClick={toggleSleep}
            className={`px-5 py-3 rounded-2xl font-bold text-sm ${
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
        className="bg-card rounded-3xl p-5 shadow-card border border-border/50"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
              <Baby className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Qidalanma</h3>
              <p className="text-sm text-muted-foreground">Bu gün: {feedingLogs.length} dəfə</p>
            </div>
          </div>
          <motion.button
            onClick={() => setShowFeedingModal(true)}
            className="px-5 py-3 rounded-2xl bg-amber-100 text-amber-700 font-bold text-sm"
            whileTap={{ scale: 0.95 }}
          >
            + Əlavə et
          </motion.button>
        </div>
        
        {/* Feeding Type Buttons */}
        <AnimatePresence>
          {showFeedingModal && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-2 gap-2 mb-4"
            >
              <motion.button
                onClick={() => toggleFeeding('left')}
                className={`p-4 rounded-2xl flex flex-col items-center gap-2 ${
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
                className={`p-4 rounded-2xl flex flex-col items-center gap-2 ${
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
                className="p-4 rounded-2xl bg-blue-50 border-2 border-blue-200 flex flex-col items-center gap-2"
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-2xl">🍼</span>
                <span className="text-sm font-medium text-blue-700">Süd Əvəzedicisi</span>
              </motion.button>
              <motion.button
                onClick={() => addFeeding('solid')}
                className="p-4 rounded-2xl bg-orange-50 border-2 border-orange-200 flex flex-col items-center gap-2"
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-2xl">🥣</span>
                <span className="text-sm font-medium text-orange-700">Əlavə Qida</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Active feeding timer indicator */}
        {(leftFeedTimer || rightFeedTimer) && !showFeedingModal && (
          <motion.div 
            className="bg-pink-50 rounded-xl p-3 flex items-center justify-between mb-3"
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
        className="bg-card rounded-3xl p-5 shadow-card border border-border/50"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Bez Dəyişmə</h3>
              <p className="text-sm text-muted-foreground">Bu gün: {diaperLogs.length} dəfə</p>
            </div>
          </div>
          <motion.button
            onClick={() => setShowDiaperModal(true)}
            className="px-5 py-3 rounded-2xl bg-emerald-100 text-emerald-700 font-bold text-sm"
            whileTap={{ scale: 0.95 }}
          >
            + Əlavə et
          </motion.button>
        </div>
        
        {/* Diaper Type Buttons */}
        <AnimatePresence>
          {showDiaperModal && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-3 gap-2 mb-4"
            >
              <motion.button
                onClick={() => addDiaper('wet')}
                className="p-4 rounded-2xl bg-blue-50 border-2 border-blue-200 flex items-center justify-center"
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-3xl">💧</span>
              </motion.button>
              <motion.button
                onClick={() => addDiaper('dirty')}
                className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center"
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-3xl">💩</span>
              </motion.button>
              <motion.button
                onClick={() => addDiaper('both')}
                className="p-4 rounded-2xl bg-purple-50 border-2 border-purple-200 flex items-center justify-center"
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-2xl">💧💩</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Recent Diapers */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {diaperLogs.slice(-5).reverse().map((log) => (
            <div 
              key={log.id}
              className="flex-shrink-0 px-3 py-2 rounded-xl bg-muted/50 flex items-center gap-2"
            >
              <span className="text-lg">{getDiaperIcon(log.type)}</span>
              <span className="text-xs text-muted-foreground">
                {log.time.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Milestones */}
      <motion.div 
        className="bg-card rounded-3xl p-5 shadow-card border border-border/50"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">İnkişaf mərhələləri</h3>
          <span className="text-xs text-primary font-bold">
            {displayMilestones.filter(m => m.achieved).length}/{displayMilestones.length}
          </span>
        </div>
        <div className="flex justify-between">
          {displayMilestones.map((milestone, index) => (
            <motion.button 
              key={milestone.id}
              onClick={() => handleMilestoneClick(milestone.id)}
              className="text-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl mb-1 relative ${
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
              <span className={`text-[10px] ${
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
        className="bg-card rounded-3xl p-5 shadow-card border border-border/50"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-lg font-bold text-foreground mb-4">Bugünkü xülasə</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-violet-50 rounded-2xl">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-violet-600" />
              <span className="text-sm font-medium text-foreground">Yuxu</span>
            </div>
            <span className="text-sm font-bold text-violet-600">{totalSleepHours} saat</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-amber-50 rounded-2xl">
            <div className="flex items-center gap-3">
              <Baby className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-medium text-foreground">Qidalanma</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                🤱{feedingLogs.filter(f => f.type === 'left' || f.type === 'right').length}
                🍼{feedingLogs.filter(f => f.type === 'formula').length}
                🥣{feedingLogs.filter(f => f.type === 'solid').length}
              </span>
              <span className="text-sm font-bold text-amber-600">{feedingLogs.length} dəfə</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-2xl">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-medium text-foreground">Bez dəyişmə</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                💧{diaperLogs.filter(d => d.type === 'wet').length}
                💩{diaperLogs.filter(d => d.type === 'dirty').length}
                💧💩{diaperLogs.filter(d => d.type === 'both').length}
              </span>
              <span className="text-sm font-bold text-emerald-600">{diaperLogs.length} dəfə</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Development Tip */}
      <motion.div 
        className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-3xl p-5 border border-teal-100"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35 }}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-mommy/20 flex items-center justify-center text-2xl">
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Sabahınız xeyir';
    if (hour < 18) return 'Günortanız xeyir';
    return 'Axşamınız xeyir';
  };

  const hasPartner = !!profile?.linked_partner_id;

  return (
    <div className="pb-28 pt-2 px-5">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between mb-6"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div>
          <p className="text-muted-foreground font-medium">{getGreeting()}</p>
          <h1 className="text-2xl font-black text-foreground">{name || 'Xanım'} 👋</h1>
        </div>
        <div className="flex items-center gap-2">
          {hasPartner && (
            <motion.button 
              onClick={onOpenChat}
              className="w-12 h-12 rounded-2xl bg-partner/10 flex items-center justify-center relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <MessageCircle className="w-6 h-6 text-partner" />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </motion.button>
          )}
          <motion.button 
            className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bell className="w-6 h-6 text-primary" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full text-[10px] font-bold text-white flex items-center justify-center">
              3
            </span>
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
