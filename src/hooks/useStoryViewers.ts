import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getPublicProfileCards } from '@/lib/public-profile-cards';

export interface StoryViewer {
  user_id: string;
  name: string;
  avatar_url: string | null;
  viewed_at: string;
}

export const useStoryViewers = (storyId: string | null) => {
  return useQuery({
    queryKey: ['story-viewers', storyId],
    queryFn: async (): Promise<StoryViewer[]> => {
      if (!storyId) return [];

      const { data, error } = await supabase
        .from('story_views')
        .select('user_id, viewed_at')
        .eq('story_id', storyId)
        .order('viewed_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const userIds = data.map(v => v.user_id);
      const profileMap = await getPublicProfileCards(userIds);

      return data.map(view => {
        const profile = profileMap[view.user_id];
        return {
          user_id: view.user_id,
          name: profile?.name || 'İstifadəçi',
          avatar_url: profile?.avatar_url || null,
          viewed_at: view.viewed_at,
        };
      });
    },
    enabled: !!storyId,
    staleTime: 10000,
  });
};
