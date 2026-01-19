import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Settings, Bell, Shield, HelpCircle, LogOut, 
  ChevronRight, Crown, Heart, MessageCircle, Sparkles,
  Trophy, Target, Star, Gift
} from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useToast } from '@/hooks/use-toast';

interface PartnerProfileScreenProps {
  onNavigate?: (screen: string) => void;
}

const PartnerProfileScreen = ({ onNavigate }: PartnerProfileScreenProps) => {
  const { name, email, partnerWomanData, logout } = useUserStore();
  const { toast } = useToast();

  const stats = {
    totalPoints: 285,
    completedMissions: 12,
    level: 5,
    lovesSent: 48,
    messagesSent: 156
  };

  const achievements = [
    { id: '1', name: 'İlk Sevgi', emoji: '💕', unlocked: true },
    { id: '2', name: 'Dəstəkçi', emoji: '🤝', unlocked: true },
    { id: '3', name: 'Qayğıkeş', emoji: '🌟', unlocked: true },
    { id: '4', name: 'Super Partner', emoji: '🏆', unlocked: false },
    { id: '5', name: 'Ailə Qəhrəmanı', emoji: '👑', unlocked: false },
  ];

  const menuItems = [
    { id: 'notifications', icon: Bell, label: 'Bildirişlər', badge: '2' },
    { id: 'privacy', icon: Shield, label: 'Gizlilik' },
    { id: 'help', icon: HelpCircle, label: 'Yardım' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <div className="pb-28 pt-2 px-5">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between mb-6"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h1 className="text-2xl font-black text-foreground">Partner Profili</h1>
        <motion.button 
          className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Settings className="w-6 h-6 text-muted-foreground" />
        </motion.button>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-6 mb-6 shadow-elevated"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-white/5 blur-xl" />
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-4xl shadow-lg">
            👨
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-black text-white">{name || 'Partner'}</h2>
            <p className="text-white/80 font-medium">{email || 'email@example.com'}</p>
            <div className="mt-2 inline-flex items-center px-3 py-1 bg-white/20 rounded-full text-white text-xs font-bold gap-1">
              <Heart className="w-3 h-3 fill-white" />
              {partnerWomanData?.name || 'Həyat Yoldaşı'} ilə əlaqəli
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        className="grid grid-cols-2 gap-3 mb-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-4 text-white">
          <Trophy className="w-6 h-6 mb-2" />
          <p className="text-3xl font-black">{stats.totalPoints}</p>
          <p className="text-xs text-white/80">Toplam Xal</p>
        </div>
        <div className="bg-gradient-to-br from-violet-400 to-purple-600 rounded-2xl p-4 text-white">
          <Target className="w-6 h-6 mb-2" />
          <p className="text-3xl font-black">{stats.completedMissions}</p>
          <p className="text-xs text-white/80">Tapşırıq</p>
        </div>
        <div className="bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl p-4 text-white">
          <Heart className="w-6 h-6 mb-2 fill-white" />
          <p className="text-3xl font-black">{stats.lovesSent}</p>
          <p className="text-xs text-white/80">Sevgi Göndərildi</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl p-4 text-white">
          <MessageCircle className="w-6 h-6 mb-2" />
          <p className="text-3xl font-black">{stats.messagesSent}</p>
          <p className="text-xs text-white/80">Mesaj</p>
        </div>
      </motion.div>

      {/* Level Card */}
      <motion.div
        className="bg-card rounded-3xl p-5 mb-6 shadow-card border border-border/50"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
            <span className="text-3xl font-black text-white">{stats.level}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-foreground">Səviyyə {stats.level}</h3>
            </div>
            <p className="text-sm text-muted-foreground">Növbəti səviyyəyə 15 xal qalıb</p>
            <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: '70%' }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Achievements */}
      <motion.div
        className="mb-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">Nailiyyətlər</h3>
          <button className="text-primary text-sm font-semibold flex items-center gap-1">
            Hamısı <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
          {achievements.map((achievement) => (
            <motion.div
              key={achievement.id}
              className={`flex-shrink-0 w-20 text-center ${
                achievement.unlocked ? '' : 'opacity-40'
              }`}
              whileHover={{ scale: 1.05 }}
            >
              <div className={`w-16 h-16 mx-auto rounded-2xl ${
                achievement.unlocked 
                  ? 'bg-gradient-to-br from-indigo-100 to-violet-100 border-2 border-indigo-200' 
                  : 'bg-muted'
              } flex items-center justify-center text-3xl mb-2`}>
                {achievement.emoji}
              </div>
              <p className="text-[10px] font-medium text-muted-foreground">{achievement.name}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Linked Partner Info */}
      {partnerWomanData && (
        <motion.div
          className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-3xl p-5 mb-6 border border-pink-100"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-lg text-3xl">
              🤰
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-foreground">{partnerWomanData.name}</h3>
              <p className="text-sm text-muted-foreground">
                {partnerWomanData.lifeStage === 'bump' ? 'Hamiləlik dövrü' : 
                 partnerWomanData.lifeStage === 'mommy' ? 'Analıq dövrü' : 'Menstruasiya dövrü'}
              </p>
            </div>
            <Gift className="w-6 h-6 text-pink-500" />
          </div>
        </motion.div>
      )}

      {/* Menu Items */}
      <motion.div
        className="bg-card rounded-3xl overflow-hidden shadow-card border border-border/50"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              variants={itemVariants}
              onClick={() => onNavigate?.(item.id)}
              className={`w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors ${
                index !== menuItems.length - 1 ? 'border-b border-border/50' : ''
              }`}
            >
              <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center">
                <Icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="flex-1 text-left font-medium text-foreground">{item.label}</span>
              {item.badge && (
                <span className="px-2.5 py-1 bg-destructive rounded-full text-[10px] font-bold text-white">
                  {item.badge}
                </span>
              )}
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </motion.button>
          );
        })}
      </motion.div>

      {/* Logout */}
      <motion.button
        onClick={logout}
        className="w-full mt-6 p-4 rounded-2xl bg-destructive/10 text-destructive font-bold flex items-center justify-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <LogOut className="w-5 h-5" />
        Çıxış
      </motion.button>

      {/* Version */}
      <p className="text-center text-xs text-muted-foreground mt-6">
        Anacan Partner v1.0.0 • Azərbaycan 🇦🇿
      </p>
    </div>
  );
};

export default PartnerProfileScreen;
