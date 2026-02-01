import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PartnerDailyTip {
  id: string;
  tip_text: string;
  tip_text_az: string | null;
  tip_emoji: string;
  life_stage: string;
  week_number: number | null;
  sort_order: number;
  is_active: boolean;
}

export const useAdminPartnerTips = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['partner-daily-tips-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_daily_tips')
        .select('*')
        .order('sort_order');
      
      if (error) throw error;
      return data as PartnerDailyTip[];
    },
  });

  const create = useMutation({
    mutationFn: async (item: Partial<PartnerDailyTip>) => {
      const { error } = await supabase.from('partner_daily_tips').insert([item as any]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-daily-tips-admin'] });
      queryClient.invalidateQueries({ queryKey: ['partner-daily-tips'] });
      toast({ title: 'Məsləhət əlavə edildi' });
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, ...item }: Partial<PartnerDailyTip> & { id: string }) => {
      const { error } = await supabase.from('partner_daily_tips').update(item).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-daily-tips-admin'] });
      queryClient.invalidateQueries({ queryKey: ['partner-daily-tips'] });
      toast({ title: 'Məsləhət yeniləndi' });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('partner_daily_tips').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-daily-tips-admin'] });
      queryClient.invalidateQueries({ queryKey: ['partner-daily-tips'] });
      toast({ title: 'Məsləhət silindi' });
    },
  });

  return { ...query, create, update, remove };
};
