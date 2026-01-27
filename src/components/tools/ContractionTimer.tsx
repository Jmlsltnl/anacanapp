import { useState, useEffect, useRef, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Square, Timer, AlertCircle, Trash2 } from 'lucide-react';
import { useContractions } from '@/hooks/useContractions';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { hapticFeedback } from '@/lib/native';

interface ContractionTimerProps {
  onBack: () => void;
}

const ContractionTimer = forwardRef<HTMLDivElement, ContractionTimerProps>(({ onBack }, ref) => {
  useScrollToTop();
  
  const [isActive, setIsActive] = useState(false);
  const [currentDuration, setCurrentDuration] = useState(0);
  const [lastEndTime, setLastEndTime] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { contractions, addContraction, getStats, clearAll, loading } = useContractions();

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setCurrentDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    await hapticFeedback.medium();
    setIsActive(true);
    setCurrentDuration(0);
  };

  const handleStop = async () => {
    await hapticFeedback.heavy();
    setIsActive(false);
    const now = new Date();
    
    const interval = lastEndTime 
      ? Math.floor((now.getTime() - lastEndTime.getTime()) / 1000 - currentDuration)
      : undefined;

    await addContraction(currentDuration, interval);
    setLastEndTime(now);
    setCurrentDuration(0);
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className={`${stats.is511 ? 'bg-gradient-to-r from-red-500 to-rose-600' : 'gradient-primary'} px-3 pt-3 pb-8 safe-top transition-colors`}>
        <div className="flex items-center gap-3">
          <motion.button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">Sancı Ölçən</h1>
            <p className="text-white/80 text-xs">5-1-1 qaydası ilə izləyin</p>
          </div>
          {contractions.length > 0 && (
            <motion.button
              onClick={clearAll}
              className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Trash2 className="w-4 h-4 text-white" />
            </motion.button>
          )}
        </div>
      </div>

      <div className="px-3 -mt-4">
        {/* 5-1-1 Alert */}
        <AnimatePresence>
          {stats.is511 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-100 dark:bg-red-950/50 border-2 border-red-200 dark:border-red-800 rounded-xl p-3 mb-3 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-red-700 dark:text-red-400 text-sm">Xəstəxanaya getmə vaxtı!</h3>
                <p className="text-xs text-red-600 dark:text-red-300">5-1-1 qaydası: Sancılar 5 dəqiqədən bir, 1 dəqiqə davam edir</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Timer Card */}
        <motion.div
          className="bg-card rounded-2xl p-4 shadow-elevated border border-border/50 mb-4"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          {/* Timer Display */}
          <div className="text-center mb-6">
            <p className="text-muted-foreground text-xs font-medium mb-1">
              {isActive ? 'Sancı müddəti' : 'Hazır'}
            </p>
            <motion.p 
              className={`text-6xl font-black font-mono ${isActive ? 'text-primary' : 'text-foreground'}`}
              animate={isActive ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 1, repeat: isActive ? Infinity : 0 }}
            >
              {formatTime(currentDuration)}
            </motion.p>
          </div>

          {/* Control Button */}
          {!isActive ? (
            <motion.button
              onClick={handleStart}
              className="w-full h-14 rounded-xl gradient-primary text-white font-bold flex items-center justify-center gap-2 shadow-button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Play className="w-5 h-5" />
              Sancı başladı
            </motion.button>
          ) : (
            <motion.button
              onClick={handleStop}
              className="w-full h-14 rounded-xl bg-red-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <Square className="w-5 h-5" />
              Sancı bitdi
            </motion.button>
          )}
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <motion.div
            className="bg-card rounded-xl p-3 shadow-card border border-border/50"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <p className="text-xs text-muted-foreground mb-0.5">Ort. Müddət</p>
            <p className="text-xl font-black text-foreground">{formatTime(stats.avgDuration)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Hədəf: ~1 dəq</p>
          </motion.div>

          <motion.div
            className="bg-card rounded-xl p-3 shadow-card border border-border/50"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-xs text-muted-foreground mb-0.5">Ort. Aralıq</p>
            <p className="text-xl font-black text-foreground">{formatTime(stats.avgInterval)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Hədəf: ~5 dəq</p>
          </motion.div>
        </div>

        {/* 5-1-1 Rule Info */}
        <motion.div
          className="bg-primary/5 dark:bg-primary/10 rounded-xl p-3 mb-4 border border-primary/20"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="font-bold text-foreground mb-1.5 flex items-center gap-2 text-sm">
            <Timer className="w-4 h-4 text-primary" />
            5-1-1 Qaydası
          </h3>
          <p className="text-xs text-muted-foreground">
            Sancılar <strong className="text-foreground">5 dəqiqə</strong> aralığında, <strong className="text-foreground">1 dəqiqə</strong> davam edərsə və bu <strong className="text-foreground">1 saat</strong> boyunca davam edərsə, xəstəxanaya getmə vaxtıdır.
          </p>
        </motion.div>

        {/* Contractions List */}
        {contractions.length > 0 && (
          <div>
            <h3 className="font-bold text-foreground mb-3 text-sm">Sancılar ({contractions.length})</h3>
            <div className="space-y-2 pb-6">
              {contractions.slice(0, 10).map((contraction, index) => (
                <motion.div
                  key={contraction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card rounded-xl p-3 shadow-card border border-border/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">{contractions.length - index}</span>
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-sm">{formatTime(contraction.duration_seconds)} müddət</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(contraction.start_time).toLocaleDateString('az-AZ', { day: 'numeric', month: 'long' })}, {new Date(contraction.start_time).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    {contraction.interval_seconds && (
                      <div className="text-right">
                        <p className="text-xs font-bold text-muted-foreground">{formatTime(contraction.interval_seconds)}</p>
                        <p className="text-[10px] text-muted-foreground">aralıq</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

ContractionTimer.displayName = 'ContractionTimer';

export default ContractionTimer;
