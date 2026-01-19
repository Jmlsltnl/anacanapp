import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface Sound {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

const sounds: Sound[] = [
  { id: 'rain', name: 'Yağış', emoji: '🌧️', color: 'from-blue-400 to-cyan-500' },
  { id: 'ocean', name: 'Okean', emoji: '🌊', color: 'from-cyan-400 to-blue-500' },
  { id: 'forest', name: 'Meşə', emoji: '🌲', color: 'from-green-400 to-emerald-500' },
  { id: 'wind', name: 'Külək', emoji: '💨', color: 'from-gray-400 to-slate-500' },
  { id: 'fire', name: 'Ocaq', emoji: '🔥', color: 'from-orange-400 to-red-500' },
  { id: 'birds', name: 'Quşlar', emoji: '🐦', color: 'from-amber-400 to-yellow-500' },
  { id: 'womb', name: 'Ana bətni', emoji: '💕', color: 'from-pink-400 to-rose-500' },
  { id: 'hairdryer', name: 'Fen', emoji: '💇', color: 'from-violet-400 to-purple-500' },
  { id: 'vacuum', name: 'Tozsoran', emoji: '🧹', color: 'from-indigo-400 to-blue-500' },
  { id: 'shush', name: 'Şşş', emoji: '🤫', color: 'from-teal-400 to-cyan-500' },
  { id: 'heartbeat', name: 'Ürək döyüntüsü', emoji: '❤️', color: 'from-red-400 to-rose-500' },
  { id: 'lullaby', name: 'Layla', emoji: '🎵', color: 'from-purple-400 to-pink-500' },
];

interface WhiteNoiseProps {
  onBack: () => void;
}

const WhiteNoise = ({ onBack }: WhiteNoiseProps) => {
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [timer, setTimer] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (timeRemaining !== null && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            setActiveSound(null);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timeRemaining]);

  const handleSoundToggle = (soundId: string) => {
    if (activeSound === soundId) {
      setActiveSound(null);
      setTimeRemaining(null);
    } else {
      setActiveSound(soundId);
      if (timer) {
        setTimeRemaining(timer * 60);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const timerOptions = [
    { value: null, label: 'Bitməz' },
    { value: 15, label: '15 dəq' },
    { value: 30, label: '30 dəq' },
    { value: 60, label: '1 saat' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-primary px-5 pt-4 pb-10 safe-top">
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
            <h1 className="text-xl font-bold text-white">Bəyaz Küylər</h1>
            <p className="text-white/80 text-sm">Körpəni sakitləşdirin</p>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-6">
        {/* Now Playing Card */}
        <AnimatePresence>
          {activeSound && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`bg-gradient-to-r ${sounds.find(s => s.id === activeSound)?.color} rounded-3xl p-6 shadow-elevated mb-6`}
            >
              <div className="text-center mb-4">
                <motion.div
                  className="text-6xl mb-3"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {sounds.find(s => s.id === activeSound)?.emoji}
                </motion.div>
                <h2 className="text-2xl font-bold text-white">{sounds.find(s => s.id === activeSound)?.name}</h2>
                {timeRemaining !== null && (
                  <p className="text-white/80 mt-2 font-mono">{formatTime(timeRemaining)} qaldı</p>
                )}
              </div>

              {/* Waveform Animation */}
              <div className="flex items-center justify-center gap-1 h-12 mb-4">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-white/60 rounded-full"
                    animate={{
                      height: [10, 30 + Math.random() * 20, 10],
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
              <div className="flex items-center justify-center gap-4">
                <motion.button
                  onClick={() => setIsMuted(!isMuted)}
                  className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center"
                  whileTap={{ scale: 0.9 }}
                >
                  {isMuted ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
                </motion.button>
                
                <motion.button
                  onClick={() => setActiveSound(null)}
                  className="w-16 h-16 rounded-full bg-white flex items-center justify-center"
                  whileTap={{ scale: 0.9 }}
                >
                  <Pause className="w-8 h-8 text-gray-800" />
                </motion.button>

                <div className="w-12" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Volume Slider */}
        <motion.div
          className="bg-card rounded-2xl p-4 shadow-card border border-border/50 mb-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="flex items-center gap-4">
            <VolumeX className="w-5 h-5 text-muted-foreground" />
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseInt(e.target.value));
                setIsMuted(false);
              }}
              className="flex-1 h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
            />
            <Volume2 className="w-5 h-5 text-muted-foreground" />
          </div>
        </motion.div>

        {/* Timer Options */}
        <div className="mb-6">
          <h3 className="font-bold text-foreground mb-3">Taymer</h3>
          <div className="flex gap-2">
            {timerOptions.map((option) => (
              <button
                key={option.label}
                onClick={() => {
                  setTimer(option.value);
                  if (activeSound && option.value) {
                    setTimeRemaining(option.value * 60);
                  } else {
                    setTimeRemaining(null);
                  }
                }}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                  timer === option.value
                    ? 'gradient-primary text-white shadow-button'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sounds Grid */}
        <h3 className="font-bold text-foreground mb-4">Səslər</h3>
        <div className="grid grid-cols-3 gap-3 pb-8">
          {sounds.map((sound, index) => {
            const isActive = activeSound === sound.id;
            return (
              <motion.button
                key={sound.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleSoundToggle(sound.id)}
                className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all ${
                  isActive
                    ? `bg-gradient-to-r ${sound.color} shadow-elevated`
                    : 'bg-card border border-border/50 shadow-card'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
              >
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-white/20"
                    animate={{ opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
                <span className="text-3xl mb-1 relative z-10">{sound.emoji}</span>
                <span className={`text-xs font-bold relative z-10 ${isActive ? 'text-white' : 'text-muted-foreground'}`}>
                  {sound.name}
                </span>
                {isActive && (
                  <motion.div
                    className="absolute top-2 right-2 w-3 h-3 rounded-full bg-white"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WhiteNoise;
