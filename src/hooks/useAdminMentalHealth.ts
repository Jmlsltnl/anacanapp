import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EPDSQuestion {
  id: string;
  question_number: number;
  question_text: string;
  question_text_az: string | null;
  options: { value: number; text: string; text_az: string }[];
  is_reverse_scored: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface MoodLevel {
  id: string;
  mood_value: number;
  label: string;
  label_az: string | null;
  emoji: string;
  color: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface BreathingExercise {
  id: string;
  name: string;
  name_az: string | null;
  description: string | null;
  description_az: string | null;
  icon: string | null;
  color: string | null;
  inhale_seconds: number;
  hold_seconds: number;
  exhale_seconds: number;
  hold_after_exhale_seconds: number;
  total_cycles: number;
  benefits: string[] | null;
  benefits_az: string[] | null;
  is_active: boolean;
  sort_order: number;
}

export interface NoiseThreshold {
  id: string;
  threshold_key: string;
  min_db: number;
  max_db: number | null;
  label: string;
  label_az: string | null;
  color: string | null;
  emoji: string | null;
  description: string | null;
  description_az: string | null;
  is_active: boolean;
  sort_order: number;
}

// EPDS Questions
export const useAdminEPDSQuestions = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['admin-epds-questions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('epds_questions')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return (data || []).map(q => ({
        ...q,
        options: (q.options as { value: number; text: string; text_az: string }[]) || [],
      })) as EPDSQuestion[];
    },
  });

  const create = useMutation({
    mutationFn: async (item: Partial<EPDSQuestion>) => {
      const { error } = await supabase.from('epds_questions').insert([item as any]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-epds-questions'] });
      queryClient.invalidateQueries({ queryKey: ['epds-questions'] });
      toast({ title: 'Sual əlavə edildi' });
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, ...item }: Partial<EPDSQuestion> & { id: string }) => {
      const { error } = await supabase.from('epds_questions').update(item as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-epds-questions'] });
      queryClient.invalidateQueries({ queryKey: ['epds-questions'] });
      toast({ title: 'Sual yeniləndi' });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('epds_questions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-epds-questions'] });
      queryClient.invalidateQueries({ queryKey: ['epds-questions'] });
      toast({ title: 'Sual silindi' });
    },
  });

  return { ...query, create, update, remove };
};

// Mood Levels
export const useAdminMoodLevels = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['admin-mood-levels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mood_levels')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as MoodLevel[];
    },
  });

  const create = useMutation({
    mutationFn: async (item: Partial<MoodLevel>) => {
      const { error } = await supabase.from('mood_levels').insert([item as any]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-mood-levels'] });
      queryClient.invalidateQueries({ queryKey: ['mood-levels'] });
      toast({ title: 'Əhval səviyyəsi əlavə edildi' });
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, ...item }: Partial<MoodLevel> & { id: string }) => {
      const { error } = await supabase.from('mood_levels').update(item).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-mood-levels'] });
      queryClient.invalidateQueries({ queryKey: ['mood-levels'] });
      toast({ title: 'Əhval səviyyəsi yeniləndi' });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('mood_levels').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-mood-levels'] });
      queryClient.invalidateQueries({ queryKey: ['mood-levels'] });
      toast({ title: 'Əhval səviyyəsi silindi' });
    },
  });

  return { ...query, create, update, remove };
};

// Breathing Exercises
export const useAdminBreathingExercises = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['admin-breathing-exercises'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('breathing_exercises')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as BreathingExercise[];
    },
  });

  const create = useMutation({
    mutationFn: async (item: Partial<BreathingExercise>) => {
      const { error } = await supabase.from('breathing_exercises').insert([item as any]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-breathing-exercises'] });
      queryClient.invalidateQueries({ queryKey: ['breathing-exercises'] });
      toast({ title: 'Nəfəs məşqi əlavə edildi' });
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, ...item }: Partial<BreathingExercise> & { id: string }) => {
      const { error } = await supabase.from('breathing_exercises').update(item).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-breathing-exercises'] });
      queryClient.invalidateQueries({ queryKey: ['breathing-exercises'] });
      toast({ title: 'Nəfəs məşqi yeniləndi' });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('breathing_exercises').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-breathing-exercises'] });
      queryClient.invalidateQueries({ queryKey: ['breathing-exercises'] });
      toast({ title: 'Nəfəs məşqi silindi' });
    },
  });

  return { ...query, create, update, remove };
};

// Noise Thresholds
export const useAdminNoiseThresholds = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['admin-noise-thresholds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('noise_thresholds')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as NoiseThreshold[];
    },
  });

  const create = useMutation({
    mutationFn: async (item: Partial<NoiseThreshold>) => {
      const { error } = await supabase.from('noise_thresholds').insert([item as any]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-noise-thresholds'] });
      queryClient.invalidateQueries({ queryKey: ['noise-thresholds'] });
      toast({ title: 'Səs hədd əlavə edildi' });
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, ...item }: Partial<NoiseThreshold> & { id: string }) => {
      const { error } = await supabase.from('noise_thresholds').update(item).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-noise-thresholds'] });
      queryClient.invalidateQueries({ queryKey: ['noise-thresholds'] });
      toast({ title: 'Səs hədd yeniləndi' });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('noise_thresholds').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-noise-thresholds'] });
      queryClient.invalidateQueries({ queryKey: ['noise-thresholds'] });
      toast({ title: 'Səs hədd silindi' });
    },
  });

  return { ...query, create, update, remove };
};
