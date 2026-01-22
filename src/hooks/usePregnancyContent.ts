import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PregnancyContent {
  id: string;
  pregnancy_day: number | null;
  week_number: number;
  day_number: number | null;
  days_until_birth: number | null;
  baby_size_fruit: string | null;
  baby_size_cm: number | null;
  baby_weight_gram: number | null;
  baby_development: string | null;
  baby_message: string | null;
  body_changes: string | null;
  daily_tip: string | null;
  mother_symptoms: string[] | null;
  mother_tips: string | null;
  mother_warnings: string | null;
  nutrition_tip: string | null;
  recommended_foods: string[] | null;
  foods_to_avoid: string[] | null;
  exercise_tip: string | null;
  recommended_exercises: string[] | null;
  doctor_visit_tip: string | null;
  tests_to_do: string[] | null;
  emotional_tip: string | null;
  partner_tip: string | null;
  image_url: string | null;
  video_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Fetch content by pregnancy day (1-280)
export const usePregnancyContentByDay = (pregnancyDay?: number) => {
  return useQuery({
    queryKey: ['pregnancy_content_day', pregnancyDay],
    queryFn: async () => {
      if (!pregnancyDay) return null;
      
      // Try to find exact day match first
      let { data, error } = await (supabase as any)
        .from('pregnancy_daily_content')
        .select('*')
        .eq('pregnancy_day', pregnancyDay)
        .eq('is_active', true)
        .maybeSingle();

      // If no exact match, find nearest previous day
      if (!data && !error) {
        const { data: nearestData } = await (supabase as any)
          .from('pregnancy_daily_content')
          .select('*')
          .lt('pregnancy_day', pregnancyDay)
          .eq('is_active', true)
          .order('pregnancy_day', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        data = nearestData;
      }

      if (error) throw error;
      return data as PregnancyContent | null;
    },
    enabled: !!pregnancyDay,
    staleTime: 1000 * 60 * 5,
  });
};

// Original week-based fetch (for backwards compatibility)
export const usePregnancyContent = (weekNumber?: number) => {
  return useQuery({
    queryKey: ['pregnancy_content', weekNumber],
    queryFn: async () => {
      let query = (supabase as any)
        .from('pregnancy_daily_content')
        .select('*')
        .eq('is_active', true)
        .order('pregnancy_day', { ascending: true });

      if (weekNumber) {
        query = query.eq('week_number', weekNumber);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as PregnancyContent[];
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const usePregnancyContentAdmin = () => {
  const queryClient = useQueryClient();

  const fetchAllContent = useQuery({
    queryKey: ['pregnancy_content_admin'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('pregnancy_daily_content')
        .select('*')
        .order('week_number', { ascending: true });

      if (error) throw error;
      return (data || []) as PregnancyContent[];
    },
  });

  const createContent = useMutation({
    mutationFn: async (content: Partial<PregnancyContent>) => {
      const { data, error } = await (supabase as any)
        .from('pregnancy_daily_content')
        .insert(content)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pregnancy_content_admin'] });
      queryClient.invalidateQueries({ queryKey: ['pregnancy_content'] });
    },
  });

  const updateContent = useMutation({
    mutationFn: async ({ id, ...content }: Partial<PregnancyContent> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('pregnancy_daily_content')
        .update(content)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pregnancy_content_admin'] });
      queryClient.invalidateQueries({ queryKey: ['pregnancy_content'] });
    },
  });

  const deleteContent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('pregnancy_daily_content')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pregnancy_content_admin'] });
      queryClient.invalidateQueries({ queryKey: ['pregnancy_content'] });
    },
  });

  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await (supabase as any)
        .from('pregnancy_daily_content')
        .delete()
        .in('id', ids);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pregnancy_content_admin'] });
      queryClient.invalidateQueries({ queryKey: ['pregnancy_content'] });
    },
  });

  const bulkImport = useMutation({
    mutationFn: async (contents: Partial<PregnancyContent>[]) => {
      const results = { success: 0, failed: 0, errors: [] as string[] };

      for (const content of contents) {
        // Try upsert based on week_number
        const { error } = await (supabase as any)
          .from('pregnancy_daily_content')
          .upsert(content, { 
            onConflict: 'week_number',
            ignoreDuplicates: false 
          });

        if (error) {
          results.failed++;
          results.errors.push(`Həftə ${content.week_number}: ${error.message}`);
        } else {
          results.success++;
        }
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pregnancy_content_admin'] });
      queryClient.invalidateQueries({ queryKey: ['pregnancy_content'] });
    },
  });

  return {
    content: fetchAllContent.data || [],
    isLoading: fetchAllContent.isLoading,
    error: fetchAllContent.error,
    createContent,
    updateContent,
    deleteContent,
    bulkDelete,
    bulkImport,
    refetch: fetchAllContent.refetch,
  };
};
