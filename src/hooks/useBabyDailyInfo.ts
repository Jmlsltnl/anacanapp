import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BabyDailyInfo {
  id: string;
  day_number: number;
  info: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useBabyDailyInfoByDay = (dayNumber: number | null) => {
  return useQuery({
    queryKey: ['baby-daily-info', dayNumber],
    queryFn: async () => {
      if (!dayNumber || dayNumber < 1 || dayNumber > 1460) return null;

      const { data, error } = await (supabase as any)
        .from('baby_daily_info')
        .select('*')
        .eq('day_number', dayNumber)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching baby daily info:', error);
        return null;
      }
      return data as BabyDailyInfo | null;
    },
    enabled: !!dayNumber && dayNumber >= 1 && dayNumber <= 1460,
    staleTime: 1000 * 60 * 5,
  });
};

export const useBabyDailyInfoAdmin = () => {
  const queryClient = useQueryClient();

  const fetchAll = useQuery({
    queryKey: ['baby-daily-info-admin'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('baby_daily_info')
        .select('*')
        .order('day_number', { ascending: true });

      if (error) throw error;
      return (data || []) as BabyDailyInfo[];
    },
  });

  const createInfo = useMutation({
    mutationFn: async (item: { day_number: number; info: string; is_active?: boolean }) => {
      const { data, error } = await (supabase as any)
        .from('baby_daily_info')
        .insert(item)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baby-daily-info-admin'] });
      queryClient.invalidateQueries({ queryKey: ['baby-daily-info'] });
    },
  });

  const updateInfo = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BabyDailyInfo> & { id: string }) => {
      const { error } = await (supabase as any)
        .from('baby_daily_info')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baby-daily-info-admin'] });
      queryClient.invalidateQueries({ queryKey: ['baby-daily-info'] });
    },
  });

  const deleteInfo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('baby_daily_info')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baby-daily-info-admin'] });
      queryClient.invalidateQueries({ queryKey: ['baby-daily-info'] });
    },
  });

  const bulkImport = useMutation({
    mutationFn: async (items: { day_number: number; info: string }[]) => {
      const results = { success: 0, failed: 0, errors: [] as string[] };

      // Get existing days
      const { data: existing } = await (supabase as any)
        .from('baby_daily_info')
        .select('id, day_number');

      const existingMap = new Map<number, string>();
      (existing || []).forEach((row: any) => {
        existingMap.set(row.day_number, row.id);
      });

      const toInsert: any[] = [];
      const toUpdate: { id: string; data: any }[] = [];

      for (const item of items) {
        const existingId = existingMap.get(item.day_number);
        if (existingId) {
          toUpdate.push({ id: existingId, data: { info: item.info, is_active: true } });
        } else {
          toInsert.push({ day_number: item.day_number, info: item.info, is_active: true });
        }
      }

      // Batch insert
      const batchSize = 50;
      for (let i = 0; i < toInsert.length; i += batchSize) {
        const batch = toInsert.slice(i, i + batchSize);
        const { error } = await (supabase as any).from('baby_daily_info').insert(batch);
        if (error) {
          results.failed += batch.length;
          results.errors.push(`Insert batch: ${error.message}`);
        } else {
          results.success += batch.length;
        }
      }

      // Batch update
      for (let i = 0; i < toUpdate.length; i += 20) {
        const batch = toUpdate.slice(i, i + 20);
        const promises = batch.map(async ({ id, data }) => {
          const { error } = await (supabase as any)
            .from('baby_daily_info')
            .update({ ...data, updated_at: new Date().toISOString() })
            .eq('id', id);
          return { error, day: data.day_number };
        });
        const updateResults = await Promise.all(promises);
        for (const r of updateResults) {
          if (r.error) {
            results.failed++;
            results.errors.push(r.error.message);
          } else {
            results.success++;
          }
        }
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baby-daily-info-admin'] });
      queryClient.invalidateQueries({ queryKey: ['baby-daily-info'] });
    },
  });

  return {
    data: fetchAll.data || [],
    isLoading: fetchAll.isLoading,
    error: fetchAll.error,
    refetch: fetchAll.refetch,
    createInfo,
    updateInfo,
    deleteInfo,
    bulkImport,
  };
};
