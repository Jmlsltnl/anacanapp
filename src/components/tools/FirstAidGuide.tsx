import { useState, useEffect } from 'react';
import { ArrowLeft, AlertTriangle, ChevronRight, ChevronLeft, Volume2, VolumeX, Phone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useFirstAidScenarios, useFirstAidSteps, FirstAidScenario, FirstAidStep } from '@/hooks/useFirstAid';
import { toast } from 'sonner';

interface FirstAidGuideProps {
  onBack: () => void;
}

const FirstAidGuide = ({ onBack }: FirstAidGuideProps) => {
  const [selectedScenario, setSelectedScenario] = useState<FirstAidScenario | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const { data: scenarios = [], isLoading } = useFirstAidScenarios();
  const { data: steps = [] } = useFirstAidSteps(selectedScenario?.id || '');

  // Text-to-speech for instructions
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

  // Auto-speak when step changes
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

  const currentStepData = steps[currentStep];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className={`sticky top-0 z-10 text-white p-4 safe-area-top ${
        selectedScenario 
          ? `bg-gradient-to-r ${getEmergencyColor(selectedScenario.emergency_level)}`
          : 'bg-gradient-to-r from-red-500 to-rose-500'
      }`}>
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">
              {selectedScenario ? selectedScenario.title_az : 'Həyat Qurtaran SOS'}
            </h1>
            {selectedScenario && (
              <p className="text-xs text-white/80">
                Addım {currentStep + 1} / {steps.length}
              </p>
            )}
          </div>
          {selectedScenario && (
            <button 
              onClick={() => isSpeaking ? stopSpeaking() : speak(currentStepData?.instruction_az || '')}
              className="p-2 hover:bg-white/20 rounded-full"
            >
              {isSpeaking ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>

      {!selectedScenario ? (
        // Scenario Selection
        <div className="p-4">
          <div className="text-center mb-6">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-2" />
            <h2 className="text-xl font-bold">Təcili Vəziyyət Seçin</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Vəziyyəti seçin, addım-addım yardım alın
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Yüklənir...</div>
          ) : (
            <div className="grid gap-3">
              {scenarios.map(scenario => (
                <button
                  key={scenario.id}
                  onClick={() => setSelectedScenario(scenario)}
                  className={`w-full p-6 rounded-2xl text-white text-left bg-gradient-to-r ${getEmergencyColor(scenario.emergency_level)} hover:opacity-90 transition-opacity`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{scenario.icon}</span>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{scenario.title_az}</h3>
                      <p className="text-sm text-white/80">{scenario.description_az}</p>
                    </div>
                    <ChevronRight className="h-6 w-6" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Emergency Call Button */}
          <div className="mt-8">
            <Button
              size="lg"
              className="w-full h-16 text-lg bg-red-600 hover:bg-red-700"
              asChild
            >
              <a href="tel:103">
                <Phone className="h-6 w-6 mr-2" />
                103 - Təcili Yardım
              </a>
            </Button>
          </div>
        </div>
      ) : (
        // Step-by-Step Guide
        <div className="flex flex-col h-[calc(100vh-80px)]">
          {/* Progress */}
          <div className="p-4">
            <Progress value={((currentStep + 1) / steps.length) * 100} className="h-2" />
          </div>

          {/* Step Content */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            {currentStepData && (
              <>
                {currentStepData.is_critical && (
                  <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-4 py-2 rounded-full mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Kritik addım
                  </div>
                )}

                <div className="text-6xl mb-6">
                  {currentStep === 0 ? '👶' : currentStep === steps.length - 1 ? '✅' : '👋'}
                </div>

                <h2 className="text-2xl font-bold mb-4">{currentStepData.title_az}</h2>

                <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
                  {currentStepData.instruction_az}
                </p>

                {/* Visual indicator for timing */}
                {currentStepData.duration_seconds && (
                  <div className="mt-6 text-sm text-muted-foreground">
                    ⏱️ Təxmini vaxt: {currentStepData.duration_seconds} saniyə
                  </div>
                )}
              </>
            )}
          </div>

          {/* Navigation */}
          <div className="p-6 space-y-4">
            <div className="flex gap-4">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 h-14"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="h-5 w-5 mr-2" />
                Əvvəlki
              </Button>
              <Button
                size="lg"
                className={`flex-1 h-14 ${
                  currentStep === steps.length - 1 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
                onClick={currentStep === steps.length - 1 ? handleBack : nextStep}
              >
                {currentStep === steps.length - 1 ? 'Tamamla' : 'Növbəti'}
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            </div>

            {/* Emergency call always available */}
            <Button
              variant="outline"
              className="w-full border-red-300 text-red-600"
              asChild
            >
              <a href="tel:103">
                <Phone className="h-4 w-4 mr-2" />
                103 Zəng Et
              </a>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FirstAidGuide;
