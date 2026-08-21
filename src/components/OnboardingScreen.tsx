import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, Calendar, Baby, Heart, Sparkles, Users, Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateField } from '@/components/ui/date-field';
import { useUserStore } from '@/store/userStore';
import { useShallow } from 'zustand/react/shallow';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useAutoJoinGroups } from '@/hooks/useCommunity';
import { useOnboardingStages, useMultiplesOptions, getFallbackStages, getFallbackMultiples } from '@/hooks/useDynamicOnboarding';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import type { LifeStage } from '@/types/anacan';
import { tr } from "@/lib/tr";
import { isRtlLang, rtlX } from '@/lib/rtl';

// Icon mapping for dynamic stages
const iconMap: Record<string, React.ComponentType<any>> = {
  Calendar,
  Heart,
  Baby
};

const OnboardingScreen = () => {
  const [step, setStep] = useState(0);
  const [selectedStage, setSelectedStage] = useState<LifeStage | null>(null);
  const [dateInput, setDateInput] = useState('');
  const [babyName, setBabyName] = useState('');
  const [babyGender, setBabyGender] = useState<'boy' | 'girl' | null>(null);
  const [multiplesType, setMultiplesType] = useState<'single' | 'twins' | 'triplets' | 'quadruplets'>('single');
  const [babyCount, setBabyCount] = useState(1);
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [isSaving, setIsSaving] = useState(false);

  const { setLifeStage, setLastPeriodDate, setBabyData, setOnboarded, setDueDate, setMultiplesData, setCycleLength: setStoreCycleLength, setPeriodLength: setStorePeriodLength, setFunnelCompleted } = useUserStore(
    useShallow((s) => ({
      setLifeStage: s.setLifeStage,
      setLastPeriodDate: s.setLastPeriodDate,
      setBabyData: s.setBabyData,
      setOnboarded: s.setOnboarded,
      setDueDate: s.setDueDate,
      setMultiplesData: s.setMultiplesData,
      setCycleLength: s.setCycleLength,
      setPeriodLength: s.setPeriodLength,
      setFunnelCompleted: s.setFunnelCompleted,
    }))
  );
  const { updateProfile } = useAuth();
  const { toast } = useToast();
  const { autoJoin } = useAutoJoinGroups();
  const { language } = useLanguage();
  const isRtl = isRtlLang(language);

  // Fetch dynamic data from backend
  const { data: dbStages, isLoading: stagesLoading } = useOnboardingStages();
  const { data: dbMultiples, isLoading: multiplesLoading } = useMultiplesOptions();
  const { data: appSettings = [] } = useAppSettings();

  // Check which stages are enabled
  const isStageEnabled = (stageId: string) => {
    const setting = appSettings.find((s) => s.key === `${stageId}_mode_enabled`);
    if (!setting) return true; // Default enabled
    const val = setting.value;
    if (val === 'true' || val === true) return true;
    if (val === 'false' || val === false) return false;
    return true;
  };

  // Use database data or fallback, then filter by enabled settings
  const stages = useMemo(() => {
    const getStageText = (s: any, field: string) => {
      // İstənilən dil üçün generik: <field>_<lang> → (kk üçün əlavə ru körpüsü) → fallback
      if (language !== 'az' && s[field + '_' + language]) return s[field + '_' + language];
      if (language === 'kk' && s[field + '_ru']) return s[field + '_ru'];
      if (language !== 'az' && language !== 'ru' && s[field + '_en']) return s[field + '_en'];

      const fallback = getFallbackStages().find(fb => fb.stage_id === s.stage_id);
      if (fallback) {
        return fallback[`${field}_az` as keyof typeof fallback] || s[field + '_az'] || s[field];
      }

      return s[field + '_az'] || s[field];
    };

    const allStages = !dbStages || dbStages.length === 0 ?
    getFallbackStages().map((s) => ({
      id: s.stage_id as LifeStage,
      title: s.title_az,
      subtitle: s.subtitle_az,
      description: s.description_az,
      icon: iconMap[s.icon_name] || Heart,
      emoji: s.emoji,
      color: s.stage_id,
      bgGradient: s.bg_gradient
    })) :
    dbStages.map((s) => ({
      id: s.stage_id as LifeStage,
      title: getStageText(s, 'title'),
      subtitle: getStageText(s, 'subtitle'),
      description: getStageText(s, 'description'),
      icon: iconMap[s.icon_name] || Heart,
      emoji: s.emoji,
      color: s.stage_id,
      bgGradient: s.bg_gradient
    }));

    // Filter by enabled settings
    return allStages.filter((stage) => isStageEnabled(stage.id));
  }, [dbStages, appSettings, language]);

  const multiplesOptions = useMemo(() => {
    const getOptionLabel = (m: any) => {
      if (language !== 'az' && m['label_' + language]) return m['label_' + language];
      if (language === 'kk' && m.label_ru) return m.label_ru;
      if (language !== 'az' && language !== 'ru' && m.label_en) return m.label_en;

      const fallback = getFallbackMultiples().find(fb => fb.option_id === m.option_id);
      if (fallback) {
        return fallback.label_az || m.label_az || m.label;
      }

      return m.label_az || m.label;
    };

    if (!dbMultiples || dbMultiples.length === 0) {
      return getFallbackMultiples().map((m) => ({
        id: m.option_id,
        label: m.label_az,
        emoji: m.emoji,
        babyCount: m.baby_count
      }));
    }
    return dbMultiples.map((m) => ({
      id: m.option_id,
      label: getOptionLabel(m),
      emoji: m.emoji,
      babyCount: m.baby_count
    }));
  }, [dbMultiples, language]);

  const handleStageSelect = (stage: LifeStage) => {
    setSelectedStage(stage);
  };

  const handleMultiplesSelect = (type: 'single' | 'twins' | 'triplets' | 'quadruplets', count: number) => {
    setMultiplesType(type);
    setBabyCount(count);
  };

  const handleNext = async () => {
    if (step === 0 && selectedStage) {
      setStep(1);
    } else if (step === 1) {
      setIsSaving(true);

      try {
        if (selectedStage === 'mommy') {
          if (dateInput && babyName && babyGender) {
            // Save to Supabase profiles
            const { error } = await updateProfile({
              life_stage: selectedStage,
              baby_birth_date: dateInput,
              baby_name: babyName,
              baby_gender: babyGender,
              baby_count: babyCount,
              multiples_type: multiplesType
            });

            if (error) {
              toast({
                title: tr("onboardingscreen_xeta_bas_verdi_f22fba", 'Xəta baş verdi'),
                description: tr("onboardingscreen_melumatlar_saxlanila_bilmedi_a65916", 'Məlumatlar saxlanıla bilmədi') + ((error as any)?.message ? ` (${String((error as any).message).slice(0, 140)})` : ''),
                variant: 'destructive'
              });
              setIsSaving(false);
              return;
            }

            // Also add child to user_children table (idempotent — retry dublikat yaratmır)
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await supabase.from('user_children').upsert({
                user_id: user.id,
                name: babyName,
                birth_date: dateInput,
                gender: babyGender,
                avatar_emoji: babyGender === 'boy' ? '👦' : '👧',
                sort_order: 0
              }, { onConflict: 'user_id,name,birth_date', ignoreDuplicates: true });
            }

            // Update local store
            setBabyData(new Date(dateInput), babyName, babyGender, babyCount, multiplesType);
            setMultiplesData(babyCount, multiplesType);
            setLifeStage(selectedStage);
            setFunnelCompleted(false);
            setOnboarded(true);

            // Auto-join relevant community groups
            await autoJoin({
              life_stage: selectedStage,
              baby_birth_date: dateInput,
              baby_gender: babyGender,
              multiples_type: multiplesType
            });
          }
        } else if (selectedStage === 'bump') {
          if (dateInput) {
            // Calculate due date (280 days from LMP)
            const lastPeriod = new Date(dateInput);
            const dueDate = new Date(lastPeriod.getTime() + 280 * 24 * 60 * 60 * 1000);

            // Save to Supabase
            const { error } = await updateProfile({
              life_stage: selectedStage,
              last_period_date: dateInput,
              due_date: dueDate.toISOString().split('T')[0],
              baby_count: babyCount,
              multiples_type: multiplesType
            });

            if (error) {
              toast({
                title: tr("onboardingscreen_xeta_bas_verdi_f22fba", 'Xəta baş verdi'),
                description: tr("onboardingscreen_melumatlar_saxlanila_bilmedi_a65916", 'Məlumatlar saxlanıla bilmədi') + ((error as any)?.message ? ` (${String((error as any).message).slice(0, 140)})` : ''),
                variant: 'destructive'
              });
              setIsSaving(false);
              return;
            }

            // Update local store
            setLastPeriodDate(new Date(dateInput));
            setDueDate(dueDate);
            setMultiplesData(babyCount, multiplesType);
            setLifeStage(selectedStage);
            setFunnelCompleted(false);
            setOnboarded(true);

            // Auto-join relevant community groups
            await autoJoin({
              life_stage: selectedStage,
              due_date: dueDate.toISOString().split('T')[0],
              multiples_type: multiplesType
            });
          }
        } else {
          // Flow stage
          if (dateInput) {
            // Save to Supabase with cycle data
            const { error } = await updateProfile({
              life_stage: selectedStage,
              last_period_date: dateInput,
              cycle_length: cycleLength,
              period_length: periodLength
            });

            if (error) {
              toast({
                title: tr("onboardingscreen_xeta_bas_verdi_f22fba", 'Xəta baş verdi'),
                description: tr("onboardingscreen_melumatlar_saxlanila_bilmedi_a65916", 'Məlumatlar saxlanıla bilmədi') + ((error as any)?.message ? ` (${String((error as any).message).slice(0, 140)})` : ''),
                variant: 'destructive'
              });
              setIsSaving(false);
              return;
            }

            // Update local store with cycle data
            setLastPeriodDate(new Date(dateInput));
            setStoreCycleLength(cycleLength);
            setStorePeriodLength(periodLength);
            setLifeStage(selectedStage!);
            setFunnelCompleted(false);
            setOnboarded(true);

            // Auto-join general groups
            await autoJoin({ life_stage: selectedStage });
          }
        }

        toast({
          title: tr("onboardingscreen_ugurla_saxlanildi_27f111", 'Uğurla saxlanıldı! 🎉'),
          description: tr("onboardingscreen_profiliniz_hazirdir_7fc314", 'Profiliniz hazırdır')
        });
      } catch (err) {
        console.error('Onboarding error:', err);
        toast({
          title: tr("onboardingscreen_xeta_bas_verdi_f22fba", 'Xəta baş verdi'),
          description: tr("onboardingscreen_bir_xeta_bas_verdi_3a783a", 'Bir xəta baş verdi'),
          variant: 'destructive'
        });
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, x: rtlX(100, isRtl) },
    animate: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
    exit: { opacity: 0, x: rtlX(-100, isRtl) }
  };

  const staggerChildren = {
    animate: { transition: { staggerChildren: 0.1 } }
  };

  const childVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
  };

  const stepperBtnStyle: React.CSSProperties = {
    width: 48, height: 48, borderRadius: 14,
    background: 'var(--a-surface)', border: '1px solid var(--a-btn-border)',
    boxShadow: '0 6px 14px -8px rgba(217, 108, 74, 0.35)',
    color: 'var(--a-ink)', fontSize: 20, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  };

  return (
    <div className="a-scope min-h-screen flex flex-col safe-top safe-bottom overflow-hidden" style={{ background: 'var(--a-bg)' }}>
      {/* Watercolor sky */}
      <div className="a-sky" aria-hidden>
        <span className="a-cloud c1" />
        <span className="a-cloud c2" />
        <span className="a-cloud c3" />
        <span className="a-cloud c4" />
      </div>

      {/* Header */}
      <div className="relative px-5 py-5 flex items-center justify-between z-10">
        {step > 0 ?
        <motion.button
          onClick={handleBack}
          className="a-icon-btn"
          style={{ width: 44, height: 44 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label={tr("common_geri", "Geri")}>

            <ArrowLeft className="rtl:rotate-180" size={18} strokeWidth={2} />
          </motion.button> :

        <div className="w-11" />
        }

        {/* Progress indicators */}
        <div className="flex gap-2">
          {[0, 1].map((i) =>
          <motion.div
            key={i}
            className="h-2 rounded-full transition-all duration-500"
            style={{
              width: i <= step ? 32 : 8,
              background: i <= step ? 'var(--a-peach-2)' : 'var(--a-chip-overlay)'
            }}
            layout />

          )}
        </div>

        <div className="w-11" />
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-4 relative overflow-y-auto z-10">
        <AnimatePresence mode="wait">
          {step === 0 &&
          <motion.div
            key="step-0"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="h-full flex flex-col max-w-md mx-auto w-full">

              {/* Header Content */}
              <motion.div
              className="text-center mb-8"
              variants={staggerChildren}
              initial="initial"
              animate="animate">

                <motion.div variants={childVariants} className="flex justify-center mb-4">
                  <div className="w-16 h-16 flex items-center justify-center"
                style={{ borderRadius: 20, background: 'var(--a-grad-peach)', boxShadow: '0 14px 28px -12px rgba(217, 108, 74, 0.5)' }}>
                    <Sparkles size={30} style={{ color: 'var(--a-accent-ink)' }} />
                  </div>
                </motion.div>
                <motion.h1 variants={childVariants} style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--a-ink)' }}>
                  {tr("onboardingscreen_xos_geldiniz_078b52", "Xo\u015F g\u0259ldiniz!")}
                </motion.h1>
                <motion.p variants={childVariants} style={{ fontSize: 16, color: 'var(--a-on-bg-soft)', marginTop: 6 }}>
                  {tr("onboardingscreen_hansi_merheledesiniz_4bc6be", "Hans\u0131 m\u0259rh\u0259l\u0259d\u0259siniz?")}
                </motion.p>
              </motion.div>

              {/* Stage Selection */}
              <motion.div
              className="space-y-3.5 flex-1"
              variants={staggerChildren}
              initial="initial"
              animate="animate">

                {stages.map((stage, index) => {
                const Icon = stage.icon;
                const isSelected = selectedStage === stage.id;

                return (
                  <motion.button
                    key={stage.id}
                    variants={childVariants}
                    onClick={() => handleStageSelect(stage.id)}
                    className={`w-full text-start transition-all duration-300 relative overflow-hidden ${
                    isSelected ?
                    `bg-gradient-to-r ${stage.bgGradient} text-white` :
                    ''}`
                    }
                    style={{
                      padding: 18,
                      borderRadius: 24,
                      background: isSelected ? undefined : 'var(--a-surface)',
                      border: isSelected ? '2px solid transparent' : '2px solid transparent',
                      boxShadow: isSelected ? '0 20px 40px -16px rgba(0,0,0,0.25)' : 'var(--a-card-shadow)'
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}>

                      {isSelected &&
                    <motion.div
                      className="absolute inset-0 bg-white/10"
                      initial={{ x: rtlX('-100%', isRtl) }}
                      animate={{ x: rtlX('100%', isRtl) }}
                      transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }} />

                    }

                      <div className="flex items-center gap-4 relative z-10">
                        <div className="w-14 h-14 flex items-center justify-center text-3xl shrink-0"
                      style={{ borderRadius: 18, background: isSelected ? 'rgba(255,255,255,0.22)' : 'var(--a-surface-soft)' }}>
                          {stage.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 style={{ fontSize: 16.5, fontWeight: 800, letterSpacing: '-0.01em', color: isSelected ? '#ffffff' : 'var(--a-ink)' }}>
                            {stage.title}
                          </h3>
                          <p style={{ fontSize: 12.5, marginTop: 2, color: isSelected ? 'rgba(255,255,255,0.85)' : 'var(--a-ink-soft)' }}>
                            {stage.description}
                          </p>
                        </div>
                        {isSelected &&
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="w-9 h-9 flex items-center justify-center shrink-0"
                        style={{ borderRadius: 12, background: 'rgba(255,255,255,0.28)' }}>

                            <Check className="w-5 h-5 text-white" strokeWidth={3} />
                          </motion.div>
                      }
                      </div>
                    </motion.button>);

              })}
              </motion.div>
            </motion.div>
          }

          {step === 1 && selectedStage &&
          <motion.div
            key="step-1"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="h-full flex flex-col max-w-md mx-auto w-full">

              <motion.div
              className="text-center mb-6"
              variants={staggerChildren}
              initial="initial"
              animate="animate">

                <motion.div variants={childVariants} className="flex justify-center mb-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${
                stages.find((s) => s.id === selectedStage)?.bgGradient} flex items-center justify-center text-3xl`
                }
                style={{ boxShadow: '0 14px 28px -12px rgba(0,0,0,0.3)' }}>
                    {stages.find((s) => s.id === selectedStage)?.emoji}
                  </div>
                </motion.div>
                <motion.h1 variants={childVariants} style={{ fontSize: 23, fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--a-ink)' }}>
                  {selectedStage === 'mommy' ? tr("onboardingscreen_korpeniz_haqqinda_dc65a9", "K\xF6rp\u0259niz haqq\u0131nda") : selectedStage === 'bump' ? tr("onboardingscreen_hamilelik_melumatlari_12e64d", "Hamil\u0259lik m\u0259lumatlar\u0131") : tr("onboardingscreen_son_dovr_tarixi_4dc91e", "Son d\xF6vr tarixi")}
                </motion.h1>
                <motion.p variants={childVariants} style={{ fontSize: 13.5, color: 'var(--a-on-bg-soft)', marginTop: 6 }}>
                  {selectedStage === 'mommy' ? tr("onboardingscreen_korpenizin_melumatlarini_daxil_6e20d3", "K\xF6rp\u0259nizin m\u0259lumatlar\u0131n\u0131 daxil edin") :

                selectedStage === 'bump' ? tr("onboardingscreen_hamilelik_melumatlarinizi_daxi_c132dd", "Hamil\u0259lik m\u0259lumatlar\u0131n\u0131z\u0131 daxil edin") : tr("onboardingscreen_son_dovrunuz_ne_vaxt_basladi_9bc1c3", "Son d\xF6vr\xFCn\xFCz n\u0259 vaxt ba\u015Flad\u0131?")


                }
                </motion.p>
              </motion.div>

              <motion.div
              className="space-y-3 flex-1"
              variants={staggerChildren}
              initial="initial"
              animate="animate">

                {/* Multiples selection for bump and mommy stages */}
                {(selectedStage === 'bump' || selectedStage === 'mommy') &&
              <motion.div variants={childVariants}>
                    <label className="mb-2 flex items-center gap-1.5" style={{ fontSize: 12, fontWeight: 700, color: 'var(--a-ink)' }}>
                      <Users className="w-3.5 h-3.5" />
                      {tr("onboardingscreen_usaq_sayi_04c015", "Uşaq sayı")}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {multiplesOptions.map((option) =>
                  <motion.button
                    key={option.id}
                    onClick={() => handleMultiplesSelect(option.id as any, option.babyCount)}
                    className="flex flex-col items-center gap-1 transition-all"
                    style={{
                      padding: '10px 8px',
                      borderRadius: 14,
                      fontWeight: 700,
                      background: multiplesType === option.id ? 'var(--a-peach-1)' : 'var(--a-surface)',
                      color: multiplesType === option.id ? 'var(--a-accent-ink)' : 'var(--a-ink-soft)',
                      border: multiplesType === option.id ? '1.5px solid var(--a-peach-2)' : '1.5px solid transparent',
                      boxShadow: multiplesType === option.id ? 'none' : 'var(--a-card-shadow)'
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}>

                          <span className="text-xl">{option.emoji}</span>
                          <span style={{ fontSize: 11.5 }}>{option.label}</span>
                        </motion.button>
                  )}
                    </div>
                  </motion.div>
              }

                {selectedStage === 'mommy' &&
              <>
                    <motion.div variants={childVariants}>
                      <label className="mb-2 block" style={{ fontSize: 12, fontWeight: 700, color: 'var(--a-ink)' }}>
                        {babyCount > 1 ? tr("onboardingscreen_korpelerinizin_adlari_vergulle_96665e", "Körpələrinizin adları (vergüllə ayırın)") : tr("onboardingscreen_korpenizin_adi_10b2c3", "Körpənizin adı")}
                      </label>
                      <Input
                    type="text"
                    placeholder={babyCount > 1 ? tr("onboardingscreen_eli_veli_e76548", "Əli, Vəli") : tr("common_ad_placeholder", "Ad")}
                    value={babyName}
                    onChange={(e) => setBabyName(e.target.value)}
                    className="h-11 rounded-xl border border-transparent text-sm px-4 bg-[var(--a-surface)] text-[var(--a-ink)] focus:border-[var(--a-peach-2)] focus-visible:ring-0"
                    style={{ boxShadow: 'var(--a-card-shadow)' }} />

                    </motion.div>

                    <motion.div variants={childVariants}>
                      <label className="mb-2 block" style={{ fontSize: 12, fontWeight: 700, color: 'var(--a-ink)' }}>{tr("untranslated_cinsi_az7fty", "Cinsi")}</label>
                      <div className="flex gap-2">
                        {[
                    { id: 'boy', label: tr("onboardingscreen_oglan_e9715e", 'Oğlan'), emoji: '👦', bg: 'var(--a-blue-2)' },
                    { id: 'girl', label: tr("onboardingscreen_qiz_79bf6b", 'Qız'), emoji: '👧', bg: 'var(--a-pink-2)' }].
                    map((g) =>
                    <motion.button
                      key={g.id}
                      onClick={() => setBabyGender(g.id as 'boy' | 'girl')}
                      className="flex-1 flex items-center justify-center gap-2 transition-all"
                      style={{
                        padding: 13,
                        borderRadius: 14,
                        fontWeight: 700,
                        background: babyGender === g.id ? g.bg : 'var(--a-surface)',
                        color: babyGender === g.id ? '#ffffff' : 'var(--a-ink-soft)',
                        boxShadow: babyGender === g.id ? '0 10px 20px -10px rgba(0,0,0,0.3)' : 'var(--a-card-shadow)'
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}>

                            <span className="text-xl">{g.emoji}</span>
                            <span style={{ fontSize: 13 }}>{g.label}</span>
                          </motion.button>
                    )}
                      </div>
                    </motion.div>
                  </>
              }

                {/* Cycle Length for Flow stage */}
                {selectedStage === 'flow' &&
              <>
                    <motion.div variants={childVariants}>
                      <label className="mb-3 flex items-center gap-2" style={{ fontSize: 13, fontWeight: 700, color: 'var(--a-ink)' }}>
                        <Calendar className="w-4 h-4" />
                        {tr("onboardingscreen_tsikl_uzunlugu_gun_642d20", "Tsikl uzunlu\u011Fu (g\xFCn)")}
                      </label>
                      <div className="flex items-center gap-3">
                        <motion.button
                      type="button"
                      onClick={() => setCycleLength(Math.max(10, cycleLength - 1))}
                      style={stepperBtnStyle}
                      whileTap={{ scale: 0.95 }}>

                          -
                        </motion.button>
                        <div className="flex-1 h-14 flex items-center justify-center" style={{ borderRadius: 18, background: 'var(--a-surface)', boxShadow: 'var(--a-card-shadow)' }}>
                          <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--a-ink)' }}>{cycleLength}</span>
                          <span className="ms-2" style={{ color: 'var(--a-ink-soft)' }}>{tr("onboardingscreen_gun_54e78d", "gün")}</span>
                        </div>
                        <motion.button
                      type="button"
                      onClick={() => setCycleLength(Math.min(50, cycleLength + 1))}
                      style={stepperBtnStyle}
                      whileTap={{ scale: 0.95 }}>

                          +
                        </motion.button>
                      </div>
                      <p className="mt-2 text-center" style={{ fontSize: 11.5, color: 'var(--a-on-bg-soft)' }}>
                        {tr("onboardingscreen_araliq_10_50_gun_normal_21_35__e2832f", "Aral\u0131q: 10-50 g\xFCn (normal: 21-35 g\xFCn)")}
                      </p>
                    </motion.div>

                    <motion.div variants={childVariants}>
                      <label className="mb-3 flex items-center gap-2" style={{ fontSize: 13, fontWeight: 700, color: 'var(--a-ink)' }}>
                        <Droplets className="w-4 h-4" />
                        {tr("onboardingscreen_period_uzunlugu_gun_a77b92", "Period uzunlu\u011Fu (g\xFCn)")}
                      </label>
                      <div className="flex items-center gap-3">
                        <motion.button
                      type="button"
                      onClick={() => setPeriodLength(Math.max(2, periodLength - 1))}
                      style={stepperBtnStyle}
                      whileTap={{ scale: 0.95 }}>

                          -
                        </motion.button>
                        <div className="flex-1 h-14 flex items-center justify-center" style={{ borderRadius: 18, background: 'var(--a-surface)', boxShadow: 'var(--a-card-shadow)' }}>
                          <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--a-ink)' }}>{periodLength}</span>
                          <span className="ms-2" style={{ color: 'var(--a-ink-soft)' }}>{tr("onboardingscreen_gun_54e78d", "gün")}</span>
                        </div>
                        <motion.button
                      type="button"
                      onClick={() => setPeriodLength(Math.min(10, periodLength + 1))}
                      style={stepperBtnStyle}
                      whileTap={{ scale: 0.95 }}>

                          +
                        </motion.button>
                      </div>
                      <p className="mt-2 text-center" style={{ fontSize: 11.5, color: 'var(--a-on-bg-soft)' }}>
                        {tr("onboardingscreen_normal_araliq_3_7_gun_167ed7", "Normal aral\u0131q: 3-7 g\xFCn")}
                      </p>
                    </motion.div>
                  </>
              }

                <motion.div variants={childVariants}>
                  <label className="mb-3 block" style={{ fontSize: 13, fontWeight: 700, color: 'var(--a-ink)' }}>
                    {selectedStage === 'mommy' ? tr("onboardingscreen_dogum_tarixi_d96907", "Do\u011Fum tarixi") : selectedStage === 'bump' ? tr("onboardingscreen_son_menstruasiya_tarixi_9f3b8a", "Son menstruasiya tarixi") : tr("onboardingscreen_son_dovr_tarixi_4dc91e", "Son d\xF6vr tarixi")}
                  </label>
                  <DateField
                  value={dateInput}
                  onChange={setDateInput}
                  className="h-14 rounded-2xl border-2 border-transparent text-lg px-5 bg-[var(--a-surface)] text-[var(--a-ink)] focus:border-[var(--a-peach-2)] focus-visible:ring-0"
                  style={{ boxShadow: 'var(--a-card-shadow)' }}
                  placeholderInset={20}
                  max={new Date().toISOString().split('T')[0]} />

                </motion.div>
              </motion.div>
            </motion.div>
          }
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-5 pb-8 pt-4 relative z-10 max-w-md mx-auto w-full">
        <Button
          onClick={handleNext}
          disabled={
          isSaving ||
          step === 0 && !selectedStage ||
          step === 1 && !dateInput ||
          step === 1 && selectedStage === 'mommy' && (!babyName || !babyGender)
          }
          className="w-full h-14 rounded-full text-white font-bold text-lg border-0 transition-all duration-300 disabled:opacity-50 disabled:shadow-none hover:opacity-95"
          style={{ background: 'var(--a-peach-2)', boxShadow: '0 18px 36px -12px rgba(217, 108, 74, 0.6)' }}>

          <span className="flex items-center gap-2">
            {isSaving ?
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> :

            <>
                {step === 1 ? tr("onboardingscreen_basla_4820bc", "Ba\u015Fla") : tr("onboardingscreen_davam_et_7bc3d8", "Davam et")}
                <motion.div
                animate={{ x: [0, rtlX(5, isRtl), 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}>

                  <ArrowRight className="rtl:rotate-180 w-6 h-6" />
                </motion.div>
              </>
            }
          </span>
        </Button>
      </div>
    </div>);

};

export default OnboardingScreen;
