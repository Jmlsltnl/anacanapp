import { motion } from 'framer-motion';
import { Droplets, Moon, Utensils, Activity } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { FRUIT_SIZES } from '@/types/anacan';

const FlowDashboard = () => {
  const { getCycleData, name } = useUserStore();
  const cycleData = getCycleData();

  if (!cycleData) return null;

  const phaseMessages = {
    menstrual: 'Menstruasiya dövrünüzdesiniz. Özünüzə qulluq edin 💕',
    follicular: 'Enerji artır! Yeni layihələrə başlamaq üçün əla vaxtdır ✨',
    ovulation: 'Fertil günlərinizdəsiniz. Enerji ən yüksək səviyyədədir! 🌟',
    luteal: 'Sakit qalın, PMS yaxınlaşır. Özünüzə yumşaq olun 🌸',
  };

  return (
    <div className="space-y-6">
      {/* Cycle Circle */}
      <div className="flex justify-center">
        <div className="relative w-56 h-56">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="45" fill="none"
              stroke="url(#flowGradient)" strokeWidth="8"
              strokeDasharray={`${(cycleData.currentDay / cycleData.cycleLength) * 283} 283`}
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(340, 70%, 60%)" />
                <stop offset="100%" stopColor="hsl(320, 60%, 70%)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold text-foreground">{cycleData.currentDay}</span>
            <span className="text-muted-foreground">/ {cycleData.cycleLength} gün</span>
          </div>
        </div>
      </div>

      {/* Phase Message */}
      <motion.div 
        className="bg-flow-light rounded-2xl p-4 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-foreground font-medium">{phaseMessages[cycleData.phase]}</p>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: Droplets, label: 'Su', color: 'bg-blue-100 text-blue-600' },
          { icon: Moon, label: 'Yuxu', color: 'bg-purple-100 text-purple-600' },
          { icon: Utensils, label: 'Qida', color: 'bg-orange-100 text-orange-600' },
          { icon: Activity, label: 'Əhval', color: 'bg-pink-100 text-pink-600' },
        ].map((item) => (
          <button key={item.label} className={`${item.color} p-4 rounded-2xl flex flex-col items-center gap-2`}>
            <item.icon className="w-6 h-6" />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const BumpDashboard = () => {
  const { getPregnancyData } = useUserStore();
  const pregData = getPregnancyData();

  if (!pregData) return null;

  const weekData = FRUIT_SIZES[pregData.currentWeek] || FRUIT_SIZES[12];

  return (
    <div className="space-y-6">
      {/* Baby Size Card */}
      <motion.div 
        className="gradient-bump rounded-3xl p-6 text-white text-center"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <p className="text-white/80 mb-2">Körpəniz hazırda</p>
        <div className="text-7xl mb-3">{weekData.emoji}</div>
        <h2 className="text-2xl font-bold">{weekData.fruit}</h2>
        <p className="text-white/80 mt-2">{weekData.lengthCm} sm • {weekData.weightG} qram</p>
      </motion.div>

      {/* Week Counter */}
      <div className="bg-card rounded-2xl p-5 shadow-card text-center">
        <span className="text-5xl font-bold text-bump">{pregData.currentWeek}</span>
        <span className="text-2xl text-muted-foreground ml-1">həftə</span>
        <p className="text-muted-foreground mt-1">{pregData.currentDay} gün • {pregData.trimester}-ci trimester</p>
      </div>

      {/* Baby Message */}
      <div className="bg-bump-light rounded-2xl p-4">
        <p className="text-sm text-muted-foreground mb-1">💬 Körpədən mesaj</p>
        <p className="text-foreground font-medium italic">"Salam ana! Bu gün çox böyüdüm, səni sevirəm!"</p>
      </div>
    </div>
  );
};

const MommyDashboard = () => {
  const { getBabyData } = useUserStore();
  const babyData = getBabyData();

  if (!babyData) return null;

  return (
    <div className="space-y-6">
      {/* Baby Card */}
      <motion.div 
        className="gradient-mommy rounded-3xl p-6 text-white text-center"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="text-6xl mb-3">{babyData.gender === 'boy' ? '👶🏻' : '👶🏻'}</div>
        <h2 className="text-2xl font-bold">{babyData.name}</h2>
        <p className="text-white/80 mt-1">
          {babyData.ageInMonths > 0 ? `${babyData.ageInMonths} aylıq` : `${babyData.ageInDays} günlük`}
        </p>
      </motion.div>

      {/* Quick Trackers */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { emoji: '😴', label: 'Yuxu', value: '2 saat əvvəl' },
          { emoji: '🍼', label: 'Qida', value: '45 dəq əvvəl' },
          { emoji: '👶', label: 'Bez', value: '1 saat əvvəl' },
        ].map((item) => (
          <button key={item.label} className="bg-card rounded-2xl p-4 shadow-card text-center">
            <span className="text-3xl">{item.emoji}</span>
            <p className="text-xs font-medium text-foreground mt-2">{item.label}</p>
            <p className="text-xs text-muted-foreground">{item.value}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { lifeStage, name } = useUserStore();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Sabahınız xeyir';
    if (hour < 18) return 'Günortanız xeyir';
    return 'Axşamınız xeyir';
  };

  return (
    <div className="pb-24 pt-4 px-5">
      {/* Header */}
      <div className="mb-6">
        <p className="text-muted-foreground">{getGreeting()}</p>
        <h1 className="text-2xl font-bold text-foreground">{name || 'Xanım'} 👋</h1>
      </div>

      {lifeStage === 'flow' && <FlowDashboard />}
      {lifeStage === 'bump' && <BumpDashboard />}
      {lifeStage === 'mommy' && <MommyDashboard />}
    </div>
  );
};

export default Dashboard;
