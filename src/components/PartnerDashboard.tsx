import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Bell, ShoppingCart, MessageCircle, 
  Gift, Calendar, CheckCircle, Plus, ChevronRight,
  Sparkles, Baby, Clock, AlertCircle, Home,
  Coffee, Flower2, Stethoscope, Star, Trophy,
  TrendingUp, Target, Zap, Send, Smile
} from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { hapticFeedback } from '@/lib/native';
import { useToast } from '@/hooks/use-toast';
import { useShoppingItems } from '@/hooks/useShoppingItems';
import { useAuth } from '@/hooks/useAuth';
import { usePartnerData } from '@/hooks/usePartnerData';
import { supabase } from '@/integrations/supabase/client';
import { FRUIT_SIZES } from '@/types/anacan';

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

interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  isChecked: boolean;
  addedBy: 'partner' | 'woman';
  priority: 'low' | 'medium' | 'high';
}

// Progress Ring Component
const ProgressRing = ({ progress, size = 80, strokeWidth = 6 }: {
  progress: number;
  size?: number;
  strokeWidth?: number;
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
        className="stroke-white"
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: "easeOut" }}
        style={{ strokeDasharray: circumference }}
      />
    </svg>
  );
};

const PartnerDashboard = () => {
  const { name } = useUserStore();
  const { toast } = useToast();
  const { profile } = useAuth();
  const { partnerProfile, partnerDailyLog, loading: partnerLoading, getPregnancyWeek, getDaysUntilDue } = usePartnerData();
  const { items: shoppingItems, addItem, toggleItem, loading: shoppingLoading } = useShoppingItems();
  const [activeTab, setActiveTab] = useState<'home' | 'missions' | 'shopping'>('home');
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
  const womanName = partnerProfile?.name || 'Partner';
  const womanMood = partnerDailyLog?.mood || 4;
  const womanSymptoms = partnerDailyLog?.symptoms || [];
  const lifeStage = partnerProfile?.life_stage || 'bump';
  
  // Calculate pregnancy week from real data
  const currentWeek = getPregnancyWeek() || 24;
  const daysUntilDue = getDaysUntilDue() || 112;
  
  // Get fruit emoji for current week
  const weekData = FRUIT_SIZES[currentWeek] || FRUIT_SIZES[24];
  
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
      toast({
        title: 'Məhsul əlavə edildi! 🛒',
      });
    }
  };

  const sendLove = async () => {
    await hapticFeedback.heavy();
    
    // Save to Supabase partner_messages table
    if (profile && partnerProfile) {
      try {
        await supabase.from('partner_messages').insert({
          sender_id: profile.user_id,
          receiver_id: partnerProfile.user_id,
          message_type: 'love',
          content: '❤️',
        });
      } catch (err) {
        console.error('Error sending love:', err);
      }
    }
    
    toast({
      title: '💕 Sevgi göndərildi!',
      description: `${womanName} bildiriş alacaq`,
    });
  };

  const sendMessage = async () => {
    if (loveMessage.trim()) {
      await hapticFeedback.medium();
      
      // Save to Supabase partner_messages table
      if (profile && partnerProfile) {
        try {
          await supabase.from('partner_messages').insert({
            sender_id: profile.user_id,
            receiver_id: partnerProfile.user_id,
            message_type: 'text',
            content: loveMessage,
          });
        } catch (err) {
          console.error('Error sending message:', err);
        }
      }
      
      toast({
        title: '💌 Mesaj göndərildi!',
        description: loveMessage,
      });
      setLoveMessage('');
    }
  };

  const getMoodEmoji = (mood: number) => {
    const emojis = ['😢', '😔', '😐', '🙂', '😊'];
    return emojis[mood - 1] || '😊';
  };

  const getMoodColor = (mood: number) => {
    const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-lime-400', 'bg-green-400'];
    return colors[mood - 1] || 'bg-green-400';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      case 'hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityIndicator = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-amber-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen pb-28 bg-gradient-to-b from-indigo-50 to-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 px-5 pt-6 pb-12 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-white/70 text-sm">Partner Paneli</p>
              <h1 className="text-2xl font-black text-white">Salam, {name || 'Partner'}! 👋</h1>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                onClick={sendLove}
                className="w-12 h-12 rounded-full bg-pink-500/30 flex items-center justify-center"
                whileTap={{ scale: 0.9 }}
              >
                <Heart className="w-6 h-6 text-white fill-white" />
              </motion.button>
              <motion.div className="relative" whileTap={{ scale: 0.95 }}>
                <Bell className="w-6 h-6 text-white" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-[10px] text-white font-bold">2</span>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Partner Info Card */}
          <motion.div 
            className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/20"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <div className="flex items-center gap-4 mb-4">
              <motion.div 
                className="w-16 h-16 rounded-full bg-pink-400/30 flex items-center justify-center text-3xl"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🤰
              </motion.div>
              <div className="flex-1">
                <h2 className="text-white font-bold text-lg">{womanName}</h2>
                <p className="text-white/70">Hamiləlik: {currentWeek}. həftə</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-3 h-3 rounded-full ${getMoodColor(womanMood)}`} />
                  <span className="text-white/60 text-xs">Əhvalı yaxşıdır</span>
                </div>
              </div>
              <div className="text-center">
                <motion.p 
                  className="text-4xl"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {getMoodEmoji(womanMood)}
                </motion.p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <Calendar className="w-5 h-5 text-white/70 mx-auto mb-1" />
                <p className="text-white font-bold">{daysUntilDue}</p>
                <p className="text-white/60 text-xs">Gün qaldı</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <Baby className="w-5 h-5 text-white/70 mx-auto mb-1" />
                <p className="text-white font-bold text-xl">{weekData?.emoji || '🥭'}</p>
                <p className="text-white/60 text-xs">{weekData?.fruit || 'Körpə'}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center relative">
                <div className="absolute -top-2 -right-2">
                  <ProgressRing progress={levelProgress} size={40} strokeWidth={3} />
                  <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                    {level}
                  </span>
                </div>
                <Trophy className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <p className="text-white font-bold">{totalPoints}</p>
                <p className="text-white/60 text-xs">Xal</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 -mt-6">
        <div className="bg-card rounded-2xl p-1.5 flex gap-1 shadow-lg">
          {[
            { id: 'home', label: 'Əsas', icon: Home },
            { id: 'missions', label: 'Tapşırıqlar', icon: Target },
            { id: 'shopping', label: 'Alış-veriş', icon: ShoppingCart },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  activeTab === tab.id 
                    ? 'bg-primary text-white shadow-md' 
                    : 'text-muted-foreground'
                }`}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="px-5 mt-6">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Quick Message */}
              <motion.div
                className="bg-card rounded-2xl p-4 shadow-card border border-border/50"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  <h3 className="font-bold">Sürətli mesaj göndər</h3>
                </div>
                <div className="flex gap-2">
                  <input
                    id="quick-message-input"
                    type="text"
                    value={loveMessage}
                    onChange={(e) => setLoveMessage(e.target.value)}
                    placeholder="Sevgi mesajı yaz..."
                    className="flex-1 h-11 px-4 rounded-xl bg-muted/50 text-sm outline-none"
                  />
                  <motion.button
                    onClick={sendMessage}
                    className="w-11 h-11 rounded-xl bg-primary text-white flex items-center justify-center"
                    whileTap={{ scale: 0.95 }}
                  >
                    <Send className="w-5 h-5" />
                  </motion.button>
                </div>
                <div className="flex gap-2 mt-3">
                  {['❤️ Səni sevirəm!', '🌹 Gözəlsən!', '💪 Güclüsən!'].map(msg => (
                    <motion.button
                      key={msg}
                      onClick={() => setLoveMessage(msg)}
                      className="px-3 py-1.5 bg-pink-50 text-pink-600 rounded-full text-xs font-medium"
                      whileTap={{ scale: 0.95 }}
                    >
                      {msg}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Alert Card */}
              <motion.div
                className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200 flex items-start gap-3"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-amber-800">Bugünkü xatırlatma</h3>
                  <p className="text-sm text-amber-700">
                    {womanName} bu gün yorğunluq hiss edir. Ayaq masajı etmək əla olar! 💆‍♀️
                  </p>
                </div>
              </motion.div>

              {/* Quick Actions */}
              <h2 className="font-bold text-lg pt-2">Sürətli Hərəkətlər</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Heart, label: 'Sevgi göndər', color: 'bg-gradient-to-br from-pink-400 to-rose-500', textColor: 'text-white', action: sendLove },
                  { icon: MessageCircle, label: 'Mesaj yaz', color: 'bg-gradient-to-br from-blue-400 to-indigo-500', textColor: 'text-white', action: () => document.getElementById('quick-message-input')?.focus() },
                  { icon: Gift, label: 'Sürpriz planla', color: 'bg-gradient-to-br from-amber-400 to-orange-500', textColor: 'text-white' },
                  { icon: Smile, label: 'Əhval yoxla', color: 'bg-gradient-to-br from-emerald-400 to-teal-500', textColor: 'text-white' },
                ].map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <motion.button
                      key={action.label}
                      onClick={action.action}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + index * 0.05 }}
                      className={`${action.color} rounded-2xl p-4 flex items-center gap-3 shadow-lg`}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <Icon className={`w-5 h-5 ${action.textColor}`} />
                      </div>
                      <span className={`font-medium text-sm ${action.textColor}`}>{action.label}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Level Progress */}
              <motion.div 
                className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl p-5"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-400" />
                    <h3 className="text-white font-bold">Səviyyə {level}</h3>
                  </div>
                  <span className="text-white/70 text-sm">{pointsToNextLevel} xal lazım</span>
                </div>
                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-white rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${levelProgress}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
                <p className="text-white/80 text-sm mt-3">
                  💡 Daha çox tapşırıq tamamla, səviyyəni artır!
                </p>
              </motion.div>

              {/* Today's Tip */}
              <motion.div 
                className="bg-card rounded-3xl p-5 shadow-card border border-border/50"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold">Günün Məsləhəti</h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  {currentWeek}. həftədə körpə artıq səsləri eşidə bilir. 
                  Ona mahnı oxumaq və ya danışmaq əlaqənizi gücləndirir! 🎵
                </p>
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'missions' && (
            <motion.div
              key="missions"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Mission Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50 text-center">
                  <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-black">{missions.filter(m => m.isCompleted).length}</p>
                  <p className="text-xs text-muted-foreground">Tamamlandı</p>
                </div>
                <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50 text-center">
                  <Target className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                  <p className="text-2xl font-black">{missions.filter(m => !m.isCompleted).length}</p>
                  <p className="text-xs text-muted-foreground">Gözləyir</p>
                </div>
                <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50 text-center">
                  <Zap className="w-6 h-6 text-violet-500 mx-auto mb-2" />
                  <p className="text-2xl font-black">{totalPoints}</p>
                  <p className="text-xs text-muted-foreground">Xal</p>
                </div>
              </div>

              <h2 className="font-bold text-lg">AI Tapşırıqları</h2>

              {missions.map((mission, index) => {
                const Icon = mission.icon;
                return (
                  <motion.div
                    key={mission.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`bg-card rounded-2xl p-4 shadow-card border-2 transition-all ${
                      mission.isCompleted 
                        ? 'border-green-300 bg-green-50/50' 
                        : 'border-border/50 hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <motion.button
                        onClick={() => toggleMission(mission.id)}
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                          mission.isCompleted 
                            ? 'bg-green-500 text-white' 
                            : 'bg-indigo-100 text-indigo-600'
                        }`}
                        whileTap={{ scale: 0.9 }}
                      >
                        {mission.isCompleted ? (
                          <CheckCircle className="w-7 h-7" />
                        ) : (
                          <Icon className="w-7 h-7" />
                        )}
                      </motion.button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-semibold ${mission.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                            {mission.title}
                          </h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getDifficultyColor(mission.difficulty)}`}>
                            {mission.difficulty === 'easy' ? 'Asan' : mission.difficulty === 'medium' ? 'Orta' : 'Çətin'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{mission.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Star className="w-4 h-4 text-amber-500" />
                          <span className="text-sm font-bold text-amber-600">+{mission.points} xal</span>
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
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg">Ortaq Alış-veriş Siyahısı</h2>
                <span className="text-sm text-primary font-medium">
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
                  className="flex-1 h-12 px-4 rounded-xl bg-muted/50 border-2 border-transparent focus:border-primary/30 outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && addShoppingItem()}
                />
                <motion.button
                  onClick={addShoppingItem}
                  className="w-12 h-12 rounded-xl gradient-primary text-white flex items-center justify-center"
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Priority Legend */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span>Vacib</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Orta</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Aşağı</span>
                </div>
              </div>

              {/* Shopping List */}
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
                    transition={{ delay: index * 0.05 }}
                    className={`bg-card rounded-xl p-4 flex items-center gap-4 shadow-card border-2 ${
                      item.isChecked ? 'border-green-300 bg-green-50/50' : 'border-border/50'
                    }`}
                  >
                    <div className={`w-2 h-10 rounded-full ${getPriorityIndicator(item.priority)}`} />
                    <motion.button
                      onClick={() => toggleShoppingItem(item.id)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                        item.isChecked 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : 'border-muted-foreground/30'
                      }`}
                      whileTap={{ scale: 0.9 }}
                    >
                      {item.isChecked && <CheckCircle className="w-5 h-5" />}
                    </motion.button>
                    <div className="flex-1">
                      <p className={`font-medium ${item.isChecked ? 'line-through text-muted-foreground' : ''}`}>
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.addedBy === 'woman' ? `${womanName} əlavə etdi` : 'Sən əlavə etdin'}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-muted-foreground bg-muted px-2 py-1 rounded-lg">
                      x{item.quantity}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Summary */}
              <motion.div 
                className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 mt-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tamamlanan</span>
                  <span className="text-lg font-bold text-primary">
                    {Math.round((shoppingList.filter(i => i.isChecked).length / shoppingList.length) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden">
                  <motion.div 
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(shoppingList.filter(i => i.isChecked).length / shoppingList.length) * 100}%` }}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PartnerDashboard;
