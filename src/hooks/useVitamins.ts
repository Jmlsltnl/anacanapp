import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Vitamin {
  id: string;
  name: string;
  name_az: string | null;
  description: string | null;
  description_az: string | null;
  benefits: string[] | null;
  food_sources: string[] | null;
  dosage: string | null;
  week_start: number | null;
  week_end: number | null;
  trimester: number | null;
  life_stage: string | null;
  importance: string | null;
  icon_emoji: string | null;
  is_active: boolean;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

// Fetch vitamins for a specific week and life stage
export const useVitamins = (weekNumber?: number, lifeStage?: string) => {
  return useQuery({
    queryKey: ['vitamins', weekNumber, lifeStage],
    queryFn: async () => {
      let query = (supabase as any)
        .from('vitamins')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (lifeStage) {
        query = query.eq('life_stage', lifeStage);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filter vitamins based on week number if provided
      let vitamins = (data || []) as Vitamin[];
      
      if (weekNumber && lifeStage === 'bump') {
        const currentTrimester = weekNumber <= 13 ? 1 : weekNumber <= 26 ? 2 : 3;
        vitamins = vitamins.filter(v => {
          // trimester 0 means "all trimesters" - always show
          if (v.trimester === 0) return true;
          // Filter by week range if provided
          if (v.week_start !== null && v.week_end !== null) {
            return weekNumber >= v.week_start && weekNumber <= v.week_end;
          }
          // Filter by trimester if set
          if (v.trimester !== null) {
            return v.trimester === currentTrimester;
          }
          return true;
        });
      }

      return vitamins;
    },
    staleTime: 1000 * 60 * 5,
  });
};

// Admin hook for full CRUD operations
export const useVitaminsAdmin = () => {
  const queryClient = useQueryClient();

  const fetchAllVitamins = useQuery({
    queryKey: ['vitamins_admin'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('vitamins')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []) as Vitamin[];
    },
  });

  const createVitamin = useMutation({
    mutationFn: async (vitamin: Partial<Vitamin>) => {
      const { data, error } = await (supabase as any)
        .from('vitamins')
        .insert(vitamin)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vitamins_admin'] });
      queryClient.invalidateQueries({ queryKey: ['vitamins'] });
    },
  });

  const updateVitamin = useMutation({
    mutationFn: async ({ id, ...vitamin }: Partial<Vitamin> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('vitamins')
        .update({ ...vitamin, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vitamins_admin'] });
      queryClient.invalidateQueries({ queryKey: ['vitamins'] });
    },
  });

  const deleteVitamin = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('vitamins')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vitamins_admin'] });
      queryClient.invalidateQueries({ queryKey: ['vitamins'] });
    },
  });

  return {
    vitamins: fetchAllVitamins.data || [],
    isLoading: fetchAllVitamins.isLoading,
    error: fetchAllVitamins.error,
    createVitamin,
    updateVitamin,
    deleteVitamin,
    refetch: fetchAllVitamins.refetch,
  };
};
