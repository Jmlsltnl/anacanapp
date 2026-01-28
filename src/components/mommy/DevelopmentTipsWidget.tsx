import { motion } from 'framer-motion';
import { Lightbulb, ChevronRight, BookOpen, Star } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useWeeklyTips } from '@/hooks/useDynamicContent';

// Age-based development tips fallback
const AGE_TIPS = {
  newborn: [
    { emoji: '👁️', title: 'Göz Təması', text: 'Körpənizlə 20-30 sm məsafədə göz təması qurun' },
    { emoji: '🎵', title: 'Səs Oyunları', text: 'Yumşaq səslər çıxarın, körpə səsləri tanımağı öyrənir' },
    { emoji: '🤲', title: 'Tummy Time', text: 'Gündə 3-5 dəqiqə qarın üstə yatırın' },
  ],
  infant: [
    { emoji: '🧸', title: 'Əşya Tutma', text: 'Rəngli oyuncaqlarla tutma bacarığını inkişaf etdirin' },
    { emoji: '📖', title: 'Kitab Oxuma', text: 'Təsvirli kitablar göstərin, dil inkişafına kömək edir' },
    { emoji: '🎶', title: 'Musiqi', text: 'Uşaq mahnıları oxuyun, ritm hissi inkişaf edir' },
  ],
  older: [
    { emoji: '🥣', title: 'Əlavə Qida', text: 'Yeni dadları tədricən tanışdırın' },
    { emoji: '🚶', title: 'Hərəkət', text: 'Sürünmə və oturma məşqləri dəstəkləyin' },
    { emoji: '🗣️', title: 'Danışıq', text: 'Sadə sözləri təkrarlayın, dil inkişafı sürətlənir' },
  ],
};

const DevelopmentTipsWidget = () => {
  const { getBabyData } = useUserStore();
  const babyData = getBabyData();
  
  const ageInWeeks = babyData ? Math.floor(babyData.ageInDays / 7) : 0;
  const ageInMonths = babyData?.ageInMonths || 0;
  
  // Fetch tips from database
  const { data: dbTips = [] } = useWeeklyTips(ageInWeeks, 'mommy');
  
  // Determine which tips to show
  const getAgeTips = () => {
    if (ageInMonths < 3) return AGE_TIPS.newborn;
    if (ageInMonths < 6) return AGE_TIPS.infant;
    return AGE_TIPS.older;
  };
  
  const tips = getAgeTips();
  const currentTip = tips[0];
  
  // Get age group label
  const getAgeLabel = () => {
    if (ageInMonths < 1) return 'Yenidoğan';
    if (ageInMonths < 3) return '0-3 ay';
    if (ageInMonths < 6) return '3-6 ay';
    if (ageInMonths < 9) return '6-9 ay';
    if (ageInMonths < 12) return '9-12 ay';
    return '12+ ay';
  };

  return (
    <motion.div
      className="bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 dark:from-teal-500/15 dark:via-emerald-500/10 dark:to-cyan-500/15 rounded-2xl p-4 border border-teal-100 dark:border-teal-500/20"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.35 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-500/20 flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground">İnkişaf Tövsiyələri</h3>
            <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">{getAgeLabel()}</span>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3].map((_, i) => (
            <Star 
              key={i} 
              className={`w-3 h-3 ${i === 0 ? 'text-amber-400 fill-amber-400' : 'text-muted'}`} 
            />
          ))}
        </div>
      </div>
      
      {/* Main Tip */}
      <motion.div 
        className="bg-white/60 dark:bg-card/60 rounded-xl p-3 mb-2"
        initial={{ x: -10, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl">{currentTip.emoji}</span>
          <div className="flex-1">
            <h4 className="font-bold text-foreground text-sm">{currentTip.title}</h4>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{currentTip.text}</p>
          </div>
        </div>
      </motion.div>
      
      {/* Other Tips Preview */}
      <div className="flex gap-2">
        {tips.slice(1).map((tip, idx) => (
          <motion.div 
            key={idx}
            className="flex-1 bg-white/40 dark:bg-card/40 rounded-lg p-2 text-center"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 + idx * 0.1 }}
          >
            <span className="text-lg">{tip.emoji}</span>
            <p className="text-[9px] text-muted-foreground mt-0.5 font-medium line-clamp-1">{tip.title}</p>
          </motion.div>
        ))}
      </div>
      
      {/* Database tips if available */}
      {dbTips.length > 0 && (
        <motion.div 
          className="mt-3 pt-3 border-t border-teal-200/50 dark:border-teal-500/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <p className="text-xs text-teal-700 dark:text-teal-300 font-medium">
              {dbTips[0].title}
            </p>
          </div>
          {dbTips[0].content && (
            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
              {dbTips[0].content}
            </p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default DevelopmentTipsWidget;
