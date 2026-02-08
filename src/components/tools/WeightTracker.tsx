import { useState, useEffect, forwardRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, TrendingUp, TrendingDown, Minus, Scale, Loader2, Sparkles, Target, Activity, Calendar, Trash2, RotateCcw, MoreVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useWeightEntries } from '@/hooks/useWeightEntries';
import { useWeightRecommendations } from '@/hooks/useDynamicTools';
import { useUserStore } from '@/store/userStore';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { supabase } from '@/integrations/supabase/client';
import { formatDateAz, formatTimeAz } from '@/lib/date-utils';

interface WeightTrackerProps {
  onBack: () => void;
}

const WeightTracker = forwardRef<HTMLDivElement, WeightTrackerProps>(({ onBack }, ref) => {
  useScrollToTop();
  
  const { entries, loading, addEntry, getStats, deleteEntry, deleteAllEntries } = useWeightEntries();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const { getPregnancyData } = useUserStore();
  const [newWeight, setNewWeight] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const pregData = getPregnancyData();
  const currentWeek = pregData?.currentWeek || 20;
  const stats = getStats();
  
  const startWeight = stats?.startWeight || 60;
  const currentWeight = stats?.currentWeight || startWeight;
  const totalGain = stats?.totalGain || 0;
  
  const trimester = currentWeek <= 12 ? 1 : currentWeek <= 26 ? 2 : 3;
  const { data: recommendations } = useWeightRecommendations(trimester);
  
  const recommended = useMemo(() => {
    const rec = recommendations?.find(r => r.bmi_category === 'normal');
    if (rec) {
      return { min: Number(rec.min_gain_kg), max: Number(rec.max_gain_kg) };
    }
    if (trimester === 1) return { min: 0.5, max: 2 };
    if (trimester === 2) return { min: 4, max: 8 };
    return { min: 8, max: 14 };
  }, [recommendations, trimester]);
  
  const getStatus = () => {
    if (totalGain < recommended.min) return { status: 'low', text: 'Az', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', gradient: 'from-amber-400 to-orange-500' };
    if (totalGain > recommended.max) return { status: 'high', text: 'Çox', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', gradient: 'from-red-400 to-rose-500' };
    return { status: 'normal', text: 'Normal', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', gradient: 'from-emerald-400 to-green-500' };
  };

  const status = getStatus();

  useEffect(() => {
    const fetchAIAdvice = async () => {
      if (entries.length === 0) return;
      
      setAiLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('dr-anacan-chat', {
          body: {
            messages: [{
              role: 'user',
              content: `Çəki analizi: ${currentWeek}-ci həftə, başlanğıc: ${startWeight}kg, indi: ${currentWeight}kg, artım: ${totalGain}kg (tövsiyə: ${recommended.min}-${recommended.max}kg). Status: ${status.text}. QAYDALAR: 1) Salamlama yoxdur, birbaşa məsələyə keç. 2) Maksimum 1-2 cümlə. 3) Disclaimer/xəbərdarlıq yoxdur. 4) Yalnız praktik qısa məsləhət.`
            }],
            isWeightAnalysis: true
          }
        });
        
        if (data && !error) {
          setAiAdvice(data.message || data.content);
        }
      } catch (e) {
        console.error('AI advice error:', e);
      } finally {
        setAiLoading(false);
      }
    };
    
    fetchAIAdvice();
  }, [entries.length, currentWeek, totalGain]);

  const handleAddWeight = async () => {
    if (newWeight) {
      const weight = parseFloat(newWeight);
      if (!isNaN(weight) && weight > 0) {
        await addEntry(weight);
        setNewWeight('');
        setShowAddForm(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 dark:from-emerald-950/20 to-background pb-24">
      {/* Premium Header */}
      <div className="sticky top-0 z-20 isolate overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 pointer-events-none" />
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-8 right-8 w-32 h-32 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute bottom-4 left-8 w-24 h-24 rounded-full bg-cyan-300/30 blur-2xl" />
        </div>
        
        <div className="relative px-4 pt-4 pb-8 safe-area-top">
          <div className="flex items-center gap-3 mb-4 relative z-30">
            <motion.button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20"
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </motion.button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Scale className="w-5 h-5" />
                Çəki İzləyici
              </h1>
              <p className="text-white/80 text-sm">AI analiz ilə çəki takibi</p>
            </div>
            <motion.button
              onClick={() => setShowAddForm(true)}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 relative z-30"
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-5 h-5 text-white" />
            </motion.button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3">
            <motion.div
              className="bg-white/15 backdrop-blur-md rounded-2xl p-3 text-center border border-white/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Scale className="w-5 h-5 mx-auto mb-1 text-white/90" />
              <p className="text-2xl font-black text-white">{currentWeight}</p>
              <p className="text-xs text-white/70 font-medium">Hazırkı (kg)</p>
            </motion.div>
            <motion.div
              className="bg-white/15 backdrop-blur-md rounded-2xl p-3 text-center border border-white/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              title="Başlanğıc çəkidən fərq"
            >
              <Activity className="w-5 h-5 mx-auto mb-1 text-white/90" />
              <p className="text-2xl font-black text-white">{totalGain >= 0 ? '+' : ''}{totalGain.toFixed(1)}</p>
              <p className="text-xs text-white/70 font-medium">Fərq (kg)</p>
            </motion.div>
            <motion.div
              className="bg-white/15 backdrop-blur-md rounded-2xl p-3 text-center border border-white/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Target className="w-5 h-5 mx-auto mb-1 text-white/90" />
              <p className="text-2xl font-black text-white">{recommended.min}-{recommended.max}</p>
              <p className="text-xs text-white/70 font-medium">Tövsiyə (kg)</p>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4">
        {/* Status Card */}
        <motion.div
          className="bg-card rounded-3xl p-5 shadow-lg border border-border/50 mb-4"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${status.gradient} flex items-center justify-center shadow-lg`}>
              {status.status === 'normal' && <Minus className="w-8 h-8 text-white" />}
              {status.status === 'low' && <TrendingDown className="w-8 h-8 text-white" />}
              {status.status === 'high' && <TrendingUp className="w-8 h-8 text-white" />}
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Çəki statusu</p>
              <h3 className="text-2xl font-black text-foreground">{status.text}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Başlanğıc: {startWeight} kg → İndi: {currentWeight} kg
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{recommended.min} kg</span>
              <span>Tövsiyə olunan aralıq</span>
              <span>{recommended.max} kg</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden relative">
              <div 
                className={`h-full bg-gradient-to-r ${status.gradient} rounded-full transition-all`}
                style={{ width: `${Math.min((totalGain / recommended.max) * 100, 100)}%` }}
              />
              <div 
                className="absolute top-0 left-0 h-full border-r-2 border-dashed border-emerald-600"
                style={{ left: `${(recommended.min / recommended.max) * 100}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* AI Analysis */}
        <motion.div
          className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-3xl p-5 mb-4 border border-emerald-200 dark:border-emerald-800"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-foreground mb-1 flex items-center gap-2">
                AI Analiz
                {aiLoading && <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />}
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {aiLoading ? 'Analiz edilir...' : aiAdvice || 'Məlumat yüklənir...'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Progress Chart */}
        {entries.length > 0 && (
          <motion.div
            className="bg-card rounded-3xl p-5 shadow-lg border border-border/50 mb-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" />
              Son 7 qeyd
            </h3>
            <div className="h-36 flex items-end gap-2">
              {entries.slice(0, 7).reverse().map((entry, index) => {
                const maxWeight = Math.max(...entries.slice(0, 7).map(e => e.weight));
                const minWeight = Math.min(...entries.slice(0, 7).map(e => e.weight));
                const range = maxWeight - minWeight || 1;
                const height = ((entry.weight - minWeight) / range * 60) + 40;
                
                return (
                  <motion.div
                    key={entry.id}
                    className="flex-1 bg-gradient-to-t from-emerald-500 to-teal-400 rounded-xl relative group cursor-pointer"
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: 0.4 + index * 0.08 }}
                  >
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-lg">
                      {entry.weight} kg
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div className="flex justify-between mt-3">
              {entries.slice(0, 7).reverse().map((entry) => (
                <span key={entry.id} className="text-[10px] text-muted-foreground text-center flex-1">
                  {formatDateAz(entry.entry_date)}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* History */}
        {entries.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-500" />
                Tarixçə
              </h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => setShowResetConfirm(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Tarixçəni sıfırla
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="space-y-3 pb-24">
              {entries.slice(0, 10).map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="bg-card rounded-2xl p-4 shadow-sm border border-border/50 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center">
                      <Scale className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-lg">{entry.weight} kg</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateAz(entry.created_at)}, {formatTimeAz(entry.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {index > 0 && entries[index - 1] && (
                      <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                        entry.weight > entries[index - 1].weight 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : entry.weight < entries[index - 1].weight
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            : 'bg-muted text-muted-foreground'
                      }`}>
                        {entry.weight > entries[index - 1].weight 
                          ? `+${(entry.weight - entries[index - 1].weight).toFixed(1)}` 
                          : entry.weight < entries[index - 1].weight
                            ? (entry.weight - entries[index - 1].weight).toFixed(1)
                            : '0'}
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        if (confirm('Bu qeydi silmək istəyirsiniz?')) {
                          deleteEntry(entry.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Reset Confirmation Modal */}
        <AnimatePresence>
          {showResetConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowResetConfirm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm bg-card rounded-3xl p-6 shadow-xl"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Trash2 className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-foreground text-center mb-2">Tarixçəni sıfırla</h2>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  Bütün çəki qeydləri silinəcək. Bu əməliyyat geri qaytarıla bilməz.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowResetConfirm(false)}
                  >
                    Ləğv et
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      deleteAllEntries();
                      setShowResetConfirm(false);
                    }}
                  >
                    Sil
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Weight Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end"
            onClick={() => setShowAddForm(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-card rounded-t-3xl overflow-hidden"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 20px)' }}
            >
              <div className="h-20 bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <motion.div 
                  className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                >
                  <Scale className="w-8 h-8 text-white" />
                </motion.div>
              </div>
              
              <div className="p-6">
                <h2 className="text-xl font-bold text-foreground mb-2 text-center">Çəki əlavə et</h2>
                <p className="text-sm text-muted-foreground text-center mb-6">Bugünkü çəkinizi daxil edin</p>
                
                <div className="mb-6">
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="65.5"
                      value={newWeight}
                      onChange={(e) => setNewWeight(e.target.value)}
                      className="h-16 rounded-2xl text-center text-3xl font-black border-2 border-emerald-200 dark:border-emerald-800 focus:border-emerald-500"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">kg</span>
                  </div>
                </div>

                <motion.button
                  onClick={handleAddWeight}
                  className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-lg flex items-center justify-center gap-2"
                  whileTap={{ scale: 0.98 }}
                >
                  <Sparkles className="w-5 h-5" />
                  Yadda saxla
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

WeightTracker.displayName = 'WeightTracker';

export default WeightTracker;