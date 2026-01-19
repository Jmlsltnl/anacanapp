import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Settings, Bell, Shield, HelpCircle, LogOut, 
  ChevronRight, Crown, Copy, Share2, FileText, Award,
  Heart, Calendar, Moon, Palette, ShieldCheck
} from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const achievements = [
  { id: '1', name: 'İlk Giriş', emoji: '🌟', unlocked: true },
  { id: '2', name: 'İlk Log', emoji: '📝', unlocked: true },
  { id: '3', name: '7 Gün Seriya', emoji: '🔥', unlocked: false },
  { id: '4', name: 'Su Qəhrəmanı', emoji: '💧', unlocked: false },
  { id: '5', name: 'Super Ana', emoji: '👑', unlocked: false },
];

interface ProfileScreenProps {
  onNavigate?: (screen: string) => void;
}

const ProfileScreen = ({ onNavigate }: ProfileScreenProps) => {
  const { name, email, lifeStage, role } = useUserStore();
  const { signOut, profile, isAdmin } = useAuth();
  const { toast } = useToast();
  const [partnerCode] = useState(profile?.partner_code || 'ANACAN-XXXX');

  const menuItems = [
    { id: 'notifications', icon: Bell, label: 'Bildirişlər', badge: '3' },
    { id: 'appearance', icon: Palette, label: 'Görünüş' },
    { id: 'calendar', icon: Calendar, label: 'Təqvim Ayarları' },
    { id: 'privacy', icon: Shield, label: 'Gizlilik' },
    { id: 'report', icon: FileText, label: 'Həkim Hesabatı' },
    { id: 'help', icon: HelpCircle, label: 'Yardım' },
    ...(isAdmin ? [{ id: 'admin', icon: ShieldCheck, label: 'Admin Panel', badge: 'Admin' }] : []),
  ];

  const copyPartnerCode = () => {
    navigator.clipboard.writeText(partnerCode);
    toast({
      title: 'Kopyalandı!',
      description: 'Partnyor kodu buferə kopyalandı.',
    });
  };

  const handleLogout = async () => {
    await signOut();
    toast({
      title: 'Çıxış edildi',
      description: 'Uğurla çıxış etdiniz.',
    });
  };

  const getStageInfo = () => {
    switch (lifeStage) {
      case 'flow': return { name: 'Menstruasiya', emoji: '🌸', color: 'flow' };
      case 'bump': return { name: 'Hamiləlik', emoji: '🤰', color: 'bump' };
      case 'mommy': return { name: 'Analıq', emoji: '👶', color: 'mommy' };
      default: return { name: 'Seçilməyib', emoji: '✨', color: 'primary' };
    }
  };

  const stageInfo = getStageInfo();

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
        <h1 className="text-2xl font-black text-foreground">Profil</h1>
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
        className="relative overflow-hidden rounded-3xl gradient-primary p-6 mb-6 shadow-elevated"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-white/5 blur-xl" />
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-4xl shadow-lg">
            {stageInfo.emoji}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-black text-white">{profile?.name || name || 'İstifadəçi'}</h2>
            <p className="text-white/80 font-medium">{profile?.email || email || 'email@example.com'}</p>
            <div className="mt-2 flex gap-2">
              <span className="inline-flex items-center px-3 py-1 bg-white/20 rounded-full text-white text-xs font-bold">
                {stageInfo.name}
              </span>
              {isAdmin && (
                <span className="inline-flex items-center px-3 py-1 bg-amber-500/80 rounded-full text-white text-xs font-bold">
                  👑 Admin
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Premium Banner */}
      <motion.div
        className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl p-5 mb-6 border border-amber-100"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
            <Crown className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-foreground">Anacan Premium</h3>
            <p className="text-sm text-muted-foreground">Bütün xüsusiyyətləri açın</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </motion.div>

      {/* Partner Code */}
      {role === 'woman' && (
        <motion.div
          className="bg-card rounded-3xl p-5 mb-6 shadow-card border border-border/50"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-partner/10 flex items-center justify-center">
                <Heart className="w-6 h-6 text-partner" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Partnyor Kodu</h3>
                <p className="text-xs text-muted-foreground">Həyat yoldaşınızla paylaşın</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted rounded-2xl">
            <code className="flex-1 text-center font-mono font-bold text-lg tracking-wider text-foreground">
              {partnerCode}
            </code>
            <motion.button
              onClick={copyPartnerCode}
              className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Copy className="w-5 h-5 text-primary" />
            </motion.button>
            <motion.button
              className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Share2 className="w-5 h-5 text-white" />
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Achievements */}
      <motion.div
        className="mb-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
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
                  ? 'bg-gradient-to-r from-amber-100 to-orange-100 border-2 border-amber-200' 
                  : 'bg-muted'
              } flex items-center justify-center text-3xl mb-2`}>
                {achievement.emoji}
              </div>
              <p className="text-[10px] font-medium text-muted-foreground">{achievement.name}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

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
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                item.id === 'admin' ? 'bg-amber-100' : 'bg-muted'
              }`}>
                <Icon className={`w-5 h-5 ${item.id === 'admin' ? 'text-amber-600' : 'text-muted-foreground'}`} />
              </div>
              <span className="flex-1 text-left font-medium text-foreground">{item.label}</span>
              {item.badge && (
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  item.id === 'admin' 
                    ? 'bg-amber-100 text-amber-700' 
                    : 'bg-destructive text-white'
                }`}>
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
        onClick={handleLogout}
        className="w-full mt-6 p-4 rounded-2xl bg-destructive/10 text-destructive font-bold flex items-center justify-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <LogOut className="w-5 h-5" />
        Çıxış
      </motion.button>

      {/* Version */}
      <p className="text-center text-xs text-muted-foreground mt-6">
        Anacan v1.0.0 • Azərbaycan 🇦🇿
      </p>
    </div>
  );
};

export default ProfileScreen;
