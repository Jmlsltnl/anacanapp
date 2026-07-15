import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/store/userStore';
import { Check, Search, ChevronLeft, Globe } from 'lucide-react';
import { clearTranslationCache, loadTranslations } from '@/lib/i18n';
import logoImage from '@/assets/logo.png';
import { useState, useMemo } from 'react';
import countriesData from '../../countries.json';

const LANGS = [
  {
    code: 'az',
    label: 'Azərbaycan',
    nativeLabel: 'Azərbaycan',
    subLabel: 'Azerbaijani',
    flag: 'az',
  },
  {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    subLabel: 'İngilis dili',
    flag: 'gb',
  },
];

export default function InitialLanguageScreen() {
  const { setLanguage, setHasSelectedLanguage, setCountryCode } = useUserStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedLang, setSelectedLang] = useState<string>('az');
  const [isSwitching, setIsSwitching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLangSelect = (code: string) => {
    if (isSwitching) return;
    setSelectedLang(code);
  };

  const handleContinue = async () => {
    if (isSwitching || !selectedLang) return;
    setIsSwitching(true);
    clearTranslationCache();
    if (selectedLang !== 'az') {
      await loadTranslations(selectedLang);
    }
    setLanguage(selectedLang);
    setTimeout(() => {
      setStep(2);
      setIsSwitching(false);
    }, 300);
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

  const t = {
    selectCountry: selectedLang === 'en' ? 'Select Country' : 'Ölkə seçin',
    selectCountryCap: selectedLang === 'en' ? 'SELECT COUNTRY' : 'SELECT COUNTRY',
    searchPlaceholder: selectedLang === 'en' ? 'Search' : 'Axtar',
    noneFound: selectedLang === 'en' ? 'No countries found' : 'Ölkə tapılmadı',
    selectLanguage: selectedLang === 'en' ? 'Select Language' : 'Dil seçin',
    selectLanguageCap: 'SELECT LANGUAGE',
    continue: selectedLang === 'en' ? 'Continue' : 'Davam et',
    continueEn: 'Continue',
  };

  return (
    <div
      className="h-[100dvh] flex flex-col bg-background relative overflow-hidden"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Subtle warm accents */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -right-16 w-[320px] h-[320px] rounded-full bg-primary/15 blur-[110px]" />
        <div className="absolute -bottom-24 -left-16 w-[320px] h-[320px] rounded-full bg-accent/10 blur-[110px]" />
      </div>

      <div className="flex-1 flex flex-col px-6 py-8 relative z-10 w-full max-w-md mx-auto h-full">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35 }}
              className="flex-1 flex flex-col justify-center"
            >
              {/* Compact brand */}
              <div className="flex flex-col items-center mb-8">
                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-md shadow-primary/20 mb-5 overflow-hidden">
                  <img src={logoImage} alt="Anacan" className="w-8 h-8 object-contain" />
                </div>
                <h1 className="text-xl font-bold text-foreground leading-tight">
                  {t.selectLanguage}
                </h1>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mt-1">
                  {t.selectLanguageCap}
                </p>
              </div>

              {/* 2-column language grid */}
              <div className="grid grid-cols-2 gap-3 w-full">
                {LANGS.map((lang, idx) => {
                  const isSelected = selectedLang === lang.code;
                  return (
                    <motion.button
                      key={lang.code}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + idx * 0.06, duration: 0.35 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleLangSelect(lang.code)}
                      disabled={isSwitching}
                      className={`relative flex flex-col items-center p-4 rounded-2xl bg-card transition-all cursor-pointer disabled:cursor-not-allowed ${
                        isSelected
                          ? 'border-2 border-primary shadow-[var(--shadow-button)]'
                          : 'border border-border/60 shadow-sm'
                      }`}
                    >
                      <div className="mb-2.5 rounded-md overflow-hidden border border-border/40 shadow-sm">
                        <img
                          src={`https://flagcdn.com/w40/${lang.flag}.png`}
                          alt={lang.code}
                          className="w-9 h-6 object-cover"
                        />
                      </div>
                      <span className="text-sm font-bold text-foreground">
                        {lang.nativeLabel}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium uppercase mt-0.5 tracking-wide">
                        {lang.subLabel}
                      </span>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                        >
                          <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3.5} />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Continue */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.35 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleContinue}
                disabled={isSwitching || !selectedLang}
                className="w-full mt-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-sm shadow-md shadow-primary/20 transition-all disabled:opacity-70"
              >
                {t.continue}
                <span className="font-normal opacity-70 mx-1.5">·</span>
                <span className="font-medium opacity-90">{t.continueEn}</span>
              </motion.button>

              <p className="text-center text-[11px] text-muted-foreground/80 mt-5 leading-relaxed">
                {selectedLang === 'en'
                  ? 'You can change the language later in settings'
                  : 'Dili sonradan tənzimləmələrdən dəyişə bilərsiniz'}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35 }}
              className="flex-1 flex flex-col h-full"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="w-10 h-10 flex items-center justify-center bg-card rounded-xl border border-border/60 text-muted-foreground hover:text-foreground transition-colors shadow-sm"
                >
                  <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
                </button>
                <div className="text-center">
                  <h2 className="text-lg font-bold text-foreground leading-tight">
                    {t.selectCountry}
                  </h2>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                    {t.selectCountryCap}
                  </p>
                </div>
                <div className="w-10" />
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={2.5} />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-3.5 pl-11 pr-4 bg-card border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors shadow-sm"
                />
              </div>

              {/* List card */}
              <div className="flex-1 bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden mb-4">
                <div className="h-full overflow-y-auto scrollbar-hide">
                  {filteredCountries.length > 0 ? (
                    filteredCountries.map((country, idx) => (
                      <motion.button
                        key={country.isoAlpha2}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(idx * 0.02, 0.3), duration: 0.25 }}
                        onClick={() => handleCountrySelect(country.isoAlpha2)}
                        className="w-full flex items-center px-4 py-3 hover:bg-background transition-colors cursor-pointer border-b border-border/40 last:border-b-0"
                      >
                        <div className="w-6 h-4 mr-3 overflow-hidden rounded-sm border border-border/40 flex-shrink-0 shadow-sm">
                          <img
                            src={country.flag.startsWith('data:') ? country.flag : `data:image/png;base64,${country.flag}`}
                            alt={country.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-sm font-semibold text-foreground text-left flex-1">
                          {country.name}
                        </span>
                        <ChevronLeft className="w-4 h-4 text-muted-foreground/60 rotate-180" />
                      </motion.button>
                    ))
                  ) : (
                    <div className="text-center py-12 px-4">
                      <Globe className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">{t.noneFound}</p>
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
