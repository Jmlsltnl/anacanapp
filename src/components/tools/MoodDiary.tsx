import { useState, forwardRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Heart, Calendar, Plus,
  Sparkles, TrendingUp, Loader2 } from
'lucide-react';
import { useDailyLogs } from '@/hooks/useDailyLogs';
import { hapticFeedback } from '@/lib/native';
import { useMoodOptions, useSymptoms } from '@/hooks/useDynamicConfig';
import { useUserStore } from '@/store/userStore';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useScreenAnalytics, trackEvent } from '@/hooks/useScreenAnalytics';
import { tr } from "@/lib/tr";
import MedicalDisclaimer from '@/components/MedicalDisclaimer';

interface MoodDiaryProps {
  onBack: () => void;
}

const MoodDiary = forwardRef<HTMLDivElement, MoodDiaryProps>(({ onBack }, ref) => {
  useScrollToTop();
  useScreenAnalytics('MoodDiary', 'Tools');

  const [activeTab, setActiveTab] = useState<'log' | 'history' | 'insights'>('log');
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const { logs, todayLog, loading: logsLoading, addLog } = useDailyLogs();
  const { lifeStage, language } = useUserStore();
  const { data: dbMoods, isLoading: moodsLoading } = useMoodOptions();
  const { data: dbSymptoms, isLoading: symptomsLoading } = useSymptoms(lifeStage);

  const locale = language === 'en' ? 'en-US' : language === 'ru' ? 'ru-RU' : 'az-AZ';

  // Map DB data to component format
  const moodEmojis = useMemo(() => {
    if (!dbMoods || dbMoods.length === 0) {
      return [
      { value: 1, emoji: '😢', label: tr("mooddiary_cox_pis_e041c5", 'Çox pis'), color: 'bg-red-100 border-red-300' },
      { value: 2, emoji: '😔', label: tr("mooddiary_pis_3c7a2d", "Pis"), color: 'bg-orange-100 border-orange-300' },
      { value: 3, emoji: '😐', label: tr("common_normal", "Normal"), color: 'bg-yellow-100 border-yellow-300' },
      { value: 4, emoji: '🙂', label: tr("mooddiary_yaxsi_9d8595", 'Yaxşı'), color: 'bg-lime-100 border-lime-300' },
      { value: 5, emoji: '😊', label: tr("mooddiary_ela_720a0e", 'Əla'), color: 'bg-green-100 border-green-300' }];

    }
    return dbMoods.map((m) => ({
      value: m.value,
      emoji: m.emoji,
      label: m.label,
      color: m.color_class || 'bg-gray-100 border-gray-300'
    }));
  }, [dbMoods]);

  const symptomOptions = useMemo(() => {
    if (!dbSymptoms || dbSymptoms.length === 0) {
      return [
      { id: 'tired', label: tr("mooddiary_yorgunluq_c68d62", 'Yorğunluq'), emoji: '😴' },
      { id: 'nausea', label: tr("mooddiary_urekbulanma_a42830", 'Ürəkbulanma'), emoji: '🤢' },
      { id: 'headache', label: tr("mooddiary_bas_agrisi_ff6f4c", 'Baş ağrısı'), emoji: '🤕' }];

    }
    return dbSymptoms.map((s) => ({
      id: s.symptom_key,
      label: s.label,
      emoji: s.icon || '🩺'
    }));
  }, [dbSymptoms]);

  // Initialize from today's log if exists
  useState(() => {
    if (todayLog) {
      setSelectedMood(todayLog.mood || null);
      setSelectedSymptoms(todayLog.symptoms || []);
      setNotes(todayLog.notes || '');
    }
  });

  const toggleSymptom = async (symptomId: string) => {
    await hapticFeedback.light();
    setSelectedSymptoms((prev) =>
    prev.includes(symptomId) ?
    prev.filter((s) => s !== symptomId) :
    [...prev, symptomId]
    );
  };

  const handleSave = async () => {
    if (selectedMood === null) return;

    await hapticFeedback.medium();
    await addLog({
      log_date: new Date().toISOString().split('T')[0],
      mood: selectedMood,
      symptoms: selectedSymptoms,
      notes: notes || null,
      water_intake: todayLog?.water_intake || null,
      temperature: todayLog?.temperature || null,
      bleeding: todayLog?.bleeding || null
    });

    setActiveTab('history');
  };

  const averageMood = logs.length > 0 ?
  (logs.reduce((sum, e) => sum + (e.mood || 0), 0) / logs.filter((l) => l.mood).length).toFixed(1) :
  0;

  const loading = logsLoading || moodsLoading || symptomsLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>);

  }

  return (
    <div className="min-h-screen bg-background" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 100px)' }}>
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
                <Heart className="w-5 h-5 text-fuchsia-500" />
                {tr("mooddiary_ehval_gundeliyi_831844", "\u018Fhval G\xFCnd\u0259liyi")}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        <MedicalDisclaimer variant="compact" className="mb-4" />
        {/* Mood Summary */}
        <motion.div
          className="bg-fuchsia-50 dark:bg-fuchsia-500/10 rounded-2xl p-4 border border-fuchsia-100 dark:border-fuchsia-500/20 mb-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-fuchsia-600/70 dark:text-fuchsia-400/70 text-xs font-medium">{tr("mooddiary_ortalama_ehval_72856f", "Ortalama əhval")}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-4xl">{logs[0]?.mood ? moodEmojis.find((m) => m.value === logs[0].mood)?.emoji : '😊'}</span>
                <span className="text-3xl font-black text-fuchsia-600 dark:text-fuchsia-400">{averageMood}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-fuchsia-600/70 dark:text-fuchsia-400/70 text-xs font-medium">{tr("mooddiary_bu_hefte_a5f60b", "Bu həftə")}</p>
              <p className="text-2xl font-black text-fuchsia-600 dark:text-fuchsia-400">{logs.length} {tr("common_qeyd", "qeyd")}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="px-3 -mt-3">
        <div className="bg-card rounded-xl p-1 flex gap-1 shadow-lg">
          {[
          { id: 'log', label: tr("mooddiary_qeyd", 'Qeyd'), icon: Plus },
          { id: 'history', label: tr("mooddiary_tarixce_b09a14", 'Tarixçə'), icon: Calendar },
          { id: 'insights', label: tr("mooddiary_analiz", 'Analiz'), icon: TrendingUp }].
          map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === tab.id ?
                'bg-primary text-white shadow-md' :
                'text-muted-foreground'}`
                }>
                
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>);

          })}
        </div>
      </div>

      <div className="px-4 mt-5">
        <AnimatePresence mode="wait">
          {activeTab === 'log' &&
          <motion.div
            key="log"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6">
            
              {/* Mood Selection */}
              <div className="bg-card rounded-3xl p-5 shadow-card border border-border/50">
                <h2 className="font-bold text-base mb-3 text-center">{tr("mooddiary_bu_gun_ozunuzu_nece_hiss_edirsiniz_b2d818", "Bu gün özünüzü necə hiss edirsiniz?")}</h2>
                <div className="flex justify-between">
                  {moodEmojis.map((mood, index) =>
                <motion.button
                  key={mood.value}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedMood(mood.value)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl border-2 transition-all ${
                  selectedMood === mood.value ?
                  `${mood.color} scale-110 shadow-lg` :
                  'bg-muted/30 border-transparent'}`
                  }
                  whileTap={{ scale: 0.95 }}>
                  
                      {mood.emoji}
                    </motion.button>
                )}
                </div>
                {selectedMood &&
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mt-3 text-primary font-medium">
                
                    {moodEmojis.find((m) => m.value === selectedMood)?.label}
                  </motion.p>
              }
              </div>

              {/* Symptoms */}
              <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
                <h2 className="font-bold text-sm mb-2.5">{tr("untranslated_simptomlar_xhm7bx", "Simptomlar")}</h2>
                <div className="flex flex-wrap gap-1.5">
                  {symptomOptions.map((symptom) =>
                <motion.button
                  key={symptom.id}
                  onClick={() => toggleSymptom(symptom.id)}
                  className={`px-2.5 py-1 rounded-full flex items-center gap-1 text-[11px] font-medium transition-all ${
                  selectedSymptoms.includes(symptom.id) ?
                  'bg-primary text-white' :
                  'bg-muted/50 text-muted-foreground'}`
                  }
                  whileTap={{ scale: 0.95 }}>
                  
                      <span className="text-xs">{symptom.emoji}</span>
                      {symptom.label}
                    </motion.button>
                )}
                </div>
              </div>

              {/* Notes */}
              <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
                <h2 className="font-bold text-sm mb-3">{tr("mooddiary_qeydler_a7a98b", "Qeydlər")}</h2>
                <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={tr("mooddiary_bu_gun_haqqinda_yazmaq_istedikleriniz_1e2d2d", "Bu gün haqqında yazmaq istədikləriniz...")}
                  className="w-full bg-muted/30 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  rows={2} />
              
              </div>

              {/* Save Button */}
              <motion.button
              onClick={handleSave}
              disabled={selectedMood === null}
              className="w-full gradient-primary text-white font-bold py-4 rounded-2xl shadow-elevated disabled:opacity-50"
              whileTap={{ scale: 0.98 }}>{tr("untranslated_yadda_saxla_bpdu9v", "Yadda saxla")}</motion.button>
            </motion.div>
          }

          {activeTab === 'history' &&
          <motion.div
            key="history"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4">
            
              <h2 className="font-bold text-lg">{tr("mooddiary_son_qeydler_181e41", "Son qeydlər")}</h2>
                {logs.length === 0 ?
            <p className="text-center text-muted-foreground py-8">{tr("mooddiary_hele_qeyd_yoxdur_a3d826", "Hələ qeyd yoxdur")}</p> :

            logs.slice(0, 10).map((entry, index) =>
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-2xl p-3 shadow-sm border border-border/50">
              
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-fuchsia-100 dark:bg-fuchsia-900/30 flex items-center justify-center text-xl">
                        {entry.mood ? moodEmojis.find((m) => m.value === entry.mood)?.emoji : '😐'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-xs text-foreground">
                            {new Date(entry.log_date).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'short' })}
                          </p>
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) =>
                      <Heart
                        key={i}
                        className={`w-4 h-4 ${i < (entry.mood || 0) ? 'text-fuchsia-500 fill-current' : 'text-muted-foreground/30'}`} />

                      )}
                          </div>
                        </div>
                        {entry.notes &&
                  <p className="text-sm text-muted-foreground mb-2">{entry.notes}</p>
                  }
                        <div className="flex flex-wrap gap-1">
                          {(entry.symptoms || []).map((s) => {
                      const symptom = symptomOptions.find((opt) => opt.id === s);
                      return symptom ?
                      <span key={s} className="text-xs bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400 px-2 py-0.5 rounded-full">
                                {symptom.emoji} {symptom.label}
                              </span> :
                      null;
                    })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
            )
            }
            </motion.div>
          }

          {activeTab === 'insights' &&
          <motion.div
            key="insights"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4">
            
              <div className="bg-card rounded-3xl p-6 shadow-card border border-border/50">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-6 h-6 text-fuchsia-500" />
                  <h2 className="font-bold text-lg">{tr("mooddiary_ai_analizi_070626", "AI Analizi")}</h2>
                </div>
                <p className="text-muted-foreground mb-4">
                  {tr("mooddiary_son_bir_heftede_ehvaliniz_umum_c383f6", "Son bir h\u0259ft\u0259d\u0259 \u0259hval\u0131n\u0131z \xFCmumiyy\u0259tl\u0259 yax\u015F\u0131 olub. \u018Fn \xE7ox qeyd etdiyiniz simptomlar\u0131 izl\u0259yin.")}
                </p>
                <div className="bg-fuchsia-100 dark:bg-fuchsia-900/30 rounded-2xl p-4 border border-fuchsia-200 dark:border-fuchsia-800/50">
                  <p className="text-fuchsia-800 dark:text-fuchsia-200 text-sm">
                    💡 <strong>{tr("mooddiary_meslehet_6a93f2", "Məsləhət:")}</strong> {tr("mooddiary_yorgunluq_hiss_etdiyiniz_gunle_478815", "Yor\u011Funluq hiss etdiyiniz g\xFCnl\u0259rd\u0259 istirah\u0259t etm\u0259yi unutmay\u0131n. Hamil\u0259lik zaman\u0131 b\u0259d\u0259ninizin ehtiyaclar\u0131na qulaq asmaq vacibdir.")}
                  </p>
                </div>
              </div>

              {/* Weekly Mood Chart */}
              <div className="bg-card rounded-3xl p-6 shadow-card border border-border/50">
                <h3 className="font-bold mb-4 text-foreground">{tr("mooddiary_heftelik_ehval_trendi_5796d9", "Həftəlik əhval trendi")}</h3>
                <div className="flex items-end justify-between h-32 px-2">
                  {Array.from({ length: 7 }).map((_, i) => {
                  const day = new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: 'short' });
                  const dayLog = logs.find((l) => new Date(l.log_date).getDay() === (i + 1) % 7);
                  const height = dayLog?.mood ? dayLog.mood / 5 * 100 : 50;
                  return (
                    <div key={i} className="flex flex-col items-center gap-2">
                        <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ delay: i * 0.1, duration: 0.5 }}
                        className="w-8 bg-gradient-to-t from-fuchsia-500 to-pink-400 rounded-t-lg" />
                      
                        <span className="text-xs text-muted-foreground">{day}</span>
                      </div>);

                })}
                </div>
              </div>
            </motion.div>
          }
        </AnimatePresence>
      </div>
    </div>);

});

MoodDiary.displayName = 'MoodDiary';

export default MoodDiary;