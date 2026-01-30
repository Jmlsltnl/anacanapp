import { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Phone, AlertTriangle, CheckCircle, ChevronRight, Brain, Wind, Smile, Frown, Meh, ChevronLeft, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { format, subDays } from 'date-fns';
import { az } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface MentalHealthTrackerProps {
  onBack: () => void;
}

const MOOD_LEVELS = [
  { value: 1, emoji: '😢', label: 'Çox pis', color: 'from-red-500 to-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  { value: 2, emoji: '😔', label: 'Pis', color: 'from-orange-500 to-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  { value: 3, emoji: '😐', label: 'Normal', color: 'from-yellow-500 to-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
  { value: 4, emoji: '😊', label: 'Yaxşı', color: 'from-lime-500 to-lime-600', bgColor: 'bg-lime-100 dark:bg-lime-900/30' },
  { value: 5, emoji: '🥰', label: 'Əla', color: 'from-green-500 to-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
];

const BREATHING_EXERCISES = [
  { name: '4-7-8 Nəfəs', inhale: 4, hold: 7, exhale: 8, description: 'Rahatlama və yuxu üçün' },
  { name: 'Qutu Nəfəsi', inhale: 4, hold: 4, exhale: 4, description: 'Stress azaltmaq üçün' },
];

const MentalHealthTracker = ({ onBack }: MentalHealthTrackerProps) => {
  const [showEPDS, setShowEPDS] = useState(false);
  const [epdsAnswers, setEpdsAnswers] = useState<Record<string, number>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showResult, setShowResult] = useState<EPDSAssessment | null>(null);
  const [showBreathing, setShowBreathing] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<'idle' | 'inhale' | 'hold' | 'exhale'>('idle');
  const [breathingCount, setBreathingCount] = useState(0);
  const [selectedExercise, setSelectedExercise] = useState(BREATHING_EXERCISES[0]);
  const [notes, setNotes] = useState('');

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
    setEpdsAnswers(prev => ({ ...prev, [questionId]: value }));
    
    if (currentQuestion < EPDS_QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQuestion(prev => prev + 1), 300);
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

  // Breathing exercise logic
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
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'moderate': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'high': return 'Yüksək Risk';
      case 'moderate': return 'Orta Risk';
      default: return 'Normal';
    }
  };

  // Calculate mood trend
  const moodTrend = moodCheckins.length >= 2
    ? moodCheckins.slice(0, 7).reduce((sum, c) => sum + c.mood_level, 0) / Math.min(7, moodCheckins.length)
    : null;

  // Get last 7 days mood data
  const last7Days = [...Array(7)].map((_, i) => {
    const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
    const checkin = moodCheckins.find(c => c.checked_at === date);
    return { date, mood: checkin?.mood_level || 0, day: format(subDays(new Date(), 6 - i), 'EEE', { locale: az }) };
  });

  const emergencyResources = resources.filter(r => r.is_emergency);
  const otherResources = resources.filter(r => !r.is_emergency);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500 text-white p-4 safe-area-top">
        <div className="flex items-center gap-3 relative z-20">
          <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full transition-colors relative z-30">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Sən Necəsən, Ana?
            </h1>
            <p className="text-xs text-white/80">Psixoloji sağlamlıq və dəstək</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* EPDS Alert */}
        {shouldShowEPDSPrompt && !epdsAssessments.length && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/50">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                      Sizinlə danışaq?
                    </h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      Son günlərdə çətin vaxt keçirdiyinizi gördük. Qısa sorğu ilə vəziyyəti qiymətləndirək?
                    </p>
                    <Button 
                      size="sm" 
                      className="mt-3 bg-amber-600 hover:bg-amber-700"
                      onClick={() => setShowEPDS(true)}
                    >
                      Sorğuya başla
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Today's Check-in */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white p-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Smile className="h-5 w-5" />
              Bu gün necəsən?
            </h3>
          </div>
          <CardContent className="p-4">
            {todayCheckin ? (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-6"
              >
                <motion.div 
                  className="text-6xl mb-3"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                >
                  {MOOD_LEVELS.find(m => m.value === todayCheckin.mood_level)?.emoji}
                </motion.div>
                <p className="text-lg font-medium">
                  Bu gün özünüzü <span className="text-primary">{MOOD_LEVELS.find(m => m.value === todayCheckin.mood_level)?.label.toLowerCase()}</span> hiss edirsiniz
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
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all hover:scale-110 ${mood.bgColor}`}
                    >
                      <span className="text-3xl">{mood.emoji}</span>
                      <span className="text-xs font-medium">{mood.label}</span>
                    </motion.button>
                  ))}
                </div>
                <div>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="İstəyirsinizsə, qısa qeyd əlavə edin..."
                    className="h-16 resize-none"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Mood Chart */}
        {moodCheckins.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Son 7 Gün</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between h-24 gap-1">
                {last7Days.map((day, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div 
                      className={`w-full rounded-t-lg transition-all ${
                        day.mood > 0 
                          ? `bg-gradient-to-t ${MOOD_LEVELS[day.mood - 1]?.color}`
                          : 'bg-muted'
                      }`}
                      style={{ height: day.mood > 0 ? `${(day.mood / 5) * 100}%` : '10%' }}
                    />
                    <span className="text-[10px] text-muted-foreground">{day.day}</span>
                  </div>
                ))}
              </div>
              {moodTrend !== null && (
                <div className="mt-4 p-3 rounded-lg bg-muted/50 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-2xl">{MOOD_LEVELS.find(m => m.value === Math.round(moodTrend))?.emoji}</span>
                    <span className="font-semibold">Ortalama: {moodTrend.toFixed(1)}/5</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {moodTrend >= 4 ? '🌟 Əla gedir! Özünüzə qayğı göstərməyə davam edin.' : 
                     moodTrend >= 3 ? '💪 Yaxşı gedir. Özünüzə vaxt ayırın.' :
                     '💝 Biraz çətin dövr keçirirsiniz. Yardım istəməkdən çəkinməyin.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Breathing Exercise */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowBreathing(true)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30">
                  <Wind className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Nəfəs Məşqi</h3>
                  <p className="text-xs text-muted-foreground">Rahatlama və stress azaltma</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* EPDS Assessment */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowEPDS(true)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/30 dark:to-emerald-900/30">
                  <Brain className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold">EPDS Testi</h3>
                  <p className="text-xs text-muted-foreground">Doğum sonrası depressiya riski</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Previous Assessments */}
        {epdsAssessments.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Keçmiş Nəticələr</h3>
            <div className="space-y-2">
              {epdsAssessments.slice(0, 3).map(assessment => (
                <Card key={assessment.id} onClick={() => setShowResult(assessment)} className="cursor-pointer hover:shadow-sm transition-shadow">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {format(new Date(assessment.completed_at), 'd MMMM yyyy', { locale: az })}
                      </p>
                      <p className="text-xs text-muted-foreground">Bal: {assessment.total_score}/30</p>
                    </div>
                    <Badge className={getRiskColor(assessment.risk_level)}>
                      {getRiskLabel(assessment.risk_level)}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Emergency Resources */}
        {emergencyResources.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Phone className="h-4 w-4 text-red-500" />
              Təcili Yardım
            </h3>
            <div className="space-y-2">
              {emergencyResources.map(resource => (
                <Card key={resource.id} className="border-red-200 dark:border-red-800">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{resource.name_az}</p>
                        <p className="text-xs text-muted-foreground">{resource.description_az}</p>
                      </div>
                      {resource.phone && (
                        <Button size="sm" variant="destructive" asChild>
                          <a href={`tel:${resource.phone}`}>
                            <Phone className="h-4 w-4 mr-1" />
                            {resource.phone}
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Other Resources */}
        {otherResources.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Dəstək Resursları</h3>
            <div className="space-y-2">
              {otherResources.map(resource => (
                <Card key={resource.id}>
                  <CardContent className="p-3">
                    <p className="font-medium">{resource.name_az}</p>
                    <p className="text-xs text-muted-foreground">{resource.description_az}</p>
                    <div className="flex gap-2 mt-2">
                      {resource.phone && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={`tel:${resource.phone}`}>
                            <Phone className="h-3 w-3 mr-1" />
                            Zəng et
                          </a>
                        </Button>
                      )}
                      {resource.website && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={resource.website} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Sayt
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Breathing Exercise Modal */}
      <Dialog open={showBreathing} onOpenChange={setShowBreathing}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nəfəs Məşqi</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {breathingPhase === 'idle' ? (
              <>
                <div className="space-y-3">
                  {BREATHING_EXERCISES.map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedExercise(ex)}
                      className={`w-full p-4 rounded-lg text-left transition-all ${
                        selectedExercise.name === ex.name
                          ? 'bg-teal-100 dark:bg-teal-900/30 border-2 border-teal-500'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      <p className="font-semibold">{ex.name}</p>
                      <p className="text-xs text-muted-foreground">{ex.description}</p>
                      <p className="text-xs mt-1">
                        Nəfəs al: {ex.inhale}s • Saxla: {ex.hold}s • Burax: {ex.exhale}s
                      </p>
                    </button>
                  ))}
                </div>
                <Button className="w-full bg-teal-500 hover:bg-teal-600" onClick={startBreathing}>
                  <Wind className="h-4 w-4 mr-2" />
                  Başla
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <motion.div
                  className="w-40 h-40 mx-auto rounded-full flex items-center justify-center"
                  animate={{
                    scale: breathingPhase === 'inhale' ? 1.5 : breathingPhase === 'exhale' ? 1 : 1.5,
                    backgroundColor: breathingPhase === 'inhale' ? '#14b8a6' : breathingPhase === 'hold' ? '#0891b2' : '#10b981',
                  }}
                  transition={{
                    duration: breathingPhase === 'inhale' ? selectedExercise.inhale : 
                              breathingPhase === 'hold' ? selectedExercise.hold : 
                              selectedExercise.exhale,
                  }}
                >
                  <span className="text-white text-xl font-bold">
                    {breathingPhase === 'inhale' ? 'Nəfəs al' : 
                     breathingPhase === 'hold' ? 'Saxla' : 'Burax'}
                  </span>
                </motion.div>
                <p className="mt-6 text-lg font-medium">
                  Dövrə: {breathingCount + 1} / 4
                </p>
                <Button variant="outline" className="mt-4" onClick={() => setBreathingPhase('idle')}>
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
            <DialogTitle>EPDS Sorğusu</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Progress value={((currentQuestion + 1) / EPDS_QUESTIONS.length) * 100} className="h-2" />
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
                  <p className="font-medium mb-4 text-lg">{EPDS_QUESTIONS[currentQuestion].question}</p>
                  <RadioGroup
                    value={epdsAnswers[EPDS_QUESTIONS[currentQuestion].id]?.toString()}
                    onValueChange={(v) => handleEPDSAnswer(EPDS_QUESTIONS[currentQuestion].id, parseInt(v))}
                    className="space-y-2"
                  >
                    {EPDS_QUESTIONS[currentQuestion].options.map(option => (
                      <div 
                        key={option.value} 
                        className={`flex items-center space-x-3 p-3 rounded-lg transition-all cursor-pointer
                          ${epdsAnswers[EPDS_QUESTIONS[currentQuestion].id] === option.value
                            ? 'bg-teal-100 dark:bg-teal-900/30 border-2 border-teal-500'
                            : 'bg-muted hover:bg-muted/80'
                          }`}
                        onClick={() => handleEPDSAnswer(EPDS_QUESTIONS[currentQuestion].id, option.value)}
                      >
                        <RadioGroupItem value={option.value.toString()} id={`option-${option.value}`} />
                        <Label htmlFor={`option-${option.value}`} className="flex-1 cursor-pointer">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-2 pt-4">
              {currentQuestion > 0 && (
                <Button variant="outline" onClick={() => setCurrentQuestion(prev => prev - 1)}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Geri
                </Button>
              )}
              {currentQuestion === EPDS_QUESTIONS.length - 1 && (
                <Button 
                  className="flex-1 bg-teal-500 hover:bg-teal-600"
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
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-lg font-semibold ${getRiskColor(showResult.risk_level)}`}
                >
                  {showResult.risk_level === 'low' ? <CheckCircle className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
                  {getRiskLabel(showResult.risk_level)}
                </motion.div>
                
                <div>
                  <p className="text-5xl font-bold">{showResult.total_score}</p>
                  <p className="text-muted-foreground">/ 30 bal</p>
                </div>

                <p className="text-sm bg-muted p-4 rounded-lg">{showResult.recommendation}</p>

                {showResult.risk_level === 'high' && emergencyResources.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-3">
                      🆘 Zəhmət olmasa mütəxəssislə əlaqə saxlayın:
                    </p>
                    {emergencyResources.map(r => (
                      <Button key={r.id} variant="destructive" className="w-full" asChild>
                        <a href={`tel:${r.phone}`}>
                          <Phone className="h-4 w-4 mr-2" />
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
