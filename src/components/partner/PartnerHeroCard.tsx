import { motion } from 'framer-motion';
import { Calendar, Baby, Droplets, Heart, Bell, Activity } from 'lucide-react';
import { PartnerWomanData, PartnerDailyLog } from '@/hooks/usePartnerData';

interface PartnerHeroCardProps {
  womanName: string;
  womanMood: number;
  womanSymptoms: string[];
  waterIntake: number;
  lifeStage: string;
  currentWeek: number;
  daysUntilDue: number;
  babyAgeDays: number;
  weekData: { emoji?: string; fruit?: string } | null;
  onSendLove: () => void;
  onOpenNotifications: () => void;
  unreadCount: number;
}

const PartnerHeroCard = ({
  womanName,
  womanMood,
  womanSymptoms,
  waterIntake,
  lifeStage,
  currentWeek,
  daysUntilDue,
  babyAgeDays,
  weekData,
  onSendLove,
  onOpenNotifications,
  unreadCount,
}: PartnerHeroCardProps) => {
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

  return (
    <motion.div 
      className="bg-white/10 backdrop-blur-xl rounded-3xl p-5 border border-white/20 shadow-2xl"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className="flex items-center gap-4">
        {/* Avatar with mood ring */}
        <div className="relative">
          <motion.div 
            className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-4xl shadow-xl ring-4 ring-white/20"
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            {lifeStage === 'bump' ? '🤰' : lifeStage === 'mommy' ? '👩‍🍼' : '👩'}
          </motion.div>
          <motion.div 
            className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-r ${getMoodColor(womanMood)} flex items-center justify-center text-lg shadow-lg border-3 border-white`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            {getMoodEmoji(womanMood)}
          </motion.div>
        </div>

        {/* Info */}
        <div className="flex-1">
          <h2 className="text-white font-black text-xl tracking-tight">{womanName}</h2>
          <p className="text-white/70 text-sm">
            {lifeStage === 'bump' && currentWeek > 0 
              ? `Hamiləlik: ${currentWeek}. həftə` 
              : lifeStage === 'mommy' 
              ? `Körpə: ${babyAgeDays} günlük`
              : 'Bağlı'}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r ${getMoodColor(womanMood)} text-white shadow-md`}>
              {getMoodText(womanMood)}
            </span>
            {womanSymptoms.length > 0 && (
              <span className="px-2.5 py-1.5 rounded-full text-xs bg-white/20 text-white font-medium flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {womanSymptoms.length}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          <motion.button
            onClick={onSendLove}
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Heart className="w-6 h-6 text-white fill-white" />
          </motion.button>
          <motion.button
            onClick={onOpenNotifications}
            className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center relative"
            whileTap={{ scale: 0.95 }}
          >
            <Bell className="w-5 h-5 text-white" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </motion.button>
        </div>
      </div>

      {/* Stats row */}
      {lifeStage === 'bump' && currentWeek > 0 && (
        <div className="grid grid-cols-3 gap-3 mt-5">
          <motion.div 
            className="bg-white/15 backdrop-blur rounded-2xl p-3 text-center"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Calendar className="w-5 h-5 text-white/70 mx-auto mb-1" />
            <p className="text-white font-black text-xl">{daysUntilDue}</p>
            <p className="text-white/60 text-[11px] font-medium">Gün qaldı</p>
          </motion.div>
          <motion.div 
            className="bg-white/15 backdrop-blur rounded-2xl p-3 text-center"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <Baby className="w-5 h-5 text-white/70 mx-auto mb-1" />
            <p className="text-3xl">{weekData?.emoji || '👶'}</p>
            <p className="text-white/60 text-[11px] font-medium">{weekData?.fruit || 'Körpə'}</p>
          </motion.div>
          <motion.div 
            className="bg-white/15 backdrop-blur rounded-2xl p-3 text-center"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Droplets className="w-5 h-5 text-white/70 mx-auto mb-1" />
            <p className="text-white font-black text-xl">{waterIntake}</p>
            <p className="text-white/60 text-[11px] font-medium">ml su</p>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default PartnerHeroCard;
