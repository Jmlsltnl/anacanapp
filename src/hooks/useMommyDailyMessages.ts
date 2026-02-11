import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MommyDailyMessage {
  id: string;
  day_number: number;
  message: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useMommyDailyMessageByDay = (dayNumber: number | null) => {
  return useQuery({
    queryKey: ['mommy-daily-message', dayNumber],
    queryFn: async () => {
      if (!dayNumber || dayNumber < 1 || dayNumber > 1460) return null;
      const { data, error } = await (supabase as any)
        .from('mommy_daily_messages')
        .select('*')
        .eq('day_number', dayNumber)
        .eq('is_active', true)
        .maybeSingle();
      if (error) { console.error('Error fetching mommy daily message:', error); return null; }
      return data as MommyDailyMessage | null;
    },
    enabled: !!dayNumber && dayNumber >= 1 && dayNumber <= 1460,
    staleTime: 1000 * 60 * 5,
  });
};

export const useMommyDailyMessagesAdmin = () => {
  const queryClient = useQueryClient();

  const fetchAll = useQuery({
    queryKey: ['mommy-daily-messages-admin'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('mommy_daily_messages')
        .select('*')
        .order('day_number', { ascending: true });
      if (error) throw error;
      return (data || []) as MommyDailyMessage[];
    },
  });

  const createMessage = useMutation({
    mutationFn: async (item: { day_number: number; message: string; is_active?: boolean }) => {
      const { data, error } = await (supabase as any).from('mommy_daily_messages').insert(item).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mommy-daily-messages-admin'] });
      queryClient.invalidateQueries({ queryKey: ['mommy-daily-message'] });
    },
  });

  const updateMessage = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MommyDailyMessage> & { id: string }) => {
      const { error } = await (supabase as any).from('mommy_daily_messages').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mommy-daily-messages-admin'] });
      queryClient.invalidateQueries({ queryKey: ['mommy-daily-message'] });
    },
  });

  const deleteMessage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('mommy_daily_messages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mommy-daily-messages-admin'] });
      queryClient.invalidateQueries({ queryKey: ['mommy-daily-message'] });
    },
  });

  const bulkImport = useMutation({
    mutationFn: async (items: { day_number: number; message: string }[]) => {
      const results = { success: 0, failed: 0, errors: [] as string[] };
      const { data: existing } = await (supabase as any).from('mommy_daily_messages').select('id, day_number');
      const existingMap = new Map<number, string>();
      (existing || []).forEach((row: any) => existingMap.set(row.day_number, row.id));

      const toInsert: any[] = [];
      const toUpdate: { id: string; data: any }[] = [];

      for (const item of items) {
        const existingId = existingMap.get(item.day_number);
        if (existingId) {
          toUpdate.push({ id: existingId, data: { message: item.message, is_active: true } });
        } else {
          toInsert.push({ day_number: item.day_number, message: item.message, is_active: true });
        }
      }

      const batchSize = 50;
      for (let i = 0; i < toInsert.length; i += batchSize) {
        const batch = toInsert.slice(i, i + batchSize);
        const { error } = await (supabase as any).from('mommy_daily_messages').insert(batch);
        if (error) { results.failed += batch.length; results.errors.push(`Insert: ${error.message}`); }
        else { results.success += batch.length; }
      }

      for (let i = 0; i < toUpdate.length; i += 20) {
        const batch = toUpdate.slice(i, i + 20);
        const promises = batch.map(async ({ id, data }) => {
          const { error } = await (supabase as any).from('mommy_daily_messages').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id);
          return { error };
        });
        const updateResults = await Promise.all(promises);
        for (const r of updateResults) {
          if (r.error) { results.failed++; results.errors.push(r.error.message); }
          else { results.success++; }
        }
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mommy-daily-messages-admin'] });
      queryClient.invalidateQueries({ queryKey: ['mommy-daily-message'] });
    },
  });

  return {
    data: fetchAll.data || [],
    isLoading: fetchAll.isLoading,
    error: fetchAll.error,
    refetch: fetchAll.refetch,
    createMessage,
    updateMessage,
    deleteMessage,
    bulkImport,
  };
};
