import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Contraction {
  id: string;
  user_id: string;
  start_time: string;
  duration_seconds: number;
  interval_seconds: number | null;
  created_at: string;
}

export const useContractions = () => {
  const [contractions, setContractions] = useState<Contraction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchContractions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('contractions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setContractions(data || []);
    } catch (error: any) {
      console.error('Error fetching contractions:', error);
    } finally {
      setLoading(false);
    }
  };

  const addContraction = async (durationSeconds: number, intervalSeconds?: number) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('contractions')
        .insert({
          user_id: user.id,
          duration_seconds: durationSeconds,
          interval_seconds: intervalSeconds || null,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchContractions();
      return data;
    } catch (error: any) {
      console.error('Error adding contraction:', error);
      toast({
        title: 'Xəta baş verdi',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const getStats = () => {
    const recent = contractions.slice(0, 5);
    if (recent.length === 0) return { avgDuration: 0, avgInterval: 0 };

    const avgDuration = Math.round(
      recent.reduce((sum, c) => sum + c.duration_seconds, 0) / recent.length
    );
    
    const withInterval = recent.filter(c => c.interval_seconds != null);
    const avgInterval = withInterval.length > 0
      ? Math.round(withInterval.reduce((sum, c) => sum + (c.interval_seconds || 0), 0) / withInterval.length)
      : 0;

    // 5-1-1 Rule: contractions 5 min apart, 1 min duration, for 1 hour
    const is511 = avgInterval > 0 && avgInterval <= 300 && avgDuration >= 60 && recent.length >= 3;

    return { avgDuration, avgInterval, is511, count: contractions.length };
  };

  const clearAll = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('contractions')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setContractions([]);
      toast({
        title: 'Sancılar silindi',
        description: 'Bütün qeydlər silindi.',
      });
    } catch (error: any) {
      console.error('Error clearing contractions:', error);
    }
  };

  useEffect(() => {
    fetchContractions();
  }, [user]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('contractions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contractions',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchContractions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    contractions,
    loading,
    addContraction,
    getStats,
    clearAll,
    refetch: fetchContractions,
  };
};
