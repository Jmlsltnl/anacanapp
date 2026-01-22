import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Bell, ShoppingCart, MessageCircle, 
  Gift, Calendar, CheckCircle, Plus, 
  Sparkles, Baby, Clock, AlertCircle, Home,
  Coffee, Flower2, Stethoscope, Star, Trophy,
  Target, Zap, Send, Droplets, Activity, BarChart3,
  Moon, Smile, Frown, Meh, User, Timer
} from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { hapticFeedback } from '@/lib/native';
import { useToast } from '@/hooks/use-toast';
import { useShoppingItems } from '@/hooks/useShoppingItems';
import { useAuth } from '@/hooks/useAuth';
import { usePartnerData } from '@/hooks/usePartnerData';
import { usePartnerMessages } from '@/hooks/usePartnerMessages';
import { supabase } from '@/integrations/supabase/client';
import { FRUIT_SIZES } from '@/types/anacan';
import PartnerChatScreen from './partner/PartnerChatScreen';
import WeeklyStatsTab from './partner/WeeklyStatsTab';
import NotificationsTab from './partner/NotificationsTab';

interface Mission {
  id: string;
  title: string;
  description: string;
  icon: any;
  points: number;
  isCompleted: boolean;
  category: 'care' | 'support' | 'surprise';
  difficulty: 'easy' | 'medium' | 'hard';
}

// Animated Progress Ring
const ProgressRing = ({ progress, size = 120, strokeWidth = 10, color = 'stroke-white' }: {
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
        className="stroke-white/20"
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
        transition={{ duration: 1.2, ease: "easeOut" }}
        style={{ strokeDasharray: circumference }}
      />
    </svg>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, value, label, color, delay = 0 }: {
  icon: any;
  value: string | number;
  label: string;
  color: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className={`${color} rounded-2xl p-4 text-white relative overflow-hidden`}
  >
    <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-white/10 blur-xl" />
    <Icon className="w-5 h-5 mb-2 opacity-80" />
    <p className="text-2xl font-black">{value}</p>
    <p className="text-xs opacity-80">{label}</p>
  </motion.div>
);

// Quick Action Button
const QuickAction = ({ icon: Icon, label, gradient, onClick, delay = 0 }: {
  icon: any;
  label: string;
  gradient: string;
  onClick?: () => void;
  delay?: number;
}) => (
  <motion.button
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay }}
    onClick={onClick}
    className={`${gradient} rounded-2xl p-4 flex flex-col items-center gap-2 shadow-lg`}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.95 }}
  >
    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
      <Icon className="w-6 h-6 text-white" />
    </div>
    <span className="text-white font-medium text-xs">{label}</span>
  </motion.button>
);

