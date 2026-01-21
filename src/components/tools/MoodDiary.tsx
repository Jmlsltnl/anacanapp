import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Heart, Calendar, Plus, 
  Sparkles, TrendingUp
} from 'lucide-react';
import { useDailyLogs } from '@/hooks/useDailyLogs';
import { hapticFeedback } from '@/lib/native';

interface MoodDiaryProps {
  onBack: () => void;
}

const moodEmojis = [
  { value: 1, emoji: '😢', label: 'Çox pis', color: 'bg-red-100 border-red-300' },
  { value: 2, emoji: '😔', label: 'Pis', color: 'bg-orange-100 border-orange-300' },
  { value: 3, emoji: '😐', label: 'Normal', color: 'bg-yellow-100 border-yellow-300' },
  { value: 4, emoji: '🙂', label: 'Yaxşı', color: 'bg-lime-100 border-lime-300' },
  { value: 5, emoji: '😊', label: 'Əla', color: 'bg-green-100 border-green-300' },
];

const symptomOptions = [
  { id: 'tired', label: 'Yorğunluq', emoji: '😴' },
  { id: 'nausea', label: 'Ürəkbulanma', emoji: '🤢' },
  { id: 'headache', label: 'Baş ağrısı', emoji: '🤕' },
  { id: 'happy', label: 'Xoşbəxtlik', emoji: '🥰' },
  { id: 'anxious', label: 'Narahatlıq', emoji: '😰' },
  { id: 'energetic', label: 'Enerjili', emoji: '⚡' },
  { id: 'emotional', label: 'Emosional', emoji: '🥺' },
  { id: 'calm', label: 'Sakit', emoji: '😌' },
];

