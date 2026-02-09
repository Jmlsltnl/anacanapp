import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Crown, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PregnancyDayNavigatorProps {
  currentActualDay: number; // The real/current pregnancy day
  selectedDay: number;
  onDayChange: (day: number) => void;
  isPremium: boolean;
  maxDays?: number;
}

const PregnancyDayNavigator = ({
  currentActualDay,
  selectedDay,
  onDayChange,
  isPremium,
  maxDays = 280,
}: PregnancyDayNavigatorProps) => {
  const FREE_RANGE = 3; // Free users can go ±3 days

  // Calculate navigation limits
  const getNavigationLimits = useCallback(() => {
    if (isPremium) {
      return { min: 1, max: maxDays };
    }
    return {
      min: Math.max(1, currentActualDay - FREE_RANGE),
      max: Math.min(maxDays, currentActualDay + FREE_RANGE),
    };
  }, [isPremium, currentActualDay, maxDays]);

  const limits = getNavigationLimits();

  const canGoBack = selectedDay > limits.min;
  const canGoForward = selectedDay < limits.max;
  const isViewingCurrentDay = selectedDay === currentActualDay;

  const goBack = () => {
    if (canGoBack) {
      onDayChange(selectedDay - 1);
    }
  };

  const goForward = () => {
    if (canGoForward) {
      onDayChange(selectedDay + 1);
    }
  };

  const resetToCurrentDay = () => {
    onDayChange(currentActualDay);
  };

  // Determine offset from current day for display
  const dayOffset = selectedDay - currentActualDay;
  const getOffsetLabel = () => {
    if (dayOffset === 0) return 'Bu gün';
    if (dayOffset > 0) return `+${dayOffset} gün`;
    return `${dayOffset} gün`;
  };

  return (
    <div className="flex items-center justify-center gap-2">
      {/* Back button */}
      <motion.button
        onClick={goBack}
        disabled={!canGoBack}
        className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center transition-all",
          canGoBack 
            ? "bg-white/20 hover:bg-white/30 text-white active:scale-95" 
            : "bg-white/5 text-white/30 cursor-not-allowed"
        )}
        whileTap={canGoBack ? { scale: 0.9 } : {}}
      >
        <ChevronLeft className="w-5 h-5" />
      </motion.button>

      {/* Current day indicator */}
      <div className="flex flex-col items-center min-w-[80px]">
        <AnimatePresence mode="wait">
          <motion.span
            key={selectedDay}
            initial={{ y: dayOffset > 0 ? 10 : -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: dayOffset > 0 ? -10 : 10, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "text-sm font-bold px-3 py-1 rounded-full",
              isViewingCurrentDay 
                ? "bg-white/25 text-white" 
                : "bg-primary text-primary-foreground"
            )}
          >
            {getOffsetLabel()}
          </motion.span>
        </AnimatePresence>
        
        {/* Premium indicator for limit reached */}
        {!isPremium && (selectedDay === limits.min || selectedDay === limits.max) && !isViewingCurrentDay && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1 mt-1"
          >
            <Crown className="w-3 h-3 text-primary" />
            <span className="text-[10px] text-primary font-medium">Premium ilə daha çox</span>
          </motion.div>
        )}
      </div>

      {/* Forward button */}
      <motion.button
        onClick={goForward}
        disabled={!canGoForward}
        className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center transition-all",
          canGoForward 
            ? "bg-white/20 hover:bg-white/30 text-white active:scale-95" 
            : "bg-white/5 text-white/30 cursor-not-allowed"
        )}
        whileTap={canGoForward ? { scale: 0.9 } : {}}
      >
        <ChevronRight className="w-5 h-5" />
      </motion.button>

      {/* Reset button - only show when not viewing current day */}
      <AnimatePresence>
        {!isViewingCurrentDay && (
          <motion.button
            onClick={resetToCurrentDay}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center ml-1"
            whileTap={{ scale: 0.9 }}
            title="Bu günə qayıt"
          >
            <RotateCcw className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PregnancyDayNavigator;
