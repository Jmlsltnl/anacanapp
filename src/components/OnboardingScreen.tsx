import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, Calendar, Baby, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUserStore } from '@/store/userStore';
import type { LifeStage } from '@/types/anacan';

const stages = [
  {
    id: 'flow' as LifeStage,
    title: 'Dövrümü izləmək',
    subtitle: 'Menstruasiya təqvimi',
    description: 'Dövrünüzü izləyin, ovulyasiyanı proqnozlaşdırın',
    icon: Calendar,
    color: 'flow',
    gradient: 'gradient-flow',
  },
  {
    id: 'bump' as LifeStage,
    title: 'Hamiləliyim',
    subtitle: 'Hamiləlik izləyicisi',
    description: 'Körpənizin inkişafını həftə-həftə izləyin',
    icon: Heart,
    color: 'bump',
    gradient: 'gradient-bump',
  },
  {
    id: 'mommy' as LifeStage,
    title: 'Körpəm var',
    subtitle: 'Analıq yardımçısı',
    description: 'Körpənizin qidalanma, yuxu və inkişafını izləyin',
    icon: Baby,
    color: 'mommy',
    gradient: 'gradient-mommy',
  },
];

const OnboardingScreen = () => {
  const [step, setStep] = useState(0);
  const [selectedStage, setSelectedStage] = useState<LifeStage | null>(null);
  const [dateInput, setDateInput] = useState('');
  const [babyName, setBabyName] = useState('');
  const [babyGender, setBabyGender] = useState<'boy' | 'girl' | null>(null);
  
  const { setLifeStage, setLastPeriodDate, setBabyData, setOnboarded } = useUserStore();

  const handleStageSelect = (stage: LifeStage) => {
    setSelectedStage(stage);
  };

  const handleNext = () => {
    if (step === 0 && selectedStage) {
      setStep(1);
    } else if (step === 1) {
      if (selectedStage === 'mommy') {
        if (dateInput && babyName && babyGender) {
          setBabyData(new Date(dateInput), babyName, babyGender);
          setLifeStage(selectedStage);
          setOnboarded(true);
        }
      } else {
        if (dateInput) {
          setLastPeriodDate(new Date(dateInput));
          setLifeStage(selectedStage!);
          setOnboarded(true);
        }
      }
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background safe-top safe-bottom">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between">
        {step > 0 ? (
          <button onClick={handleBack} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
        ) : (
          <div className="w-10" />
        )}
        <div className="flex gap-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className={`w-8 h-1.5 rounded-full transition-colors ${
                i <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-4">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step-0"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-foreground">Sizə xoş gəldiniz!</h1>
                <p className="text-muted-foreground mt-2">
                  Hansı mərhələdəsiniz?
                </p>
              </div>

              <div className="space-y-4">
                {stages.map((stage) => {
                  const Icon = stage.icon;
                  const isSelected = selectedStage === stage.id;
                  
                  return (
                    <motion.button
                      key={stage.id}
                      onClick={() => handleStageSelect(stage.id)}
                      className={`w-full p-5 rounded-2xl text-left transition-all ${
                        isSelected
                          ? `${stage.gradient} text-white shadow-lg`
                          : 'bg-card border-2 border-border hover:border-primary/30'
                      }`}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                          isSelected ? 'bg-white/20' : `bg-${stage.color}-light`
                        }`}>
                          <Icon className={`w-7 h-7 ${isSelected ? 'text-white' : `text-${stage.color}`}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-bold text-lg ${isSelected ? 'text-white' : 'text-foreground'}`}>
                            {stage.title}
                          </h3>
                          <p className={`text-sm ${isSelected ? 'text-white/80' : 'text-muted-foreground'}`}>
                            {stage.description}
                          </p>
                        </div>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
                          >
                            <Check className="w-5 h-5 text-white" />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 1 && selectedStage && (
            <motion.div
              key="step-1"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-foreground">
                  {selectedStage === 'mommy' ? 'Körpəniz haqqında' : 'Son dövr tarixi'}
                </h1>
                <p className="text-muted-foreground mt-2">
                  {selectedStage === 'mommy' 
                    ? 'Körpənizin məlumatlarını daxil edin'
                    : selectedStage === 'bump'
                    ? 'Son menstruasiya tarixinizi daxil edin'
                    : 'Son dövrünüz nə vaxt başladı?'
                  }
                </p>
              </div>

              <div className="space-y-4">
                {selectedStage === 'mommy' && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Körpənizin adı
                      </label>
                      <Input
                        type="text"
                        placeholder="Ad"
                        value={babyName}
                        onChange={(e) => setBabyName(e.target.value)}
                        className="h-14 rounded-2xl bg-muted border-0 text-base"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Cinsi
                      </label>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setBabyGender('boy')}
                          className={`flex-1 p-4 rounded-2xl font-medium transition-all ${
                            babyGender === 'boy'
                              ? 'bg-partner text-white'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          👦 Oğlan
                        </button>
                        <button
                          onClick={() => setBabyGender('girl')}
                          className={`flex-1 p-4 rounded-2xl font-medium transition-all ${
                            babyGender === 'girl'
                              ? 'bg-primary text-white'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          👧 Qız
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    {selectedStage === 'mommy' ? 'Doğum tarixi' : 'Tarix'}
                  </label>
                  <Input
                    type="date"
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                    className="h-14 rounded-2xl bg-muted border-0 text-base"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-6 pb-8">
        <Button
          onClick={handleNext}
          disabled={
            (step === 0 && !selectedStage) ||
            (step === 1 && !dateInput) ||
            (step === 1 && selectedStage === 'mommy' && (!babyName || !babyGender))
          }
          className="w-full h-14 rounded-2xl gradient-primary text-white font-semibold text-base shadow-button hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {step === 1 ? 'Başla' : 'Davam et'}
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default OnboardingScreen;
