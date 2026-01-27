import { useState, useEffect, useRef, forwardRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Pause, Volume2, VolumeX, Crown, Lock, Loader2 } from 'lucide-react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useSubscription } from '@/hooks/useSubscription';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { PremiumModal } from '@/components/PremiumModal';
import { useWhiteNoiseSounds } from '@/hooks/useDynamicConfig';

interface Sound {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

interface WhiteNoiseProps {
  onBack: () => void;
}

const WhiteNoise = forwardRef<HTMLDivElement, WhiteNoiseProps>(({ onBack }, ref) => {
  useScrollToTop();
  
  const { preferences, loading: prefsLoading, updateWhiteNoiseVolume, updateWhiteNoiseTimer, updateLastWhiteNoiseSound } = useUserPreferences();
  const { isPremium, canUseWhiteNoise, trackWhiteNoiseUsage, freeLimits } = useSubscription();
  const { data: dbSounds, isLoading: soundsLoading } = useWhiteNoiseSounds();
  
  // Map DB sounds to component format
  const sounds: Sound[] = useMemo(() => {
    if (!dbSounds || dbSounds.length === 0) return [];
    return dbSounds.map(s => ({
      id: s.id,
      name: s.name_az || s.name,
      emoji: s.emoji,
      color: s.color_gradient || 'from-blue-400 to-cyan-500',
    }));
  }, [dbSounds]);
  
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [timer, setTimer] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [usageInfo, setUsageInfo] = useState<{ allowed: boolean; remainingSeconds: number }>({ allowed: true, remainingSeconds: Infinity });
  
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTrackTimeRef = useRef<number>(Date.now());

  // Check usage limits
  useEffect(() => {
    const info = canUseWhiteNoise();
    setUsageInfo(info);
  }, [canUseWhiteNoise]);

  // Initialize from preferences
  useEffect(() => {
    if (preferences) {
      setVolume(preferences.white_noise_volume || 70);
      setTimer(preferences.white_noise_timer);
      if (preferences.last_white_noise_sound) {
        const { allowed } = canUseWhiteNoise();
        if (allowed || isPremium) {
          setActiveSound(preferences.last_white_noise_sound);
          if (preferences.white_noise_timer) {
            setTimeRemaining(preferences.white_noise_timer * 60);
          }
        }
      }
    }
  }, [preferences, isPremium]);

  // Timer countdown and usage tracking
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (activeSound && timeRemaining !== null && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            setActiveSound(null);
            updateLastWhiteNoiseSound(null);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (activeSound && timeRemaining === null) {
      if (!isPremium) {
        interval = setInterval(() => {
          const info = canUseWhiteNoise();
          setUsageInfo(info);
          
          if (!info.allowed) {
            setActiveSound(null);
            updateLastWhiteNoiseSound(null);
            setShowPremiumModal(true);
          }
        }, 1000);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeSound, timeRemaining, isPremium]);

  // Track usage every 10 seconds for free users
  useEffect(() => {
    if (activeSound && !isPremium) {
      trackingIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - lastTrackTimeRef.current) / 1000);
        if (elapsed >= 10) {
          trackWhiteNoiseUsage(10);
          lastTrackTimeRef.current = now;
        }
      }, 10000);

      return () => {
        if (trackingIntervalRef.current) {
          clearInterval(trackingIntervalRef.current);
          const now = Date.now();
          const elapsed = Math.floor((now - lastTrackTimeRef.current) / 1000);
          if (elapsed > 0) {
            trackWhiteNoiseUsage(elapsed);
          }
        }
      };
    }
  }, [activeSound, isPremium]);

  const handleSoundToggle = async (soundId: string) => {
    if (activeSound === soundId) {
      const now = Date.now();
      const elapsed = Math.floor((now - lastTrackTimeRef.current) / 1000);
      if (elapsed > 0 && !isPremium) {
        await trackWhiteNoiseUsage(elapsed);
      }
      
      setActiveSound(null);
      setTimeRemaining(null);
      await updateLastWhiteNoiseSound(null);
    } else {
      const { allowed } = canUseWhiteNoise();
      if (!allowed && !isPremium) {
        setShowPremiumModal(true);
        return;
      }
      
      lastTrackTimeRef.current = Date.now();
      setActiveSound(soundId);
      await updateLastWhiteNoiseSound(soundId);
      
      if (timer) {
        setTimeRemaining(timer * 60);
      } else if (!isPremium) {
        const info = canUseWhiteNoise();
        if (info.remainingSeconds < Infinity) {
          setTimeRemaining(info.remainingSeconds);
        }
      }
    }
  };

  const handleVolumeChange = async (newVolume: number) => {
    setVolume(newVolume);
    setIsMuted(false);
    await updateWhiteNoiseVolume(newVolume);
  };

  const handleTimerChange = async (newTimer: number | null) => {
    setTimer(newTimer);
    await updateWhiteNoiseTimer(newTimer);
    if (activeSound && newTimer) {
      setTimeRemaining(newTimer * 60);
    } else if (!isPremium && activeSound) {
      const info = canUseWhiteNoise();
      setTimeRemaining(info.remainingSeconds < Infinity ? info.remainingSeconds : null);
    } else {
      setTimeRemaining(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const timerOptions = isPremium 
    ? [
        { value: null, label: 'Bitməz' },
        { value: 15, label: '15 dəq' },
        { value: 30, label: '30 dəq' },
        { value: 60, label: '1 saat' },
      ]
    : [
        { value: 10, label: '10 dəq' },
        { value: 15, label: '15 dəq' },
        { value: 20, label: '20 dəq' },
      ];

  if (prefsLoading || soundsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const remainingMinutes = Math.floor(usageInfo.remainingSeconds / 60);
  const activeDbSound = sounds.find(s => s.id === activeSound);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="gradient-primary px-3 pt-3 pb-8 rounded-b-[1.5rem] flex-shrink-0">
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
            <h1 className="text-lg font-bold text-white">Bəyaz Küylər</h1>
            <p className="text-white/80 text-xs">Körpəni sakitləşdirin</p>
          </div>
          {isPremium && (
            <div className="bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
              <Crown className="w-3 h-3" />
              Premium
            </div>
          )}
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-3 -mt-4">
        {/* Free tier usage info */}
        {!isPremium && (
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={`rounded-xl p-3 mb-3 flex items-center gap-2 ${
              usageInfo.remainingSeconds < 300 
                ? 'bg-red-50 dark:bg-red-900/20' 
                : 'bg-amber-50 dark:bg-amber-900/20'
            }`}
          >
            {usageInfo.remainingSeconds < 300 ? (
              <Lock className="w-4 h-4 text-red-500 flex-shrink-0" />
            ) : (
              <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className={`text-xs font-medium ${
                usageInfo.remainingSeconds < 300 
                  ? 'text-red-800 dark:text-red-200'
                  : 'text-amber-800 dark:text-amber-200'
              }`}>
                Bu gün qalan: {remainingMinutes} dəqiqə
              </p>
              <p className={`text-[10px] mt-0.5 ${
                usageInfo.remainingSeconds < 300 
                  ? 'text-red-600 dark:text-red-300'
                  : 'text-amber-600 dark:text-amber-300'
              }`}>
                Limitsiz istifadə üçün Premium-a keçin
              </p>
            </div>
            <motion.button
              onClick={() => setShowPremiumModal(true)}
              className="bg-amber-400 text-amber-900 px-2 py-1 rounded-lg text-[10px] font-bold"
              whileTap={{ scale: 0.95 }}
            >
              Premium
            </motion.button>
          </motion.div>
        )}

        {/* Now Playing Card */}
        <AnimatePresence>
          {activeSound && activeDbSound && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`bg-gradient-to-r ${activeDbSound.color} rounded-2xl p-4 shadow-elevated mb-4`}
            >
              <div className="text-center mb-3">
                <motion.div
                  className="text-5xl mb-2"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {activeDbSound.emoji}
                </motion.div>
                <h2 className="text-xl font-bold text-white">{activeDbSound.name}</h2>
                {timeRemaining !== null && (
                  <p className="text-white/80 mt-1 font-mono text-sm">{formatTime(timeRemaining)} qaldı</p>
                )}
              </div>

              {/* Waveform Animation */}
              <div className="flex items-center justify-center gap-0.5 h-10 mb-3">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-white/60 rounded-full"
                    animate={{
                      height: [8, 24 + Math.random() * 16, 8],
                    }}
                    transition={{
                      duration: 0.5 + Math.random() * 0.5,
                      repeat: Infinity,
                      delay: i * 0.05,
                    }}
                  />
                ))}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-3">
                <motion.button
                  onClick={() => setIsMuted(!isMuted)}
                  className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
                  whileTap={{ scale: 0.9 }}
                >
                  {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
                </motion.button>
                
                <motion.button
                  onClick={() => handleSoundToggle(activeSound)}
                  className="w-14 h-14 rounded-full bg-white flex items-center justify-center"
                  whileTap={{ scale: 0.9 }}
                >
                  <Pause className="w-7 h-7 text-gray-800" />
                </motion.button>

                <div className="w-10" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Volume Slider */}
        <motion.div
          className="bg-card rounded-xl p-3 shadow-card border border-border/50 mb-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="flex items-center gap-3">
            <VolumeX className="w-4 h-4 text-muted-foreground" />
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
              className="flex-1 h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
            />
            <Volume2 className="w-4 h-4 text-muted-foreground" />
          </div>
        </motion.div>

        {/* Timer Options */}
        <div className="mb-4">
          <h3 className="font-bold text-foreground mb-2 text-sm">Taymer</h3>
          <div className="flex gap-2">
            {timerOptions.map((option) => (
              <button
                key={option.label}
                onClick={() => handleTimerChange(option.value)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  timer === option.value
                    ? 'gradient-primary text-white shadow-button'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {!isPremium && (
            <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
              Limitsiz taymer üçün Premium-a keçin
            </p>
          )}
        </div>

        {/* Sounds Grid */}
        <h3 className="font-bold text-foreground mb-3 text-sm">Səslər</h3>
        {sounds.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Səs tapılmadı</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 pb-24">
            {sounds.map((sound, index) => {
              const isActive = activeSound === sound.id;
              return (
                <motion.button
                  key={sound.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleSoundToggle(sound.id)}
                  className={`relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all ${
                    isActive
                      ? `bg-gradient-to-r ${sound.color} shadow-elevated`
                      : 'bg-card border border-border/50 shadow-card'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-xl bg-white/20"
                      animate={{ opacity: [0.2, 0.4, 0.2] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                  <span className="text-2xl mb-0.5 relative z-10">{sound.emoji}</span>
                  <span className={`text-[10px] font-bold relative z-10 ${isActive ? 'text-white' : 'text-muted-foreground'}`}>
                    {sound.name}
                  </span>
                  {isActive && (
                    <motion.div
                      className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-white"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Premium Modal */}
      <PremiumModal 
        isOpen={showPremiumModal} 
        onClose={() => setShowPremiumModal(false)}
        feature="Limitsiz bəyaz küy"
      />
    </div>
  );
});

WhiteNoise.displayName = 'WhiteNoise';

export default WhiteNoise;