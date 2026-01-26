import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface WeightEntry {
  id: string;
  user_id: string;
  weight: number;
  entry_date: string;
  notes: string | null;
  created_at: string;
}

export const useWeightEntries = () => {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const fetchEntries = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('weight_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false })
        .limit(100);

      if (error) throw error;
      setEntries(data || []);
    } catch (error: any) {
      console.error('Error fetching weight entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const addEntry = async (weight: number, notes?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('weight_entries')
        .insert({
          user_id: user.id,
          weight,
          notes: notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Çəki yadda saxlandı! ⚖️',
        description: `${weight} kg`,
      });

      await fetchEntries();
      return data;
    } catch (error: any) {
      console.error('Error adding weight entry:', error);
      toast({
        title: 'Xəta baş verdi',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const getStats = () => {
    if (entries.length === 0) return null;

    // Start weight is from profile, or the FIRST (oldest) entry if no profile start weight
    // Entries are ordered by entry_date DESC, so oldest is at the end
    const firstEntryWeight = entries.length > 0 ? entries[entries.length - 1].weight : 0;
    const startWeight = profile?.start_weight || firstEntryWeight;
    
    // Current weight is the LATEST entry (first in the array since ordered DESC)
    const currentWeight = entries[0]?.weight || startWeight;
    const totalGain = currentWeight - startWeight;
    
    return {
      startWeight,
      currentWeight,
      totalGain,
      entryCount: entries.length,
    };
  };

  const updateStartWeight = async (weight: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ start_weight: weight })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Başlanğıc çəki yadda saxlandı!',
        description: `${weight} kg`,
      });
    } catch (error: any) {
      console.error('Error updating start weight:', error);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [user]);

  return {
    entries,
    loading,
    addEntry,
    getStats,
    updateStartWeight,
    refetch: fetchEntries,
  };
};
