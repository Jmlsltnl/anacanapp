import { useState, useEffect, useRef, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Pause, RotateCcw, Footprints } from 'lucide-react';
import { useKickSessions } from '@/hooks/useKickSessions';
import { hapticFeedback } from '@/lib/native';

interface KickCounterProps {
  onBack: () => void;
}

const KickCounter = forwardRef<HTMLDivElement, KickCounterProps>(({ onBack }, ref) => {
  const [kicks, setKicks] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [time, setTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { sessions, addSession, getTodayStats, loading } = useKickSessions();

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTime(prev => prev + 1);
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
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleKick = async () => {
    await hapticFeedback.medium();
    if (!isActive) {
      setIsActive(true);
    }
    setKicks(prev => prev + 1);
  };

  const handleStop = async () => {
    setIsActive(false);
    if (kicks > 0) {
      await addSession(kicks, time);
    }
  };

  const handleReset = () => {
    setIsActive(false);
    setKicks(0);
    setTime(0);
  };

  const getKickMessage = () => {
    if (kicks === 0) return 'Başlamaq üçün düyməyə toxunun';
    if (kicks < 5) return 'Davam edin, izləyirsiniz! 👶';
    if (kicks < 10) return 'Əla gedir! Körpəniz aktivdir 💪';
    return 'Super! 10 təpikə çatdınız! 🎉';
  };

  const todayStats = getTodayStats();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-primary px-3 pt-3 pb-8 safe-top">
        <div className="flex items-center gap-2">
          <motion.button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">Təpik Sayğacı</h1>
            <p className="text-white/80 text-xs">Körpə hərəkətlərini izləyin</p>
          </div>
        </div>
      </div>

      <div className="px-3 -mt-5">
        {/* Main Counter Card */}
        <motion.div
          className="bg-card rounded-2xl p-4 shadow-elevated border border-border/50 mb-3"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          {/* Timer */}
          <div className="text-center mb-6">
            <p className="text-muted-foreground text-sm font-medium mb-1">Keçən vaxt</p>
            <p className="text-4xl font-black text-foreground font-mono">{formatTime(time)}</p>
          </div>

          {/* Kick Button */}
          <motion.button
            onClick={handleKick}
            className="w-48 h-48 mx-auto rounded-full gradient-primary flex flex-col items-center justify-center shadow-glow mb-6 relative overflow-hidden"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
          >
            {isActive && (
              <motion.div
                className="absolute inset-0 bg-white/20"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 2], opacity: [0.5, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            )}
            <Footprints className="w-16 h-16 text-white mb-2" />
            <span className="text-6xl font-black text-white">{kicks}</span>
          </motion.button>

          {/* Message */}
          <p className="text-center text-muted-foreground font-medium mb-6">
            {getKickMessage()}
          </p>

          {/* Controls */}
          <div className="flex gap-4">
            {isActive ? (
              <motion.button
                onClick={handleStop}
                className="flex-1 h-14 rounded-2xl bg-destructive text-white font-bold flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Pause className="w-5 h-5" />
                Dayandır
              </motion.button>
            ) : (
              <motion.button
                onClick={() => setIsActive(true)}
                className="flex-1 h-14 rounded-2xl gradient-primary text-white font-bold flex items-center justify-center gap-2 shadow-button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Play className="w-5 h-5" />
                Başla
              </motion.button>
            )}
            <motion.button
              onClick={handleReset}
              className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RotateCcw className="w-5 h-5 text-muted-foreground" />
            </motion.button>
          </div>
        </motion.div>

        {/* Today's Stats */}
        <motion.div
          className="bg-beige-light rounded-3xl p-5 mb-6 border border-beige"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-foreground">Bugünkü ümumi</span>
            <span className="text-primary font-bold">{todayStats.totalKicks}/10 təpik</span>
          </div>
          <div className="h-3 bg-beige rounded-full overflow-hidden">
            <motion.div
              className="h-full gradient-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(todayStats.totalKicks / 10 * 100, 100)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Həkimlər gündə ən azı 10 hərəkət hiss etməyi tövsiyə edirlər
          </p>
        </motion.div>

        {/* Recent Sessions - Grouped by Day */}
        {sessions.length > 0 && (
          <div className="pb-8">
            <h3 className="font-bold text-foreground mb-4">Son sessiyalar</h3>
            {(() => {
              // Group sessions by date
              const grouped: { [date: string]: typeof sessions } = {};
              sessions.forEach(session => {
                const date = session.session_date;
                if (!grouped[date]) grouped[date] = [];
                grouped[date].push(session);
              });
              
              const formatDateLabel = (dateStr: string) => {
                const date = new Date(dateStr);
                const today = new Date().toISOString().split('T')[0];
                const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                
                if (dateStr === today) return 'Bu gün';
                if (dateStr === yesterday) return 'Dünən';
                return date.toLocaleDateString('az-AZ', { day: 'numeric', month: 'long' });
              };
              
              return Object.entries(grouped).slice(0, 5).map(([date, daySessions]) => (
                <div key={date} className="mb-4">
                  {/* Date Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold text-primary">{formatDateLabel(date)}</span>
                    <span className="text-xs text-muted-foreground">
                      ({daySessions.reduce((sum, s) => sum + s.kick_count, 0)} təpik)
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {daySessions.map((session, index) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-card rounded-2xl p-4 shadow-card border border-border/50 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Footprints className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-bold text-foreground">{session.kick_count} təpik</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(session.created_at).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground font-mono">
                          {formatTime(session.duration_seconds)}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        )}
      </div>
    </div>
  );
});

KickCounter.displayName = 'KickCounter';

export default KickCounter;
