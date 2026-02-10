import { useState, useEffect, useRef, forwardRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Pause, Play, Volume2, VolumeX, Crown, Lock, Loader2, Timer, Music2 } from 'lucide-react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useSubscription } from '@/hooks/useSubscription';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { PremiumModal } from '@/components/PremiumModal';
import { useWhiteNoiseSounds, WhiteNoiseSound } from '@/hooks/useDynamicConfig';

interface Sound {
  id: string;
  name: string;
  emoji: string;
  color: string;
  noiseType: string;
  description: string;
  audioUrl: string | null;
}

// Noise type metadata
const noiseTypes = [
  { 
    id: 'white', 
    label: 'Bəyaz Küy', 
    subtitle: 'Sakitləşdirici',
    description: 'Ana bətnindəki səsə bənzər monoton fon',
    emoji: '⚪',
    gradient: 'from-slate-100 to-gray-200 dark:from-slate-800 dark:to-gray-900',
    borderColor: 'border-slate-300 dark:border-slate-700',
    textColor: 'text-slate-700 dark:text-slate-300',
    badgeColor: 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
  },
  { 
    id: 'pink', 
    label: 'Çəhrayı Küy', 
    subtitle: 'Təbiət effekti',
    description: 'Yüngül yağış və yarpaq xışıltısı kimi',
    emoji: '🌸',
    gradient: 'from-pink-50 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/20',
    borderColor: 'border-pink-300 dark:border-pink-800',
    textColor: 'text-pink-700 dark:text-pink-300',
    badgeColor: 'bg-pink-200 dark:bg-pink-800 text-pink-700 dark:text-pink-300',
  },
  { 
    id: 'brown', 
    label: 'Qəhvəyi Küy', 
    subtitle: 'Dərin yuxu',
    description: 'Dərin və boğuq səslər — şəlalə, göy gurultusu',
    emoji: '🟤',
    gradient: 'from-amber-50 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/20',
    borderColor: 'border-amber-300 dark:border-amber-800',
    textColor: 'text-amber-800 dark:text-amber-300',
    badgeColor: 'bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-300',
  },
];

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
      noiseType: s.noise_type || 'white',
      description: s.description_az || s.description || '',
      audioUrl: s.audio_url || null,
    }));
  }, [dbSounds]);

  // Group sounds by noise type
  const groupedSounds = useMemo(() => {
    const groups: Record<string, Sound[]> = {};
    noiseTypes.forEach(nt => { groups[nt.id] = []; });
    sounds.forEach(s => {
      if (groups[s.noiseType]) {
        groups[s.noiseType].push(s);
      } else {
        groups['white'].push(s);
      }
    });
    return groups;
  }, [sounds]);
  
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [timer, setTimer] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTrackTimeRef = useRef<number>(Date.now());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const usageInfo = useMemo(() => canUseWhiteNoise(), [canUseWhiteNoise]);

  // Helper: generate noise buffer
  const generateNoiseBuffer = (ctx: AudioContext, type: string): AudioBuffer => {
    const sampleRate = ctx.sampleRate;
    const duration = 4; // seconds, will loop
    const length = sampleRate * duration;
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    if (type === 'pink') {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    } else if (type === 'brown') {
      let last = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + (0.02 * white)) / 1.02;
        data[i] = last * 3.5;
      }
    } else {
      // white noise
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }
    return buffer;
  };

  // Stop all audio
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (noiseSourceRef.current) {
      try { noiseSourceRef.current.stop(); } catch {}
      noiseSourceRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    gainNodeRef.current = null;
  };

  // Play audio when activeSound changes
  useEffect(() => {
    if (!activeSound) {
      stopAudio();
      return;
    }

    const sound = sounds.find(s => s.id === activeSound);
    if (!sound) { stopAudio(); return; }

    const effectiveVolume = isMuted ? 0 : volume / 100;

    if (sound.audioUrl) {
      // Play from URL
      stopAudio();
      const audio = new Audio(sound.audioUrl);
      audio.loop = true;
      audio.volume = effectiveVolume;
      audio.play().catch(err => console.warn('Audio play failed:', err));
      audioRef.current = audio;
    } else {
      // Generate noise with Web Audio API
      stopAudio();
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const gainNode = ctx.createGain();
      gainNode.gain.value = effectiveVolume;
      gainNode.connect(ctx.destination);
      gainNodeRef.current = gainNode;

      const buffer = generateNoiseBuffer(ctx, sound.noiseType);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(gainNode);
      source.start();
      noiseSourceRef.current = source;
    }

    return () => stopAudio();
  }, [activeSound, sounds]);

  // Update volume on active audio
  useEffect(() => {
    const effectiveVolume = isMuted ? 0 : volume / 100;
    if (audioRef.current) {
      audioRef.current.volume = effectiveVolume;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = effectiveVolume;
    }
  }, [volume, isMuted]);

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
          } else if (!isPremium) {
            const info = canUseWhiteNoise();
            setTimeRemaining(info.remainingSeconds < Infinity ? info.remainingSeconds : null);
          }
        }
      }
    }
  }, [preferences, isPremium, canUseWhiteNoise]);

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (activeSound && timeRemaining !== null && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            setActiveSound(null);
            updateLastWhiteNoiseSound(null);
            if (!isPremium && timer === null) setShowPremiumModal(true);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [activeSound, timeRemaining, isPremium, timer, updateLastWhiteNoiseSound]);

  // Track usage for free users
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
          if (elapsed > 0) trackWhiteNoiseUsage(elapsed);
        }
      };
    }
  }, [activeSound, isPremium, trackWhiteNoiseUsage]);

  const handleSoundToggle = async (soundId: string) => {
    if (activeSound === soundId) {
      const now = Date.now();
      const elapsed = Math.floor((now - lastTrackTimeRef.current) / 1000);
      if (elapsed > 0 && !isPremium) await trackWhiteNoiseUsage(elapsed);
      setActiveSound(null);
      setTimeRemaining(null);
      await updateLastWhiteNoiseSound(null);
    } else {
      const { allowed, remainingSeconds } = canUseWhiteNoise();
      if (!allowed && !isPremium) { setShowPremiumModal(true); return; }
      lastTrackTimeRef.current = Date.now();
      setActiveSound(soundId);
      await updateLastWhiteNoiseSound(soundId);
      if (isPremium) { setTimeRemaining(timer ? timer * 60 : null); return; }
      const requestedSeconds = timer ? timer * 60 : remainingSeconds;
      setTimeRemaining(Math.min(requestedSeconds, remainingSeconds));
    }
  };

  const handleVolumeChange = async (newVolume: number) => {
    setVolume(newVolume);
    setIsMuted(false);
    await updateWhiteNoiseVolume(newVolume);
  };

  const handleTimerChange = async (newTimer: number | null) => {
    if (!isPremium && newTimer === null) { setShowPremiumModal(true); return; }
    setTimer(newTimer);
    await updateWhiteNoiseTimer(newTimer);
    if (!activeSound) { setTimeRemaining(newTimer ? newTimer * 60 : null); return; }
    if (isPremium) { setTimeRemaining(newTimer ? newTimer * 60 : null); return; }
    const info = canUseWhiteNoise();
    if (!info.allowed) {
      setActiveSound(null);
      await updateLastWhiteNoiseSound(null);
      setShowPremiumModal(true);
      setTimeRemaining(null);
      return;
    }
    if (newTimer) setTimeRemaining(Math.min(newTimer * 60, info.remainingSeconds));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const timerOptions = isPremium 
    ? [
        { value: null, label: 'Limitsiz', icon: '∞' },
        { value: 15, label: '15 dəq', icon: '15' },
        { value: 30, label: '30 dəq', icon: '30' },
        { value: 60, label: '1 saat', icon: '60' },
      ]
    : [
        { value: 10, label: '10 dəq', icon: '10' },
        { value: 15, label: '15 dəq', icon: '15' },
        { value: 20, label: '20 dəq', icon: '20' },
      ];

  if (prefsLoading || soundsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const remainingMinutes = usageInfo.remainingSeconds === Infinity ? null : Math.floor(usageInfo.remainingSeconds / 60);
  const activeDbSound = sounds.find(s => s.id === activeSound);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 flex flex-col">
      {/* Compact Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <motion.button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-muted/80 flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Yuxu Səsləri</h1>
            <p className="text-xs text-muted-foreground">Küy rəngləri ilə dərin yuxu</p>
          </div>
          {isPremium && (
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-lg">
              <Crown className="w-3 h-3" />
              Premium
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
        {/* Free tier usage banner */}
        {!isPremium && remainingMinutes !== null && (
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={`rounded-2xl p-4 mb-5 border ${
              usageInfo.remainingSeconds < 300 
                ? 'bg-gradient-to-r from-destructive/10 to-destructive/5 border-destructive/20' 
                : 'bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                usageInfo.remainingSeconds < 300 ? 'bg-destructive/20' : 'bg-primary/20'
              }`}>
                {usageInfo.remainingSeconds < 300 ? (
                  <Lock className="w-5 h-5 text-destructive" />
                ) : (
                  <Timer className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-bold ${usageInfo.remainingSeconds < 300 ? 'text-destructive' : 'text-foreground'}`}>
                  {remainingMinutes} dəqiqə qalıb
                </p>
                <p className="text-xs text-muted-foreground">
                  Limitsiz dinləmə üçün Premium
                </p>
              </div>
              <motion.button
                onClick={() => setShowPremiumModal(true)}
                className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg"
                whileTap={{ scale: 0.95 }}
              >
                Keç
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Now Playing Card */}
        <AnimatePresence mode="wait">
          {activeSound && activeDbSound ? (
            <motion.div
              key="playing"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`bg-gradient-to-br ${activeDbSound.color} rounded-3xl p-6 shadow-xl mb-6 relative overflow-hidden`}
            >
              <div className="absolute inset-0 opacity-20">
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/30 blur-2xl" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/20 blur-3xl" />
              </div>
              
              <div className="relative z-10">
                <div className="text-center mb-4">
                  <motion.div
                    className="text-6xl mb-3 drop-shadow-lg"
                    animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    {activeDbSound.emoji}
                  </motion.div>
                  <h2 className="text-2xl font-black text-white drop-shadow-md">{activeDbSound.name}</h2>
                  {activeDbSound.description && (
                    <p className="text-white/70 text-xs mt-1">{activeDbSound.description}</p>
                  )}
                  {timeRemaining !== null && (
                    <div className="inline-flex items-center gap-2 mt-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full">
                      <Timer className="w-4 h-4 text-white/80" />
                      <span className="text-white font-mono font-bold">{formatTime(timeRemaining)}</span>
                    </div>
                  )}
                </div>

                {/* Waveform Animation */}
                <div className="flex items-center justify-center gap-1 h-12 mb-5">
                  {[...Array(24)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 bg-white/70 rounded-full"
                      animate={{ height: [6, 20 + Math.random() * 20, 6] }}
                      transition={{ duration: 0.4 + Math.random() * 0.4, repeat: Infinity, delay: i * 0.03 }}
                    />
                  ))}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                  <motion.button
                    onClick={() => setIsMuted(!isMuted)}
                    className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
                    whileTap={{ scale: 0.9 }}
                  >
                    {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
                  </motion.button>
                  <motion.button
                    onClick={() => handleSoundToggle(activeSound)}
                    className="w-16 h-16 rounded-2xl bg-white text-foreground flex items-center justify-center shadow-xl"
                    whileTap={{ scale: 0.9 }}
                  >
                    <Pause className="w-8 h-8" />
                  </motion.button>
                  <div className="w-12 h-12" />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-card rounded-3xl p-6 shadow-lg border border-border/50 mb-6 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <Music2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-bold text-foreground mb-1">Hansı səs körpənizə daha xoş gəlir?</h3>
              <p className="text-sm text-muted-foreground">Aşağıdakı küy növlərindən birini seçərək başlayın</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Volume Control */}
        <motion.div
          className="bg-card rounded-2xl p-4 shadow-lg border border-border/50 mb-5"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Volume2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Səs səviyyəsi</span>
            <span className="ml-auto text-sm font-bold text-primary">{isMuted ? 0 : volume}%</span>
          </div>
          <div className="relative">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
                style={{ width: `${isMuted ? 0 : volume}%` }}
              />
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </motion.div>

        {/* Timer Options */}
        <motion.div
          className="mb-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Timer className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Taymer</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {timerOptions.map((option) => (
              <motion.button
                key={option.label}
                onClick={() => handleTimerChange(option.value)}
                className={`relative py-3 rounded-xl text-center transition-all ${
                  timer === option.value
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'bg-card border border-border/50 text-muted-foreground hover:bg-muted/50'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-lg font-bold">{option.icon}</span>
                <p className="text-[10px] mt-0.5 opacity-80">
                  {option.value === null ? 'Limitsiz' : 'dəqiqə'}
                </p>
              </motion.button>
            ))}
          </div>
          {!isPremium && (
            <p className="text-[10px] text-muted-foreground mt-2 text-center flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" />
              Limitsiz taymer Premium-a aiddir
            </p>
          )}
        </motion.div>

        {/* Sounds by Noise Type */}
        {noiseTypes.map((nt, ntIdx) => {
          const typeSounds = groupedSounds[nt.id] || [];
          if (typeSounds.length === 0) return null;
          
          return (
            <motion.div
              key={nt.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 + ntIdx * 0.08 }}
              className="mb-5"
            >
              {/* Section Header */}
              <div className={`rounded-2xl p-3 mb-3 border ${nt.borderColor} ${nt.gradient}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{nt.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-bold text-sm ${nt.textColor}`}>{nt.label}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${nt.badgeColor}`}>
                        {nt.subtitle}
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 opacity-70 ${nt.textColor}`}>{nt.description}</p>
                  </div>
                </div>
              </div>

              {/* Sounds Grid */}
              <div className="grid grid-cols-3 gap-3">
                {typeSounds.map((sound, index) => {
                  const isActive = activeSound === sound.id;
                  return (
                    <motion.button
                      key={sound.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.25 + ntIdx * 0.08 + index * 0.03 }}
                      onClick={() => handleSoundToggle(sound.id)}
                      className={`relative rounded-2xl flex flex-col items-center justify-center transition-all overflow-hidden p-3 ${
                        isActive
                          ? `bg-gradient-to-br ${sound.color} shadow-xl`
                          : 'bg-card border border-border/50 shadow-sm hover:shadow-lg hover:border-primary/30'
                      }`}
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {isActive && (
                        <>
                          <motion.div
                            className="absolute inset-0 bg-white/10"
                            animate={{ opacity: [0.1, 0.3, 0.1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                          <motion.div
                            className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-white shadow-lg"
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                        </>
                      )}
                      <span className={`text-3xl mb-1 relative z-10 drop-shadow-sm ${isActive ? 'drop-shadow-lg' : ''}`}>
                        {sound.emoji}
                      </span>
                      <span className={`text-[11px] font-bold relative z-10 px-1 text-center leading-tight ${
                        isActive ? 'text-white' : 'text-foreground'
                      }`}>
                        {sound.name}
                      </span>
                      {sound.description && !isActive && (
                        <span className="text-[9px] text-muted-foreground mt-0.5 text-center leading-tight line-clamp-1 px-1">
                          {sound.description}
                        </span>
                      )}
                      {isActive && (
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                          <div className="flex items-center gap-0.5">
                            {[...Array(3)].map((_, i) => (
                              <motion.div
                                key={i}
                                className="w-1 bg-white/80 rounded-full"
                                animate={{ height: [4, 8, 4] }}
                                transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.1 }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Premium Modal */}
      <PremiumModal 
        isOpen={showPremiumModal} 
        onClose={() => setShowPremiumModal(false)}
        feature="Limitsiz yuxu səsləri"
      />
    </div>
  );
});

WhiteNoise.displayName = 'WhiteNoise';

export default WhiteNoise;
