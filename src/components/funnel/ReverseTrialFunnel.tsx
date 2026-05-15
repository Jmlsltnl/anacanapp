import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/store/userStore';
import { QUIZ_QUESTIONS, SYMPTOM_MAPPINGS, RESULTS_TEMPLATES, REVIEWS, FEATURES, PLAN_MILESTONES } from './funnelData';
import QuizStep from './steps/QuizStep';
import AnalysisStep from './steps/AnalysisStep';
import ResultsStep from './steps/ResultsStep';
import HowAppHelpsStep from './steps/HowAppHelpsStep';
import ReviewsStep from './steps/ReviewsStep';
import FeaturesStep from './steps/FeaturesStep';
import CustomPlanStep from './steps/CustomPlanStep';
import PaywallStep from './steps/PaywallStep';
import DiscountedPaywallStep from './steps/DiscountedPaywallStep';
import type { LifeStage } from '@/types/anacan';
import type { SymptomMapping } from './funnelData';

type FunnelStep = 'quiz' | 'analysis' | 'results' | 'howhelps' | 'reviews' | 'features' | 'plan' | 'paywall' | 'discount';

const STEP_ORDER: FunnelStep[] = ['quiz', 'analysis', 'results', 'howhelps', 'reviews', 'features', 'plan', 'paywall', 'discount'];

interface ReverseTrialFunnelProps {
  onComplete: () => void;
}

export default function ReverseTrialFunnel({ onComplete }: ReverseTrialFunnelProps) {
  const { name, lifeStage, getPregnancyData, getBabyData, cycleLength } = useUserStore();
  const [step, setStep] = useState<FunnelStep>('quiz');
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});

  const stage = (lifeStage || 'bump') as LifeStage;
  const userName = name || 'İstifadəçi';

  const questions = QUIZ_QUESTIONS[stage] || [];

  // Context line for analysis
  const contextLine = useMemo(() => {
    if (stage === 'bump') {
      const pd = getPregnancyData();
      return pd ? `${pd.currentWeek}-ci həftə, ${pd.trimester}-ci trimester` : 'Hamiləlik';
    }
    if (stage === 'mommy') {
      const bd = getBabyData();
      return bd ? `${bd.name} — ${bd.ageInMonths} aylıq` : 'Analıq';
    }
    return `Tsikl: ${cycleLength} gün`;
  }, [stage, getPregnancyData, getBabyData, cycleLength]);

  // Week/age number for results
  const weekOrAge = useMemo(() => {
    if (stage === 'bump') return getPregnancyData()?.currentWeek || 0;
    if (stage === 'mommy') return getBabyData()?.ageInMonths || 0;
    return cycleLength;
  }, [stage, getPregnancyData, getBabyData, cycleLength]);

  // Map quiz answers to relevant symptom mappings
  const relevantMappings = useMemo((): SymptomMapping[] => {
    const seen = new Set<string>();
    const result: SymptomMapping[] = [];
    Object.values(quizAnswers).forEach(answerId => {
      const mapping = SYMPTOM_MAPPINGS[answerId];
      if (mapping && !seen.has(mapping.toolId)) {
        seen.add(mapping.toolId);
        result.push(mapping);
      }
    });
    // Ensure at least 3 items
    if (result.length < 3) {
      const defaults = stage === 'bump'
        ? ['interrupted', 'high', 'no']
        : stage === 'mommy'
        ? ['sleep', 'sometimes_hard', 'some']
        : ['physical', 'mood', 'low'];
      for (const d of defaults) {
        const m = SYMPTOM_MAPPINGS[d];
        if (m && !result.find(r => r.toolId === m.toolId)) {
          result.push(m);
          if (result.length >= 4) break;
        }
      }
    }
    return result;
  }, [quizAnswers, stage]);

  const resultLines = useMemo(() => {
    const templateFn = RESULTS_TEMPLATES[stage];
    return templateFn ? templateFn(userName, weekOrAge, quizAnswers) : [];
  }, [stage, userName, weekOrAge, quizAnswers]);

  const goTo = useCallback((s: FunnelStep) => setStep(s), []);

  const stepIndex = STEP_ORDER.indexOf(step);
  const totalSteps = STEP_ORDER.length;

  const renderStep = () => {
    switch (step) {
      case 'quiz':
        return (
          <QuizStep
            questions={questions}
            onComplete={(a) => { setQuizAnswers(a); goTo('analysis'); }}
          />
        );
      case 'analysis':
        return (
          <AnalysisStep
            userName={userName}
            contextLine={contextLine}
            onComplete={() => goTo('results')}
          />
        );
      case 'results':
        return <ResultsStep lines={resultLines} onContinue={() => goTo('howhelps')} />;
      case 'howhelps':
        return <HowAppHelpsStep mappings={relevantMappings} onContinue={() => goTo('reviews')} />;
      case 'reviews':
        return <ReviewsStep reviews={REVIEWS[stage] || REVIEWS.bump} onContinue={() => goTo('features')} />;
      case 'features':
        return <FeaturesStep features={FEATURES} onContinue={() => goTo('plan')} />;
      case 'plan':
        return (
          <CustomPlanStep
            userName={userName}
            milestones={PLAN_MILESTONES[stage] || PLAN_MILESTONES.bump}
            onContinue={() => goTo('paywall')}
          />
        );
      case 'paywall':
        return (
          <PaywallStep
            onPurchase={() => onComplete()}
            onClose={() => goTo('discount')}
          />
        );
      case 'discount':
        return (
          <DiscountedPaywallStep
            onAccept={() => onComplete()}
            onDecline={() => onComplete()}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col overflow-hidden">
      {/* Safe area top */}
      <div className="bg-background flex-shrink-0" style={{ height: 'env(safe-area-inset-top)' }} />

      {/* Global progress bar */}
      {step !== 'analysis' && (
        <div className="px-6 pt-3 pb-1 flex-shrink-0">
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="max-w-md mx-auto min-h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
              className="min-h-full"
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
