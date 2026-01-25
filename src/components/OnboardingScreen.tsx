import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, Calendar, Baby, Heart, Sparkles, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUserStore } from '@/store/userStore';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useAutoJoinGroups } from '@/hooks/useCommunity';
import { useOnboardingStages, useMultiplesOptions, FALLBACK_STAGES, FALLBACK_MULTIPLES } from '@/hooks/useDynamicOnboarding';
import type { LifeStage } from '@/types/anacan';

// Icon mapping for dynamic stages
const iconMap: Record<string, React.ComponentType<any>> = {
  Calendar,
  Heart,
  Baby,
};

const OnboardingScreen = () => {
  const [step, setStep] = useState(0);
  const [selectedStage, setSelectedStage] = useState<LifeStage | null>(null);
  const [dateInput, setDateInput] = useState('');
  const [babyName, setBabyName] = useState('');
  const [babyGender, setBabyGender] = useState<'boy' | 'girl' | null>(null);
  const [multiplesType, setMultiplesType] = useState<'single' | 'twins' | 'triplets' | 'quadruplets'>('single');
  const [babyCount, setBabyCount] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  
  const { setLifeStage, setLastPeriodDate, setBabyData, setOnboarded, setDueDate, setMultiplesData } = useUserStore();
  const { updateProfile } = useAuth();
  const { toast } = useToast();
  const { autoJoin } = useAutoJoinGroups();
  
  // Fetch dynamic data from backend
  const { data: dbStages, isLoading: stagesLoading } = useOnboardingStages();
  const { data: dbMultiples, isLoading: multiplesLoading } = useMultiplesOptions();

  // Use database data or fallback
  const stages = useMemo(() => {
    if (!dbStages || dbStages.length === 0) {
      return FALLBACK_STAGES.map(s => ({
        id: s.stage_id as LifeStage,
        title: s.title_az,
        subtitle: s.subtitle_az,
        description: s.description_az,
        icon: iconMap[s.icon_name] || Heart,
        emoji: s.emoji,
        color: s.stage_id,
        bgGradient: s.bg_gradient,
      }));
    }
    return dbStages.map(s => ({
      id: s.stage_id as LifeStage,
      title: s.title_az || s.title,
      subtitle: s.subtitle_az || s.subtitle,
      description: s.description_az || s.description,
      icon: iconMap[s.icon_name] || Heart,
      emoji: s.emoji,
      color: s.stage_id,
      bgGradient: s.bg_gradient,
    }));
  }, [dbStages]);

  const multiplesOptions = useMemo(() => {
    if (!dbMultiples || dbMultiples.length === 0) {
      return FALLBACK_MULTIPLES.map(m => ({
        id: m.option_id,
        label: m.label_az,
        emoji: m.emoji,
        count: m.baby_count,
      }));
    }
    return dbMultiples.map(m => ({
      id: m.option_id,
      label: m.label_az || m.label,
      emoji: m.emoji,
      count: m.baby_count,
    }));
  }, [dbMultiples]);

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
            // Save to Supabase
            const { error } = await updateProfile({
              life_stage: selectedStage,
              baby_birth_date: dateInput,
              baby_name: babyName,
              baby_gender: babyGender,
              baby_count: babyCount,
              multiples_type: multiplesType,
            });

            if (error) {
              toast({
                title: 'Xəta baş verdi',
                description: 'Məlumatlar saxlanıla bilmədi',
                variant: 'destructive',
              });
              setIsSaving(false);
              return;
            }

            // Update local store
            setBabyData(new Date(dateInput), babyName, babyGender, babyCount, multiplesType);
            setMultiplesData(babyCount, multiplesType);
            setLifeStage(selectedStage);
            setOnboarded(true);

            // Auto-join relevant community groups
            await autoJoin({
              life_stage: selectedStage,
              baby_birth_date: dateInput,
              baby_gender: babyGender,
              multiples_type: multiplesType,
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
              multiples_type: multiplesType,
            });

            if (error) {
              toast({
                title: 'Xəta baş verdi',
                description: 'Məlumatlar saxlanıla bilmədi',
                variant: 'destructive',
              });
              setIsSaving(false);
              return;
            }

            // Update local store
            setLastPeriodDate(new Date(dateInput));
            setDueDate(dueDate);
            setMultiplesData(babyCount, multiplesType);
            setLifeStage(selectedStage);
            setOnboarded(true);

            // Auto-join relevant community groups
            await autoJoin({
              life_stage: selectedStage,
              due_date: dueDate.toISOString().split('T')[0],
              multiples_type: multiplesType,
            });
          }
        } else {
          // Flow stage
          if (dateInput) {
            // Save to Supabase
            const { error } = await updateProfile({
              life_stage: selectedStage,
              last_period_date: dateInput,
            });

            if (error) {
              toast({
                title: 'Xəta baş verdi',
                description: 'Məlumatlar saxlanıla bilmədi',
                variant: 'destructive',
              });
              setIsSaving(false);
              return;
            }

            // Update local store
            setLastPeriodDate(new Date(dateInput));
            setLifeStage(selectedStage!);
            setOnboarded(true);

            // Auto-join general groups
            await autoJoin({ life_stage: selectedStage });
          }
        }

        toast({
          title: 'Uğurla saxlanıldı! 🎉',
          description: 'Profiliniz hazırdır',
        });
      } catch (err) {
        console.error('Onboarding error:', err);
        toast({
          title: 'Xəta baş verdi',
          description: 'Bir xəta baş verdi',
          variant: 'destructive',
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
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
    exit: { opacity: 0, x: -100 }
  };

  const staggerChildren = {
    animate: { transition: { staggerChildren: 0.1 } }
  };

  const childVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background safe-top safe-bottom overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 -left-20 w-48 h-48 rounded-full bg-accent/5 blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative px-5 py-5 flex items-center justify-between">
        {step > 0 ? (
          <motion.button 
            onClick={handleBack} 
            className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
        ) : (
          <div className="w-12" />
        )}
        
        {/* Progress indicators */}
        <div className="flex gap-2">
          {[0, 1].map((i) => (
            <motion.div
              key={i}
              className={`h-2 rounded-full transition-all duration-500 ${
                i <= step ? 'bg-primary w-8' : 'bg-muted w-2'
              }`}
              layout
            />
          ))}
        </div>
        
        <div className="w-12" />
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-4 relative overflow-y-auto">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step-0"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="h-full flex flex-col"
            >
              {/* Header Content */}
              <motion.div 
                className="text-center mb-8"
                variants={staggerChildren}
                initial="initial"
                animate="animate"
              >
                <motion.div variants={childVariants} className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-button">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                </motion.div>
                <motion.h1 variants={childVariants} className="text-3xl font-black text-foreground">
                  Xoş gəldiniz! 
                </motion.h1>
                <motion.p variants={childVariants} className="text-muted-foreground mt-2 text-lg">
                  Hansı mərhələdəsiniz?
                </motion.p>
              </motion.div>

              {/* Stage Selection */}
              <motion.div 
                className="space-y-4 flex-1"
                variants={staggerChildren}
                initial="initial"
                animate="animate"
              >
                {stages.map((stage, index) => {
                  const Icon = stage.icon;
                  const isSelected = selectedStage === stage.id;
                  
                  return (
                    <motion.button
                      key={stage.id}
                      variants={childVariants}
                      onClick={() => handleStageSelect(stage.id)}
                      className={`w-full p-5 rounded-3xl text-left transition-all duration-300 relative overflow-hidden ${
                        isSelected
                          ? `bg-gradient-to-r ${stage.bgGradient} text-white shadow-elevated`
                          : 'bg-card border-2 border-border hover:border-primary/20 hover:shadow-card'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isSelected && (
                        <motion.div
                          className="absolute inset-0 bg-white/10"
                          initial={{ x: '-100%' }}
                          animate={{ x: '100%' }}
                          transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
                        />
                      )}
                      
                      <div className="flex items-center gap-4 relative z-10">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${
                          isSelected ? 'bg-white/20' : 'bg-muted'
                        }`}>
                          {stage.emoji}
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-bold text-lg ${isSelected ? 'text-white' : 'text-foreground'}`}>
                            {stage.title}
                          </h3>
                          <p className={`text-sm mt-0.5 ${isSelected ? 'text-white/80' : 'text-muted-foreground'}`}>
                            {stage.description}
                          </p>
                        </div>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="w-10 h-10 rounded-xl bg-white/25 flex items-center justify-center"
                          >
                            <Check className="w-6 h-6 text-white" strokeWidth={3} />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            </motion.div>
          )}

          {step === 1 && selectedStage && (
            <motion.div
              key="step-1"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="h-full flex flex-col"
            >
              <motion.div 
                className="text-center mb-6"
                variants={staggerChildren}
                initial="initial"
                animate="animate"
              >
                <motion.div variants={childVariants} className="flex justify-center mb-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${
                    stages.find(s => s.id === selectedStage)?.bgGradient
                  } flex items-center justify-center text-3xl shadow-button`}>
                    {stages.find(s => s.id === selectedStage)?.emoji}
                  </div>
                </motion.div>
                <motion.h1 variants={childVariants} className="text-2xl font-black text-foreground">
                  {selectedStage === 'mommy' ? 'Körpəniz haqqında' : selectedStage === 'bump' ? 'Hamiləlik məlumatları' : 'Son dövr tarixi'}
                </motion.h1>
                <motion.p variants={childVariants} className="text-muted-foreground mt-2">
                  {selectedStage === 'mommy' 
                    ? 'Körpənizin məlumatlarını daxil edin'
                    : selectedStage === 'bump'
                    ? 'Hamiləlik məlumatlarınızı daxil edin'
                    : 'Son dövrünüz nə vaxt başladı?'
                  }
                </motion.p>
              </motion.div>

              <motion.div 
                className="space-y-5 flex-1"
                variants={staggerChildren}
                initial="initial"
                animate="animate"
              >
                {/* Multiples selection for bump and mommy stages */}
                {(selectedStage === 'bump' || selectedStage === 'mommy') && (
                  <motion.div variants={childVariants}>
                    <label className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Uşaq sayı
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {multiplesOptions.map((option) => (
                        <motion.button
                          key={option.id}
                          onClick={() => handleMultiplesSelect(option.id as any, option.count)}
                          className={`p-4 rounded-2xl font-bold transition-all flex flex-col items-center gap-2 ${
                            multiplesType === option.id
                              ? 'bg-primary text-primary-foreground shadow-elevated'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span className="text-2xl">{option.emoji}</span>
                          <span className="text-sm">{option.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {selectedStage === 'mommy' && (
                  <>
                    <motion.div variants={childVariants}>
                      <label className="text-sm font-bold text-foreground mb-3 block">
                        {babyCount > 1 ? 'Körpələrinizin adları (vergüllə ayırın)' : 'Körpənizin adı'}
                      </label>
                      <Input
                        type="text"
                        placeholder={babyCount > 1 ? 'Əli, Vəli' : 'Ad'}
                        value={babyName}
                        onChange={(e) => setBabyName(e.target.value)}
                        className="h-14 rounded-2xl bg-muted/50 border-2 border-transparent focus:border-primary/30 text-lg px-5"
                      />
                    </motion.div>

                    <motion.div variants={childVariants}>
                      <label className="text-sm font-bold text-foreground mb-3 block">
                        Cinsi
                      </label>
                      <div className="flex gap-4">
                        {[
                          { id: 'boy', label: 'Oğlan', emoji: '👦', gradient: 'from-blue-500 to-indigo-600' },
                          { id: 'girl', label: 'Qız', emoji: '👧', gradient: 'from-pink-500 to-rose-600' },
                        ].map((g) => (
                          <motion.button
                            key={g.id}
                            onClick={() => setBabyGender(g.id as 'boy' | 'girl')}
                            className={`flex-1 p-4 rounded-2xl font-bold transition-all flex flex-col items-center gap-2 ${
                              babyGender === g.id
                                ? `bg-gradient-to-r ${g.gradient} text-white shadow-elevated`
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <span className="text-3xl">{g.emoji}</span>
                            <span>{g.label}</span>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}

                <motion.div variants={childVariants}>
                  <label className="text-sm font-bold text-foreground mb-3 block">
                    {selectedStage === 'mommy' ? 'Doğum tarixi' : selectedStage === 'bump' ? 'Son menstruasiya tarixi' : 'Son dövr tarixi'}
                  </label>
                  <Input
                    type="date"
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                    className="h-14 rounded-2xl bg-muted/50 border-2 border-transparent focus:border-primary/30 text-lg px-5"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-5 pb-8 pt-4">
        <Button
          onClick={handleNext}
          disabled={
            isSaving ||
            (step === 0 && !selectedStage) ||
            (step === 1 && !dateInput) ||
            (step === 1 && selectedStage === 'mommy' && (!babyName || !babyGender))
          }
          className="w-full h-16 rounded-2xl gradient-primary text-white font-bold text-lg shadow-button hover:shadow-glow transition-all duration-300 disabled:opacity-50 disabled:shadow-none"
        >
          <span className="flex items-center gap-2">
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {step === 1 ? 'Başla' : 'Davam et'}
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="w-6 h-6" />
                </motion.div>
              </>
            )}
          </span>
        </Button>
      </div>
    </div>
  );
};

export default OnboardingScreen;
