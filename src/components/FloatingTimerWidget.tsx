import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Baby, Volume2, Square, ChevronUp, ChevronDown, Clock } from 'lucide-react';
import { useTimerStore, type TimerType } from '@/store/timerStore';

const timerConfig: Record<TimerType, { icon: typeof Moon; color: string; label: string }> = {
  sleep: { icon: Moon, color: 'text-indigo-500', label: 'Yuxu' },
  feeding: { icon: Baby, color: 'text-rose-500', label: 'Əmizdirmə' },
  diaper: { icon: Clock, color: 'text-amber-500', label: 'Bez' },
  'white-noise': { icon: Volume2, color: 'text-emerald-500', label: 'Küy Səsi' },
};

const formatTime = (totalSeconds: number) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const FloatingTimerWidget = () => {
  const { activeTimers, stopTimer, getElapsedSeconds } = useTimerStore();
  const [expanded, setExpanded] = useState(false);
  const [, setTick] = useState(0);

  // Tick every second to update elapsed times
  useEffect(() => {
    if (activeTimers.length === 0) return;
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [activeTimers.length]);

  if (activeTimers.length === 0) return null;

  const primaryTimer = activeTimers[0];
  const config = timerConfig[primaryTimer.type] || timerConfig.sleep;
  const PrimaryIcon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="fixed left-3 right-3 z-[55] transition-all"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 4rem)' }}
      >
        <div className="bg-card/95 backdrop-blur-xl rounded-2xl shadow-lg border border-border/60 overflow-hidden">
          {/* Collapsed: single row */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center gap-3 px-4 py-2.5"
          >
            {/* Pulsing indicator */}
            <div className="relative">
              <div className={`w-2 h-2 rounded-full bg-green-500`} />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-ping opacity-75" />
            </div>

            <PrimaryIcon className={`w-4.5 h-4.5 ${config.color}`} />

            <div className="flex-1 text-left">
              <span className="text-xs font-semibold text-foreground">
                {primaryTimer.label || config.label}
                {primaryTimer.feedType ? ` (${primaryTimer.feedType === 'left' ? 'Sol' : 'Sağ'})` : ''}
              </span>
              {activeTimers.length > 1 && (
                <span className="text-[10px] text-muted-foreground ml-1.5">
                  +{activeTimers.length - 1}
                </span>
              )}
            </div>

            <span className="text-sm font-mono font-bold text-foreground tabular-nums">
              {formatTime(getElapsedSeconds(primaryTimer.id))}
            </span>

            <motion.button
              onClick={(e) => { e.stopPropagation(); stopTimer(primaryTimer.id); }}
              whileTap={{ scale: 0.85 }}
              className="w-7 h-7 rounded-full bg-destructive/10 flex items-center justify-center"
            >
              <Square className="w-3 h-3 text-destructive fill-destructive" />
            </motion.button>

            {activeTimers.length > 1 && (
              expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {/* Expanded: all timers */}
          <AnimatePresence>
            {expanded && activeTimers.length > 1 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-border/40"
              >
                {activeTimers.slice(1).map((timer) => {
                  const tc = timerConfig[timer.type] || timerConfig.sleep;
                  const Icon = tc.icon;
                  return (
                    <div key={timer.id} className="flex items-center gap-3 px-4 py-2">
                      <Icon className={`w-4 h-4 ${tc.color}`} />
                      <span className="flex-1 text-xs font-medium text-foreground">
                        {timer.label || tc.label}
                        {timer.feedType ? ` (${timer.feedType === 'left' ? 'Sol' : 'Sağ'})` : ''}
                      </span>
                      <span className="text-xs font-mono font-semibold text-foreground tabular-nums">
                        {formatTime(getElapsedSeconds(timer.id))}
                      </span>
                      <motion.button
                        onClick={() => stopTimer(timer.id)}
                        whileTap={{ scale: 0.85 }}
                        className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center"
                      >
                        <Square className="w-2.5 h-2.5 text-destructive fill-destructive" />
                      </motion.button>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FloatingTimerWidget;
