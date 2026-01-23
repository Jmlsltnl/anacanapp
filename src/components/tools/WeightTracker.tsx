import { useState, useEffect, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, TrendingUp, TrendingDown, Minus, Scale, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useWeightEntries } from '@/hooks/useWeightEntries';
import { useUserStore } from '@/store/userStore';
import { supabase } from '@/integrations/supabase/client';

interface WeightTrackerProps {
  onBack: () => void;
}

const WeightTracker = forwardRef<HTMLDivElement, WeightTrackerProps>(({ onBack }, ref) => {
  const { entries, loading, addEntry, getStats } = useWeightEntries();
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
  
  // Recommended weight gain based on week
  const getRecommendedGain = (week: number) => {
    if (week <= 12) return { min: 0.5, max: 2 };
    if (week <= 26) return { min: 4, max: 8 };
    return { min: 8, max: 14 };
  };

  const recommended = getRecommendedGain(currentWeek);
  
  const getStatus = () => {
    if (totalGain < recommended.min) return { status: 'low', text: 'Az', color: 'text-amber-600', bg: 'bg-amber-50' };
    if (totalGain > recommended.max) return { status: 'high', text: 'Çox', color: 'text-red-600', bg: 'bg-red-50' };
    return { status: 'normal', text: 'Normal', color: 'text-emerald-600', bg: 'bg-emerald-50' };
  };

  const status = getStatus();

  // Fetch AI advice
  useEffect(() => {
    const fetchAIAdvice = async () => {
      if (entries.length === 0) return;
      
      setAiLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('dr-anacan-chat', {
          body: {
            messages: [{
              role: 'user',
              content: `Hamiləlik həftəsi: ${currentWeek}, başlanğıc çəki: ${startWeight}kg, hazırkı çəki: ${currentWeight}kg, ümumi artım: ${totalGain}kg, tövsiyə olunan artım: ${recommended.min}-${recommended.max}kg. Status: ${status.text}. 1-2 cümlə ilə qısa məsləhət ver.`
            }]
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-primary px-5 pt-4 pb-10 safe-top">
        <div className="flex items-center gap-4">
          <motion.button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Çəki İzləyici</h1>
            <p className="text-white/80 text-sm">AI analiz ilə çəki takibi</p>
          </div>
          <motion.button
            onClick={() => setShowAddForm(true)}
            className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-5 h-5 text-white" />
          </motion.button>
        </div>
      </div>

      <div className="px-5 -mt-6">
        {/* Current Weight Card */}
        <motion.div
          className="bg-card rounded-3xl p-6 shadow-elevated border border-border/50 mb-6"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Hazırkı çəki</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-foreground">{currentWeight}</span>
                <span className="text-xl text-muted-foreground">kg</span>
              </div>
            </div>
            <div className={`w-16 h-16 rounded-2xl ${status.bg} flex items-center justify-center`}>
              <Scale className={`w-8 h-8 ${status.color}`} />
            </div>
          </div>

          {/* Status Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${status.bg}`}>
            {status.status === 'normal' && <Minus className={`w-4 h-4 ${status.color}`} />}
            {status.status === 'low' && <TrendingDown className={`w-4 h-4 ${status.color}`} />}
            {status.status === 'high' && <TrendingUp className={`w-4 h-4 ${status.color}`} />}
            <span className={`text-sm font-bold ${status.color}`}>{status.text}</span>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <motion.div
            className="bg-card rounded-2xl p-4 shadow-card border border-border/50"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <p className="text-sm text-muted-foreground mb-1">Ümumi artım</p>
            <p className="text-2xl font-black text-primary">+{totalGain.toFixed(1)} kg</p>
          </motion.div>

          <motion.div
            className="bg-card rounded-2xl p-4 shadow-card border border-border/50"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-sm text-muted-foreground mb-1">Tövsiyə olunan</p>
            <p className="text-2xl font-black text-foreground">{recommended.min}-{recommended.max} kg</p>
          </motion.div>
        </div>

        {/* AI Analysis */}
        <motion.div
          className="bg-beige-light rounded-3xl p-5 mb-6 border border-beige"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center text-2xl">
              🤖
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-foreground mb-1">AI Analiz</h4>
              {aiLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Analiz edilir...</span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{aiAdvice || 'Məlumat yüklənir...'}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Progress Chart */}
        {entries.length > 0 && (
          <motion.div
            className="bg-card rounded-3xl p-5 shadow-card border border-border/50 mb-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="font-bold text-foreground mb-4">Çəki qrafiki</h3>
            <div className="h-32 flex items-end gap-2">
              {entries.slice(0, 7).reverse().map((entry, index) => {
                const maxWeight = Math.max(...entries.slice(0, 7).map(e => e.weight));
                const minWeight = Math.min(...entries.slice(0, 7).map(e => e.weight));
                const range = maxWeight - minWeight || 1;
                const height = ((entry.weight - minWeight) / range * 60) + 40;
                
                return (
                  <motion.div
                    key={entry.id}
                    className="flex-1 gradient-primary rounded-t-lg"
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  />
                );
              })}
            </div>
            <div className="flex justify-between mt-2">
              {entries.slice(0, 7).reverse().map((entry) => (
                <span key={entry.id} className="text-xs text-muted-foreground">
                  {new Date(entry.entry_date).toLocaleDateString('az-AZ', { day: 'numeric', month: 'short' })}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* History */}
        {entries.length > 0 && (
          <>
            <h3 className="font-bold text-foreground mb-4">Tarixçə</h3>
            <div className="space-y-3 pb-8">
              {entries.slice(0, 10).map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="bg-card rounded-2xl p-4 shadow-card border border-border/50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Scale className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{entry.weight} kg</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.entry_date).toLocaleDateString('az-AZ', { day: 'numeric', month: 'long' })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add Weight Modal */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={() => setShowAddForm(false)}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-card rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 100px)' }}
          >
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />
            <h2 className="text-xl font-bold text-foreground mb-4">Çəki əlavə et</h2>
            
            <div className="mb-6">
              <label className="text-sm font-medium text-foreground mb-2 block">Çəkiniz (kg)</label>
              <Input
                type="number"
                step="0.1"
                placeholder="63.5"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                className="h-14 rounded-2xl text-center text-2xl font-bold"
              />
            </div>

            <button
              onClick={handleAddWeight}
              className="w-full h-14 rounded-2xl gradient-primary text-white font-bold shadow-button"
            >
              Yadda saxla
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
});

WeightTracker.displayName = 'WeightTracker';

export default WeightTracker;
