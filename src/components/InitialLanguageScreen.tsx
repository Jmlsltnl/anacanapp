import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/store/userStore';
import { Check, Sparkles, Search, Globe, ChevronLeft } from 'lucide-react';
import { clearTranslationCache, loadTranslations } from '@/lib/i18n';
import logoImage from '@/assets/logo.png';
import { useState, useMemo } from 'react';
import countriesData from '../../countries.json';

const LANGS = [
  {
    code: 'az',
    label: 'Azərbaycan',
    nativeLabel: 'Azərbaycan dili',
    flag: 'az',
    desc: 'Azərbaycan dilində davam edin',
  },
  {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    flag: 'gb',
    desc: 'Continue in English',
  },
];

export default function InitialLanguageScreen() {
  const { setLanguage, setHasSelectedLanguage, setCountryCode } = useUserStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLangSelect = async (code: string) => {
    if (isSwitching) return;
    setSelectedLang(code);
    setIsSwitching(true);

    clearTranslationCache();
    if (code !== 'az') {
      await loadTranslations(code);
    }

    setLanguage(code);

    setTimeout(() => {
      setStep(2);
      setIsSwitching(false);
    }, 400);
  };

  const handleCountrySelect = (code: string) => {
    setCountryCode(code);
    setHasSelectedLanguage(true);
  };

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return countriesData;
    const lowerQuery = searchQuery.toLowerCase();
    return countriesData.filter(c => c.name.toLowerCase().includes(lowerQuery));
  }, [searchQuery]);

  return (
    <div
      className="h-[100dvh] flex flex-col bg-background relative overflow-hidden"
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

      <div className="flex-1 flex flex-col px-6 py-10 relative z-10 w-full max-w-md mx-auto h-full">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
              className="flex-1 flex flex-col justify-center"
            >
              <div className="text-center mb-10">
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
              </div>

              <div className="w-full">
                <div className="text-center mb-5">
                  <p className="text-sm font-semibold text-foreground/80">
                    Dil seçin
                    <span className="mx-2 text-muted-foreground/50">·</span>
                    <span className="text-muted-foreground">Select language</span>
                  </p>
                </div>

                <div className="space-y-3">
                  {LANGS.map((lang, idx) => {
                    const isSelected = selectedLang === lang.code;
                    return (
                      <motion.button
                        key={lang.code}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 + idx * 0.07, duration: 0.4 }}
                        whileTap={{ scale: 0.985 }}
                        onClick={() => handleLangSelect(lang.code)}
                        disabled={isSwitching}
                        className={`group relative w-full overflow-hidden text-left rounded-2xl p-4 flex items-center gap-4 transition-all duration-300 border ${
                          isSelected
                            ? 'bg-card border-primary shadow-[var(--shadow-button)] scale-[1.01]'
                            : 'bg-card/80 backdrop-blur-md border-border/60 hover:border-primary/40 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-soft)]'
                        } disabled:cursor-not-allowed`}
                      >
                        <div
                          className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-3xl transition-all ${
                            isSelected
                              ? 'bg-gradient-to-br from-primary to-accent shadow-md'
                              : 'bg-[hsl(var(--beige-light))] group-hover:bg-primary/10'
                          }`}
                        >
                          <img src={`https://flagcdn.com/w40/${lang.flag}.png`} alt={lang.code} className="w-8 h-auto rounded-sm shadow-sm" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-foreground leading-tight">
                            {lang.nativeLabel}
                          </h3>
                          <p className="text-[13px] text-muted-foreground mt-0.5 truncate">
                            {lang.desc}
                          </p>
                        </div>

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
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
              className="flex-1 flex flex-col h-full"
            >
              <div className="flex items-center mb-6 pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="w-10 h-10 rounded-full bg-card/80 border border-border flex items-center justify-center shadow-sm"
                >
                  <ChevronLeft className="w-5 h-5 text-foreground" />
                </button>
                <div className="flex-1 text-center pr-10">
                  <h2 className="text-xl font-bold text-foreground">
                    {selectedLang === 'en' ? 'Select Country' : selectedLang === 'ru' ? 'Выберите страну' : selectedLang === 'tr' ? 'Ülke seçin' : 'Ölkə seçin'}
                  </h2>
                </div>
              </div>

              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={selectedLang === 'en' ? 'Search country...' : selectedLang === 'ru' ? 'Поиск страны...' : selectedLang === 'tr' ? 'Ülke ara...' : 'Ölkə axtarın...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 rounded-2xl bg-card border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all outline-none text-base"
                />
              </div>

              <div className="flex-1 overflow-y-auto pb-6 -mx-2 px-2 scrollbar-hide">
                <div className="space-y-2">
                  {filteredCountries.length > 0 ? (
                    filteredCountries.map((country, idx) => (
                      <motion.button
                        key={country.isoAlpha2}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                        onClick={() => handleCountrySelect(country.isoAlpha2)}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/30 hover:bg-card hover:shadow-md transition-all group"
                      >
                        <div className="w-10 h-8 rounded-lg overflow-hidden flex-shrink-0 shadow-sm border border-border/50">
                          <img 
                            src={country.flag.startsWith('data:') ? country.flag : `data:image/png;base64,${country.flag}`} 
                            alt={country.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 text-left">
                          <span className="font-medium text-foreground group-hover:text-primary transition-colors text-base">
                            {country.name}
                          </span>
                        </div>
                        <ChevronLeft className="w-4 h-4 text-muted-foreground rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </motion.button>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Globe className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground">
                        {selectedLang === 'en' ? 'No countries found' : selectedLang === 'ru' ? 'Страны не найдены' : selectedLang === 'tr' ? 'Ülke bulunamadı' : 'Ölkə tapılmadı'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