const MoodDiary = ({ onBack }: MoodDiaryProps) => {
  const [activeTab, setActiveTab] = useState<'log' | 'history' | 'insights'>('log');
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  
  const { logs, todayLog, loading, addLog } = useDailyLogs();

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
    setSelectedSymptoms(prev => 
      prev.includes(symptomId) 
        ? prev.filter(s => s !== symptomId)
        : [...prev, symptomId]
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
    });
    
    setActiveTab('history');
  };

  const averageMood = logs.length > 0 
    ? (logs.reduce((sum, e) => sum + (e.mood || 0), 0) / logs.filter(l => l.mood).length).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-fuchsia-50 to-background pb-28">
      {/* Header */}
      <div className="bg-gradient-to-br from-fuchsia-500 to-pink-600 px-5 pt-4 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <motion.button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
          <div>
            <h1 className="text-xl font-bold text-white">Əhval Gündəliyi</h1>
            <p className="text-white/80 text-sm">Emosiyalarınızı izləyin</p>
          </div>
        </div>

        {/* Mood Summary */}
        <motion.div 
          className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/20"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Ortalama əhval</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-3xl">{logs[0]?.mood ? moodEmojis.find(m => m.value === logs[0].mood)?.emoji : '😊'}</span>
                <span className="text-2xl font-bold text-white">{averageMood}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-sm">Bu həftə</p>
              <p className="text-xl font-bold text-white">{logs.length} qeyd</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="px-5 -mt-4">
        <div className="bg-card rounded-2xl p-1.5 flex gap-1 shadow-lg">
          {[
            { id: 'log', label: 'Qeyd', icon: Plus },
            { id: 'history', label: 'Tarixçə', icon: Calendar },
            { id: 'insights', label: 'Analiz', icon: TrendingUp },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  activeTab === tab.id 
                    ? 'bg-primary text-white shadow-md' 
                    : 'text-muted-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5 mt-6">
        <AnimatePresence mode="wait">
          {activeTab === 'log' && (
            <motion.div
              key="log"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Mood Selection */}
              <div className="bg-card rounded-3xl p-6 shadow-card border border-border/50">
                <h2 className="font-bold text-lg mb-4 text-center">Bu gün özünüzü necə hiss edirsiniz?</h2>
                <div className="flex justify-between">
                  {moodEmojis.map((mood, index) => (
                    <motion.button
                      key={mood.value}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => setSelectedMood(mood.value)}
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border-2 transition-all ${
                        selectedMood === mood.value 
                          ? `${mood.color} scale-110 shadow-lg` 
                          : 'bg-muted/30 border-transparent'
                      }`}
                      whileTap={{ scale: 0.95 }}
                    >
                      {mood.emoji}
                    </motion.button>
                  ))}
                </div>
                {selectedMood && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mt-3 text-primary font-medium"
                  >
                    {moodEmojis.find(m => m.value === selectedMood)?.label}
                  </motion.p>
                )}
              </div>

              {/* Symptoms */}
              <div className="bg-card rounded-3xl p-6 shadow-card border border-border/50">
                <h2 className="font-bold text-lg mb-4">Simptomlar</h2>
                <div className="flex flex-wrap gap-2">
                  {symptomOptions.map(symptom => (
                    <motion.button
                      key={symptom.id}
                      onClick={() => toggleSymptom(symptom.id)}
                      className={`px-4 py-2 rounded-full flex items-center gap-2 text-sm transition-all ${
                        selectedSymptoms.includes(symptom.id)
                          ? 'bg-primary text-white'
                          : 'bg-muted/50 text-muted-foreground'
                      }`}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span>{symptom.emoji}</span>
                      {symptom.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="bg-card rounded-3xl p-6 shadow-card border border-border/50">
                <h2 className="font-bold text-lg mb-4">Qeydlər</h2>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Bu gün haqqında yazmaq istədikləriniz..."
                  className="w-full h-24 p-4 rounded-2xl bg-muted/30 resize-none outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Save Button */}
              <motion.button
                onClick={handleSave}
                disabled={selectedMood === null}
                className="w-full gradient-primary text-white font-bold py-4 rounded-2xl shadow-elevated disabled:opacity-50"
                whileTap={{ scale: 0.98 }}
              >
                Yadda saxla
              </motion.button>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <h2 className="font-bold text-lg">Son qeydlər</h2>
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : logs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Hələ qeyd yoxdur</p>
              ) : (
                logs.slice(0, 10).map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-card rounded-2xl p-4 shadow-card border border-border/50"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-fuchsia-50 flex items-center justify-center text-2xl">
                        {entry.mood ? moodEmojis.find(m => m.value === entry.mood)?.emoji : '😐'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold">
                            {new Date(entry.log_date).toLocaleDateString('az-AZ', { weekday: 'long', day: 'numeric', month: 'short' })}
                          </p>
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Heart 
                                key={i}
                                className={`w-4 h-4 ${i < (entry.mood || 0) ? 'text-fuchsia-500 fill-current' : 'text-gray-200'}`}
                              />
                            ))}
                          </div>
                        </div>
                        {entry.notes && (
                          <p className="text-sm text-muted-foreground mb-2">{entry.notes}</p>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {(entry.symptoms || []).map(s => {
                            const symptom = symptomOptions.find(opt => opt.id === s);
                            return symptom ? (
                              <span key={s} className="text-xs bg-fuchsia-50 text-fuchsia-600 px-2 py-0.5 rounded-full">
                                {symptom.emoji} {symptom.label}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="bg-card rounded-3xl p-6 shadow-card border border-border/50">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-6 h-6 text-fuchsia-500" />
                  <h2 className="font-bold text-lg">AI Analizi</h2>
                </div>
                <p className="text-muted-foreground mb-4">
                  Son bir həftədə əhvalınız ümumiyyətlə yaxşı olub. Ən çox qeyd etdiyiniz simptomları izləyin.
                </p>
                <div className="bg-fuchsia-50 rounded-2xl p-4 border border-fuchsia-100">
                  <p className="text-fuchsia-800 text-sm">
                    💡 <strong>Məsləhət:</strong> Yorğunluq hiss etdiyiniz günlərdə istirahət etməyi unutmayın. Hamiləlik zamanı bədəninizin ehtiyaclarına qulaq asmaq vacibdir.
                  </p>
                </div>
              </div>

              {/* Weekly Mood Chart */}
              <div className="bg-card rounded-3xl p-6 shadow-card border border-border/50">
                <h3 className="font-bold mb-4">Həftəlik əhval trendi</h3>
                <div className="flex items-end justify-between h-32 px-2">
                  {['B.e.', 'Ç.a.', 'Ç.', 'C.a.', 'C.', 'Ş.', 'B.'].map((day, i) => {
                    // Use actual log data if available
                    const dayLog = logs.find(l => new Date(l.log_date).getDay() === (i + 1) % 7);
                    const height = dayLog?.mood ? (dayLog.mood / 5) * 100 : 50;
                    return (
                      <div key={day} className="flex flex-col items-center gap-2">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${height}%` }}
                          transition={{ delay: i * 0.1, duration: 0.5 }}
                          className="w-8 bg-gradient-to-t from-fuchsia-500 to-pink-400 rounded-t-lg"
                        />
                        <span className="text-xs text-muted-foreground">{day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MoodDiary;
