import { useState, forwardRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Clock, 
  Heart, Flame, Check, ChevronRight, Star,
  Award, Loader2
} from 'lucide-react';
import { useExerciseLogs } from '@/hooks/useExerciseLogs';
import { useUserStore } from '@/store/userStore';
import { useExercises } from '@/hooks/useDynamicConfig';
import { useScrollToTop } from '@/hooks/useScrollToTop';

interface ExercisesProps {
  onBack: () => void;
}

const Exercises = forwardRef<HTMLDivElement, ExercisesProps>(({ onBack }, ref) => {
  useScrollToTop();
  
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const { loading: logsLoading, addLog, isCompletedToday, getTodayStats, getStreak } = useExerciseLogs();
  const { getPregnancyData } = useUserStore();
  const { data: dbExercises, isLoading: exercisesLoading } = useExercises();
  
  const pregnancyData = getPregnancyData();
  const currentTrimester = pregnancyData?.trimester || 2;

  // Map DB exercises to component format
  const exercises = useMemo(() => {
    if (!dbExercises) return [];
    return dbExercises.map(e => ({
      id: e.id,
      name: e.name_az || e.name,
      duration: e.duration_minutes,
      calories: e.calories,
      level: e.level,
      trimester: Array.isArray(e.trimester) ? e.trimester : [1, 2, 3],
      icon: e.icon || '🏃',
      description: e.description || '',
      steps: Array.isArray(e.steps) ? e.steps : [],
    }));
  }, [dbExercises]);

  const filteredExercises = exercises.filter(e => e.trimester.includes(currentTrimester));
  const selectedExercise = exercises.find(e => e.id === selectedExerciseId) || null;
  const todayStats = getTodayStats();
  const streak = getStreak();

  const handleComplete = async () => {
    if (selectedExercise) {
      await addLog(
        selectedExercise.id,
        selectedExercise.name,
        selectedExercise.duration,
        selectedExercise.calories
      );
    }
    setSelectedExerciseId(null);
    setCurrentStep(0);
  };

  if (logsLoading || exercisesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 dark:from-cyan-950/20 to-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 isolate bg-gradient-to-br from-cyan-500 to-teal-600 px-3 pt-3 pb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-teal-600 pointer-events-none" />
        <div className="flex items-center gap-3 mb-4 relative z-30">
          <motion.button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center relative z-30"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </motion.button>
          <div>
            <h1 className="text-lg font-bold text-white">Məşqlər</h1>
            <p className="text-white/80 text-xs">{currentTrimester}. trimester üçün</p>
          </div>
        </div>

        {/* Stats Card */}
        <motion.div 
          className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="flex justify-around">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-1">
                <Check className="w-5 h-5 text-white" />
              </div>
              <p className="text-xl font-bold text-white">{todayStats.completedCount}</p>
              <p className="text-white/70 text-[10px]">Tamamlandı</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-1">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <p className="text-xl font-bold text-white">{todayStats.totalCalories}</p>
              <p className="text-white/70 text-[10px]">Kalori</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-1">
                <Award className="w-5 h-5 text-white" />
              </div>
              <p className="text-xl font-bold text-white">{streak}</p>
              <p className="text-white/70 text-[10px]">Günlük zolaq</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="px-3 -mt-3">
        <AnimatePresence mode="wait">
          {!selectedExercise ? (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {/* Daily Recommendation */}
              <motion.div
                className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl p-3 border border-amber-200"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                <div className="flex items-center gap-2">
                  <Star className="w-6 h-6 text-amber-500" />
                  <div>
                    <h3 className="font-bold text-amber-800 text-sm">Günün tövsiyəsi</h3>
                    <p className="text-xs text-amber-700">20 dəq gəzinti + Kegel məşqləri</p>
                  </div>
                </div>
              </motion.div>

              {/* Exercise List */}
              <h2 className="font-bold text-sm pt-1">Sizin üçün məşqlər</h2>
              {filteredExercises.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Məşq tapılmadı</p>
              ) : (
                filteredExercises.map((exercise, index) => {
                  const isCompleted = isCompletedToday(exercise.id);
                  return (
                    <motion.button
                      key={exercise.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => setSelectedExerciseId(exercise.id)}
                      className={`w-full bg-card rounded-xl p-3 flex items-center gap-3 shadow-card border ${
                        isCompleted ? 'border-green-300 bg-green-50' : 'border-border/50'
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${
                        isCompleted ? 'bg-green-100' : 'bg-cyan-50'
                      }`}>
                        {isCompleted ? '✅' : exercise.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-sm">{exercise.name}</h3>
                        <p className="text-xs text-muted-foreground">{exercise.description}</p>
                        <div className="flex gap-2 mt-0.5">
                          <span className="text-[10px] text-cyan-600 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {exercise.duration} dəq
                          </span>
                          <span className="text-[10px] text-orange-600 flex items-center gap-1">
                            <Flame className="w-3 h-3" /> {exercise.calories} kal
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </motion.button>
                  );
                })
              )}
            </motion.div>
          ) : (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-3"
            >
              {/* Exercise Detail Card */}
              <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50 text-center">
                <div className="text-4xl mb-3">{selectedExercise.icon}</div>
                <h2 className="text-xl font-bold mb-1">{selectedExercise.name}</h2>
                <p className="text-muted-foreground text-sm mb-3">{selectedExercise.description}</p>
                
                <div className="flex justify-center gap-4 mb-4">
                  <div className="text-center">
                    <Clock className="w-5 h-5 text-cyan-500 mx-auto mb-0.5" />
                    <p className="font-bold text-sm">{selectedExercise.duration}</p>
                    <p className="text-[10px] text-muted-foreground">dəqiqə</p>
                  </div>
                  <div className="text-center">
                    <Flame className="w-5 h-5 text-orange-500 mx-auto mb-0.5" />
                    <p className="font-bold text-sm">{selectedExercise.calories}</p>
                    <p className="text-[10px] text-muted-foreground">kalori</p>
                  </div>
                </div>

                {/* Steps */}
                <div className="text-left bg-muted/50 rounded-xl p-3 mb-3">
                  <h3 className="font-bold mb-2 text-sm">Addımlar:</h3>
                  <div className="space-y-1.5">
                    {selectedExercise.steps.map((step, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`flex items-center gap-2 p-1.5 rounded-lg ${
                          i === currentStep ? 'bg-primary/10' : ''
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          i < currentStep 
                            ? 'bg-green-500 text-white' 
                            : i === currentStep 
                              ? 'bg-primary text-white' 
                              : 'bg-muted text-muted-foreground'
                        }`}>
                          {i < currentStep ? '✓' : i + 1}
                        </div>
                        <span className={`text-xs ${i === currentStep ? 'font-medium' : ''}`}>{step}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex gap-2">
                  <motion.button
                    onClick={() => {
                      setSelectedExerciseId(null);
                      setCurrentStep(0);
                    }}
                    className="flex-1 py-3 rounded-xl border-2 border-border font-medium text-sm"
                    whileTap={{ scale: 0.98 }}
                  >
                    Geri
                  </motion.button>
                  <motion.button
                    onClick={handleComplete}
                    className="flex-1 gradient-primary text-white font-bold py-3 rounded-xl shadow-elevated flex items-center justify-center gap-1.5 text-sm"
                    whileTap={{ scale: 0.98 }}
                  >
                    <Check className="w-4 h-4" />
                    Bitirdim
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

Exercises.displayName = 'Exercises';

export default Exercises;