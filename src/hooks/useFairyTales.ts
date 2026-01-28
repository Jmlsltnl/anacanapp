import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface FairyTale {
  id: string;
  user_id: string;
  title: string;
  content: string;
  child_name: string | null;
  theme: string | null;
  hero: string | null;
  moral_lesson: string | null;
  audio_url: string | null;
  cover_image_url: string | null;
  duration_minutes: number;
  is_favorite: boolean;
  play_count: number;
  created_at: string;
}

export interface FairyTaleTheme {
  id: string;
  name: string;
  name_az: string;
  description: string | null;
  description_az: string | null;
  emoji: string | null;
  cover_image_url: string | null;
}

export const useFairyTales = () => {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ['fairy-tales', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('fairy_tales')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as FairyTale[];
    },
    enabled: !!user?.id,
  });
};

export const useFairyTaleThemes = () => {
  return useQuery({
    queryKey: ['fairy-tale-themes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fairy_tale_themes')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data as FairyTaleTheme[];
    },
    staleTime: 1000 * 60 * 30,
  });
};

export const useGenerateFairyTale = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async (params: {
      child_name: string;
      theme: string;
      hero?: string;
      moral_lesson?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Call edge function to generate story
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-fairy-tale`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify(params),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate story');
      }

      const { title, content } = await response.json();

      // Save to database
      const { data, error } = await supabase
        .from('fairy_tales')
        .insert({
          user_id: user.id,
          title,
          content,
          child_name: params.child_name,
          theme: params.theme,
          hero: params.hero,
          moral_lesson: params.moral_lesson,
        })
        .select()
        .single();

      if (error) throw error;
      return data as FairyTale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fairy-tales'] });
      toast.success('Nağıl yaradıldı! ✨');
    },
    onError: (error) => {
      toast.error(`Nağıl yaradıla bilmədi: ${error.message}`);
    },
  });
};

export const useToggleFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const { error } = await supabase
        .from('fairy_tales')
        .update({ is_favorite: isFavorite })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fairy-tales'] });
    },
  });
};

export const useIncrementPlayCount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: current } = await supabase
        .from('fairy_tales')
        .select('play_count')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('fairy_tales')
        .update({ play_count: (current?.play_count || 0) + 1 })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fairy-tales'] });
    },
  });
};

export const useDeleteFairyTale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fairy_tales')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fairy-tales'] });
      toast.success('Nağıl silindi');
    },
  });
};
