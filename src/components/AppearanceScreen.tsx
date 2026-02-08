import { motion } from 'framer-motion';
import { ArrowLeft, Sun, Moon, Monitor, Check, Palette } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useScrollToTop } from '@/hooks/useScrollToTop';

interface AppearanceScreenProps {
  onBack: () => void;
}

const AppearanceScreen = ({ onBack }: AppearanceScreenProps) => {
  useScrollToTop();
  
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const currentTheme = theme === 'system' ? systemTheme : theme;

  const themeOptions = [
    {
      id: 'light',
      label: 'Açıq rejim',
      description: 'Klassik açıq rənglər',
      icon: Sun,
      preview: 'bg-gradient-to-br from-amber-50 to-orange-100',
    },
    {
      id: 'dark',
      label: 'Qaranlıq rejim',
      description: 'Gözlərə rahat qaranlıq tema',
      icon: Moon,
      preview: 'bg-gradient-to-br from-slate-800 to-slate-900',
    },
    {
      id: 'system',
      label: 'Sistem',
      description: 'Cihazınızın ayarına uyğun',
      icon: Monitor,
      preview: 'bg-gradient-to-r from-amber-100 via-slate-300 to-slate-800',
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-28 overflow-y-auto">
      {/* Header with safe area */}
      <div className="gradient-primary px-5 pb-6" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}>
        <div className="flex items-center gap-3 mb-4">
          <motion.button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Görünüş</h1>
            <p className="text-white/80 text-sm">Tema və rəng seçimləri</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-6 -mt-4">
        {/* Theme Selection */}
        <motion.div
          className="bg-card rounded-2xl p-4 shadow-card border border-border/50"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            Tema Seçimi
          </h3>
          
          <div className="space-y-3">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = theme === option.id;
              
              return (
                <motion.button
                  key={option.id}
                  onClick={() => setTheme(option.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/30 hover:bg-muted/50'
                  }`}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Preview */}
                  <div className={`w-14 h-14 rounded-xl ${option.preview} flex items-center justify-center shadow-inner`}>
                    <Icon className={`w-6 h-6 ${option.id === 'dark' ? 'text-white' : 'text-foreground'}`} />
                  </div>
                  
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-foreground">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                  
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center"
                    >
                      <Check className="w-5 h-5 text-white" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Current Theme Preview */}
        <motion.div
          className="bg-card rounded-2xl p-4 shadow-card border border-border/50"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="font-bold text-foreground mb-4">Cari Görünüş</h3>
          
          <div className="space-y-3">
            {/* Color samples */}
            <div className="flex gap-2">
              <div className="flex-1 h-12 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-xs text-primary-foreground font-medium">Primary</span>
              </div>
              <div className="flex-1 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <span className="text-xs text-secondary-foreground font-medium">Secondary</span>
              </div>
              <div className="flex-1 h-12 rounded-xl bg-muted flex items-center justify-center">
                <span className="text-xs text-muted-foreground font-medium">Muted</span>
              </div>
            </div>

            {/* Sample card */}
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sun className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Nümunə kart</p>
                  <p className="text-xs text-muted-foreground">Bu cari temanızın görünüşüdür</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Info */}
        <motion.div
          className="bg-muted/50 rounded-2xl p-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-sm text-muted-foreground text-center">
            {theme === 'system' 
              ? `Hal-hazırda sistem teması (${currentTheme === 'dark' ? 'qaranlıq' : 'açıq'}) istifadə olunur.`
              : `${theme === 'dark' ? 'Qaranlıq' : 'Açıq'} rejim aktiv edilib.`
            }
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AppearanceScreen;
