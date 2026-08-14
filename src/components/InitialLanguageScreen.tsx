import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/store/userStore';
import { Check, Search, ChevronLeft, Globe } from 'lucide-react';
import { clearTranslationCache, ensureLanguageReady, loadTranslations, fetchActiveLanguages } from '@/lib/i18n';
import logoImage from '@/assets/logo.png';
import { useState, useMemo, useEffect } from 'react';
import countriesData from '../../countries.json';

// flagcdn ölkə kodu xəritəsi (dil kodu → bayraq kodu)
const FLAG_BY_CODE: Record<string, string> = { az: 'az', en: 'gb', ru: 'ru', tr: 'tr', kk: 'kz', de: 'de', ar: 'sa' };

// İlkin/fallback siyahı — app_languages sorğusu gələnə qədər və ya offline halda.
const FALLBACK_LANGS = [
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
    subLabel: 'English',
    flag: 'gb',
  },
];

export default function InitialLanguageScreen() {
  const { setLanguage, setHasSelectedLanguage, setCountryCode } = useUserStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedLang, setSelectedLang] = useState<string>(useUserStore.getState().language || 'az');
  const [isSwitching, setIsSwitching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [langs, setLangs] = useState(FALLBACK_LANGS);

  // Aktiv dillər DB-dən (app_languages.is_active) — ru/tr açılışı app release tələb etmir.
  useEffect(() => {
    fetchActiveLanguages()
      .then((list) =>
        setLangs(
          list.map((l) => ({
            code: l.code,
            label: l.native_name,
            nativeLabel: l.native_name,
            subLabel: l.name,
            flag: FLAG_BY_CODE[l.code] || 'az',
          }))
        )
      )
      .catch(() => {});
  }, []);

  const handleLangSelect = (code: string) => {
    if (isSwitching) return;
    setSelectedLang(code);
  };

  const handleContinue = async () => {
    if (isSwitching || !selectedLang) return;
    setIsSwitching(true);
    clearTranslationCache();
    if (selectedLang !== 'az') {
      // Lokal seed dərhal (şəbəkəsiz); DB overlay arxa planda gəlir —
      // zəif internetdə "Davam et" düyməsi saniyələrlə asılı qalmır.
      await ensureLanguageReady(selectedLang);
      void loadTranslations(selectedLang);
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
    // KRİTİK: qeyri-az dillərdə BİR DƏFƏ reload — main-chunk modul konstantları
    // (onboarding sual mətnləri, flow seçimləri və s.) import anında tr() ilə
    // hesablanır; reload-suz ilk quraşdırmada AZ donub qalırdılar.
    // Keş artıq localStorage-a yazılıb → reload-dan sonra zero-flash işləyir.
    if (selectedLang && selectedLang !== 'az') {
      setTimeout(() => window.location.reload(), 80);
    }
  };

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return countriesData;
    const lowerQuery = searchQuery.toLowerCase();
    return countriesData.filter(c => c.name.toLowerCase().includes(lowerQuery));
  }, [searchQuery]);

  // Bu ekran tərcümə yüklənməzdən ƏVVƏL göstərilir — mətnlər inline saxlanır.
  const L = (m: Record<string, string>) => m[selectedLang] ?? m.az;
  const t = {
    selectCountry: L({ az: 'Ölkə seçin', en: 'Select Country', ru: 'Выберите страну', tr: 'Ülke seçin', kk: 'Елді таңдаңыз', de: 'Land auswählen', ar: 'اختاري الدولة' }),
    selectCountryCap: 'SELECT COUNTRY',
    searchPlaceholder: L({ az: 'Axtar', en: 'Search', ru: 'Поиск', tr: 'Ara', kk: 'Іздеу', de: 'Suchen', ar: 'بحث' }),
    noneFound: L({ az: 'Ölkə tapılmadı', en: 'No countries found', ru: 'Страны не найдены', tr: 'Ülke bulunamadı', kk: 'Ел табылмады', de: 'Kein Land gefunden', ar: 'لم يتم العثور على دولة' }),
    selectLanguage: L({ az: 'Dil seçin', en: 'Select Language', ru: 'Выберите язык', tr: 'Dil seçin', kk: 'Тілді таңдаңыз', de: 'Sprache auswählen', ar: 'اختاري اللغة' }),
    selectLanguageCap: 'SELECT LANGUAGE',
    continue: L({ az: 'Davam et', en: 'Continue', ru: 'Продолжить', tr: 'Devam et', kk: 'Жалғастыру', de: 'Weiter', ar: 'متابعة' }),
    continueEn: 'Continue',
  };

  return (
    <div
      className="a-scope h-[100dvh] flex flex-col relative overflow-hidden"
      style={{
        background: 'var(--a-bg)',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Watercolor sky */}
      <div className="a-sky" aria-hidden>
        <span className="a-cloud c1" />
        <span className="a-cloud c2" />
        <span className="a-cloud c3" />
        <span className="a-cloud c4" />
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
                <div className="w-14 h-14 flex items-center justify-center mb-5 overflow-hidden"
                style={{ borderRadius: 18, background: 'var(--a-grad-peach)', boxShadow: '0 14px 28px -12px rgba(217, 108, 74, 0.5)' }}>
                  <img src={logoImage} alt="Anacan" className="w-9 h-9 object-contain" />
                </div>
                <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.2, color: 'var(--a-ink)' }}>
                  {t.selectLanguage}
                </h1>
                <p style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--a-on-bg-soft)', marginTop: 4 }}>
                  {t.selectLanguageCap}
                </p>
              </div>

              {/* 2-column language grid */}
              <div className="grid grid-cols-2 gap-3 w-full">
                {langs.map((lang, idx) => {
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
                      className="relative flex flex-col items-center transition-all cursor-pointer disabled:cursor-not-allowed"
                      style={{
                        padding: 16,
                        borderRadius: 20,
                        background: 'var(--a-surface)',
                        border: isSelected ? '2px solid var(--a-peach-2)' : '2px solid transparent',
                        boxShadow: 'var(--a-card-shadow)'
                      }}
                    >
                      <div className="mb-2.5 rounded-md overflow-hidden" style={{ border: '1px solid var(--a-line)', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
                        <img
                          src={`https://flagcdn.com/w40/${lang.flag}.png`}
                          alt={lang.code}
                          className="w-9 h-6 object-cover"
                        />
                      </div>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--a-ink)' }}>
                        {lang.nativeLabel}
                      </span>
                      <span style={{ fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--a-ink-soft)', marginTop: 2 }}>
                        {lang.subLabel}
                      </span>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                          className="absolute top-2 end-2 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: 'var(--a-peach-2)' }}
                        >
                          <Check className="w-3 h-3 text-white" strokeWidth={3.5} />
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
                className="w-full mt-8 py-4 rounded-full text-white transition-all disabled:opacity-70"
                style={{ background: 'var(--a-peach-2)', fontSize: 14, fontWeight: 700, boxShadow: '0 16px 32px -12px rgba(217, 108, 74, 0.6)' }}
              >
                {t.continue}
                <span className="font-normal opacity-70 mx-1.5">·</span>
                <span className="font-medium opacity-90">{t.continueEn}</span>
              </motion.button>

              <p className="text-center mt-5 leading-relaxed" style={{ fontSize: 11, color: 'var(--a-on-bg-soft)' }}>
                {L({
                  az: 'Dili sonradan tənzimləmələrdən dəyişə bilərsiniz',
                  en: 'You can change the language later in settings',
                  ru: 'Язык можно изменить позже в настройках',
                  tr: 'Dili daha sonra ayarlardan değiştirebilirsiniz',
                  kk: 'Тілді кейін баптаулардан өзгерте аласыз',
                  de: 'Du kannst die Sprache später in den Einstellungen ändern',
                  ar: 'يمكنكِ تغيير اللغة لاحقًا من الإعدادات',
                })}
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
                  className="a-icon-btn"
                  aria-label="Back"
                >
                  <ChevronLeft className="rtl:rotate-180" size={18} strokeWidth={2.5} />
                </button>
                <div className="text-center">
                  <h2 style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.2, color: 'var(--a-ink)' }}>
                    {t.selectCountry}
                  </h2>
                  <p style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--a-on-bg-soft)', marginTop: 2 }}>
                    {t.selectCountryCap}
                  </p>
                </div>
                <div className="w-10" />
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4" strokeWidth={2.5} style={{ color: 'var(--a-ink-faint)' }} />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-3.5 ps-11 pe-4 rounded-2xl text-sm focus:outline-none transition-colors"
                  style={{ background: 'var(--a-surface)', border: '1px solid var(--a-line)', color: 'var(--a-ink)', boxShadow: 'var(--a-card-shadow)' }}
                />
              </div>

              {/* List card */}
              <div className="flex-1 overflow-hidden mb-4" style={{ background: 'var(--a-surface)', borderRadius: 20, boxShadow: 'var(--a-card-shadow)' }}>
                <div className="h-full overflow-y-auto scrollbar-hide">
                  {filteredCountries.length > 0 ? (
                    filteredCountries.map((country, idx) => (
                      <motion.button
                        key={country.isoAlpha2}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(idx * 0.02, 0.3), duration: 0.25 }}
                        onClick={() => handleCountrySelect(country.isoAlpha2)}
                        className="w-full flex items-center px-4 py-3 transition-colors cursor-pointer"
                        style={{ borderBottom: '1px solid var(--a-line)' }}
                      >
                        <div className="w-6 h-4 me-3 overflow-hidden rounded-sm flex-shrink-0" style={{ border: '1px solid var(--a-line)' }}>
                          <img
                            src={country.flag.startsWith('data:') ? country.flag : `data:image/png;base64,${country.flag}`}
                            alt={country.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-start flex-1" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--a-ink)' }}>
                          {country.name}
                        </span>
                        <ChevronLeft className="rtl:rotate-180 w-4 h-4 rotate-180" style={{ color: 'var(--a-ink-faint)' }} />
                      </motion.button>
                    ))
                  ) : (
                    <div className="text-center py-12 px-4">
                      <Globe className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--a-ink-faint)' }} />
                      <p style={{ fontSize: 13, color: 'var(--a-ink-soft)' }}>{t.noneFound}</p>
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
