import { useState, useCallback } from 'react';
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
      let query = supabase
        .from('community_stories')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (groupId) {
        query = query.eq('group_id', groupId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const authorMap = await getPublicProfileCards((data || []).map((s: any) => s.user_id));

      // Fetch author details and view status
      const storiesWithDetails = await Promise.all(
        (data || []).map(async (story: any) => {
          const authorData = authorMap[story.user_id];

          let isViewed = false;
          if (user) {
            const { data: viewData } = await supabase
              .from('story_views')
              .select('id')
              .eq('story_id', story.id)
              .eq('user_id', user.id)
              .single();
            isViewed = !!viewData;
          }

          return {
            ...story,
            author: authorData
              ? { name: authorData.name || 'İstifadəçi', avatar_url: authorData.avatar_url || null }
              : { name: 'İstifadəçi', avatar_url: null },
            is_viewed: isViewed,
          };
        })
      );

      return storiesWithDetails as Story[];
    },
    staleTime: 30000,
  });

  // Group stories by user
  const storyGroups: UserStoryGroup[] = stories.reduce((acc: UserStoryGroup[], story) => {
    const existingGroup = acc.find(g => g.user_id === story.user_id);
    if (existingGroup) {
      existingGroup.stories.push(story);
      if (!story.is_viewed) {
        existingGroup.has_unviewed = true;
      }
    } else {
      acc.push({
        user_id: story.user_id,
        user_name: story.author?.name || 'İstifadəçi',
        user_avatar: story.author?.avatar_url || null,
        stories: [story],
        has_unviewed: !story.is_viewed,
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
      groupId: storyGroupId,
    }: {
      mediaUrl: string;
      mediaType: 'image' | 'video';
      textOverlay?: string;
      backgroundColor?: string;
      groupId?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('community_stories')
        .insert({
          user_id: user.id,
          group_id: storyGroupId || null,
          media_url: mediaUrl,
          media_type: mediaType,
          text_overlay: textOverlay || null,
          background_color: backgroundColor || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      toast({ title: 'Story paylaşıldı! 📸' });
    },
    onError: () => {
      toast({ title: 'Xəta baş verdi', variant: 'destructive' });
    },
  });

  const markAsViewed = useCallback(async (storyId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('story_views')
        .upsert({
          story_id: storyId,
          user_id: user.id,
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

      const { error } = await supabase
        .from('community_stories')
        .delete()
        .eq('id', storyId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      toast({ title: 'Story silindi' });
    },
  });

  return {
    stories,
    storyGroups,
    isLoading,
    createStory: createStoryMutation.mutate,
    isCreating: createStoryMutation.isPending,
    markAsViewed,
    deleteStory: deleteStory.mutate,
  };
};
