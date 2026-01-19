import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Activity, Play, Pause, Clock, 
  Heart, Flame, Check, ChevronRight, Star,
  RefreshCw, Award
} from 'lucide-react';

interface ExercisesProps {
  onBack: () => void;
}

interface Exercise {
  id: string;
  name: string;
  duration: number;
  calories: number;
  level: 'easy' | 'medium';
  trimester: number[];
  icon: string;
  description: string;
  steps: string[];
}

const exercises: Exercise[] = [
  {
    id: '1',
    name: 'Kegel Məşqləri',
    duration: 5,
    calories: 10,
    level: 'easy',
    trimester: [1, 2, 3],
    icon: '🧘‍♀️',
    description: 'Döşəmə əzələlərini gücləndirmək üçün',
    steps: ['Rahat oturun', 'Əzələləri sıxın', '5 saniyə saxlayın', 'Boşaldın', '10 dəfə təkrarlayın']
  },
  {
    id: '2',
    name: 'Gəzinti',
    duration: 20,
    calories: 80,
    level: 'easy',
    trimester: [1, 2, 3],
    icon: '🚶‍♀️',
    description: 'Ürək-damar sağlamlığı üçün',
    steps: ['Rahat ayaqqabı geyin', 'Yavaş başlayın', 'Düz duruşu qoruyun', 'Sabit tempdə gedin']
  },
  {
    id: '3',
    name: 'Hamiləlik Yoqası',
    duration: 15,
    calories: 50,
    level: 'easy',
    trimester: [1, 2, 3],
    icon: '🧘',
    description: 'Rahatlama və çeviklik',
    steps: ['Cat-Cow pozası', 'Pişik uzanması', 'Uşaq pozası', 'Dərin nəfəs']
  },
  {
    id: '4',
    name: 'Squat Məşqi',
    duration: 10,
    calories: 40,
    level: 'medium',
    trimester: [1, 2],
    icon: '🏋️‍♀️',
    description: 'Ayaq əzələlərini gücləndirmək',
    steps: ['Ayaqları çiyin genişliyində açın', 'Yavaş-yavaş çökün', 'Dizləri barmaqlardan keçirməyin', '10 dəfə təkrarlayın']
  },
  {
    id: '5',
    name: 'Üzgüçülük',
    duration: 30,
    calories: 150,
    level: 'medium',
    trimester: [1, 2, 3],
    icon: '🏊‍♀️',
    description: 'Bütün bədən məşqi',
    steps: ['Hovuza yavaş girin', 'Rahat tempdə üzün', 'Fasilələr verin', 'Hidrasiyanı qoruyun']
  },
  {
    id: '6',
    name: 'Nəfəs Məşqləri',
    duration: 10,
    calories: 15,
    level: 'easy',
    trimester: [1, 2, 3],
    icon: '💨',
    description: 'Doğuşa hazırlıq',
    steps: ['Rahat oturun', 'Dərin nəfəs alın', '4 saniyə saxlayın', 'Yavaş-yavaş verin', 'Təkrarlayın']
  },
];

