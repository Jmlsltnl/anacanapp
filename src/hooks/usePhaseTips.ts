import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type MenstrualPhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
export type TipCategory = 'general' | 'nutrition' | 'exercise' | 'selfcare' | 'mood' | 'intimacy';

export interface PhaseTip {
  id: string;
  phase: MenstrualPhase;
  title: string;
  title_az: string | null;
  content: string;
  content_az: string | null;
  emoji: string;
  category: TipCategory;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const PHASE_INFO: Record<MenstrualPhase, { label: string; labelAz: string; emoji: string; color: string; days: string }> = {
  menstrual: { label: 'Menstrual', labelAz: 'Menstrual Faza', emoji: '🩸', color: '#dc2626', days: '1-5' },
  follicular: { label: 'Follicular', labelAz: 'Follikulyar Faza', emoji: '🌱', color: '#16a34a', days: '6-13' },
  ovulation: { label: 'Ovulation', labelAz: 'Ovulyasiya Fazası', emoji: '🌸', color: '#ec4899', days: '14-16' },
  luteal: { label: 'Luteal', labelAz: 'Luteal Faza', emoji: '🌙', color: '#8b5cf6', days: '17-28' }
};

export const CATEGORY_INFO: Record<TipCategory, { label: string; labelAz: string; emoji: string }> = {
  general: { label: 'General', labelAz: 'Ümumi', emoji: '💡' },
  nutrition: { label: 'Nutrition', labelAz: 'Qidalanma', emoji: '🥗' },
  exercise: { label: 'Exercise', labelAz: 'Məşq', emoji: '🏃' },
  selfcare: { label: 'Self-care', labelAz: 'Özünə Qulluq', emoji: '💆' },
  mood: { label: 'Mood', labelAz: 'Əhval', emoji: '😊' },
  intimacy: { label: 'Intimacy', labelAz: 'Yaxınlıq', emoji: '💕' }
};

// Hook for fetching tips by phase (public use)
export const usePhaseTips = (phase: MenstrualPhase) => {
  return useQuery({
    queryKey: ['phase-tips', phase],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menstruation_phase_tips')
        .select('*')
        .eq('phase', phase)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as PhaseTip[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for admin management
export const usePhaseTipsAdmin = () => {
  const queryClient = useQueryClient();

  const { data: tips = [], isLoading } = useQuery({
    queryKey: ['phase-tips-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menstruation_phase_tips')
        .select('*')
        .order('phase')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as PhaseTip[];
    },
  });

  const createTip = useMutation({
    mutationFn: async (tip: Omit<PhaseTip, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('menstruation_phase_tips')
        .insert(tip)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-tips-admin'] });
      queryClient.invalidateQueries({ queryKey: ['phase-tips'] });
    },
  });

  const updateTip = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PhaseTip> & { id: string }) => {
      const { data, error } = await supabase
        .from('menstruation_phase_tips')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-tips-admin'] });
      queryClient.invalidateQueries({ queryKey: ['phase-tips'] });
    },
  });

  const deleteTip = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('menstruation_phase_tips')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-tips-admin'] });
      queryClient.invalidateQueries({ queryKey: ['phase-tips'] });
    },
  });

  // Group tips by phase
  const tipsByPhase = tips.reduce((acc, tip) => {
    if (!acc[tip.phase]) acc[tip.phase] = [];
    acc[tip.phase].push(tip);
    return acc;
  }, {} as Record<MenstrualPhase, PhaseTip[]>);

  return {
    tips,
    tipsByPhase,
    isLoading,
    createTip: createTip.mutate,
    updateTip: updateTip.mutate,
    deleteTip: deleteTip.mutate,
    isCreating: createTip.isPending,
    isUpdating: updateTip.isPending,
    isDeleting: deleteTip.isPending,
  };
};
