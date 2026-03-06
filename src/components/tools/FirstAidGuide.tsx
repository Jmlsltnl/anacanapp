import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, AlertTriangle, ChevronRight, ChevronLeft, Phone, Shield } from 'lucide-react';
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

  const { data: scenarios = [], isLoading } = useFirstAidScenarios();
  const { data: steps = [] } = useFirstAidSteps(selectedScenario?.id || '');

  // TTS disabled - no auto-speaking

  const handleBack = () => {
    if (selectedScenario) {
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
    <div className="min-h-screen bg-background pb-24">
      {/* Compact Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="px-4 py-3 safe-area-top">
          <div className="flex items-center gap-3">
            <motion.button
              onClick={handleBack}
              className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </motion.button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-500" />
                {selectedScenario ? selectedScenario.title_az : 'Həyat Qurtaran SOS'}
              </h1>
              {selectedScenario && (
                <p className="text-xs text-muted-foreground">
                  Addım {currentStep + 1} / {steps.length}
                </p>
              )}
            </div>
            {/* TTS button removed */}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!selectedScenario ? (
          <motion.div 
            key="scenarios"
            className="px-4 pt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Emergency Call Button */}
            <motion.a
              href="tel:103"
              className="block w-full mb-4"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-3 shadow-lg flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-lg font-black text-white">103</p>
                  <p className="text-xs text-white/80">Təcili Tibbi Yardım</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                  <ChevronRight className="w-4 h-4 text-white" />
                </div>
              </div>
            </motion.a>

            {/* Scenario Selection */}
            <h2 className="font-bold text-sm text-foreground mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Təcili Vəziyyət Seçin
            </h2>

            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-card rounded-xl p-4 animate-pulse">
                    <div className="h-5 bg-muted rounded w-1/2 mb-1" />
                    <div className="h-3 bg-muted rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 pb-4">
                {scenarios.map((scenario, index) => (
                  <motion.button
                    key={scenario.id}
                    onClick={() => setSelectedScenario(scenario)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`w-full rounded-xl border p-3 text-left transition-all hover:shadow-md ${getEmergencyBg(scenario.emergency_level)}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getEmergencyColor(scenario.emergency_level)} flex items-center justify-center text-xl shadow`}>
                        {scenario.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-foreground">{scenario.title_az}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-1">{scenario.description_az}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-gradient-to-r ${getEmergencyColor(scenario.emergency_level)} text-white`}>
                          {scenario.emergency_level === 'critical' ? 'KRİTİK' : scenario.emergency_level === 'high' ? 'YÜKSƏK' : 'ORTA'}
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="steps"
            className="flex flex-col h-[calc(100vh-56px)]"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
          >
            {/* Progress */}
            <div className="px-3 pt-2">
              <div className="flex items-center gap-1">
                {steps.map((_, i) => (
                  <div 
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      i <= currentStep 
                        ? `bg-gradient-to-r ${getEmergencyColor(selectedScenario.emergency_level)}`
                        : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Step Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-2 text-center overflow-y-auto">
              {currentStepData && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="w-full max-w-sm"
                  >
                    {currentStepData.is_critical && (
                      <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-3 py-1 rounded-full mb-2 inline-flex items-center gap-1.5 text-xs font-semibold">
                        <AlertTriangle className="w-3 h-3" />
                        Kritik addım!
                      </div>
                    )}

                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getEmergencyColor(selectedScenario.emergency_level)} flex items-center justify-center mx-auto mb-2 shadow-md`}>
                      <span className="text-2xl">
                        {currentStep === 0 ? '👋' : currentStep === steps.length - 1 ? '✅' : selectedScenario.icon}
                      </span>
                    </div>

                    <div className="bg-card rounded-xl p-3 shadow border border-border/50 mb-2">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-medium mb-1.5">
                        Addım {currentStep + 1}
                      </span>
                      <h2 className="text-base font-bold text-foreground mb-1">{currentStepData.title_az}</h2>
                      <p className="text-sm text-muted-foreground leading-snug">
                        {currentStepData.instruction_az}
                      </p>
                    </div>

                    {currentStepData.duration_seconds && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs">
                        <span>⏱️</span>
                        <span className="font-medium">{currentStepData.duration_seconds} san</span>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>

            {/* Navigation */}
            <div className="px-3 pb-3 pt-1 space-y-2 safe-area-bottom">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-10 rounded-xl text-sm"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Əvvəlki
                </Button>
                <Button
                  size="sm"
                  className={`flex-1 h-10 rounded-xl text-sm font-bold ${
                    currentStep === steps.length - 1 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700' 
                      : `bg-gradient-to-r ${getEmergencyColor(selectedScenario.emergency_level)}`
                  }`}
                  onClick={currentStep === steps.length - 1 ? handleBack : nextStep}
                >
                  {currentStep === steps.length - 1 ? 'Tamamla' : 'Növbəti'}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full h-9 rounded-xl border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs"
                asChild
              >
                <a href="tel:103">
                  <Phone className="w-3.5 h-3.5 mr-1.5" />
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