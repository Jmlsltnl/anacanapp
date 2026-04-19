import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Bell, ShoppingCart, MessageCircle, 
  Gift, Plus, Home, Target, Send, BarChart3
} from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { hapticFeedback } from '@/lib/native';
import { useToast } from '@/hooks/use-toast';
import { useShoppingItems } from '@/hooks/useShoppingItems';
import { useAuth } from '@/hooks/useAuth';
import { usePartnerData } from '@/hooks/usePartnerData';
import { usePartnerMessages } from '@/hooks/usePartnerMessages';
import { usePartnerMissions } from '@/hooks/usePartnerMissions';
import { usePregnancyContentByDay } from '@/hooks/usePregnancyContent';
import { useFruitImages, getDynamicFruitData } from '@/hooks/useFruitData';
import { useDailyTip } from '@/hooks/usePartnerDailyTips';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { supabase } from '@/integrations/supabase/client';
import { getPregnancyDay } from '@/lib/pregnancy-utils';

// Component imports
import PartnerChatScreen from './partner/PartnerChatScreen';
import WeeklyStatsTab from './partner/WeeklyStatsTab';
import NotificationsTab from './partner/NotificationsTab';
import SurpriseTab from './partner/SurpriseTab';
import LevelUpCelebration from './partner/LevelUpCelebration';
import SOSButton from './partner/SOSButton';
import PartnerHeroCard from './partner/PartnerHeroCard';
import LiveActivityCard from './partner/LiveActivityCard';
import PartnerQuickStats from './partner/PartnerQuickStats';
import SyncedFeaturesGrid from './partner/SyncedFeaturesGrid';
import PartnerMissionsCard from './partner/PartnerMissionsCard';
import { tr } from "@/lib/tr";

// Quick Action Button
const QuickAction = ({ icon: Icon, label, gradient, onClick }: {
  icon: any;
  label: string;
  gradient: string;
  onClick?: () => void;
}) => (
  <motion.button
    onClick={onClick}
    className={`${gradient} rounded-2xl p-4 flex flex-col items-center gap-2 shadow-lg flex-1`}
    whileHover={{ scale: 1.02, y: -2 }}
    whileTap={{ scale: 0.95 }}
  >
    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
      <Icon className="w-6 h-6 text-white" />
    </div>
    <span className="text-white font-medium text-xs">{label}</span>
  </motion.button>
);

interface PartnerDashboardProps {
  onNavigate?: (screen: string) => void;
}

