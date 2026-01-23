import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Surprise {
  id: string;
  user_id: string;
  surprise_id: string;
  surprise_title: string;
  surprise_emoji: string;
  surprise_category: string;
  surprise_points: number;
  planned_date: string;
  completed_date: string | null;
  notes: string | null;
  status: 'planned' | 'completed';
  created_at: string;
}

export const useSurprises = () => {
  const { user } = useAuth();
  const [surprises, setSurprises] = useState<Surprise[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSurprises = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('partner_surprises')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSurprises((data || []) as Surprise[]);
    } catch (err) {
      console.error('Error fetching surprises:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSurprises();
  }, [user]);

  const addSurprise = async (surprise: {
    surprise_id: string;
    surprise_title: string;
    surprise_emoji: string;
    surprise_category: string;
    surprise_points: number;
    planned_date: string;
    notes?: string;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('partner_surprises')
        .insert({
          user_id: user.id,
          ...surprise,
          status: 'planned',
        })
        .select()
        .single();

      if (error) throw error;
      
      setSurprises(prev => [data as Surprise, ...prev]);
      return data;
    } catch (err) {
      console.error('Error adding surprise:', err);
      return null;
    }
  };

  const completeSurprise = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('partner_surprises')
        .update({
          status: 'completed',
          completed_date: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setSurprises(prev =>
        prev.map(s =>
          s.id === id
            ? { ...s, status: 'completed' as const, completed_date: new Date().toISOString() }
            : s
        )
      );
      return true;
    } catch (err) {
      console.error('Error completing surprise:', err);
      return false;
    }
  };

  const deleteSurprise = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('partner_surprises')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setSurprises(prev => prev.filter(s => s.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting surprise:', err);
      return false;
    }
  };

  const plannedSurprises = surprises.filter(s => s.status === 'planned');
  const completedSurprises = surprises.filter(s => s.status === 'completed');
  const totalPoints = completedSurprises.reduce((sum, s) => sum + s.surprise_points, 0);

  return {
    surprises,
    plannedSurprises,
    completedSurprises,
    totalPoints,
    isLoading,
    addSurprise,
    completeSurprise,
    deleteSurprise,
    refetch: fetchSurprises,
  };
};
