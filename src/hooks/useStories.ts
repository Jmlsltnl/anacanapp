import { useState, useCallback } from 'react';
import { tr } from '@/lib/tr';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { getPublicProfileCards } from '@/lib/public-profile-cards';

export interface Story {
  id: string;
  user_id: string;
  group_id: string | null;
  media_url: string;
  media_type: 'image' | 'video';
  text_overlay: string | null;
  background_color: string | null;
  created_at: string;
  expires_at: string;
  view_count: number;
  likes_count: number;
  is_liked?: boolean;
  replies_count: number;
  author?: {
    name: string;
    avatar_url: string | null;
  };
  is_viewed?: boolean;
}

export interface UserStoryGroup {
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  stories: Story[];
  has_unviewed: boolean;
}

export const useStories = (groupId?: string | null) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stories = [], isLoading } = useQuery({
    queryKey: ['stories', groupId],
    queryFn: async () => {
      let query = supabase.
      from('community_stories').
      select('*').
      gt('expires_at', new Date().toISOString()).
      order('created_at', { ascending: false });

      if (groupId) {
        query = query.eq('group_id', groupId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const authorMap = await getPublicProfileCards((data || []).map((s: any) => s.user_id));

      // İstifadəçinin bəyəndikləri — TƏK batch sorğu (post_likes-dəki enrichPosts nümunəsi ilə eyni, N+1 yox)
      const likedSet = new Set<string>();
      if (user && data && data.length > 0) {
        const { data: likeRows } = await supabase.
        from('story_likes' as any).
        select('story_id').
        eq('user_id', user.id).
        in('story_id', data.map((s: any) => s.id));
        (likeRows || []).forEach((r: any) => likedSet.add(r.story_id));
      }

      // Fetch author details and view status
      const storiesWithDetails = await Promise.all(
        (data || []).map(async (story: any) => {
          const authorData = authorMap[story.user_id];

          let isViewed = false;
          if (user) {
            const { data: viewData } = await supabase.
            from('story_views').
            select('id').
            eq('story_id', story.id).
            eq('user_id', user.id).
            single();
            isViewed = !!viewData;
          }

          return {
            ...story,
            likes_count: story.likes_count || 0,
            is_liked: likedSet.has(story.id),
            replies_count: story.replies_count || 0,
            author: authorData ?
            { name: authorData.name || tr("usestories_i_stifadeci_b6bdd6", "\u0130stifad\u0259\xE7i"), avatar_url: authorData.avatar_url || null } :
            { name: tr("usestories_istifadeci_b6bdd6", "İstifadəçi"), avatar_url: null },
            is_viewed: isViewed
          };
        })
      );

      return storiesWithDetails as Story[];
    },
    staleTime: 30000
  });

  // Group stories by user
  const storyGroups: UserStoryGroup[] = stories.reduce((acc: UserStoryGroup[], story) => {
    const existingGroup = acc.find((g) => g.user_id === story.user_id);
    if (existingGroup) {
      existingGroup.stories.push(story);
      if (!story.is_viewed) {
        existingGroup.has_unviewed = true;
      }
    } else {
      acc.push({
        user_id: story.user_id,
        user_name: story.author?.name || tr("usestories_i_stifadeci_b6bdd6", "\u0130stifad\u0259\xE7i"),
        user_avatar: story.author?.avatar_url || null,
        stories: [story],
        has_unviewed: !story.is_viewed
      });
    }
    return acc;
  }, []);

  // Sort so current user is first, then unviewed, then viewed
  storyGroups.sort((a, b) => {
    if (a.user_id === user?.id) return -1;
    if (b.user_id === user?.id) return 1;
    if (a.has_unviewed && !b.has_unviewed) return -1;
    if (!a.has_unviewed && b.has_unviewed) return 1;
    return 0;
  });

  const createStoryMutation = useMutation({
    mutationFn: async ({
      mediaUrl,
      mediaType,
      textOverlay,
      backgroundColor,
      groupId: storyGroupId






    }: {mediaUrl: string;mediaType: 'image' | 'video';textOverlay?: string;backgroundColor?: string;groupId?: string;}) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.
      from('community_stories').
      insert({
        user_id: user.id,
        group_id: storyGroupId || null,
        media_url: mediaUrl,
        media_type: mediaType,
        text_overlay: textOverlay || null,
        background_color: backgroundColor || null
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      toast({ title: tr("usestories_story_paylasildi_e1288f", "Story paylaşıldı! 📸") });
    },
    onError: () => {
      toast({ title: tr("usestories_xeta_bas_verdi_f22fba", "Xəta baş verdi"), variant: 'destructive' });
    }
  });

  const markAsViewed = useCallback(async (storyId: string) => {
    if (!user) return;

    try {
      await supabase.
      from('story_views').
      upsert({
        story_id: storyId,
        user_id: user.id
      }, {
        onConflict: 'story_id,user_id'
      });

      queryClient.invalidateQueries({ queryKey: ['stories'] });
    } catch (error) {
      console.error('Error marking story as viewed:', error);
    }
  }, [user, queryClient]);

  const deleteStory = useMutation({
    mutationFn: async (storyId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.
      from('community_stories').
      delete().
      eq('id', storyId).
      eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      toast({ title: tr("stories_story_silindi", 'Story silindi') });
    }
  });

  return {
    stories,
    storyGroups,
    isLoading,
    createStory: createStoryMutation.mutate,
    isCreating: createStoryMutation.isPending,
    markAsViewed,
    deleteStory: deleteStory.mutate
  };
};

/**
 * Story like toggle — optimistic (useCommunity.ts-dəki useToggleLike ilə eyni prinsip).
 *  - Ürək DƏRHAL dolur/boşalır (server cavabı gözlənilmir)
 *  - Push bildirişi arxa planda göndərilir (öz story-nə like YOX)
 *  - Duplicate insert (sürətli double-tap, 23505) uğur sayılır
 *  - Xətada cache geri qaytarılır (rollback)
 */
export const useToggleStoryLike = () => {
  const queryClient = useQueryClient();

  // ['stories', groupId] açarının bütün variantlarını (əsas lenta + hər qrup) yenilə
  const patchStoryInCaches = (storyId: string, patch: (s: Story) => Story) => {
    queryClient.setQueriesData({ queryKey: ['stories'] }, (old: any) =>
    Array.isArray(old) ? old.map((s: Story) => s.id === storyId ? patch(s) : s) : old
    );
  };

  return useMutation({
    mutationFn: async ({ storyId, isLiked }: {storyId: string;isLiked: boolean;}) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (isLiked) {
        const { error } = await supabase.
        from('story_likes' as any).
        delete().
        eq('story_id', storyId).
        eq('user_id', user.id);
        if (error) throw error;
        return;
      }

      const { error } = await supabase.
      from('story_likes' as any).
      insert({ story_id: storyId, user_id: user.id });

      if (error) {
        // 23505 = unikal açar (artıq bəyənilib) — double-tap yarışı, uğur say
        if ((error as any).code === '23505') return;
        throw error;
      }

      // Push bildirişi ARXA PLANDA — story sahibinə (özünə deyilsə)
      void (async () => {
        try {
          const { data: story } = await supabase.from('community_stories').select('user_id').eq('id', storyId).maybeSingle();
          if (story && story.user_id !== user.id) {
            const { data: profile } = await supabase.from('public_profile_cards').select('name').eq('user_id', user.id).maybeSingle();
            const likerName = profile?.name || tr("usestories_i_stifadeci_b6bdd6", "\u0130stifad\u0259\xE7i");
            await supabase.functions.invoke('send-push-notification', {
              body: {
                userId: story.user_id,
                title: tr('usestories_yeni_beyenme_3fd88a', 'Yeni bəyənmə ❤️'),
                body: `${likerName} ${tr('usestories_story_nizi_beyendi', "story-nizi bəyəndi")}`,
                data: { type: 'story_like', storyId, context: 'community_story' }
              }
            });
          }
        } catch (e) {console.error('Story like notification error:', e);}
      })();
    },
    onMutate: async ({ storyId, isLiked }) => {
      await queryClient.cancelQueries({ queryKey: ['stories'] });
      const prev = queryClient.getQueriesData({ queryKey: ['stories'] });

      patchStoryInCaches(storyId, (s) => ({
        ...s,
        is_liked: !isLiked,
        likes_count: Math.max(0, (s.likes_count || 0) + (isLiked ? -1 : 1))
      }));

      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.prev?.forEach(([key, data]) => queryClient.setQueryData(key, data as any));
    }
  });
};
