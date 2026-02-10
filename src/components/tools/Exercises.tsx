import { useState, forwardRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Clock, 
  Heart, Flame, Check, ChevronRight, Star,
  Award, Loader2, Dumbbell, Sparkles, Play, Trophy
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
    <div className="min-h-screen bg-background pb-24">
      {/* Compact Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="px-4 py-3 safe-area-top">
          <div className="flex items-center gap-3">
            <motion.button
              onClick={selectedExercise ? () => { setSelectedExerciseId(null); setCurrentStep(0); } : onBack}
              className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </motion.button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-cyan-500" />
                {selectedExercise ? selectedExercise.name : 'Hamilə Məşqləri'}
              </h1>
              <p className="text-xs text-muted-foreground">{currentTrimester}. trimester üçün</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <motion.div
            className="bg-cyan-50 dark:bg-cyan-500/10 rounded-2xl p-3 text-center border border-cyan-100 dark:border-cyan-500/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Check className="w-5 h-5 mx-auto mb-1 text-cyan-500" />
            <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400">{todayStats.completedCount}</p>
            <p className="text-xs text-cyan-600/70 dark:text-cyan-400/70 font-medium">Bu gün</p>
          </motion.div>
          <motion.div
            className="bg-orange-50 dark:bg-orange-500/10 rounded-2xl p-3 text-center border border-orange-100 dark:border-orange-500/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Flame className="w-5 h-5 mx-auto mb-1 text-orange-500" />
            <p className="text-2xl font-black text-orange-600 dark:text-orange-400">{todayStats.totalCalories}</p>
            <p className="text-xs text-orange-600/70 dark:text-orange-400/70 font-medium">Kalori</p>
          </motion.div>
          <motion.div
            className="bg-amber-50 dark:bg-amber-500/10 rounded-2xl p-3 text-center border border-amber-100 dark:border-amber-500/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Trophy className="w-5 h-5 mx-auto mb-1 text-amber-500" />
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{streak}</p>
            <p className="text-xs text-amber-600/70 dark:text-amber-400/70 font-medium">Gün ardıcıl</p>
          </motion.div>
        </div>
      </div>

      <div className="px-4">
        <AnimatePresence mode="wait">
          {!selectedExercise ? (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Daily Recommendation */}
              <motion.div
                className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-800 mb-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-amber-800 dark:text-amber-200">Günün tövsiyəsi</h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300">20 dəq gəzinti + Kegel məşqləri</p>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 text-xs font-bold">
                    Tövsiyə
                  </div>
                </div>
              </motion.div>

              {/* Exercise List */}
              <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-500" />
                Sizin üçün məşqlər
              </h2>
              
              {filteredExercises.length === 0 ? (
                <motion.div 
                  className="text-center py-16"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="w-20 h-20 rounded-3xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center mx-auto mb-4">
                    <Dumbbell className="w-10 h-10 text-cyan-500" />
                  </div>
                  <p className="font-bold text-foreground mb-1">Məşq tapılmadı</p>
                  <p className="text-sm text-muted-foreground">Admin paneldən məşq əlavə edin</p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {filteredExercises.map((exercise, index) => {
                    const isCompleted = isCompletedToday(exercise.id);
                    return (
                      <motion.button
                        key={exercise.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.08 }}
                        onClick={() => setSelectedExerciseId(exercise.id)}
                        className={`w-full bg-card rounded-2xl p-4 flex items-center gap-4 shadow-sm border transition-all hover:shadow-md ${
                          isCompleted 
                            ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20' 
                            : 'border-border/50'
                        }`}
                      >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${
                          isCompleted 
                            ? 'bg-gradient-to-br from-green-400 to-emerald-500' 
                            : 'bg-gradient-to-br from-cyan-100 to-teal-100 dark:from-cyan-900/30 dark:to-teal-900/30'
                        }`}>
                          {isCompleted ? '✅' : exercise.icon}
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="font-bold text-foreground">{exercise.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">{exercise.description}</p>
                          <div className="flex gap-3 mt-1">
                            <span className="text-xs text-cyan-600 dark:text-cyan-400 flex items-center gap-1 font-medium">
                              <Clock className="w-3.5 h-3.5" /> {exercise.duration} dəq
                            </span>
                            <span className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1 font-medium">
                              <Flame className="w-3.5 h-3.5" /> {exercise.calories} kal
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              exercise.level === 'easy' 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                : exercise.level === 'medium'
                                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            }`}>
                              {exercise.level === 'easy' ? 'Asan' : exercise.level === 'medium' ? 'Orta' : 'Çətin'}
                            </span>
                          </div>
                        </div>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isCompleted ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'
                        }`}>
                          {isCompleted 
                            ? <Check className="w-5 h-5 text-green-600" />
                            : <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          }
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              {/* Exercise Detail Card */}
              <div className="bg-card rounded-3xl shadow-lg border border-border/50 overflow-hidden">
                {/* Exercise Header */}
                <div className="bg-gradient-to-br from-cyan-500 to-teal-600 p-6 text-center">
                  <motion.div 
                    className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3 text-4xl"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {selectedExercise.icon}
                  </motion.div>
                  <h2 className="text-xl font-bold text-white mb-1">{selectedExercise.name}</h2>
                  <p className="text-white/80 text-sm">{selectedExercise.description}</p>
                </div>
                
                {/* Stats */}
                <div className="p-4 grid grid-cols-3 gap-3 border-b border-border">
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center mx-auto mb-1">
                      <Clock className="w-5 h-5 text-cyan-600" />
                    </div>
                    <p className="font-bold text-foreground">{selectedExercise.duration}</p>
                    <p className="text-[10px] text-muted-foreground">dəqiqə</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-1">
                      <Flame className="w-5 h-5 text-orange-600" />
                    </div>
                    <p className="font-bold text-foreground">{selectedExercise.calories}</p>
                    <p className="text-[10px] text-muted-foreground">kalori</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-1">
                      <Award className="w-5 h-5 text-purple-600" />
                    </div>
                    <p className="font-bold text-foreground capitalize">
                      {selectedExercise.level === 'easy' ? 'Asan' : selectedExercise.level === 'medium' ? 'Orta' : 'Çətin'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">səviyyə</p>
                  </div>
                </div>

                {/* Steps */}
                <div className="p-4">
                  <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                    <Play className="w-4 h-4 text-cyan-500" />
                    Addımlar
                  </h3>
                  <div className="space-y-2">
                    {selectedExercise.steps.map((step, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
                          i === currentStep ? 'bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800' : 'bg-muted/30'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          i < currentStep 
                            ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white' 
                            : i === currentStep 
                              ? 'bg-gradient-to-br from-cyan-500 to-teal-600 text-white' 
                              : 'bg-muted text-muted-foreground'
                        }`}>
                          {i < currentStep ? '✓' : i + 1}
                        </div>
                        <span className={`text-sm pt-0.5 ${i === currentStep ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                          {step}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Controls */}
                <div className="p-4 flex gap-3">
                  <motion.button
                    onClick={() => {
                      setSelectedExerciseId(null);
                      setCurrentStep(0);
                    }}
                    className="flex-1 py-3.5 rounded-2xl border-2 border-border font-bold text-foreground"
                    whileTap={{ scale: 0.98 }}
                  >
                    Geri
                  </motion.button>
                  <motion.button
                    onClick={handleComplete}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-teal-600 text-white font-bold py-3.5 rounded-2xl shadow-lg flex items-center justify-center gap-2"
                    whileTap={{ scale: 0.98 }}
                  >
                    <Check className="w-5 h-5" />
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