const PartnerDashboard = () => {
  const { name } = useUserStore();
  const { toast } = useToast();
  const { profile } = useAuth();
  const { partnerProfile, partnerDailyLog, loading: partnerLoading, getPregnancyWeek, getDaysUntilDue, getBabyAgeDays } = usePartnerData();
  const { items: shoppingItems, addItem, toggleItem, loading: shoppingLoading } = useShoppingItems();
  const { messages, markAsRead, getUnreadCount } = usePartnerMessages();
  const [activeTab, setActiveTab] = useState<'home' | 'missions' | 'shopping' | 'notifications' | 'stats'>('home');
  const [showChat, setShowChat] = useState(false);
  const [missions, setMissions] = useState<Mission[]>([
    { id: '1', title: 'Səhər çay hazırla', description: 'Zəncəfilli çay ürəkbulanmaya kömək edir', icon: Coffee, points: 10, isCompleted: false, category: 'care', difficulty: 'easy' },
    { id: '2', title: 'Ayaq masajı et', description: 'Axşam 15 dəqiqə rahatlatıcı masaj', icon: Heart, points: 20, isCompleted: true, category: 'care', difficulty: 'medium' },
    { id: '3', title: 'Gül gətir', description: 'Onu sürpriz etmək üçün', icon: Flower2, points: 15, isCompleted: false, category: 'surprise', difficulty: 'easy' },
    { id: '4', title: 'Həkim vizitinə götür', description: 'Bu həftəki USG randevusu', icon: Stethoscope, points: 25, isCompleted: false, category: 'support', difficulty: 'hard' },
    { id: '5', title: 'Körpə otağını hazırla', description: 'Mebel yığmaqda kömək et', icon: Baby, points: 30, isCompleted: false, category: 'support', difficulty: 'hard' },
  ]);

  const [newItem, setNewItem] = useState('');
  const [loveMessage, setLoveMessage] = useState('');

  // Convert shopping items from DB to local format
  const shoppingList = shoppingItems.map(item => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    isChecked: item.is_checked,
    addedBy: (item.added_by || 'woman') as 'partner' | 'woman',
    priority: item.priority as 'low' | 'medium' | 'high'
  }));

  // Use real partner data or fallback
  const womanName = partnerProfile?.name || 'Həyat yoldaşın';
  const womanMood = partnerDailyLog?.mood || 4;
  const womanSymptoms = partnerDailyLog?.symptoms || [];
  const waterIntake = partnerDailyLog?.water_intake || 0;
  const lifeStage = partnerProfile?.life_stage || 'bump';
  
  // Calculate pregnancy week from real data
  const currentWeek = getPregnancyWeek() || 0;
  const daysUntilDue = getDaysUntilDue() || 0;
  const babyAgeDays = getBabyAgeDays();
  
  // Get fruit emoji for current week
  const weekData = currentWeek > 0 ? (FRUIT_SIZES[currentWeek] || FRUIT_SIZES[24]) : null;
  
  const totalPoints = missions.filter(m => m.isCompleted).reduce((sum, m) => sum + m.points, 0);
  const level = Math.floor(totalPoints / 50) + 1;
  const pointsToNextLevel = 50 - (totalPoints % 50);
  const levelProgress = ((totalPoints % 50) / 50) * 100;

  const toggleMission = async (id: string) => {
    await hapticFeedback.medium();
    const mission = missions.find(m => m.id === id);
    setMissions(missions.map(m => 
      m.id === id ? { ...m, isCompleted: !m.isCompleted } : m
    ));
    
    if (mission && !mission.isCompleted) {
      toast({
        title: `+${mission.points} xal qazandın! 🎉`,
        description: mission.title,
      });
    }
  };

  const toggleShoppingItem = async (id: string) => {
    await hapticFeedback.light();
    await toggleItem(id);
  };

  const addShoppingItem = async () => {
    if (newItem.trim()) {
      await addItem({ name: newItem, quantity: 1, priority: 'medium' });
      setNewItem('');
      toast({ title: 'Məhsul əlavə edildi! 🛒' });
    }
  };

  const sendLove = async () => {
    await hapticFeedback.heavy();
    
    if (profile && partnerProfile) {
      try {
        await supabase.from('partner_messages').insert({
          sender_id: profile.user_id,
          receiver_id: partnerProfile.user_id,
          message_type: 'love',
          content: '❤️',
        });
        toast({
          title: '💕 Sevgi göndərildi!',
          description: `${womanName} bildiriş alacaq`,
        });
      } catch (err) {
        console.error('Error sending love:', err);
      }
    } else {
      toast({
        title: 'Partner bağlantısı yoxdur',
        description: 'Əvvəlcə partner kodunu bağlayın',
        variant: 'destructive',
      });
    }
  };

  const sendMessage = async () => {
    if (loveMessage.trim() && profile && partnerProfile) {
      await hapticFeedback.medium();
      
      try {
        await supabase.from('partner_messages').insert({
          sender_id: profile.user_id,
          receiver_id: partnerProfile.user_id,
          message_type: 'text',
          content: loveMessage,
        });
        toast({
          title: '💌 Mesaj göndərildi!',
          description: loveMessage,
        });
        setLoveMessage('');
      } catch (err) {
        console.error('Error sending message:', err);
      }
    }
  };

  const getMoodEmoji = (mood: number) => {
    const emojis = ['😢', '😔', '😐', '🙂', '😊'];
    return emojis[mood - 1] || '😊';
  };

  const getMoodText = (mood: number) => {
    const texts = ['Çox pis', 'Pis', 'Normal', 'Yaxşı', 'Əla'];
    return texts[mood - 1] || 'Yaxşı';
  };

  const getMoodColor = (mood: number) => {
    if (mood >= 4) return 'from-emerald-400 to-green-500';
    if (mood === 3) return 'from-amber-400 to-yellow-500';
    return 'from-rose-400 to-red-500';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'hard': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-rose-500';
      case 'medium': return 'bg-amber-500';
      case 'low': return 'bg-emerald-500';
      default: return 'bg-muted';
    }
  };

  // Show chat screen if active
  if (showChat) {
    return <PartnerChatScreen onBack={() => setShowChat(false)} />;
  }

  // Loading state
  if (partnerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div 
          className="w-16 h-16 rounded-full border-4 border-partner border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  // No partner linked state
  if (!partnerProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-partner/20 to-background flex flex-col items-center justify-center p-8 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 rounded-full bg-partner/20 flex items-center justify-center mb-6"
        >
          <Heart className="w-12 h-12 text-partner" />
        </motion.div>
        <h1 className="text-2xl font-black mb-2">Partner Bağlantısı Yoxdur</h1>
        <p className="text-muted-foreground mb-6">
          Həyat yoldaşınızın partner kodunu daxil edərək qeydiyyatdan keçin
        </p>
        <div className="bg-card rounded-2xl p-6 shadow-lg border border-border/50">
          <p className="text-sm text-muted-foreground mb-2">Qeydiyyat zamanı partner kodunu daxil etdiniz?</p>
          <p className="text-xs text-muted-foreground">
            Bağlantı yaradılması üçün bir neçə saniyə gözləyin və səhifəni yeniləyin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 bg-background">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-partner via-indigo-600 to-violet-700 px-5 pt-6 pb-16 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-pink-500/20 blur-3xl" />
        <div className="absolute top-1/2 right-1/4 w-20 h-20 rounded-full bg-amber-500/20 blur-2xl" />
        
        <div className="relative z-10">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-white/70 text-sm font-medium">Partner Paneli</p>
              <h1 className="text-2xl font-black text-white">Salam, {name || 'Partner'}! 👋</h1>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                onClick={sendLove}
                className="w-12 h-12 rounded-full bg-pink-500/30 backdrop-blur flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Heart className="w-6 h-6 text-white fill-white" />
              </motion.button>
              <motion.button
                onClick={() => setActiveTab('notifications')}
                className="w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center relative"
                whileTap={{ scale: 0.95 }}
              >
                <Bell className="w-6 h-6 text-white" />
                {getUnreadCount() > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center">
                    {getUnreadCount() > 9 ? '9+' : getUnreadCount()}
                  </span>
                )}
              </motion.button>
            </div>
          </div>

          {/* Partner Status Card */}
          <motion.div 
            className="bg-white/10 backdrop-blur-xl rounded-3xl p-5 border border-white/20"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <div className="flex items-center gap-4">
              {/* Avatar with mood ring */}
              <div className="relative">
                <motion.div 
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-4xl shadow-lg"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {lifeStage === 'bump' ? '🤰' : lifeStage === 'mommy' ? '👩‍🍼' : '👩'}
                </motion.div>
                <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-r ${getMoodColor(womanMood)} flex items-center justify-center text-lg shadow-md border-2 border-white`}>
                  {getMoodEmoji(womanMood)}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1">
                <h2 className="text-white font-bold text-xl">{womanName}</h2>
                <p className="text-white/70 text-sm">
                  {lifeStage === 'bump' && currentWeek > 0 
                    ? `Hamiləlik: ${currentWeek}. həftə` 
                    : lifeStage === 'mommy' 
                    ? `Körpə: ${babyAgeDays} günlük`
                    : 'Bağlı'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getMoodColor(womanMood)} text-white`}>
                    {getMoodText(womanMood)}
                  </span>
                  {womanSymptoms.length > 0 && (
                    <span className="px-2 py-1 rounded-full text-xs bg-white/20 text-white">
                      {womanSymptoms.length} simptom
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats row */}
            {lifeStage === 'bump' && currentWeek > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-5">
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <Calendar className="w-5 h-5 text-white/70 mx-auto mb-1" />
                  <p className="text-white font-bold text-lg">{daysUntilDue}</p>
                  <p className="text-white/60 text-xs">Gün qaldı</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <Baby className="w-5 h-5 text-white/70 mx-auto mb-1" />
                  <p className="text-3xl">{weekData?.emoji || '👶'}</p>
                  <p className="text-white/60 text-xs">{weekData?.fruit || 'Körpə'}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <Droplets className="w-5 h-5 text-white/70 mx-auto mb-1" />
                  <p className="text-white font-bold text-lg">{waterIntake}</p>
                  <p className="text-white/60 text-xs">ml su</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-5 -mt-6 relative z-20">
        <div className="bg-card rounded-2xl p-1.5 flex gap-1 shadow-xl border border-border/50">
          {[
            { id: 'home', label: 'Əsas', icon: Home },
            { id: 'notifications', label: 'Bildiriş', icon: Bell, badge: getUnreadCount() },
            { id: 'stats', label: 'Statistika', icon: BarChart3 },
            { id: 'missions', label: 'Tapşırıq', icon: Target },
            { id: 'shopping', label: 'Siyahı', icon: ShoppingCart },
          ].map(tab => {
            const Icon = tab.icon;
            const badge = 'badge' in tab ? tab.badge : 0;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-3 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 relative ${
                  isActive 
                    ? 'bg-partner text-white shadow-md' 
                    : 'text-muted-foreground hover:bg-muted/50'
                }`}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {badge > 0 && !isActive && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 mt-6">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-5"
            >
              {/* Quick Message */}
              <motion.div
                className="bg-card rounded-2xl p-5 shadow-lg border border-border/50"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-partner/10 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-partner" />
                  </div>
                  <h3 className="font-bold text-lg">Mesaj göndər</h3>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={loveMessage}
                    onChange={(e) => setLoveMessage(e.target.value)}
                    placeholder="Sevgi mesajı yaz..."
                    className="flex-1 h-12 px-4 rounded-xl bg-muted/50 text-sm outline-none border-2 border-transparent focus:border-partner/30 transition-colors"
                  />
                  <motion.button
                    onClick={sendMessage}
                    disabled={!loveMessage.trim()}
                    className="w-12 h-12 rounded-xl bg-partner text-white flex items-center justify-center disabled:opacity-50"
                    whileTap={{ scale: 0.95 }}
                  >
                    <Send className="w-5 h-5" />
                  </motion.button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {['❤️ Səni sevirəm!', '🌹 Gözəlsən!', '💪 Güclüsən!', '😘 Öpürəm!'].map(msg => (
                    <motion.button
                      key={msg}
                      onClick={() => setLoveMessage(msg)}
                      className="px-3 py-1.5 bg-partner/10 text-partner rounded-full text-xs font-medium hover:bg-partner/20 transition-colors"
                      whileTap={{ scale: 0.95 }}
                    >
                      {msg}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Alert Card */}
              {womanSymptoms.length > 0 && (
                <motion.div
                  className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-800 flex items-start gap-3"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-800 dark:text-amber-200">Bugünkü simptomlar</h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      {womanName} bugün: {womanSymptoms.slice(0, 3).join(', ')}
                      {womanSymptoms.length > 3 && ` +${womanSymptoms.length - 3}`}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Quick Actions */}
              <div>
                <h2 className="font-bold text-lg mb-3">Sürətli Hərəkətlər</h2>
                <div className="grid grid-cols-2 gap-3">
                  <QuickAction 
                    icon={Heart} 
                    label="Sevgi göndər" 
                    gradient="bg-gradient-to-br from-pink-500 to-rose-600"
                    onClick={sendLove}
                    delay={0.1}
                  />
                  <QuickAction 
                    icon={MessageCircle} 
                    label="Canlı chat" 
                    gradient="bg-gradient-to-br from-partner to-indigo-600"
                    onClick={() => setShowChat(true)}
                    delay={0.15}
                  />
                  <QuickAction 
                    icon={Gift} 
                    label="Sürpriz planla" 
                    gradient="bg-gradient-to-br from-amber-500 to-orange-600"
                    delay={0.2}
                  />
                  <QuickAction 
                    icon={BarChart3} 
                    label="Statistika" 
                    gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
                    onClick={() => setActiveTab('stats')}
                    delay={0.25}
                  />
                </div>
              </div>

              {/* Level Progress */}
              <motion.div 
                className="bg-gradient-to-br from-partner to-violet-700 rounded-3xl p-5 relative overflow-hidden"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <ProgressRing progress={levelProgress} size={60} strokeWidth={5} />
                        <span className="absolute inset-0 flex items-center justify-center text-white font-black text-lg">
                          {level}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">Səviyyə {level}</h3>
                        <p className="text-white/70 text-sm">{pointsToNextLevel} xal lazım</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Trophy className="w-8 h-8 text-amber-400 mx-auto mb-1" />
                      <p className="text-white font-bold">{totalPoints}</p>
                      <p className="text-white/60 text-xs">Xal</p>
                    </div>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-white rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${levelProgress}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Today's Tip */}
              <motion.div 
                className="bg-card rounded-2xl p-5 shadow-lg border border-border/50"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="font-bold text-lg">Günün Məsləhəti</h3>
                </div>
                <p className="text-muted-foreground">
                  {currentWeek > 0 
                    ? `${currentWeek}. həftədə körpə artıq səsləri eşidə bilir. Ona mahnı oxumaq və ya danışmaq əlaqənizi gücləndirir! 🎵`
                    : 'Həyat yoldaşınıza hər gün sevginizi göstərin. Kiçik jestlər böyük fərq yaradır! 💕'
                  }
                </p>
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'notifications' && <NotificationsTab />}

          {activeTab === 'stats' && <WeeklyStatsTab />}

          {activeTab === 'missions' && (
            <motion.div
              key="missions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-5"
            >
              {/* Mission Stats */}
              <div className="grid grid-cols-3 gap-3">
                <StatCard 
                  icon={CheckCircle} 
                  value={missions.filter(m => m.isCompleted).length}
                  label="Tamamlandı"
                  color="bg-gradient-to-br from-emerald-500 to-green-600"
                  delay={0}
                />
                <StatCard 
                  icon={Target} 
                  value={missions.filter(m => !m.isCompleted).length}
                  label="Gözləyir"
                  color="bg-gradient-to-br from-amber-500 to-orange-600"
                  delay={0.1}
                />
                <StatCard 
                  icon={Zap} 
                  value={totalPoints}
                  label="Xal"
                  color="bg-gradient-to-br from-violet-500 to-purple-600"
                  delay={0.2}
                />
              </div>

              <h2 className="font-bold text-lg">Gündəlik Tapşırıqlar</h2>

              {missions.map((mission, index) => {
                const Icon = mission.icon;
                return (
                  <motion.div
                    key={mission.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className={`bg-card rounded-2xl p-4 shadow-lg border-2 transition-all ${
                      mission.isCompleted 
                        ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/20' 
                        : 'border-border/50 hover:border-partner/30'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <motion.button
                        onClick={() => toggleMission(mission.id)}
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                          mission.isCompleted 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-partner/10 text-partner'
                        }`}
                        whileTap={{ scale: 0.9 }}
                      >
                        {mission.isCompleted ? (
                          <CheckCircle className="w-7 h-7" />
                        ) : (
                          <Icon className="w-7 h-7" />
                        )}
                      </motion.button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className={`font-semibold truncate ${mission.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                            {mission.title}
                          </h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${getDifficultyColor(mission.difficulty)}`}>
                            {mission.difficulty === 'easy' ? 'Asan' : mission.difficulty === 'medium' ? 'Orta' : 'Çətin'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{mission.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Star className="w-4 h-4 text-amber-500" />
                          <span className="text-sm font-bold text-amber-600 dark:text-amber-400">+{mission.points} xal</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {activeTab === 'shopping' && (
            <motion.div
              key="shopping"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg">Ortaq Alış-veriş</h2>
                <span className="text-sm text-partner font-medium bg-partner/10 px-3 py-1 rounded-full">
                  {shoppingList.filter(i => i.isChecked).length}/{shoppingList.length}
                </span>
              </div>
              
              {/* Add Item */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Yeni məhsul əlavə et..."
                  className="flex-1 h-12 px-4 rounded-xl bg-muted/50 border-2 border-transparent focus:border-partner/30 outline-none transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && addShoppingItem()}
                />
                <motion.button
                  onClick={addShoppingItem}
                  className="w-12 h-12 rounded-xl bg-partner text-white flex items-center justify-center"
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Priority Legend */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Vacib</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Orta</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Aşağı</span>
                </div>
              </div>

              {/* Shopping List */}
              {shoppingList.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">Siyahı boşdur</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {shoppingList
                    .sort((a, b) => {
                      const priorityOrder = { high: 0, medium: 1, low: 2 };
                      return priorityOrder[a.priority] - priorityOrder[b.priority];
                    })
                    .map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`bg-card rounded-xl p-4 flex items-center gap-3 shadow-md border-2 transition-all ${
                        item.isChecked ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/20' : 'border-border/50'
                      }`}
                    >
                      <div className={`w-1.5 h-10 rounded-full ${getPriorityColor(item.priority)}`} />
                      <motion.button
                        onClick={() => toggleShoppingItem(item.id)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0 ${
                          item.isChecked 
                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                            : 'border-muted-foreground/30'
                        }`}
                        whileTap={{ scale: 0.9 }}
                      >
                        {item.isChecked && <CheckCircle className="w-5 h-5" />}
                      </motion.button>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${item.isChecked ? 'line-through text-muted-foreground' : ''}`}>
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.addedBy === 'woman' ? `${womanName}` : 'Sən'} əlavə etdi
                        </p>
                      </div>
                      <span className="text-sm font-bold text-muted-foreground bg-muted px-2 py-1 rounded-lg shrink-0">
                        x{item.quantity}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Summary */}
              {shoppingList.length > 0 && (
                <motion.div 
                  className="bg-partner/10 rounded-2xl p-4"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Tamamlanan</span>
                    <span className="text-lg font-bold text-partner">
                      {Math.round((shoppingList.filter(i => i.isChecked).length / shoppingList.length) * 100) || 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-partner rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(shoppingList.filter(i => i.isChecked).length / shoppingList.length) * 100 || 0}%` }}
                    />
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PartnerDashboard;
