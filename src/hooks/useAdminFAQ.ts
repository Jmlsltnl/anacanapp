import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FAQ {
  id: string;
  question: string;
  question_az: string | null;
  answer: string;
  answer_az: string | null;
  category: string | null;
  sort_order: number | null;
  is_active: boolean;
}

export const useFAQs = () => {
  return useQuery({
    queryKey: ['faqs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data as FAQ[];
    },
    staleTime: 1000 * 60 * 10,
  });
};

export const useAdminFAQ = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['faqs-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('sort_order');
      
      if (error) throw error;
      return data as FAQ[];
    },
  });

  const create = useMutation({
    mutationFn: async (item: Partial<FAQ>) => {
      const { error } = await supabase.from('faqs').insert([item as any]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs-admin'] });
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      toast({ title: 'Sual əlavə edildi' });
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, ...item }: Partial<FAQ> & { id: string }) => {
      const { error } = await supabase.from('faqs').update(item).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs-admin'] });
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      toast({ title: 'Sual yeniləndi' });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('faqs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs-admin'] });
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      toast({ title: 'Sual silindi' });
    },
  });

  return { ...query, create, update, remove };
};
