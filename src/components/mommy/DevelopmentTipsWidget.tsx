import { motion } from 'framer-motion';
import { Lightbulb, BookOpen, Star } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useDevelopmentTips } from '@/hooks/useDevelopmentTips';

const DevelopmentTipsWidget = () => {
  const { getBabyData } = useUserStore();
  const babyData = getBabyData();
  
  const ageInMonths = babyData?.ageInMonths || 0;
  
  // Determine age group
  const getAgeGroup = () => {
    if (ageInMonths < 3) return 'newborn';
    if (ageInMonths < 6) return 'infant';
    return 'older';
  };
  
  const ageGroup = getAgeGroup();
  
  // Fetch tips from database
  const { data: tips = [], isLoading } = useDevelopmentTips(ageGroup);
  
  // Get age group label
  const getAgeLabel = () => {
    if (ageInMonths < 1) return 'Yenidoğan';
    if (ageInMonths < 3) return '0-3 ay';
    if (ageInMonths < 6) return '3-6 ay';
    if (ageInMonths < 9) return '6-9 ay';
    if (ageInMonths < 12) return '9-12 ay';
    return '12+ ay';
  };

  if (isLoading) {
    return (
      <motion.div
        className="bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 dark:from-teal-500/15 dark:via-emerald-500/10 dark:to-cyan-500/15 rounded-2xl p-4 border border-teal-100 dark:border-teal-500/20"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="h-32 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </motion.div>
    );
  }

  const currentTip = tips[0];

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
      {currentTip && (
        <motion.div 
          className="bg-white/60 dark:bg-card/60 rounded-xl p-3 mb-2"
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">{currentTip.emoji}</span>
            <div className="flex-1">
              <h4 className="font-bold text-foreground text-sm">{currentTip.title_az || currentTip.title}</h4>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {currentTip.content_az || currentTip.content}
              </p>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Other Tips Preview */}
      {tips.length > 1 && (
        <div className="flex gap-2">
          {tips.slice(1, 3).map((tip, idx) => (
            <motion.div 
              key={tip.id}
              className="flex-1 bg-white/40 dark:bg-card/40 rounded-lg p-2 text-center"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 + idx * 0.1 }}
            >
              <span className="text-lg">{tip.emoji}</span>
              <p className="text-[9px] text-muted-foreground mt-0.5 font-medium line-clamp-1">
                {tip.title_az || tip.title}
              </p>
            </motion.div>
          ))}
        </div>
      )}
      
      {tips.length === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">Bu yaş qrupu üçün tövsiyə yoxdur</p>
        </div>
      )}
    </motion.div>
  );
};

export default DevelopmentTipsWidget;
