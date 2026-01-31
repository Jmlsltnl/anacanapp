import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, AlertTriangle, ChevronRight, ChevronLeft, Volume2, VolumeX, Phone, Shield, Heart, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useFirstAidScenarios, useFirstAidSteps, FirstAidScenario } from '@/hooks/useFirstAid';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { toast } from 'sonner';

interface FirstAidGuideProps {
  onBack: () => void;
}

const FirstAidGuide = ({ onBack }: FirstAidGuideProps) => {
  useScrollToTop();
  
  const [selectedScenario, setSelectedScenario] = useState<FirstAidScenario | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const { data: scenarios = [], isLoading } = useFirstAidScenarios();
  const { data: steps = [] } = useFirstAidSteps(selectedScenario?.id || '');

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'az-AZ';
      utterance.rate = 0.9;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  useEffect(() => {
    if (selectedScenario && steps[currentStep]) {
      speak(steps[currentStep].instruction_az);
    }
    return () => stopSpeaking();
  }, [currentStep, steps, selectedScenario]);

  const handleBack = () => {
    if (selectedScenario) {
      stopSpeaking();
      setSelectedScenario(null);
      setCurrentStep(0);
    } else {
      onBack();
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const getEmergencyColor = (level: string) => {
    switch (level) {
      case 'critical': return 'from-red-600 to-red-700';
      case 'high': return 'from-orange-500 to-red-500';
      case 'medium': return 'from-amber-500 to-orange-500';
      default: return 'from-yellow-500 to-amber-500';
    }
  };

  const getEmergencyBg = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
      case 'high': return 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800';
      case 'medium': return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';
      default: return 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800';
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 dark:from-red-950/20 to-background pb-24">
      {/* Premium Header */}
      <div className={`sticky top-0 z-20 isolate overflow-hidden ${
        selectedScenario 
          ? `bg-gradient-to-r ${getEmergencyColor(selectedScenario.emergency_level)}`
          : 'bg-gradient-to-br from-red-500 via-rose-500 to-pink-600'
      }`}>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-10 pointer-events-none" />
        
        <div className="relative px-4 pt-4 pb-6 safe-area-top">
          <div className="flex items-center gap-3 relative z-30">
            <motion.button
              onClick={handleBack}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center"
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </motion.button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5" />
                {selectedScenario ? selectedScenario.title_az : 'Həyat Qurtaran SOS'}
              </h1>
              {selectedScenario ? (
                <p className="text-white/80 text-sm">
                  Addım {currentStep + 1} / {steps.length}
                </p>
              ) : (
                <p className="text-white/80 text-sm">Təcili hallarda həyat qurtaran yardım</p>
              )}
            </div>
            {selectedScenario && (
              <motion.button 
                onClick={() => isSpeaking ? stopSpeaking() : speak(currentStepData?.instruction_az || '')}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center"
                whileTap={{ scale: 0.95 }}
              >
                {isSpeaking ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
              </motion.button>
            )}
          </div>

          {/* Header Stats */}
          {!selectedScenario && (
            <motion.div 
              className="grid grid-cols-3 gap-3 mt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="bg-white/15 backdrop-blur-md rounded-2xl p-3 text-center">
                <Shield className="w-5 h-5 mx-auto mb-1 text-white/80" />
                <p className="text-lg font-bold text-white">{scenarios.length}</p>
                <p className="text-[10px] text-white/70">Ssenari</p>
              </div>
              <div className="bg-white/15 backdrop-blur-md rounded-2xl p-3 text-center">
                <Heart className="w-5 h-5 mx-auto mb-1 text-white/80" />
                <p className="text-lg font-bold text-white">24/7</p>
                <p className="text-[10px] text-white/70">Dəstək</p>
              </div>
              <div className="bg-white/15 backdrop-blur-md rounded-2xl p-3 text-center">
                <Zap className="w-5 h-5 mx-auto mb-1 text-white/80" />
                <p className="text-lg font-bold text-white">Offline</p>
                <p className="text-[10px] text-white/70">İşləyir</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!selectedScenario ? (
          <motion.div 
            key="scenarios"
            className="px-4 -mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Emergency Call Button */}
            <motion.a
              href="tel:103"
              className="block w-full mb-6"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-4 shadow-lg flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Phone className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xl font-black text-white">103</p>
                  <p className="text-sm text-white/80">Təcili Tibbi Yardım</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                  <ChevronRight className="w-5 h-5 text-white" />
                </div>
              </div>
            </motion.a>

            {/* Scenario Selection */}
            <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Təcili Vəziyyət Seçin
            </h2>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-card rounded-2xl p-6 animate-pulse">
                    <div className="h-6 bg-muted rounded w-1/2 mb-2" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3 pb-8">
                {scenarios.map((scenario, index) => (
                  <motion.button
                    key={scenario.id}
                    onClick={() => setSelectedScenario(scenario)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`w-full rounded-2xl border-2 p-4 text-left transition-all hover:shadow-lg ${getEmergencyBg(scenario.emergency_level)}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getEmergencyColor(scenario.emergency_level)} flex items-center justify-center text-3xl shadow-lg`}>
                        {scenario.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-foreground mb-1">{scenario.title_az}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{scenario.description_az}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r ${getEmergencyColor(scenario.emergency_level)} text-white`}>
                            {scenario.emergency_level === 'critical' ? 'KRİTİK' : scenario.emergency_level === 'high' ? 'YÜKSƏK' : 'ORTA'}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-6 h-6 text-muted-foreground" />
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="steps"
            className="flex flex-col min-h-[calc(100vh-140px)]"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            {/* Progress */}
            <div className="px-4 pt-4">
              <div className="flex items-center gap-2 mb-2">
                {steps.map((_, i) => (
                  <div 
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-all ${
                      i <= currentStep 
                        ? `bg-gradient-to-r ${getEmergencyColor(selectedScenario.emergency_level)}`
                        : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Step Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              {currentStepData && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="w-full max-w-md"
                  >
                    {currentStepData.is_critical && (
                      <motion.div 
                        className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-4 py-2 rounded-full mb-4 inline-flex items-center gap-2"
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <AlertTriangle className="w-4 h-4" />
                        Kritik addım!
                      </motion.div>
                    )}

                    <motion.div 
                      className={`w-28 h-28 rounded-3xl bg-gradient-to-br ${getEmergencyColor(selectedScenario.emergency_level)} flex items-center justify-center mx-auto mb-6 shadow-xl`}
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <span className="text-5xl">
                        {currentStep === 0 ? '👋' : currentStep === steps.length - 1 ? '✅' : selectedScenario.icon}
                      </span>
                    </motion.div>

                    <div className="bg-card rounded-3xl p-6 shadow-lg border border-border/50 mb-4">
                      <span className="inline-block px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm font-medium mb-3">
                        Addım {currentStep + 1}
                      </span>
                      <h2 className="text-2xl font-black text-foreground mb-3">{currentStepData.title_az}</h2>
                      <p className="text-lg text-muted-foreground leading-relaxed">
                        {currentStepData.instruction_az}
                      </p>
                    </div>

                    {currentStepData.duration_seconds && (
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-muted-foreground">
                        <span className="text-xl">⏱️</span>
                        <span className="font-medium">Təxmini vaxt: {currentStepData.duration_seconds} saniyə</span>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>

            {/* Navigation */}
            <div className="p-4 space-y-3 safe-area-bottom">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 h-14 rounded-2xl text-base"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                >
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  Əvvəlki
                </Button>
                <Button
                  size="lg"
                  className={`flex-1 h-14 rounded-2xl text-base font-bold ${
                    currentStep === steps.length - 1 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700' 
                      : `bg-gradient-to-r ${getEmergencyColor(selectedScenario.emergency_level)}`
                  }`}
                  onClick={currentStep === steps.length - 1 ? handleBack : nextStep}
                >
                  {currentStep === steps.length - 1 ? 'Tamamla' : 'Növbəti'}
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>

              <Button
                variant="outline"
                className="w-full h-12 rounded-2xl border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                asChild
              >
                <a href="tel:103">
                  <Phone className="w-4 h-4 mr-2" />
                  103 Zəng Et
                </a>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FirstAidGuide;