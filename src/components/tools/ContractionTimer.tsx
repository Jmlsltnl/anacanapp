import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Square, Timer, AlertCircle, CheckCircle } from 'lucide-react';

interface Contraction {
  id: string;
  startTime: Date;
  duration: number;
  interval?: number;
}

interface ContractionTimerProps {
  onBack: () => void;
}

const ContractionTimer = ({ onBack }: ContractionTimerProps) => {
  const [isActive, setIsActive] = useState(false);
  const [currentDuration, setCurrentDuration] = useState(0);
  const [contractions, setContractions] = useState<Contraction[]>([]);
  const [lastEndTime, setLastEndTime] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleStart = () => {
    setIsActive(true);
    setCurrentDuration(0);
  };

  const handleStop = () => {
    setIsActive(false);
    const now = new Date();
    
    const interval = lastEndTime 
      ? Math.floor((now.getTime() - lastEndTime.getTime()) / 1000 - currentDuration)
      : undefined;

    const newContraction: Contraction = {
      id: Date.now().toString(),
      startTime: new Date(now.getTime() - currentDuration * 1000),
      duration: currentDuration,
      interval,
    };

    setContractions(prev => [newContraction, ...prev]);
    setLastEndTime(now);
    setCurrentDuration(0);
  };

  // Calculate averages
  const recentContractions = contractions.slice(0, 5);
  const avgDuration = recentContractions.length > 0
    ? Math.round(recentContractions.reduce((sum, c) => sum + c.duration, 0) / recentContractions.length)
    : 0;
  const avgInterval = recentContractions.filter(c => c.interval).length > 0
    ? Math.round(recentContractions.filter(c => c.interval).reduce((sum, c) => sum + (c.interval || 0), 0) / recentContractions.filter(c => c.interval).length)
    : 0;

  // 5-1-1 Rule check
  const is511 = avgInterval <= 300 && avgInterval > 0 && avgDuration >= 60 && recentContractions.length >= 3;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className={`${is511 ? 'bg-gradient-to-r from-red-500 to-rose-600' : 'gradient-primary'} px-5 pt-4 pb-10 safe-top transition-colors`}>
        <div className="flex items-center gap-4">
          <motion.button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Sancı Ölçən</h1>
            <p className="text-white/80 text-sm">5-1-1 qaydası ilə izləyin</p>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-6">
        {/* 5-1-1 Alert */}
        <AnimatePresence>
          {is511 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-4 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-red-700">Xəstəxanaya getmə vaxtı!</h3>
                <p className="text-sm text-red-600">5-1-1 qaydası: Sancılar 5 dəqiqədən bir, 1 dəqiqə davam edir</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Timer Card */}
        <motion.div
          className="bg-card rounded-3xl p-6 shadow-elevated border border-border/50 mb-6"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          {/* Timer Display */}
          <div className="text-center mb-8">
            <p className="text-muted-foreground text-sm font-medium mb-2">
              {isActive ? 'Sancı müddəti' : 'Hazır'}
            </p>
            <motion.p 
              className={`text-7xl font-black font-mono ${isActive ? 'text-primary' : 'text-foreground'}`}
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
              className="w-full h-16 rounded-2xl gradient-primary text-white font-bold text-lg flex items-center justify-center gap-3 shadow-button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Play className="w-6 h-6" />
              Sancı başladı
            </motion.button>
          ) : (
            <motion.button
              onClick={handleStop}
              className="w-full h-16 rounded-2xl bg-red-500 text-white font-bold text-lg flex items-center justify-center gap-3 shadow-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <Square className="w-6 h-6" />
              Sancı bitdi
            </motion.button>
          )}
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <motion.div
            className="bg-card rounded-2xl p-4 shadow-card border border-border/50"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <p className="text-sm text-muted-foreground mb-1">Ort. Müddət</p>
            <p className="text-2xl font-black text-foreground">{formatTime(avgDuration)}</p>
            <p className="text-xs text-muted-foreground mt-1">Hədəf: ~1 dəq</p>
          </motion.div>

          <motion.div
            className="bg-card rounded-2xl p-4 shadow-card border border-border/50"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-sm text-muted-foreground mb-1">Ort. Aralıq</p>
            <p className="text-2xl font-black text-foreground">{formatTime(avgInterval)}</p>
            <p className="text-xs text-muted-foreground mt-1">Hədəf: ~5 dəq</p>
          </motion.div>
        </div>

        {/* 5-1-1 Rule Info */}
        <motion.div
          className="bg-beige-light rounded-2xl p-4 mb-6 border border-beige"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
            <Timer className="w-5 h-5 text-primary" />
            5-1-1 Qaydası
          </h3>
          <p className="text-sm text-muted-foreground">
            Sancılar <strong>5 dəqiqə</strong> aralığında, <strong>1 dəqiqə</strong> davam edərsə və bu <strong>1 saat</strong> boyunca davam edərsə, xəstəxanaya getmə vaxtıdır.
          </p>
        </motion.div>

        {/* Contractions List */}
        {contractions.length > 0 && (
          <div>
            <h3 className="font-bold text-foreground mb-4">Sancılar ({contractions.length})</h3>
            <div className="space-y-3 pb-8">
              {contractions.map((contraction, index) => (
                <motion.div
                  key={contraction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-card rounded-2xl p-4 shadow-card border border-border/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-bold text-primary">{contractions.length - index}</span>
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{formatTime(contraction.duration)} müddət</p>
                        <p className="text-xs text-muted-foreground">
                          {contraction.startTime.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    {contraction.interval && (
                      <div className="text-right">
                        <p className="text-sm font-bold text-muted-foreground">{formatTime(contraction.interval)}</p>
                        <p className="text-xs text-muted-foreground">aralıq</p>
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
};

export default ContractionTimer;
