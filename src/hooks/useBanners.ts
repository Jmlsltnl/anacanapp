import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type BannerPlacement = 
  | 'home_top' 
  | 'home_middle' 
  | 'home_bottom' 
  | 'tools_top' 
  | 'tools_bottom' 
  | 'profile_top' 
  | 'community_top' 
  | 'ai_chat_top';

export type BannerType = 'native' | 'image';
export type LinkType = 'external' | 'internal' | 'tool';

export interface Banner {
  id: string;
  title: string;
  title_az: string | null;
  description: string | null;
  description_az: string | null;
  image_url: string | null;
  link_url: string | null;
  link_type: LinkType;
  placement: BannerPlacement;
  banner_type: BannerType;
  background_color: string | null;
  text_color: string | null;
  button_text: string | null;
  button_text_az: string | null;
  is_active: boolean;
  is_premium_only: boolean;
  sort_order: number;
  start_date: string | null;
  end_date: string | null;
  click_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export const useBanners = (placement?: BannerPlacement) => {
  return useQuery({
    queryKey: ['banners', placement],
    queryFn: async () => {
      let query = supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (placement) {
        query = query.eq('placement', placement);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Banner[];
    }
  });
};

export const useAllBanners = () => {
  return useQuery({
    queryKey: ['banners', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('placement')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return (data || []) as Banner[];
    }
  });
};

export const useCreateBanner = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (banner: Partial<Banner>) => {
      const { data, error } = await supabase
        .from('banners')
        .insert([banner as any])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
    }
  });
};

export const useUpdateBanner = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Banner> & { id: string }) => {
      const { data, error } = await supabase
        .from('banners')
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
    }
  });
};

export const useDeleteBanner = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
    }
  });
};

export const useIncrementBannerClick = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      // Direct update without RPC
      const { data: banner } = await supabase
        .from('banners')
        .select('click_count')
        .eq('id', id)
        .single();
      
      if (banner) {
        await supabase
          .from('banners')
          .update({ click_count: ((banner as any).click_count || 0) + 1 } as any)
          .eq('id', id);
      }
    }
  });
};
