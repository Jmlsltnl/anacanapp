import { motion } from 'framer-motion';
import { useUserStore } from '@/store/userStore';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clearTranslationCache, loadTranslations } from '@/lib/i18n';
import logoImage from '@/assets/logo.png';
import { useState } from 'react';

const LANGS = [
  { code: 'az', label: 'Azərbaycan', flag: '🇦🇿', desc: 'Azərbaycan dilində davam edin' },
  { code: 'en', label: 'English', flag: '🇬🇧', desc: 'Continue in English' }
];

export default function InitialLanguageScreen() {
  const { setLanguage, setHasSelectedLanguage } = useUserStore();
  const [isSwitching, setIsSwitching] = useState(false);

  const handleSelect = async (code: string) => {
    setIsSwitching(true);
    
    // Switch translations
    clearTranslationCache();
    if (code !== 'az') {
      await loadTranslations(code);
    }
    
    // Save to store
    setLanguage(code);
    
    // Brief delay to allow UI to show loading state if needed
    setTimeout(() => {
      setHasSelectedLanguage(true);
    }, 300);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background relative overflow-hidden">
      {/* Decorative background blur */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-500/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full max-w-md mx-auto">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="mb-10 text-center"
        >
          <div className="bg-white/80 dark:bg-black/50 p-6 rounded-3xl shadow-xl backdrop-blur-md inline-block border border-white/20">
            <img src={logoImage} alt="Anacan" className="w-24 h-24 object-contain mx-auto" />
          </div>
          <h1 className="mt-8 text-3xl font-black text-foreground">Xoş gəlmisiniz!</h1>
          <p className="mt-2 text-muted-foreground text-lg">Welcome to Anacan</p>
        </motion.div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full space-y-4"
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <Globe className="w-5 h-5 text-primary" />
            <span className="font-semibold text-lg">Dil seçin / Select language</span>
          </div>

          <div className="grid gap-4">
            {LANGS.map((lang, idx) => (
              <motion.button
                key={lang.code}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelect(lang.code)}
                disabled={isSwitching}
                className="w-full relative group overflow-hidden bg-card/60 backdrop-blur-xl border border-border/50 hover:border-primary/50 p-5 rounded-2xl flex items-center gap-4 transition-all hover:shadow-lg text-left disabled:opacity-50"
              >
                <div className="text-4xl">{lang.flag}</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground">{lang.label}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{lang.desc}</p>
                </div>
                
                {/* Hover gradient effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
