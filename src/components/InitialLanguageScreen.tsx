import { motion } from 'framer-motion';
import { useUserStore } from '@/store/userStore';
import { Check, Sparkles } from 'lucide-react';
import { clearTranslationCache, loadTranslations } from '@/lib/i18n';
import logoImage from '@/assets/logo.png';
import { useState } from 'react';

const LANGS = [
  {
    code: 'az',
    label: 'Azərbaycan',
    nativeLabel: 'Azərbaycan dili',
    flag: '🇦🇿',
    desc: 'Azərbaycan dilində davam edin',
  },
  {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    flag: '🇬🇧',
    desc: 'Continue in English',
  },
];

export default function InitialLanguageScreen() {
  const { setLanguage, setHasSelectedLanguage } = useUserStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);

  const handleSelect = async (code: string) => {
    if (isSwitching) return;
    setSelected(code);
    setIsSwitching(true);

    clearTranslationCache();
    if (code !== 'az') {
      await loadTranslations(code);
    }

    setLanguage(code);

    setTimeout(() => {
      setHasSelectedLanguage(true);
    }, 350);
  };

  return (
    <div
      className="min-h-[100dvh] flex flex-col bg-background relative overflow-hidden"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Warm decorative background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-24 w-[420px] h-[420px] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute -bottom-40 -left-24 w-[460px] h-[460px] rounded-full bg-accent/15 blur-[120px]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full bg-[hsl(var(--beige))]/40 blur-[100px]" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 relative z-10 w-full max-w-md mx-auto">
        {/* Logo + heading */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-10"
        >
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-primary/30 to-accent/20 blur-2xl" />
            <div className="relative bg-card/90 backdrop-blur-xl p-5 rounded-[1.75rem] shadow-[var(--shadow-elevated)] border border-white/60">
              <img
                src={logoImage}
                alt="Anacan"
                className="w-20 h-20 object-contain"
              />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/15 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
            <span className="text-xs font-semibold text-primary tracking-wide">
              Anacan
            </span>
          </div>

          <h1 className="text-[2rem] leading-tight font-black text-foreground tracking-tight">
            Xoş gəlmisiniz
          </h1>
          <p className="mt-1.5 text-base text-muted-foreground font-medium">
            Welcome to Anacan
          </p>
        </motion.div>

        {/* Language section */}
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="w-full"
        >
          <div className="text-center mb-5">
            <p className="text-sm font-semibold text-foreground/80">
              Dil seçin
              <span className="mx-2 text-muted-foreground/50">·</span>
              <span className="text-muted-foreground">Select language</span>
            </p>
          </div>

          <div className="space-y-3">
            {LANGS.map((lang, idx) => {
              const isSelected = selected === lang.code;
              return (
                <motion.button
                  key={lang.code}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + idx * 0.07, duration: 0.4 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => handleSelect(lang.code)}
                  disabled={isSwitching}
                  className={`group relative w-full overflow-hidden text-left rounded-2xl p-4 flex items-center gap-4 transition-all duration-300 border ${
                    isSelected
                      ? 'bg-card border-primary shadow-[var(--shadow-button)] scale-[1.01]'
                      : 'bg-card/80 backdrop-blur-md border-border/60 hover:border-primary/40 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-soft)]'
                  } disabled:cursor-not-allowed`}
                >
                  {/* Flag tile */}
                  <div
                    className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-3xl transition-all ${
                      isSelected
                        ? 'bg-gradient-to-br from-primary to-accent shadow-md'
                        : 'bg-[hsl(var(--beige-light))] group-hover:bg-primary/10'
                    }`}
                  >
                    <span className="drop-shadow-sm">{lang.flag}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-foreground leading-tight">
                      {lang.nativeLabel}
                    </h3>
                    <p className="text-[13px] text-muted-foreground mt-0.5 truncate">
                      {lang.desc}
                    </p>
                  </div>

                  {/* Selection indicator */}
                  <div
                    className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isSelected
                        ? 'bg-primary text-primary-foreground scale-100'
                        : 'border-2 border-border bg-transparent scale-90 group-hover:border-primary/50'
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                      >
                        <Check className="w-4 h-4" strokeWidth={3} />
                      </motion.div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.4 }}
            className="text-center text-xs text-muted-foreground/80 mt-6 leading-relaxed"
          >
            Dili sonradan tənzimləmələrdən dəyişə bilərsiniz
            <br />
            <span className="text-muted-foreground/60">
              You can change the language later in settings
            </span>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
