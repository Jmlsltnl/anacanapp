import { motion } from 'framer-motion';
import { Droplets, Moon, Utensils, Activity, Plus, TrendingUp, Heart, Sparkles, Bell, ChevronRight } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { FRUIT_SIZES } from '@/types/anacan';

const QuickActionButton = ({ icon: Icon, label, color, onClick }: { icon: any; label: string; color: string; onClick?: () => void }) => (
  <motion.button 
    onClick={onClick}
    className={`${color} p-4 rounded-2xl flex flex-col items-center gap-2 shadow-card`}
    whileHover={{ scale: 1.05, y: -2 }}
    whileTap={{ scale: 0.95 }}
  >
    <Icon className="w-6 h-6" />
    <span className="text-xs font-bold">{label}</span>
  </motion.button>
);

const FlowDashboard = () => {
  const { getCycleData, name } = useUserStore();
  const cycleData = getCycleData();

  if (!cycleData) return null;

  const phaseData = {
    menstrual: { 
      message: 'Menstruasiya dövrünüzdesiniz. Özünüzə qulluq edin 💕',
      emoji: '🌸',
      color: 'from-rose-500 to-pink-600'
    },
    follicular: { 
      message: 'Enerji artır! Yeni layihələrə başlamaq üçün əla vaxtdır ✨',
      emoji: '🌱',
      color: 'from-emerald-500 to-teal-600'
    },
    ovulation: { 
      message: 'Fertil günlərinizdəsiniz. Enerji ən yüksək səviyyədədir! 🌟',
      emoji: '✨',
      color: 'from-amber-500 to-orange-600'
    },
    luteal: { 
      message: 'Sakit qalın, PMS yaxınlaşır. Özünüzə yumşaq olun 🌸',
      emoji: '🌙',
      color: 'from-violet-500 to-purple-600'
    },
  };

  const currentPhase = phaseData[cycleData.phase];
  const progress = (cycleData.currentDay / cycleData.cycleLength) * 100;

  return (
    <div className="space-y-6">
      {/* Main Cycle Card */}
      <motion.div 
        className="relative overflow-hidden rounded-[2rem] gradient-flow p-6 text-white shadow-elevated"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Background decoration */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/5 blur-xl" />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-white/80 text-sm font-medium">Dövrün günü</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-5xl font-black">{cycleData.currentDay}</span>
                <span className="text-xl text-white/70">/ {cycleData.cycleLength}</span>
              </div>
            </div>
            <motion.div 
              className="text-6xl"
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {currentPhase.emoji}
            </motion.div>
          </div>

          {/* Progress bar */}
          <div className="h-3 bg-white/20 rounded-full overflow-hidden mb-4">
            <motion.div 
              className="h-full bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </div>

          <p className="text-white/90 font-medium">{currentPhase.message}</p>
        </div>
      </motion.div>

      {/* Quick Log Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">Bugün qeyd et</h3>
          <button className="text-primary text-sm font-semibold flex items-center gap-1">
            Hamısı <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <QuickActionButton icon={Droplets} label="Su" color="bg-blue-50 text-blue-600" />
          <QuickActionButton icon={Moon} label="Yuxu" color="bg-violet-50 text-violet-600" />
          <QuickActionButton icon={Utensils} label="Qida" color="bg-orange-50 text-orange-600" />
          <QuickActionButton icon={Activity} label="Əhval" color="bg-pink-50 text-pink-600" />
        </div>
      </div>

      {/* Symptoms */}
      <motion.div 
        className="bg-card rounded-3xl p-5 shadow-card border border-border/50"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">Simptomlar</h3>
          <button className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Plus className="w-5 h-5 text-primary" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {['Baş ağrısı', 'Yorğunluq', 'Sancı', 'Əsəbilik'].map((symptom) => (
            <button 
              key={symptom}
              className="px-4 py-2 rounded-full bg-muted text-muted-foreground text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors"
            >
              {symptom}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Insights Card */}
      <motion.div 
        className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-3xl p-5 border border-orange-100"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-foreground">Gündəlik məsləhət</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Bu dövrdə dəmir zəngin qidalar qəbul etmək sizin üçün faydalı olacaq.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const BumpDashboard = () => {
  const { getPregnancyData } = useUserStore();
  const pregData = getPregnancyData();

  if (!pregData) return null;

  const weekData = FRUIT_SIZES[pregData.currentWeek] || FRUIT_SIZES[12];
  const daysLeft = pregData.dueDate ? Math.ceil((pregData.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="space-y-6">
      {/* Baby Size Hero Card */}
      <motion.div 
        className="relative overflow-hidden rounded-[2rem] gradient-bump p-6 text-white shadow-elevated"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Decorative elements */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 blur-xl" />
        
        <div className="relative z-10 text-center">
          <p className="text-white/80 text-sm font-medium mb-3">Körpəniz hazırda</p>
          <motion.div 
            className="text-8xl mb-3"
            animate={{ 
              scale: [1, 1.05, 1],
              y: [0, -5, 0]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            {weekData.emoji}
          </motion.div>
          <h2 className="text-3xl font-black">{weekData.fruit}</h2>
          <p className="text-white/80 mt-2 font-medium">
            {weekData.lengthCm} sm uzunluq • {weekData.weightG}g çəki
          </p>
        </div>
      </motion.div>

      {/* Week Counter & Due Date */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div 
          className="bg-card rounded-3xl p-5 shadow-card border border-border/50 text-center"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-5xl font-black text-bump">{pregData.currentWeek}</div>
          <p className="text-muted-foreground font-medium mt-1">həftə</p>
          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-bump/10 text-bump text-xs font-bold">
            {pregData.trimester}-ci trimester
          </div>
        </motion.div>

        <motion.div 
          className="bg-card rounded-3xl p-5 shadow-card border border-border/50 text-center"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="text-5xl font-black text-primary">{daysLeft}</div>
          <p className="text-muted-foreground font-medium mt-1">gün qaldı</p>
          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
            Təxmini tarix
          </div>
        </motion.div>
      </div>

      {/* Baby Message */}
      <motion.div 
        className="relative overflow-hidden bg-gradient-to-r from-violet-50 to-purple-50 rounded-3xl p-5 border border-violet-100"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="absolute -right-4 -top-4 text-6xl opacity-20">💬</div>
        <p className="text-xs text-bump font-bold uppercase tracking-wider mb-2">Körpədən mesaj</p>
        <p className="text-foreground font-medium italic text-lg leading-relaxed">
          "Salam ana! Bu gün çox böyüdüm. Səsini eşidirəm və səni çox sevirəm! 💕"
        </p>
      </motion.div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-bold text-foreground mb-4">Bugün</h3>
        <div className="grid grid-cols-4 gap-3">
          <QuickActionButton icon={Droplets} label="Su" color="bg-blue-50 text-blue-600" />
          <QuickActionButton icon={Heart} label="Təpik" color="bg-rose-50 text-rose-600" />
          <QuickActionButton icon={Activity} label="Çəki" color="bg-emerald-50 text-emerald-600" />
          <QuickActionButton icon={Sparkles} label="Əhval" color="bg-amber-50 text-amber-600" />
        </div>
      </div>
    </div>
  );
};

const MommyDashboard = () => {
  const { getBabyData } = useUserStore();
  const babyData = getBabyData();

  if (!babyData) return null;

  const trackers = [
    { emoji: '😴', label: 'Yuxu', value: '2 saat', subtext: 'əvvəl', color: 'from-violet-500 to-purple-600' },
    { emoji: '🍼', label: 'Qida', value: '45 dəq', subtext: 'əvvəl', color: 'from-amber-500 to-orange-600' },
    { emoji: '👶', label: 'Bez', value: '1 saat', subtext: 'əvvəl', color: 'from-emerald-500 to-teal-600' },
  ];

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
        
        <div className="relative z-10 text-center">
          <motion.div 
            className="text-7xl mb-3"
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {babyData.gender === 'boy' ? '👶🏻' : '👶🏻'}
          </motion.div>
          <h2 className="text-3xl font-black">{babyData.name}</h2>
          <p className="text-white/90 mt-2 font-medium text-lg">
            {babyData.ageInMonths > 0 ? `${babyData.ageInMonths} aylıq` : `${babyData.ageInDays} günlük`}
          </p>
        </div>
      </motion.div>

      {/* Quick Trackers */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">İzləyicilər</h3>
          <button className="text-primary text-sm font-semibold">+ Əlavə et</button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {trackers.map((tracker, index) => (
            <motion.button 
              key={tracker.label}
              className="bg-card rounded-2xl p-4 shadow-card border border-border/50 text-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              <motion.span 
                className="text-4xl block mb-2"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
              >
                {tracker.emoji}
              </motion.span>
              <p className="text-xs font-bold text-foreground">{tracker.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{tracker.value} {tracker.subtext}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Today's Summary */}
      <motion.div 
        className="bg-card rounded-3xl p-5 shadow-card border border-border/50"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-lg font-bold text-foreground mb-4">Bugünkü xülasə</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-violet-50 rounded-2xl">
            <span className="text-sm font-medium text-foreground">Yuxu</span>
            <span className="text-sm font-bold text-violet-600">8 saat 30 dəq</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-amber-50 rounded-2xl">
            <span className="text-sm font-medium text-foreground">Qidalanma</span>
            <span className="text-sm font-bold text-amber-600">6 dəfə</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-2xl">
            <span className="text-sm font-medium text-foreground">Bez dəyişmə</span>
            <span className="text-sm font-bold text-emerald-600">4 dəfə</span>
          </div>
        </div>
      </motion.div>

      {/* Development Tip */}
      <motion.div 
        className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-3xl p-5 border border-teal-100"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-mommy/20 flex items-center justify-center text-2xl">
            💡
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-foreground">İnkişaf məsləhəti</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Bu yaşda körpəniz rəngləri fərqləndirməyə başlayır. Parlaq oyuncaqlar göstərin!
            </p>
          </div>
        </div>
      </motion.div>
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
      </motion.div>

      {lifeStage === 'flow' && <FlowDashboard />}
      {lifeStage === 'bump' && <BumpDashboard />}
      {lifeStage === 'mommy' && <MommyDashboard />}
    </div>
  );
};

export default Dashboard;
