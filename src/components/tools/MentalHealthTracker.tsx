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
import { useScreenAnalytics, trackEvent } from '@/hooks/useScreenAnalytics';
import {
  useMoodCheckins,
  useTodayMoodCheckin,
  useAddMoodCheckin,
  useEPDSAssessments,
  useSubmitEPDS,
  useMentalHealthResources,
  useShouldShowEPDSPrompt,
  EPDS_QUESTIONS as FALLBACK_EPDS_QUESTIONS,
  EPDSAssessment } from
'@/hooks/useMentalHealth';
import {
  useMoodLevelsDB,
  useBreathingExercisesDB,
  useEPDSQuestionsDB,
  FALLBACK_MOOD_LEVELS,
  FALLBACK_BREATHING_EXERCISES } from
'@/hooks/useMentalHealthData';
import { format, subDays } from 'date-fns';
import { getCurrentDateLocale } from '@/lib/date-utils';
import { toast } from 'sonner';
import { tr } from "@/lib/tr";
import MedicalDisclaimer from '@/components/MedicalDisclaimer';

interface MentalHealthTrackerProps {
  onBack: () => void;
}

const MentalHealthTracker = ({ onBack }: MentalHealthTrackerProps) => {
  useScrollToTop();
  useScreenAnalytics('MentalHealthTracker', 'Tools');

  // Fetch data from database
  const { data: moodLevelsDB = [] } = useMoodLevelsDB();
  const { data: breathingExercisesDB = [] } = useBreathingExercisesDB();
  const { data: epdsQuestionsDB = [] } = useEPDSQuestionsDB();

  // Map DB EPDS questions to component format, fallback to hardcoded
  const EPDS_QUESTIONS = useMemo(() => {
    if (epdsQuestionsDB.length > 0) {
      return epdsQuestionsDB.map((q) => ({
        id: q.question_number,
        question: q.question_text_az || q.question_text,
        options: (q.options || []).map((o) => ({
          value: o.value,
          label: o.text_az || o.text
        }))
      }));
    }
    return FALLBACK_EPDS_QUESTIONS;
  }, [epdsQuestionsDB]);

  // Use DB data or fallback
  const MOOD_LEVELS = useMemo(() => {
    if (moodLevelsDB.length > 0) {
      return moodLevelsDB.map((m) => ({
        value: m.mood_value,
        emoji: m.emoji,
        label: m.label_az || m.label,
        gradient: `from-[${m.color}] to-[${m.color}]`,
        bg: `bg-[${m.color}]/10`
      }));
    }
    return FALLBACK_MOOD_LEVELS.map((m) => ({
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
      return breathingExercisesDB.map((e) => ({
        name: e.name_az || e.name,
        inhale: e.inhale_seconds,
        hold: e.hold_seconds,
        exhale: e.exhale_seconds,
        description: e.description_az || e.description || '',
        emoji: e.icon === 'Wind' ? '🌙' : e.icon === 'Square' ? '📦' : '💨'
      }));
    }
    return FALLBACK_BREATHING_EXERCISES.map((e) => ({
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
    toast.success(tr("mentalhealthtracker_ehvaliniz_qeyd_edildi_dd9071", "\u018Fhval\u0131n\u0131z qeyd edildi \u2728"));
  };

  const handleEPDSAnswer = (questionId: number, value: number) => {
    // Update the answer for the current question
    setEpdsAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const goToNextQuestion = () => {
    if (currentQuestion < EPDS_QUESTIONS.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const goToPrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleSubmitEPDS = async () => {
    if (Object.keys(epdsAnswers).length < EPDS_QUESTIONS.length) {
      toast.error(tr("mentalhealthtracker_butun_suallara_cavab_verin_3e999d", "B\xFCt\xFCn suallara cavab verin"));
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
      exhale: selectedExercise.exhale * 1000
    };

    const timer = setTimeout(() => {
      if (breathingPhase === 'inhale') {
        setBreathingPhase('hold');
      } else if (breathingPhase === 'hold') {
        setBreathingPhase('exhale');
      } else if (breathingPhase === 'exhale') {
        if (breathingCount < 3) {
          setBreathingCount((c) => c + 1);
          setBreathingPhase('inhale');
        } else {
          setBreathingPhase('idle');
          setBreathingCount(0);
          toast.success(tr("mentalhealthtracker_tamamlandi_ozunuzu_nece_hiss_e_9a2212", "Tamamland\u0131! \xD6z\xFCn\xFCz\xFC nec\u0259 hiss edirsiniz?"));
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
      case 'high':return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
      case 'moderate':return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
      default:return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'high':return tr("mentalhealthtracker_yuksek_risk_29a5a3", "Y\xFCks\u0259k Risk");
      case 'moderate':return 'Orta Risk';
      default:return 'Normal';
    }
  };

  const moodTrend = moodCheckins.length >= 2 ?
  moodCheckins.slice(0, 7).reduce((sum, c) => sum + c.mood_level, 0) / Math.min(7, moodCheckins.length) :
  null;

  const last7Days = [...Array(7)].map((_, i) => {
    const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
    const checkin = moodCheckins.find((c) => c.checked_at === date);
    return { date, mood: checkin?.mood_level || 0, day: format(subDays(new Date(), 6 - i), 'EEE', { locale: getCurrentDateLocale() }) };
  });

  const emergencyResources = resources.filter((r) => r.is_emergency);
  const otherResources = resources.filter((r) => !r.is_emergency);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Compact Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="px-4 pb-2">
          <div className="flex items-center gap-3">
            <motion.button
              onClick={onBack}
              className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
              whileTap={{ scale: 0.95 }}>
              
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </motion.button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Brain className="w-5 h-5 text-teal-500" />
                {tr("mentalhealthtracker_mental_saglamliq_68e65e", "Mental Sa\u011Flaml\u0131q")}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        <MedicalDisclaimer variant="compact" className="mb-4" />
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <motion.div
            className="bg-teal-50 dark:bg-teal-500/10 rounded-2xl p-3 text-center border border-teal-100 dark:border-teal-500/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}>
            
            <Smile className="w-5 h-5 mx-auto mb-1 text-teal-500" />
            <p className="text-2xl font-black text-teal-600 dark:text-teal-400">{moodCheckins.length}</p>
            <p className="text-xs text-teal-600/70 dark:text-teal-400/70 font-medium">{tr("untranslated_qeyd_z0999u", "Qeyd")}</p>
          </motion.div>
          <motion.div
            className="bg-cyan-50 dark:bg-cyan-500/10 rounded-2xl p-3 text-center border border-cyan-100 dark:border-cyan-500/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}>
            
            <Activity className="w-5 h-5 mx-auto mb-1 text-cyan-500" />
            <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400">{moodTrend ? moodTrend.toFixed(1) : '—'}</p>
            <p className="text-xs text-cyan-600/70 dark:text-cyan-400/70 font-medium">{tr("untranslated_ortalama_qxgps6", "Ortalama")}</p>
          </motion.div>
          <motion.div
            className="bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl p-3 text-center border border-emerald-100 dark:border-emerald-500/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}>
            
            <Calendar className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{epdsAssessments.length}</p>
            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 font-medium">EPDS</p>
          </motion.div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* EPDS Alert */}
        {shouldShowEPDSPrompt && !epdsAssessments.length &&
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-800">
          
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-amber-800 dark:text-amber-200">{tr("mentalhealthtracker_sizinle_danisaq_a4ad3a", "Sizinlə danışaq?")}</h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  {tr("mentalhealthtracker_qisa_sorgu_ile_veziyyeti_qiyme_97ab4c", "Q\u0131sa sor\u011Fu il\u0259 v\u0259ziyy\u0259ti qiym\u0259tl\u0259ndir\u0259k?")}
                </p>
                <Button
                size="sm"
                className="mt-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 border-0"
                onClick={() => setShowEPDS(true)}>
                  {tr("mentalhealthtracker_sorguya_basla_0563f3", "Sor\u011Fuya ba\u015Fla")}
                
              </Button>
              </div>
            </div>
          </motion.div>
        }

        {/* Today's Check-in */}
        <motion.div
          className="bg-card rounded-3xl shadow-lg border border-border/50 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}>
          
          <div className="bg-gradient-to-r from-teal-500 to-cyan-500 p-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Smile className="w-5 h-5" />
              {tr("mentalhealthtracker_bu_gun_necesen_26ad26", "Bu g\xFCn nec\u0259s\u0259n?")}
            </h3>
          </div>
          <div className="p-4">
            {todayCheckin ?
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-6">
              
                <motion.div
                className="text-7xl mb-3"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}>
                
                  {MOOD_LEVELS.find((m) => m.value === todayCheckin.mood_level)?.emoji}
                </motion.div>
                <p className="text-lg font-medium text-foreground">
                  {tr("mentalhealthtracker_bu_gun_ozunuzu_24fed0", "Bu g\xFCn \xF6z\xFCn\xFCz\xFC")} <span className="text-primary font-bold">{MOOD_LEVELS.find((m) => m.value === todayCheckin.mood_level)?.label.toLowerCase()}</span> hiss edirsiniz
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {tr("mentalhealthtracker_qeyd_etdiyiniz_ucun_tesekkurle_52b458", "\u2728 Qeyd etdiyiniz \xFC\xE7\xFCn t\u0259\u015F\u0259kk\xFCrl\u0259r!")}
                </p>
              </motion.div> :

            <div className="space-y-4">
                <div className="flex justify-between items-end py-2">
                  {MOOD_LEVELS.map((mood, index) =>
                <motion.button
                  key={mood.value}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleMoodSelect(mood.value)}
                  disabled={addMoodCheckin.isPending}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all hover:scale-110 ${mood.bg}`}
                  whileTap={{ scale: 0.95 }}>
                  
                      <span className="text-3xl">{mood.emoji}</span>
                      <span className="text-[10px] font-bold">{mood.label}</span>
                    </motion.button>
                )}
                </div>
                <div>
                  <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={tr("mentalhealthtracker_i_steyirsinizse_qisa_qeyd_elave_edin_9043bb", "İstəyirsinizsə, qısa qeyd əlavə edin...")}
                  className="h-16 resize-none rounded-2xl border-2" />
                
                </div>
              </div>
            }
          </div>
        </motion.div>

        {/* Weekly Mood Chart */}
        {moodCheckins.length > 0 &&
        <motion.div
          className="bg-card rounded-3xl p-5 shadow-lg border border-border/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}>
          
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-500" />
              {tr("mentalhealthtracker_son_7_gun_1d4103", "Son 7 G\xFCn")}
            </h3>
            <div className="flex items-end justify-between h-28 gap-2">
              {last7Days.map((day, i) =>
            <motion.div
              key={i}
              className="flex-1 flex flex-col items-center gap-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}>
              
                  <div
                className={`w-full rounded-xl transition-all ${
                day.mood > 0 ?
                `bg-gradient-to-t ${MOOD_LEVELS[day.mood - 1]?.gradient}` :
                'bg-muted'}`
                }
                style={{ height: day.mood > 0 ? `${day.mood / 5 * 100}%` : '15%' }} />
              
                  <span className="text-[10px] text-muted-foreground font-medium">{day.day}</span>
                </motion.div>
            )}
            </div>
            {moodTrend !== null &&
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border border-teal-200 dark:border-teal-800">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <span className="text-3xl">{MOOD_LEVELS.find((m) => m.value === Math.round(moodTrend))?.emoji}</span>
                  <span className="font-bold text-lg text-foreground">Ortalama: {moodTrend.toFixed(1)}/5</span>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {moodTrend >= 4 ? tr("mentalhealthtracker_ela_gedir_ozunuze_qaygi_goster_f76926", "\uD83C\uDF1F \u018Fla gedir! \xD6z\xFCn\xFCz\u0259 qay\u011F\u0131 g\xF6st\u0259rm\u0259y\u0259 davam edin.") :
              moodTrend >= 3 ? tr("mentalhealthtracker_yaxsi_gedir_ozunuze_vaxt_ayiri_a89726", "\uD83D\uDCAA Yax\u015F\u0131 gedir. \xD6z\xFCn\xFCz\u0259 vaxt ay\u0131r\u0131n.") : tr("mentalhealthtracker_biraz_cetin_dovr_kecirirsiniz__85fe81", "\uD83D\uDC9D Biraz \xE7\u0259tin d\xF6vr ke\xE7irirsiniz. Yard\u0131m ist\u0259m\u0259kd\u0259n \xE7\u0259kinm\u0259yin.")
              }
                </p>
              </div>
          }
          </motion.div>
        }

        {/* Action Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Breathing Exercise */}
          <motion.button
            onClick={() => setShowBreathing(true)}
            className="bg-card rounded-2xl p-4 shadow-sm border border-border/50 text-left hover:shadow-md transition-shadow"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileTap={{ scale: 0.98 }}>
            
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center mb-3 shadow-lg">
              <Wind className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-foreground">{tr("mentalhealthtracker_nefes_mesqi_8d98bb", "Nəfəs Məşqi")}</h3>
            <p className="text-xs text-muted-foreground mt-1">{tr("mentalhealthtracker_rahatlama_ve_stress_azaltma_1a97bc", "Rahatlama və stress azaltma")}</p>
          </motion.button>

          {/* EPDS Assessment */}
          <motion.button
            onClick={() => setShowEPDS(true)}
            className="bg-card rounded-2xl p-4 shadow-sm border border-border/50 text-left hover:shadow-md transition-shadow"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileTap={{ scale: 0.98 }}>
            
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center mb-3 shadow-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-foreground">EPDS Testi</h3>
            <p className="text-xs text-muted-foreground mt-1">{tr("mentalhealthtracker_depressiya_riski_qiymetlendirme_2729fe", "Depressiya riski qiymətləndirmə")}</p>
          </motion.button>
        </div>

        {/* Previous Assessments */}
        {epdsAssessments.length > 0 &&
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}>
          
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-500" />
              {tr("mentalhealthtracker_kecmis_neticeler_072044", "Ke\xE7mi\u015F N\u0259tic\u0259l\u0259r")}
            </h3>
            <div className="space-y-2">
              {epdsAssessments.slice(0, 3).map((assessment, index) =>
            <motion.button
              key={assessment.id}
              onClick={() => setShowResult(assessment)}
              className="w-full bg-card rounded-2xl p-4 shadow-sm border border-border/50 flex items-center justify-between hover:shadow-md transition-shadow"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}>
              
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                      <Brain className="w-5 h-5 text-teal-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-foreground">
                        {format(new Date(assessment.completed_at), 'd MMMM yyyy', { locale: getCurrentDateLocale() })}
                      </p>
                      <p className="text-xs text-muted-foreground">Bal: {assessment.total_score}/30</p>
                    </div>
                  </div>
                  <Badge className={`${getRiskColor(assessment.risk_level)} border`}>
                    {getRiskLabel(assessment.risk_level)}
                  </Badge>
                </motion.button>
            )}
            </div>
          </motion.div>
        }

        {/* Emergency Resources */}
        {emergencyResources.length > 0 &&
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}>
          
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <Phone className="w-5 h-5 text-red-500" />
              {tr("mentalhealthtracker_tecili_yardim_283100", "T\u0259cili Yard\u0131m")}
            </h3>
            <div className="space-y-2">
              {emergencyResources.map((resource) =>
            <div key={resource.id} className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 border border-red-200 dark:border-red-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-red-700 dark:text-red-300">{resource.name_az}</p>
                      <p className="text-xs text-red-600 dark:text-red-400">{resource.description_az}</p>
                    </div>
                    {resource.phone &&
                <Button size="sm" className="bg-gradient-to-r from-red-500 to-rose-600 border-0" asChild>
                        <a href={`tel:${resource.phone}`}>
                          <Phone className="w-4 h-4 mr-1" />
                          {resource.phone}
                        </a>
                      </Button>
                }
                  </div>
                </div>
            )}
            </div>
          </motion.div>
        }

        {/* Other Resources */}
        {otherResources.length > 0 &&
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}>
          
            <h3 className="font-bold text-foreground mb-3">{tr("mentalhealthtracker_destek_resurslari_345241", "Dəstək Resursları")}</h3>
            <div className="space-y-2">
              {otherResources.map((resource) =>
            <div key={resource.id} className="bg-card rounded-2xl p-4 shadow-sm border border-border/50">
                  <p className="font-bold text-foreground">{resource.name_az}</p>
                  <p className="text-xs text-muted-foreground">{resource.description_az}</p>
                  <div className="flex gap-2 mt-3">
                    {resource.phone &&
                <Button size="sm" variant="outline" className="rounded-xl" asChild>
                        <a href={`tel:${resource.phone}`}>
                          <Phone className="w-3.5 h-3.5 mr-1" />
                          {tr("mentalhealthtracker_zeng_et_15094d", "Z\u0259ng et")}
                        </a>
                      </Button>
                }
                    {resource.website &&
                <Button size="sm" variant="outline" className="rounded-xl" asChild>
                        <a href={resource.website} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3.5 h-3.5 mr-1" />
                          Sayt
                        </a>
                      </Button>
                }
                  </div>
                </div>
            )}
            </div>
          </motion.div>
        }
      </div>

      {/* Breathing Exercise Modal */}
      <Dialog open={showBreathing} onOpenChange={setShowBreathing}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wind className="w-5 h-5 text-cyan-500" />
              {tr("mentalhealthtracker_nefes_mesqi_8d98bb", "N\u0259f\u0259s M\u0259\u015Fqi")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {breathingPhase === 'idle' ?
            <>
                <div className="space-y-3">
                  {BREATHING_EXERCISES.map((ex, i) =>
                <motion.button
                  key={i}
                  onClick={() => setSelectedExercise(ex)}
                  className={`w-full p-4 rounded-2xl text-left transition-all flex items-center gap-3 ${
                  selectedExercise.name === ex.name ?
                  'bg-teal-100 dark:bg-teal-900/30 border-2 border-teal-500' :
                  'bg-muted hover:bg-muted/80 border-2 border-transparent'}`
                  }
                  whileTap={{ scale: 0.98 }}>
                  
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-2xl">
                        {ex.emoji}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-foreground">{ex.name}</p>
                        <p className="text-xs text-muted-foreground">{ex.description}</p>
                        <p className="text-xs mt-1 text-teal-600 dark:text-teal-400 font-medium">
                          {tr("mentalhealthtracker_nefes_al_56f3c5", "N\u0259f\u0259s al:")} {ex.inhale}s • Saxla: {ex.hold}s • Burax: {ex.exhale}s
                        </p>
                      </div>
                    </motion.button>
                )}
                </div>
                <Button
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-600 border-0"
                onClick={startBreathing}>
                
                  <Wind className="w-5 h-5 mr-2" />
                  {tr("mentalhealthtracker_basla_4820bc", "Ba\u015Fla")}
                </Button>
              </> :

            <div className="text-center py-8">
                <motion.div
                className="w-44 h-44 mx-auto rounded-full flex items-center justify-center shadow-xl"
                animate={{
                  scale: breathingPhase === 'inhale' ? 1.4 : breathingPhase === 'exhale' ? 1 : 1.4,
                  backgroundColor: breathingPhase === 'inhale' ? '#14b8a6' : breathingPhase === 'hold' ? '#0891b2' : '#10b981'
                }}
                transition={{
                  duration: breathingPhase === 'inhale' ? selectedExercise.inhale :
                  breathingPhase === 'hold' ? selectedExercise.hold :
                  selectedExercise.exhale
                }}>
                
                  <span className="text-white text-2xl font-bold">
                    {breathingPhase === 'inhale' ? tr("mentalhealthtracker_nefes_al_50ff18", "N\u0259f\u0259s al") :
                  breathingPhase === 'hold' ? 'Saxla' : 'Burax'}
                  </span>
                </motion.div>
                <p className="mt-8 text-xl font-bold text-foreground">
                  {tr("mentalhealthtracker_dovre_a52cde", "D\xF6vr\u0259:")} {breathingCount + 1} / 4
                </p>
                <Button variant="outline" className="mt-4 rounded-xl" onClick={() => setBreathingPhase('idle')}>
                  {tr("mentalhealthtracker_dayandir_b2ea06", "Dayand\u0131r")}
                </Button>
              </div>
            }
          </div>
        </DialogContent>
      </Dialog>

      {/* EPDS Quiz Modal */}
      <Dialog open={showEPDS} onOpenChange={setShowEPDS}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-teal-500" />
              {tr("mentalhealthtracker_epds_sorgusu_564f52", "EPDS Sor\u011Fusu")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {EPDS_QUESTIONS.map((_, i) =>
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                i <= currentQuestion ? 'bg-gradient-to-r from-teal-500 to-cyan-500' : 'bg-muted'}`
                } />

              )}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Sual {currentQuestion + 1} / {EPDS_QUESTIONS.length}
            </p>
            
            <AnimatePresence mode="wait">
              {EPDS_QUESTIONS[currentQuestion] &&
              <motion.div
                key={currentQuestion}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}>
                
                  <p className="font-bold mb-4 text-lg text-foreground">{EPDS_QUESTIONS[currentQuestion].question}</p>
                  <div className="space-y-2">
                    {EPDS_QUESTIONS[currentQuestion].options.map((option) => {
                    const isSelected = epdsAnswers[EPDS_QUESTIONS[currentQuestion].id] === option.value;
                    return (
                      <motion.button
                        key={option.value}
                        type="button"
                        className={`w-full flex items-center space-x-3 p-4 rounded-2xl transition-all text-left border-2
                            ${isSelected ?
                        'bg-teal-100 dark:bg-teal-900/30 border-teal-500' :
                        'bg-muted/50 hover:bg-muted border-transparent'}`
                        }
                        onClick={() => handleEPDSAnswer(EPDS_QUESTIONS[currentQuestion].id, option.value)}
                        whileTap={{ scale: 0.98 }}>
                        
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-teal-500 bg-teal-500' : 'border-muted-foreground/30'}`
                        }>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <span className="flex-1 font-medium">{option.label}</span>
                        </motion.button>);

                  })}
                  </div>
                </motion.div>
              }
            </AnimatePresence>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={goToPrevQuestion}
                disabled={currentQuestion === 0}>
                
                <ChevronLeft className="w-4 h-4 mr-1" />
                Geri
              </Button>
              
              {currentQuestion < EPDS_QUESTIONS.length - 1 ?
              <Button
                className="flex-1 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 border-0"
                onClick={goToNextQuestion}
                disabled={epdsAnswers[EPDS_QUESTIONS[currentQuestion].id] === undefined}>
                  {tr("mentalhealthtracker_novbeti_6e8661", "N\xF6vb\u0259ti")}
                  
                <ChevronRight className="w-4 h-4 ml-1" />
                </Button> :

              <Button
                className="flex-1 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 border-0"
                onClick={handleSubmitEPDS}
                disabled={submitEPDS.isPending || Object.keys(epdsAnswers).length < EPDS_QUESTIONS.length}>
                  {tr("mentalhealthtracker_neticeni_gor_d2fef0", "N\u0259tic\u0259ni G\xF6r")}
                
              </Button>
              }
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Result Modal */}
      <Dialog open={!!showResult} onOpenChange={() => setShowResult(null)}>
        <DialogContent className="max-w-md">
          {showResult &&
          <>
              <DialogHeader>
                <DialogTitle className="text-center">{tr("mentalhealthtracker_neticeniz_d14591", "Nəticəniz")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 text-center">
                <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-lg font-bold ${getRiskColor(showResult.risk_level)} border`}>
                
                  {showResult.risk_level === 'low' ? <CheckCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                  {getRiskLabel(showResult.risk_level)}
                </motion.div>
                
                <div>
                  <p className="text-6xl font-black text-foreground">{showResult.total_score}</p>
                  <p className="text-muted-foreground">/ 30 bal</p>
                </div>

                <p className="text-sm bg-muted p-4 rounded-2xl">{showResult.recommendation}</p>

                {showResult.risk_level === 'high' && emergencyResources.length > 0 &&
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-200 dark:border-red-800">
                    <p className="text-sm font-bold text-red-700 dark:text-red-300 mb-3">
                      {tr("mentalhealthtracker_zehmet_olmasa_mutexessisle_ela_07b456", "\uD83C\uDD98 Z\u0259hm\u0259t olmasa m\xFCt\u0259x\u0259ssisl\u0259 \u0259laq\u0259 saxlay\u0131n:")}
                    </p>
                    {emergencyResources.map((r) =>
                <Button key={r.id} className="w-full bg-gradient-to-r from-red-500 to-rose-600 border-0" asChild>
                        <a href={`tel:${r.phone}`}>
                          <Phone className="w-4 h-4 mr-2" />
                          {r.name_az}: {r.phone}
                        </a>
                      </Button>
                )}
                  </div>
              }
              </div>
            </>
          }
        </DialogContent>
      </Dialog>
    </div>);

};

export default MentalHealthTracker;