const PartnerDashboard = ({ onNavigate }: PartnerDashboardProps = {}) => {
  useScrollToTop();
  
  const { name } = useUserStore();
  const { toast } = useToast();
  const { profile } = useAuth();
  const { partnerProfile, partnerDailyLog, loading: partnerLoading, getPregnancyWeek, getDaysUntilDue, getBabyAgeDays } = usePartnerData();
  const { items: shoppingItems, addItem, toggleItem, loading: shoppingLoading } = useShoppingItems();
  const { messages, markAsRead, getUnreadCount } = usePartnerMessages();
  const { level, totalPoints } = usePartnerMissions();
  const [activeTab, setActiveTab] = useState<'home' | 'missions' | 'shopping' | 'notifications' | 'stats' | 'surprise'>('home');
  const [showChat, setShowChat] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const previousLevelRef = useRef(level);

  const [newItem, setNewItem] = useState('');
  const [loveMessage, setLoveMessage] = useState('');

  // Convert shopping items from DB to local format
  const shoppingList = shoppingItems.map(item => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    isChecked: item.is_checked,
    addedBy: (item.added_by || 'woman') as 'partner' | 'woman',
    priority: item.priority as 'low' | 'medium' | 'high',
    createdAt: item.created_at
  }));

  // Use real partner data or fallback
  const womanName = partnerProfile?.name || 'Həyat yoldaşın';
  const womanMood = partnerDailyLog?.mood || 4;
  const womanSymptoms = partnerDailyLog?.symptoms || [];
  const waterIntake = partnerDailyLog?.water_intake || 0;
  const lifeStage = partnerProfile?.life_stage || 'bump';
  
  // Calculate pregnancy week and day
  const currentWeek = getPregnancyWeek() || 0;
  const daysUntilDue = getDaysUntilDue() || 0;
  const babyAgeDays = getBabyAgeDays();
  const pregnancyDay = partnerProfile?.last_period_date 
    ? getPregnancyDay(partnerProfile.last_period_date)
    : 0;
  
  // Fetch dynamic content
  const { data: dayContent } = usePregnancyContentByDay(pregnancyDay > 0 ? pregnancyDay : undefined);
  const { data: fruitImages = [] } = useFruitImages();
  const { tipText, tipEmoji } = useDailyTip(lifeStage, currentWeek);
  
  // Get fruit data
  const weekData = currentWeek > 0 
    ? getDynamicFruitData(fruitImages, pregnancyDay, currentWeek, dayContent)
    : null;

  // Track level changes for celebration
  useEffect(() => {
    if (level > previousLevelRef.current && previousLevelRef.current > 0) {
      setShowLevelUp(true);
    }
    previousLevelRef.current = level;
  }, [level]);

  const toggleShoppingItem = async (id: string) => {
    await hapticFeedback.light();
    await toggleItem(id);
  };

  const addShoppingItem = async () => {
    if (newItem.trim()) {
      await addItem({ name: newItem, quantity: 1, priority: 'medium' });
      setNewItem('');
      toast({ title: tr("partnerdashboard_mehsul_elave_edildi_4c8d9f", 'Məhsul əlavə edildi! 🛒') });
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
          title: tr("partnerdashboard_sevgi_gonderildi_4284b1", '💕 Sevgi göndərildi!'),
          description: `${womanName} bildiriş alacaq`,
        });
      } catch (err) {
        console.error('Error sending love:', err);
      }
    } else {
      toast({
        title: tr("partnerdashboard_partner_baglantisi_yoxdur_d0c7c6", 'Partner bağlantısı yoxdur'),
        description: tr("partnerdashboard_evvelce_partner_kodunu_baglayin_9a5906", 'Əvvəlcə partner kodunu bağlayın'),
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
          title: tr("partnerdashboard_mesaj_gonderildi_dca65e", '💌 Mesaj göndərildi!'),
          description: loveMessage,
        });
        setLoveMessage('');
      } catch (err) {
        console.error('Error sending message:', err);
      }
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
    <div className="pb-4 bg-background min-h-screen">
      {/* Level Up Celebration */}
      <LevelUpCelebration 
        show={showLevelUp} 
        level={level} 
        onClose={() => setShowLevelUp(false)} 
      />

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-partner via-indigo-600 to-violet-700 px-4 pt-3 pb-16 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-pink-500/20 blur-3xl" />
        <div className="absolute top-1/2 right-1/4 w-24 h-24 rounded-full bg-amber-500/20 blur-2xl" />
        
        <div className="relative z-10">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <motion.p 
                className="text-white/70 text-xs font-medium"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                Partner Paneli
              </motion.p>
              <motion.h1 
                className="text-xl font-black text-white"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 }}
              >
                Salam, {name || 'Partner'}! 👋
              </motion.h1>
            </div>
            
            {/* SOS Button in header */}
            <SOSButton variant="compact" />
          </div>

          {/* Partner Status Card */}
          <PartnerHeroCard
            womanName={womanName}
            womanMood={womanMood}
            womanSymptoms={womanSymptoms}
            waterIntake={waterIntake}
            lifeStage={lifeStage}
            currentWeek={currentWeek}
            daysUntilDue={daysUntilDue}
            babyAgeDays={babyAgeDays}
            weekData={weekData}
            onSendLove={sendLove}
            onOpenNotifications={() => setActiveTab('notifications')}
            unreadCount={getUnreadCount()}
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-4 -mt-6 relative z-20">
        <div className="bg-card rounded-2xl p-1.5 flex gap-1 shadow-xl border border-border/50">
          {[
            { id: 'home', label: tr("partnerdashboard_esas_6d87f7", 'Əsas'), icon: Home },
            { id: 'missions', label: tr("partnerdashboard_tapsiriq_d827b6", 'Tapşırıq'), icon: Target },
            { id: 'stats', label: 'Statistika', icon: BarChart3 },
            { id: 'surprise', label: tr("partnerdashboard_surpriz_67b2b2", 'Sürpriz'), icon: Gift },
            { id: 'shopping', label: tr("partnerdashboard_siyahi_f04aac", 'Siyahı'), icon: ShoppingCart },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-3 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                  isActive 
                    ? 'bg-partner text-white shadow-lg' 
                    : 'text-muted-foreground hover:bg-muted/50'
                }`}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden xs:inline">{tab.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 mt-5">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-5"
            >
              {/* Live Activity */}
              <LiveActivityCard />

              {/* New Messages Banner */}
              {getUnreadCount() > 0 && (
                <motion.button
                  onClick={() => setShowChat(true)}
                  className="w-full bg-gradient-to-r from-partner/20 to-indigo-500/20 rounded-2xl p-4 border-2 border-partner/30 flex items-center gap-4 text-left"
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="w-14 h-14 rounded-2xl bg-partner/20 flex items-center justify-center">
                    <MessageCircle className="w-7 h-7 text-partner" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-partner text-lg">Yeni mesajınız var!</h3>
                    <p className="text-sm text-muted-foreground">
                      {getUnreadCount()} oxunmamış mesaj
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-partner flex items-center justify-center">
                    <span className="text-white font-black">{getUnreadCount()}</span>
                  </div>
                </motion.button>
              )}

              {/* Quick Message */}
              <motion.div
                className="bg-card rounded-2xl p-5 shadow-lg border border-border/50"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-partner/10 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-partner" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Mesaj göndər</h3>
                    <p className="text-xs text-muted-foreground">Sevgi sözlərini paylaş</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={loveMessage}
                    onChange={(e) => setLoveMessage(e.target.value)}
                    placeholder={tr("partnerdashboard_sevgi_mesaji_yaz_54b43a", "Sevgi mesajı yaz...")}
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

              {/* Quick Actions */}
              <div>
                <h2 className="font-bold text-lg mb-3">Sürətli Hərəkətlər</h2>
                <div className="flex gap-3">
                  <QuickAction 
                    icon={Heart} 
                    label="Sevgi göndər" 
                    gradient="bg-gradient-to-br from-pink-500 to-rose-600"
                    onClick={sendLove}
                  />
                  <QuickAction 
                    icon={MessageCircle} 
                    label="Canlı chat" 
                    gradient="bg-gradient-to-br from-partner to-indigo-600"
                    onClick={() => setShowChat(true)}
                  />
                  <QuickAction 
                    icon={Gift} 
                    label="Sürpriz planla" 
                    gradient="bg-gradient-to-br from-amber-500 to-orange-600"
                    onClick={() => setActiveTab('surprise')}
                  />
                </div>
              </div>

              {/* Synced Features Grid */}
              <SyncedFeaturesGrid 
                onNavigate={onNavigate || (() => {})} 
                onTabChange={(tab) => setActiveTab(tab as any)}
              />

              {/* Daily Tip */}
              {tipText && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-800"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{tipEmoji}</span>
                    <div>
                      <h4 className="font-bold text-amber-800 dark:text-amber-200">Günün Tövsiyəsi</h4>
                      <p className="text-sm text-amber-700 dark:text-amber-300">{tipText}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Quick Stats */}
              <PartnerQuickStats />
            </motion.div>
          )}

          {activeTab === 'missions' && (
            <motion.div
              key="missions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <PartnerMissionsCard showAll />
            </motion.div>
          )}

          {activeTab === 'stats' && <WeeklyStatsTab />}

          {activeTab === 'surprise' && <SurpriseTab />}

          {activeTab === 'notifications' && <NotificationsTab />}

          {activeTab === 'shopping' && (
            <motion.div
              key="shopping"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">Alış-veriş Siyahısı</h2>
                  <p className="text-sm text-muted-foreground">Sinxronlaşdırılmış siyahı</p>
                </div>
              </div>

              {/* Add new item */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder={tr("partnerdashboard_yeni_mehsul_elave_et_3d6c73", "Yeni məhsul əlavə et...")}
                  className="flex-1 h-12 px-4 rounded-xl bg-muted/50 text-sm outline-none border-2 border-transparent focus:border-teal-500/30"
                />
                <motion.button
                  onClick={addShoppingItem}
                  disabled={!newItem.trim()}
                  className="w-12 h-12 rounded-xl bg-teal-500 text-white flex items-center justify-center disabled:opacity-50"
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Shopping list */}
              <div className="space-y-2">
                {shoppingList.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all ${
                      item.isChecked
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                        : 'bg-card border-border/50'
                    }`}
                  >
                    <motion.button
                      onClick={() => toggleShoppingItem(item.id)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                        item.isChecked
                          ? 'bg-emerald-500 text-white'
                          : 'bg-muted hover:bg-teal-500/20'
                      }`}
                      whileTap={{ scale: 0.9 }}
                    >
                      {item.isChecked && <span className="text-sm">✓</span>}
                    </motion.button>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm ${item.isChecked ? 'line-through text-muted-foreground' : ''}`}>
                        {item.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`w-2 h-2 rounded-full ${getPriorityColor(item.priority)}`} />
                        <span className="text-[10px] text-muted-foreground">
                          {item.addedBy === 'partner' ? 'Sən əlavə etdin' : 'O əlavə etdi'}
                        </span>
                      </div>
                    </div>
                    
                    {item.quantity > 1 && (
                      <span className="text-xs font-bold px-2 py-1 bg-muted rounded-lg">
                        x{item.quantity}
                      </span>
                    )}
                  </motion.div>
                ))}
                
                {shoppingList.length === 0 && (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground">Siyahı boşdur</p>
                    <p className="text-sm text-muted-foreground/70">Yuxarıdakı formadan məhsul əlavə edin</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PartnerDashboard;
