import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDevelopmentTips } from '@/hooks/useDevelopmentTips';
import { useChildren } from '@/hooks/useChildren';

const DevelopmentTipsWidget = () => {
  const { selectedChild, getChildAge } = useChildren();
  const childAge = selectedChild ? getChildAge(selectedChild) : null;
  const ageInMonths = childAge?.months || 0;
  const [currentIndex, setCurrentIndex] = useState(0);

  const getAgeGroup = () => {
    if (ageInMonths < 3) return 'newborn';
    if (ageInMonths < 6) return 'infant';
    return 'older';
  };

  const { data: tips = [], isLoading } = useDevelopmentTips(getAgeGroup());

  const getAgeLabel = () => {
    if (ageInMonths < 1) return 'Yenidoğan';
    if (ageInMonths < 3) return '0-3 ay';
    if (ageInMonths < 6) return '3-6 ay';
    if (ageInMonths < 9) return '6-9 ay';
    if (ageInMonths < 12) return '9-12 ay';
    return '12+ ay';
  };

  const handleNext = () => {
    if (tips.length > 0) setCurrentIndex((prev) => (prev + 1) % tips.length);
  };

  const handlePrev = () => {
    if (tips.length > 0) setCurrentIndex((prev) => (prev - 1 + tips.length) % tips.length);
  };

  if (isLoading) {
    return (
      <motion.div
        className="bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 dark:from-teal-500/15 dark:via-emerald-500/10 dark:to-cyan-500/15 rounded-2xl p-4 border border-teal-100 dark:border-teal-500/20"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="h-24 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </motion.div>
    );
  }

  if (tips.length === 0) {
    return (
      <motion.div
        className="bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 dark:from-teal-500/15 dark:via-emerald-500/10 dark:to-cyan-500/15 rounded-2xl p-4 border border-teal-100 dark:border-teal-500/20"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">Bu yaş qrupu üçün tövsiyə yoxdur</p>
        </div>
      </motion.div>
    );
  }

  const currentTip = tips[currentIndex];

  return (
    <motion.div
      className="bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 dark:from-teal-500/15 dark:via-emerald-500/10 dark:to-cyan-500/15 rounded-2xl p-4 border border-teal-100 dark:border-teal-500/20"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.35 }}
    >
      {/* Header */}
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
        <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
          {currentIndex + 1}/{tips.length}
        </span>
      </div>

      {/* Current Tip with Swipe */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTip.id}
          className="bg-white/70 dark:bg-card/60 rounded-xl p-3"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">{currentTip.emoji}</span>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-foreground text-sm leading-tight">{currentTip.title_az || currentTip.title}</h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-3">
                {currentTip.content_az || currentTip.content}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Dots & Arrows */}
      {tips.length > 1 && (
        <div className="flex items-center justify-between mt-2.5">
          <button
            onClick={handlePrev}
            className="w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-500/20 flex items-center justify-center active:scale-90 transition-transform"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          </button>
          <div className="flex gap-1">
            {tips.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentIndex
                    ? 'w-4 bg-teal-500'
                    : 'w-1.5 bg-teal-200 dark:bg-teal-700'
                }`}
              />
            ))}
          </div>
          <button
            onClick={handleNext}
            className="w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-500/20 flex items-center justify-center active:scale-90 transition-transform"
          >
            <ChevronRight className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default DevelopmentTipsWidget;