const Exercises = ({ onBack }: ExercisesProps) => {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedToday, setCompletedToday] = useState<string[]>(['1']);
  const currentTrimester = 2;

  const filteredExercises = exercises.filter(e => e.trimester.includes(currentTrimester));
  const totalCaloriesBurned = completedToday.reduce((sum, id) => {
    const exercise = exercises.find(e => e.id === id);
    return sum + (exercise?.calories || 0);
  }, 0);

  const handleComplete = () => {
    if (selectedExercise && !completedToday.includes(selectedExercise.id)) {
      setCompletedToday([...completedToday, selectedExercise.id]);
    }
    setSelectedExercise(null);
    setCurrentStep(0);
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-background pb-28">
      {/* Header */}
      <div className="bg-gradient-to-br from-cyan-500 to-teal-600 px-5 pt-4 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <motion.button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
          <div>
            <h1 className="text-xl font-bold text-white">Məşqlər</h1>
            <p className="text-white/80 text-sm">{currentTrimester}. trimester üçün</p>
          </div>
        </div>

        {/* Stats Card */}
        <motion.div 
          className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/20"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="flex justify-around">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
                <Check className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-white">{completedToday.length}</p>
              <p className="text-white/70 text-xs">Tamamlandı</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-white">{totalCaloriesBurned}</p>
              <p className="text-white/70 text-xs">Kalori</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
                <Award className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-white">3</p>
              <p className="text-white/70 text-xs">Günlük zolaq</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="px-5 -mt-4">
        <AnimatePresence mode="wait">
          {!selectedExercise ? (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Daily Recommendation */}
              <motion.div
                className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl p-4 border border-amber-200"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                <div className="flex items-center gap-3">
                  <Star className="w-8 h-8 text-amber-500" />
                  <div>
                    <h3 className="font-bold text-amber-800">Günün tövsiyəsi</h3>
                    <p className="text-sm text-amber-700">20 dəq gəzinti + Kegel məşqləri</p>
                  </div>
                </div>
              </motion.div>

              {/* Exercise List */}
              <h2 className="font-bold text-lg pt-2">Sizin üçün məşqlər</h2>
              {filteredExercises.map((exercise, index) => {
                const isCompleted = completedToday.includes(exercise.id);
                return (
                  <motion.button
                    key={exercise.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setSelectedExercise(exercise)}
                    className={`w-full bg-card rounded-2xl p-4 flex items-center gap-4 shadow-card border ${
                      isCompleted ? 'border-green-300 bg-green-50' : 'border-border/50'
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                      isCompleted ? 'bg-green-100' : 'bg-cyan-50'
                    }`}>
                      {isCompleted ? '✅' : exercise.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold">{exercise.name}</h3>
                      <p className="text-sm text-muted-foreground">{exercise.description}</p>
                      <div className="flex gap-3 mt-1">
                        <span className="text-xs text-cyan-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {exercise.duration} dəq
                        </span>
                        <span className="text-xs text-orange-600 flex items-center gap-1">
                          <Flame className="w-3 h-3" /> {exercise.calories} kal
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </motion.button>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-4"
            >
              {/* Exercise Detail Card */}
              <div className="bg-card rounded-3xl p-6 shadow-card border border-border/50 text-center">
                <div className="text-5xl mb-4">{selectedExercise.icon}</div>
                <h2 className="text-2xl font-bold mb-2">{selectedExercise.name}</h2>
                <p className="text-muted-foreground mb-4">{selectedExercise.description}</p>
                
                <div className="flex justify-center gap-6 mb-6">
                  <div className="text-center">
                    <Clock className="w-6 h-6 text-cyan-500 mx-auto mb-1" />
                    <p className="font-bold">{selectedExercise.duration}</p>
                    <p className="text-xs text-muted-foreground">dəqiqə</p>
                  </div>
                  <div className="text-center">
                    <Flame className="w-6 h-6 text-orange-500 mx-auto mb-1" />
                    <p className="font-bold">{selectedExercise.calories}</p>
                    <p className="text-xs text-muted-foreground">kalori</p>
                  </div>
                </div>

                {/* Steps */}
                <div className="text-left bg-muted/50 rounded-2xl p-4 mb-4">
                  <h3 className="font-bold mb-3">Addımlar:</h3>
                  <div className="space-y-2">
                    {selectedExercise.steps.map((step, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`flex items-center gap-3 p-2 rounded-lg ${
                          i === currentStep ? 'bg-primary/10' : ''
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          i < currentStep 
                            ? 'bg-green-500 text-white' 
                            : i === currentStep 
                              ? 'bg-primary text-white' 
                              : 'bg-muted text-muted-foreground'
                        }`}>
                          {i < currentStep ? '✓' : i + 1}
                        </div>
                        <span className={i === currentStep ? 'font-medium' : ''}>{step}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex gap-3">
                  <motion.button
                    onClick={() => {
                      setSelectedExercise(null);
                      setCurrentStep(0);
                    }}
                    className="flex-1 py-4 rounded-2xl border-2 border-border font-medium"
                    whileTap={{ scale: 0.98 }}
                  >
                    Geri
                  </motion.button>
                  <motion.button
                    onClick={handleComplete}
                    className="flex-1 gradient-primary text-white font-bold py-4 rounded-2xl shadow-elevated flex items-center justify-center gap-2"
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
};

export default Exercises;
