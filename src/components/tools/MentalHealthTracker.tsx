import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Heart, Phone, AlertTriangle, CheckCircle, ChevronRight, Brain, Wind, Smile, ChevronLeft, ExternalLink, Sparkles, Activity, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
// Note: RadioGroup removed - using custom button-based selection for better UX
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { 
  useMoodCheckins, 
  useTodayMoodCheckin, 
  useAddMoodCheckin,
  useEPDSAssessments,
  useSubmitEPDS,
  useMentalHealthResources,
  useShouldShowEPDSPrompt,
  EPDS_QUESTIONS,
  EPDSAssessment
} from '@/hooks/useMentalHealth';
import { 
  useMoodLevelsDB, 
  useBreathingExercisesDB,
  useEPDSQuestionsDB,
  FALLBACK_MOOD_LEVELS,
  FALLBACK_BREATHING_EXERCISES
} from '@/hooks/useMentalHealthData';
import { format, subDays } from 'date-fns';
import { az } from 'date-fns/locale';
import { toast } from 'sonner';

interface MentalHealthTrackerProps {
  onBack: () => void;
}

const MentalHealthTracker = ({ onBack }: MentalHealthTrackerProps) => {
  useScrollToTop();
  
  // Fetch data from database
  const { data: moodLevelsDB = [] } = useMoodLevelsDB();
  const { data: breathingExercisesDB = [] } = useBreathingExercisesDB();
  const { data: epdsQuestionsDB = [] } = useEPDSQuestionsDB();
  
  // Use DB data or fallback
  const MOOD_LEVELS = useMemo(() => {
    if (moodLevelsDB.length > 0) {
      return moodLevelsDB.map(m => ({
        value: m.mood_value,
        emoji: m.emoji,
        label: m.label_az || m.label,
        gradient: `from-[${m.color}] to-[${m.color}]`,
        bg: `bg-[${m.color}]/10`
      }));
    }
    return FALLBACK_MOOD_LEVELS.map(m => ({
      value: m.mood_value,
      emoji: m.emoji,
      label: m.label_az || m.label,
      gradient: m.mood_value === 1 ? 'from-red-500 to-rose-600' :
                m.mood_value === 2 ? 'from-orange-500 to-amber-600' :
                m.mood_value === 3 ? 'from-yellow-500 to-amber-500' :
                m.mood_value === 4 ? 'from-lime-500 to-green-500' : 'from-emerald-500 to-teal-500',
      bg: m.mood_value === 1 ? 'bg-red-100 dark:bg-red-900/30' :
          m.mood_value === 2 ? 'bg-orange-100 dark:bg-orange-900/30' :
          m.mood_value === 3 ? 'bg-yellow-100 dark:bg-yellow-900/30' :
          m.mood_value === 4 ? 'bg-lime-100 dark:bg-lime-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'
    }));
  }, [moodLevelsDB]);

  const BREATHING_EXERCISES = useMemo(() => {
    if (breathingExercisesDB.length > 0) {
      return breathingExercisesDB.map(e => ({
        name: e.name_az || e.name,
        inhale: e.inhale_seconds,
        hold: e.hold_seconds,
        exhale: e.exhale_seconds,
        description: e.description_az || e.description || '',
        emoji: e.icon === 'Wind' ? '🌙' : e.icon === 'Square' ? '📦' : '💨'
      }));
    }
    return FALLBACK_BREATHING_EXERCISES.map(e => ({
      name: e.name_az || e.name,
      inhale: e.inhale_seconds,
      hold: e.hold_seconds,
      exhale: e.exhale_seconds,
      description: e.description_az || e.description || '',
      emoji: e.icon === 'Wind' ? '🌙' : e.icon === 'Square' ? '📦' : '💨'
    }));
  }, [breathingExercisesDB]);
  
  const [showEPDS, setShowEPDS] = useState(false);
  const [epdsAnswers, setEpdsAnswers] = useState<Record<string, number>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showResult, setShowResult] = useState<EPDSAssessment | null>(null);
  const [showBreathing, setShowBreathing] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<'idle' | 'inhale' | 'hold' | 'exhale'>('idle');
  const [breathingCount, setBreathingCount] = useState(0);
  const [selectedExercise, setSelectedExercise] = useState(BREATHING_EXERCISES[0]);
  const [notes, setNotes] = useState('');

  // Update selected exercise when exercises load
  useEffect(() => {
    if (BREATHING_EXERCISES.length > 0 && !selectedExercise) {
      setSelectedExercise(BREATHING_EXERCISES[0]);
    }
  }, [BREATHING_EXERCISES]);

  const { data: moodCheckins = [] } = useMoodCheckins(14);
  const { data: todayCheckin } = useTodayMoodCheckin();
  const { data: epdsAssessments = [] } = useEPDSAssessments();
  const { data: resources = [] } = useMentalHealthResources();
  
  const addMoodCheckin = useAddMoodCheckin();
  const submitEPDS = useSubmitEPDS();
  const shouldShowEPDSPrompt = useShouldShowEPDSPrompt();

  const handleMoodSelect = async (level: number) => {
    await addMoodCheckin.mutateAsync({ mood_level: level, notes: notes || undefined });
    setNotes('');
    toast.success('Əhvalınız qeyd edildi ✨');
  };

  const handleEPDSAnswer = (questionId: number, value: number) => {
    // Update the answer for the current question
    setEpdsAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const goToNextQuestion = () => {
    if (currentQuestion < EPDS_QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const goToPrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmitEPDS = async () => {
    if (Object.keys(epdsAnswers).length < EPDS_QUESTIONS.length) {
      toast.error('Bütün suallara cavab verin');
      return;
    }

    const result = await submitEPDS.mutateAsync(epdsAnswers);
    setShowResult(result);
    setShowEPDS(false);
    setEpdsAnswers({});
    setCurrentQuestion(0);
  };

  useEffect(() => {
    if (breathingPhase === 'idle') return;

    const durations: Record<string, number> = {
      inhale: selectedExercise.inhale * 1000,
      hold: selectedExercise.hold * 1000,
      exhale: selectedExercise.exhale * 1000,
    };

    const timer = setTimeout(() => {
      if (breathingPhase === 'inhale') {
        setBreathingPhase('hold');
      } else if (breathingPhase === 'hold') {
        setBreathingPhase('exhale');
      } else if (breathingPhase === 'exhale') {
        if (breathingCount < 3) {
          setBreathingCount(c => c + 1);
          setBreathingPhase('inhale');
        } else {
          setBreathingPhase('idle');
          setBreathingCount(0);
          toast.success('Tamamlandı! Özünüzü necə hiss edirsiniz?');
        }
      }
    }, durations[breathingPhase]);

    return () => clearTimeout(timer);
  }, [breathingPhase, breathingCount, selectedExercise]);

  const startBreathing = () => {
    setBreathingPhase('inhale');
    setBreathingCount(0);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
      case 'moderate': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
      default: return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'high': return 'Yüksək Risk';
      case 'moderate': return 'Orta Risk';
      default: return 'Normal';
    }
  };

  const moodTrend = moodCheckins.length >= 2
    ? moodCheckins.slice(0, 7).reduce((sum, c) => sum + c.mood_level, 0) / Math.min(7, moodCheckins.length)
    : null;

  const last7Days = [...Array(7)].map((_, i) => {
    const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
    const checkin = moodCheckins.find(c => c.checked_at === date);
    return { date, mood: checkin?.mood_level || 0, day: format(subDays(new Date(), 6 - i), 'EEE', { locale: az }) };
  });

  const emergencyResources = resources.filter(r => r.is_emergency);
  const otherResources = resources.filter(r => !r.is_emergency);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Compact Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="px-4 py-3 safe-area-top">
          <div className="flex items-center gap-3">
            <motion.button
              onClick={onBack}
              className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </motion.button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Brain className="w-5 h-5 text-teal-500" />
                Sən Necəsən, Ana?
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <motion.div
            className="bg-teal-50 dark:bg-teal-500/10 rounded-2xl p-3 text-center border border-teal-100 dark:border-teal-500/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Smile className="w-5 h-5 mx-auto mb-1 text-teal-500" />
            <p className="text-2xl font-black text-teal-600 dark:text-teal-400">{moodCheckins.length}</p>
            <p className="text-xs text-teal-600/70 dark:text-teal-400/70 font-medium">Qeyd</p>
          </motion.div>
          <motion.div
            className="bg-cyan-50 dark:bg-cyan-500/10 rounded-2xl p-3 text-center border border-cyan-100 dark:border-cyan-500/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Activity className="w-5 h-5 mx-auto mb-1 text-cyan-500" />
            <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400">{moodTrend ? moodTrend.toFixed(1) : '—'}</p>
            <p className="text-xs text-cyan-600/70 dark:text-cyan-400/70 font-medium">Ortalama</p>
          </motion.div>
          <motion.div
            className="bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl p-3 text-center border border-emerald-100 dark:border-emerald-500/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Calendar className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{epdsAssessments.length}</p>
            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 font-medium">EPDS</p>
          </motion.div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* EPDS Alert */}
        {shouldShowEPDSPrompt && !epdsAssessments.length && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-800"
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-amber-800 dark:text-amber-200">Sizinlə danışaq?</h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Qısa sorğu ilə vəziyyəti qiymətləndirək?
                </p>
                <Button 
                  size="sm" 
                  className="mt-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 border-0"
                  onClick={() => setShowEPDS(true)}
                >
                  Sorğuya başla
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Today's Check-in */}
        <motion.div
          className="bg-card rounded-3xl shadow-lg border border-border/50 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-gradient-to-r from-teal-500 to-cyan-500 p-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Smile className="w-5 h-5" />
              Bu gün necəsən?
            </h3>
          </div>
          <div className="p-4">
            {todayCheckin ? (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-6"
              >
                <motion.div 
                  className="text-7xl mb-3"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                >
                  {MOOD_LEVELS.find(m => m.value === todayCheckin.mood_level)?.emoji}
                </motion.div>
                <p className="text-lg font-medium text-foreground">
                  Bu gün özünüzü <span className="text-primary font-bold">{MOOD_LEVELS.find(m => m.value === todayCheckin.mood_level)?.label.toLowerCase()}</span> hiss edirsiniz
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  ✨ Qeyd etdiyiniz üçün təşəkkürlər!
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-end py-2">
                  {MOOD_LEVELS.map((mood, index) => (
                    <motion.button
                      key={mood.value}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleMoodSelect(mood.value)}
                      disabled={addMoodCheckin.isPending}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all hover:scale-110 ${mood.bg}`}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="text-3xl">{mood.emoji}</span>
                      <span className="text-[10px] font-bold">{mood.label}</span>
                    </motion.button>
                  ))}
                </div>
                <div>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="İstəyirsinizsə, qısa qeyd əlavə edin..."
                    className="h-16 resize-none rounded-2xl border-2"
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Weekly Mood Chart */}
        {moodCheckins.length > 0 && (
          <motion.div
            className="bg-card rounded-3xl p-5 shadow-lg border border-border/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-500" />
              Son 7 Gün
            </h3>
            <div className="flex items-end justify-between h-28 gap-2">
              {last7Days.map((day, i) => (
                <motion.div 
                  key={i} 
                  className="flex-1 flex flex-col items-center gap-1"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div 
                    className={`w-full rounded-xl transition-all ${
                      day.mood > 0 
                        ? `bg-gradient-to-t ${MOOD_LEVELS[day.mood - 1]?.gradient}`
                        : 'bg-muted'
                    }`}
                    style={{ height: day.mood > 0 ? `${(day.mood / 5) * 100}%` : '15%' }}
                  />
                  <span className="text-[10px] text-muted-foreground font-medium">{day.day}</span>
                </motion.div>
              ))}
            </div>
            {moodTrend !== null && (
              <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border border-teal-200 dark:border-teal-800">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <span className="text-3xl">{MOOD_LEVELS.find(m => m.value === Math.round(moodTrend))?.emoji}</span>
                  <span className="font-bold text-lg text-foreground">Ortalama: {moodTrend.toFixed(1)}/5</span>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {moodTrend >= 4 ? '🌟 Əla gedir! Özünüzə qayğı göstərməyə davam edin.' : 
                   moodTrend >= 3 ? '💪 Yaxşı gedir. Özünüzə vaxt ayırın.' :
                   '💝 Biraz çətin dövr keçirirsiniz. Yardım istəməkdən çəkinməyin.'}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Action Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Breathing Exercise */}
          <motion.button
            onClick={() => setShowBreathing(true)}
            className="bg-card rounded-2xl p-4 shadow-sm border border-border/50 text-left hover:shadow-md transition-shadow"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center mb-3 shadow-lg">
              <Wind className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-foreground">Nəfəs Məşqi</h3>
            <p className="text-xs text-muted-foreground mt-1">Rahatlama və stress azaltma</p>
          </motion.button>

          {/* EPDS Assessment */}
          <motion.button
            onClick={() => setShowEPDS(true)}
            className="bg-card rounded-2xl p-4 shadow-sm border border-border/50 text-left hover:shadow-md transition-shadow"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center mb-3 shadow-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-foreground">EPDS Testi</h3>
            <p className="text-xs text-muted-foreground mt-1">Depressiya riski qiymətləndirmə</p>
          </motion.button>
        </div>

        {/* Previous Assessments */}
        {epdsAssessments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-500" />
              Keçmiş Nəticələr
            </h3>
            <div className="space-y-2">
              {epdsAssessments.slice(0, 3).map((assessment, index) => (
                <motion.button 
                  key={assessment.id} 
                  onClick={() => setShowResult(assessment)} 
                  className="w-full bg-card rounded-2xl p-4 shadow-sm border border-border/50 flex items-center justify-between hover:shadow-md transition-shadow"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                      <Brain className="w-5 h-5 text-teal-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-foreground">
                        {format(new Date(assessment.completed_at), 'd MMMM yyyy', { locale: az })}
                      </p>
                      <p className="text-xs text-muted-foreground">Bal: {assessment.total_score}/30</p>
                    </div>
                  </div>
                  <Badge className={`${getRiskColor(assessment.risk_level)} border`}>
                    {getRiskLabel(assessment.risk_level)}
                  </Badge>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Emergency Resources */}
        {emergencyResources.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <Phone className="w-5 h-5 text-red-500" />
              Təcili Yardım
            </h3>
            <div className="space-y-2">
              {emergencyResources.map(resource => (
                <div key={resource.id} className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 border border-red-200 dark:border-red-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-red-700 dark:text-red-300">{resource.name_az}</p>
                      <p className="text-xs text-red-600 dark:text-red-400">{resource.description_az}</p>
                    </div>
                    {resource.phone && (
                      <Button size="sm" className="bg-gradient-to-r from-red-500 to-rose-600 border-0" asChild>
                        <a href={`tel:${resource.phone}`}>
                          <Phone className="w-4 h-4 mr-1" />
                          {resource.phone}
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Other Resources */}
        {otherResources.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="font-bold text-foreground mb-3">Dəstək Resursları</h3>
            <div className="space-y-2">
              {otherResources.map(resource => (
                <div key={resource.id} className="bg-card rounded-2xl p-4 shadow-sm border border-border/50">
                  <p className="font-bold text-foreground">{resource.name_az}</p>
                  <p className="text-xs text-muted-foreground">{resource.description_az}</p>
                  <div className="flex gap-2 mt-3">
                    {resource.phone && (
                      <Button size="sm" variant="outline" className="rounded-xl" asChild>
                        <a href={`tel:${resource.phone}`}>
                          <Phone className="w-3.5 h-3.5 mr-1" />
                          Zəng et
                        </a>
                      </Button>
                    )}
                    {resource.website && (
                      <Button size="sm" variant="outline" className="rounded-xl" asChild>
                        <a href={resource.website} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3.5 h-3.5 mr-1" />
                          Sayt
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Breathing Exercise Modal */}
      <Dialog open={showBreathing} onOpenChange={setShowBreathing}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wind className="w-5 h-5 text-cyan-500" />
              Nəfəs Məşqi
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {breathingPhase === 'idle' ? (
              <>
                <div className="space-y-3">
                  {BREATHING_EXERCISES.map((ex, i) => (
                    <motion.button
                      key={i}
                      onClick={() => setSelectedExercise(ex)}
                      className={`w-full p-4 rounded-2xl text-left transition-all flex items-center gap-3 ${
                        selectedExercise.name === ex.name
                          ? 'bg-teal-100 dark:bg-teal-900/30 border-2 border-teal-500'
                          : 'bg-muted hover:bg-muted/80 border-2 border-transparent'
                      }`}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-2xl">
                        {ex.emoji}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-foreground">{ex.name}</p>
                        <p className="text-xs text-muted-foreground">{ex.description}</p>
                        <p className="text-xs mt-1 text-teal-600 dark:text-teal-400 font-medium">
                          Nəfəs al: {ex.inhale}s • Saxla: {ex.hold}s • Burax: {ex.exhale}s
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
                <Button 
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-600 border-0" 
                  onClick={startBreathing}
                >
                  <Wind className="w-5 h-5 mr-2" />
                  Başla
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <motion.div
                  className="w-44 h-44 mx-auto rounded-full flex items-center justify-center shadow-xl"
                  animate={{
                    scale: breathingPhase === 'inhale' ? 1.4 : breathingPhase === 'exhale' ? 1 : 1.4,
                    backgroundColor: breathingPhase === 'inhale' ? '#14b8a6' : breathingPhase === 'hold' ? '#0891b2' : '#10b981',
                  }}
                  transition={{
                    duration: breathingPhase === 'inhale' ? selectedExercise.inhale : 
                              breathingPhase === 'hold' ? selectedExercise.hold : 
                              selectedExercise.exhale,
                  }}
                >
                  <span className="text-white text-2xl font-bold">
                    {breathingPhase === 'inhale' ? 'Nəfəs al' : 
                     breathingPhase === 'hold' ? 'Saxla' : 'Burax'}
                  </span>
                </motion.div>
                <p className="mt-8 text-xl font-bold text-foreground">
                  Dövrə: {breathingCount + 1} / 4
                </p>
                <Button variant="outline" className="mt-4 rounded-xl" onClick={() => setBreathingPhase('idle')}>
                  Dayandır
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* EPDS Quiz Modal */}
      <Dialog open={showEPDS} onOpenChange={setShowEPDS}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-teal-500" />
              EPDS Sorğusu
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {EPDS_QUESTIONS.map((_, i) => (
                <div 
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    i <= currentQuestion ? 'bg-gradient-to-r from-teal-500 to-cyan-500' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Sual {currentQuestion + 1} / {EPDS_QUESTIONS.length}
            </p>
            
            <AnimatePresence mode="wait">
              {EPDS_QUESTIONS[currentQuestion] && (
                <motion.div
                  key={currentQuestion}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <p className="font-bold mb-4 text-lg text-foreground">{EPDS_QUESTIONS[currentQuestion].question}</p>
                  <div className="space-y-2">
                    {EPDS_QUESTIONS[currentQuestion].options.map(option => {
                      const isSelected = epdsAnswers[EPDS_QUESTIONS[currentQuestion].id] === option.value;
                      return (
                        <motion.button
                          key={option.value}
                          type="button"
                          className={`w-full flex items-center space-x-3 p-4 rounded-2xl transition-all text-left border-2
                            ${isSelected
                              ? 'bg-teal-100 dark:bg-teal-900/30 border-teal-500'
                              : 'bg-muted/50 hover:bg-muted border-transparent'
                            }`}
                          onClick={() => handleEPDSAnswer(EPDS_QUESTIONS[currentQuestion].id, option.value)}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'border-teal-500 bg-teal-500' : 'border-muted-foreground/30'
                          }`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <span className="flex-1 font-medium">{option.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                className="rounded-xl" 
                onClick={goToPrevQuestion}
                disabled={currentQuestion === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Geri
              </Button>
              
              {currentQuestion < EPDS_QUESTIONS.length - 1 ? (
                <Button 
                  className="flex-1 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 border-0"
                  onClick={goToNextQuestion}
                  disabled={epdsAnswers[EPDS_QUESTIONS[currentQuestion].id] === undefined}
                >
                  Növbəti
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button 
                  className="flex-1 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 border-0"
                  onClick={handleSubmitEPDS}
                  disabled={submitEPDS.isPending || Object.keys(epdsAnswers).length < EPDS_QUESTIONS.length}
                >
                  Nəticəni Gör
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Result Modal */}
      <Dialog open={!!showResult} onOpenChange={() => setShowResult(null)}>
        <DialogContent className="max-w-md">
          {showResult && (
            <>
              <DialogHeader>
                <DialogTitle className="text-center">Nəticəniz</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 text-center">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-lg font-bold ${getRiskColor(showResult.risk_level)} border`}
                >
                  {showResult.risk_level === 'low' ? <CheckCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                  {getRiskLabel(showResult.risk_level)}
                </motion.div>
                
                <div>
                  <p className="text-6xl font-black text-foreground">{showResult.total_score}</p>
                  <p className="text-muted-foreground">/ 30 bal</p>
                </div>

                <p className="text-sm bg-muted p-4 rounded-2xl">{showResult.recommendation}</p>

                {showResult.risk_level === 'high' && emergencyResources.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-200 dark:border-red-800">
                    <p className="text-sm font-bold text-red-700 dark:text-red-300 mb-3">
                      🆘 Zəhmət olmasa mütəxəssislə əlaqə saxlayın:
                    </p>
                    {emergencyResources.map(r => (
                      <Button key={r.id} className="w-full bg-gradient-to-r from-red-500 to-rose-600 border-0" asChild>
                        <a href={`tel:${r.phone}`}>
                          <Phone className="w-4 h-4 mr-2" />
                          {r.name_az}: {r.phone}
                        </a>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MentalHealthTracker;
