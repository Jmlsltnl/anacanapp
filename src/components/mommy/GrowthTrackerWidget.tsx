import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, TrendingUp, Plus, Ruler, CircleDot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { hapticFeedback } from '@/lib/native';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useChildren } from '@/hooks/useChildren';
import { differenceInMonths } from 'date-fns';

interface BabyGrowthEntry {
  id: string;
  user_id: string;
  child_id: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  head_cm: number | null;
  entry_date: string;
  notes: string | null;
  created_at: string;
}

const GrowthTrackerWidget = () => {
  const { user } = useAuth();
  const { selectedChild, getChildAge } = useChildren();
  const { toast } = useToast();
  const [entries, setEntries] = useState<BabyGrowthEntry[]>([]);
  const [showInput, setShowInput] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [heightInput, setHeightInput] = useState('');
  const [headInput, setHeadInput] = useState('');

  // Check if baby is under 1 year old using selectedChild
  const showHeadCircumference = useMemo(() => {
    if (!selectedChild) return true; // Show by default if no child selected
    const ageInMonths = getChildAge(selectedChild).months;
    return ageInMonths < 12;
  }, [selectedChild, getChildAge]);

  // Fetch baby growth entries - filtered by selectedChild
  useEffect(() => {
    const fetchEntries = async () => {
      if (!user) return;
      try {
        let query = supabase
          .from('baby_growth')
          .select('*')
          .eq('user_id', user.id)
          .order('entry_date', { ascending: false })
          .limit(10);
        
        // Filter by selected child
        if (selectedChild) {
          query = query.eq('child_id', selectedChild.id);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.log('Baby growth fetch error:', error);
          return;
        }
        setEntries((data || []) as BabyGrowthEntry[]);
      } catch (e) {
        console.log('Baby growth table not ready');
      }
    };
    fetchEntries();
  }, [user, selectedChild]);

  const latestEntry = entries[0];
  const previousEntry = entries[1];

  // Calculate changes
  const weightChange = latestEntry && previousEntry 
    ? ((latestEntry.weight_kg || 0) - (previousEntry.weight_kg || 0)).toFixed(2)
    : null;
  const heightChange = latestEntry && previousEntry
    ? ((latestEntry.height_cm || 0) - (previousEntry.height_cm || 0)).toFixed(1)
    : null;
  const headChange = latestEntry && previousEntry
    ? ((latestEntry.head_cm || 0) - (previousEntry.head_cm || 0)).toFixed(1)
    : null;

  const handleAddEntry = async () => {
    if (!user) return;
    
    const weight = parseFloat(weightInput);
    const height = parseFloat(heightInput);
    
    if (isNaN(weight) && isNaN(height)) {
      toast({
        title: 'Məlumat daxil edin',
        description: 'Çəki və ya boy daxil edin',
        variant: 'destructive',
      });
      return;
    }
    
    await hapticFeedback.medium();
    
    try {
      const { data, error } = await supabase
        .from('baby_growth')
        .insert({
          user_id: user.id,
          child_id: selectedChild?.id || null,
          weight_kg: isNaN(weight) ? null : weight,
          height_cm: isNaN(height) ? null : height,
          head_cm: showHeadCircumference && !isNaN(parseFloat(headInput)) ? parseFloat(headInput) : null,
          entry_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Add new entry to local state
      if (data) {
        setEntries(prev => [data as BabyGrowthEntry, ...prev]);
      }
      setWeightInput('');
      setHeightInput('');
      setHeadInput('');
      setShowInput(false);
      
      toast({
        title: 'Ölçü yadda saxlandı! 📏',
        description: `${!isNaN(weight) ? `${weight} kq` : ''} ${!isNaN(height) ? `${height} sm` : ''}`,
      });
    } catch (error) {
      console.error('Error adding growth entry:', error);
      toast({
        title: 'Xəta baş verdi',
        variant: 'destructive',
      });
    }
  };

  return (
    <motion.div
      className="bg-card rounded-2xl p-4 shadow-card border border-border/50"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center">
            <Scale className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-bold text-sm text-foreground">Böyümə İzləmə</h3>
        </div>
        <motion.button
          onClick={() => setShowInput(!showInput)}
          className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"
          whileTap={{ scale: 0.9 }}
        >
          <Plus className={`w-4 h-4 text-primary transition-transform ${showInput ? 'rotate-45' : ''}`} />
        </motion.button>
      </div>
      
      {/* Current Stats */}
      <div className={`grid ${showHeadCircumference ? 'grid-cols-3' : 'grid-cols-2'} gap-2 mb-3`}>
        <div className="bg-rose-50 dark:bg-rose-500/15 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Scale className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
            <span className="text-[10px] text-rose-600/70 dark:text-rose-400/70">Çəki</span>
          </div>
          <p className="text-lg font-black text-rose-700 dark:text-rose-300">
            {latestEntry?.weight_kg ? `${latestEntry.weight_kg} kq` : '—'}
          </p>
          {weightChange && parseFloat(weightChange) !== 0 && (
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className={`w-3 h-3 ${parseFloat(weightChange) > 0 ? 'text-green-500' : 'text-red-500 rotate-180'}`} />
              <span className={`text-[10px] font-medium ${parseFloat(weightChange) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {parseFloat(weightChange) > 0 ? '+' : ''}{weightChange}
              </span>
            </div>
          )}
        </div>
        
        <div className="bg-indigo-50 dark:bg-indigo-500/15 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Ruler className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span className="text-[10px] text-indigo-600/70 dark:text-indigo-400/70">Boy</span>
          </div>
          <p className="text-lg font-black text-indigo-700 dark:text-indigo-300">
            {latestEntry?.height_cm ? `${latestEntry.height_cm} sm` : '—'}
          </p>
          {heightChange && parseFloat(heightChange) !== 0 && (
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className={`w-3 h-3 ${parseFloat(heightChange) > 0 ? 'text-green-500' : 'text-red-500 rotate-180'}`} />
              <span className={`text-[10px] font-medium ${parseFloat(heightChange) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {parseFloat(heightChange) > 0 ? '+' : ''}{heightChange}
              </span>
            </div>
          )}
        </div>

        {showHeadCircumference && (
          <div className="bg-amber-50 dark:bg-amber-500/15 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <CircleDot className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span className="text-[10px] text-amber-600/70 dark:text-amber-400/70">Baş</span>
            </div>
            <p className="text-lg font-black text-amber-700 dark:text-amber-300">
              {latestEntry?.head_cm ? `${latestEntry.head_cm} sm` : '—'}
            </p>
            {headChange && parseFloat(headChange) !== 0 && (
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className={`w-3 h-3 ${parseFloat(headChange) > 0 ? 'text-green-500' : 'text-red-500 rotate-180'}`} />
                <span className={`text-[10px] font-medium ${parseFloat(headChange) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {parseFloat(headChange) > 0 ? '+' : ''}{headChange}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Quick Add Input */}
      <AnimatePresence>
        {showInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <div className={`grid ${showHeadCircumference ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">Çəki (kq)</label>
                <input
                  type="number"
                  step="0.1"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  placeholder="5.2"
                  className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">Boy (sm)</label>
                <input
                  type="number"
                  step="0.5"
                  value={heightInput}
                  onChange={(e) => setHeightInput(e.target.value)}
                  placeholder="58"
                  className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm"
                />
              </div>
              {showHeadCircumference && (
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">Baş (sm)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={headInput}
                    onChange={(e) => setHeadInput(e.target.value)}
                    placeholder="38"
                    className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm"
                  />
                </div>
              )}
            </div>
            <motion.button
              onClick={handleAddEntry}
              className="w-full py-2.5 bg-primary text-white rounded-xl font-bold text-sm"
              whileTap={{ scale: 0.98 }}
            >
              Yadda saxla
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Last updated */}
      {latestEntry && !showInput && (
        <p className="text-[10px] text-muted-foreground text-center">
          Son ölçü: {new Date(latestEntry.entry_date).toLocaleDateString('az-AZ')}
        </p>
      )}
    </motion.div>
  );
};

export default GrowthTrackerWidget;
