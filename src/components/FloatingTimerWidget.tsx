import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Baby, Volume2, Square, Clock, X, VolumeX } from 'lucide-react';
import { useTimerStore, type TimerType } from '@/store/timerStore';
import { useWhiteNoiseStore } from '@/store/whiteNoiseStore';
import { useTranslation } from "@/hooks/useTranslation";

const timerConfig: Record<TimerType, { icon: typeof Moon; color: string; label: string }> = {
  sleep: { icon: Moon, color: 'text-indigo-500', label: 'Yuxu' },
  feeding: { icon: Baby, color: 'text-rose-500', label: t("floatingtimerwidget_emizdirme_20d46a", 'Əmizdirmə') },
  diaper: { icon: Clock, color: 'text-amber-500', label: 'Bez' },
  'white-noise': { icon: Volume2, color: 'text-emerald-500', label: t("floatingtimerwidget_kuy_sesi_7b0cd5", 'Küy Səsi') },
};

const formatTime = (totalSeconds: number) => {
  const { t } = useTranslation();
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const FloatingTimerWidget = () => {
  const { activeTimers, stopTimer, getElapsedSeconds } = useTimerStore();
  const whiteNoise = useWhiteNoiseStore();
  const [expanded, setExpanded] = useState(false);
  const [, setTick] = useState(0);

  const hasTimers = activeTimers.length > 0;
  const hasWhiteNoise = whiteNoise.isPlaying;
  const hasAnything = hasTimers || hasWhiteNoise;

  useEffect(() => {
    if (!hasAnything) return;
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [hasAnything]);

  useEffect(() => {
    if (!hasAnything) setExpanded(false);
  }, [hasAnything]);

  if (!hasAnything) return null;

  const primaryTimer = activeTimers[0];
  const config = primaryTimer ? (timerConfig[primaryTimer.type] || timerConfig.sleep) : null;
  const PrimaryIcon = config?.icon || Volume2;
  const primaryColor = config?.color || 'text-emerald-500';

  return (
    <AnimatePresence mode="wait">
      {!expanded ? (
        <motion.button
          key="mini"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          onClick={() => setExpanded(true)}
          whileTap={{ scale: 0.9 }}
          className="fixed right-3 z-[55] flex items-center gap-1.5 rounded-full shadow-lg border border-border/60 bg-card/95 backdrop-blur-xl px-2.5 py-1.5"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 4.5rem)' }}
        >
          <div className="relative">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-green-500 animate-ping opacity-75" />
          </div>
          {hasWhiteNoise && !primaryTimer ? (
            <>
              <span className="text-sm">{whiteNoise.soundEmoji || '🔊'}</span>
              <span className="text-[11px] font-semibold text-foreground truncate max-w-[60px]">
                {whiteNoise.soundName || 'Küy'}
              </span>
            </>
          ) : primaryTimer ? (
            <>
              <PrimaryIcon className={`w-3.5 h-3.5 ${primaryColor}`} />
              <span className="text-[11px] font-mono font-bold text-foreground tabular-nums">
                {formatTime(getElapsedSeconds(primaryTimer.id))}
              </span>
            </>
          ) : null}
          {(activeTimers.length + (hasWhiteNoise ? 1 : 0)) > 1 && (
            <span className="text-[9px] font-semibold text-muted-foreground bg-muted rounded-full w-4 h-4 flex items-center justify-center">
              {activeTimers.length + (hasWhiteNoise ? 1 : 0)}
            </span>
          )}
        </motion.button>
      ) : (
        <motion.div
          key="panel"
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 60, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          className="fixed right-3 z-[55] w-52"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 4.5rem)' }}
        >
          <div className="bg-card/95 backdrop-blur-xl rounded-2xl shadow-lg border border-border/60 overflow-hidden">
            <div className="flex items-center justify-between px-3 pt-2 pb-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Taymer</span>
              <button
                onClick={() => setExpanded(false)}
                className="w-5 h-5 rounded-full bg-muted/60 flex items-center justify-center"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
            <div className="px-2 pb-2 space-y-1">
              {/* White noise entry */}
              {hasWhiteNoise && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-2.5 py-1.5">
                  <span className="text-sm shrink-0">{whiteNoise.soundEmoji || '🔊'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-foreground truncate leading-tight">
                      {whiteNoise.soundName || 'Küy Səsi'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Oynayır</p>
                  </div>
                  <motion.button
                    onClick={() => whiteNoise.toggleMute()}
                    whileTap={{ scale: 0.85 }}
                    className="w-6 h-6 rounded-full bg-muted/60 flex items-center justify-center shrink-0"
                  >
                    {whiteNoise.isMuted 
                      ? <VolumeX className="w-2.5 h-2.5 text-muted-foreground" />
                      : <Volume2 className="w-2.5 h-2.5 text-emerald-600" />
                    }
                  </motion.button>
                  <motion.button
                    onClick={() => whiteNoise.stop()}
                    whileTap={{ scale: 0.85 }}
                    className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center shrink-0"
                  >
                    <Square className="w-2.5 h-2.5 text-destructive fill-destructive" />
                  </motion.button>
                </div>
              )}
              {/* Timer entries */}
              {activeTimers.map((timer) => {
                const tc = timerConfig[timer.type] || timerConfig.sleep;
                const Icon = tc.icon;
                return (
                  <div key={timer.id} className="flex items-center gap-2 rounded-xl bg-muted/40 px-2.5 py-1.5">
                    <Icon className={`w-3.5 h-3.5 ${tc.color} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-foreground truncate leading-tight">
                        {timer.label || tc.label}
                        {timer.feedType ? ` (${timer.feedType === 'left' ? 'Sol' : 'Sağ'})` : ''}
                      </p>
                      <p className="text-xs font-mono font-bold text-foreground tabular-nums">
                        {formatTime(getElapsedSeconds(timer.id))}
                      </p>
                    </div>
                    <motion.button
                      onClick={() => stopTimer(timer.id)}
                      whileTap={{ scale: 0.85 }}
                      className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center shrink-0"
                    >
                      <Square className="w-2.5 h-2.5 text-destructive fill-destructive" />
                    </motion.button>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingTimerWidget;
