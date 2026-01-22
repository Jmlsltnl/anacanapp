import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CommunityGroup {
  id: string;
  name: string;
  description: string | null;
  group_type: string;
  cover_image_url: string | null;
  icon_emoji: string | null;
  is_active: boolean;
  is_auto_join: boolean;
  auto_join_criteria: Record<string, any> | null;
  member_count: number;
  created_at: string;
}

export interface CommunityPost {
  id: string;
  group_id: string | null;
  user_id: string;
  content: string;
  media_urls: string[] | null;
  likes_count: number;
  comments_count: number;
  is_pinned: boolean;
  created_at: string;
  author?: {
    name: string;
    avatar_url: string | null;
    badge_type?: string;
  };
  is_liked?: boolean;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  likes_count: number;
  created_at: string;
  author?: {
    name: string;
    avatar_url: string | null;
    badge_type?: string;
  };
  is_liked?: boolean;
}

export const useCommunityGroups = () => {
  return useQuery({
    queryKey: ['community-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_groups')
        .select('*')
        .eq('is_active', true)
        .order('group_type', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data as CommunityGroup[];
    },
  });
};

export const useUserMemberships = () => {
  return useQuery({
    queryKey: ['user-memberships'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('group_memberships')
        .select('group_id, role, joined_at')
        .eq('user_id', user.id);

      if (error) throw error;
      return data;
    },
  });
};

export const useJoinGroup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (groupId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('group_memberships')
        .insert({ group_id: groupId, user_id: user.id });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-memberships'] });
      queryClient.invalidateQueries({ queryKey: ['community-groups'] });
      toast({ title: 'Qrupa qoşuldunuz! 🎉' });
    },
    onError: () => {
      toast({ title: 'Xəta baş verdi', variant: 'destructive' });
    },
  });
};

export const useLeaveGroup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (groupId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('group_memberships')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-memberships'] });
      queryClient.invalidateQueries({ queryKey: ['community-groups'] });
      toast({ title: 'Qrupdan ayrıldınız' });
    },
  });
};

export const useGroupPosts = (groupId: string | null) => {
  return useQuery({
    queryKey: ['group-posts', groupId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase
        .from('community_posts')
        .select('*')
        .eq('is_active', true)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (groupId) {
        query = query.eq('group_id', groupId);
      } else {
        query = query.is('group_id', null);
      }

      const { data: posts, error } = await query;
      if (error) throw error;

      // Fetch author details and like status for each post
      const postsWithDetails = await Promise.all(
        (posts || []).map(async (post) => {
          // Get author
          const { data: authorData } = await supabase
            .from('profiles')
            .select('name, avatar_url')
            .eq('user_id', post.user_id)
            .single();

          // Check if user liked this post
          let isLiked = false;
          if (user) {
            const { data: likeData } = await supabase
              .from('post_likes')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', user.id)
              .single();
            isLiked = !!likeData;
          }

          return {
            ...post,
            author: authorData || { name: 'İstifadəçi', avatar_url: null },
            is_liked: isLiked,
          };
        })
      );

      return postsWithDetails as CommunityPost[];
    },
    enabled: groupId !== undefined,
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ groupId, content, mediaUrls }: { groupId: string | null; content: string; mediaUrls?: string[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('community_posts')
        .insert({
          group_id: groupId,
          user_id: user.id,
          content,
          media_urls: mediaUrls || [],
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group-posts', variables.groupId] });
      toast({ title: 'Paylaşım əlavə edildi! ✨' });
    },
    onError: () => {
      toast({ title: 'Xəta baş verdi', variant: 'destructive' });
    },
  });
};

export const useToggleLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, isLiked, groupId }: { postId: string; isLiked: boolean; groupId: string | null }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (isLiked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: user.id });
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group-posts', variables.groupId] });
    },
  });
};

export const usePostComments = (postId: string) => {
  return useQuery({
    queryKey: ['post-comments', postId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: comments, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const commentsWithDetails = await Promise.all(
        (comments || []).map(async (comment) => {
          const { data: authorData } = await supabase
            .from('profiles')
            .select('name, avatar_url')
            .eq('user_id', comment.user_id)
            .single();

          let isLiked = false;
          if (user) {
            const { data: likeData } = await supabase
              .from('comment_likes')
              .select('id')
              .eq('comment_id', comment.id)
              .eq('user_id', user.id)
              .single();
            isLiked = !!likeData;
          }

          return {
            ...comment,
            author: authorData || { name: 'İstifadəçi', avatar_url: null },
            is_liked: isLiked,
          };
        })
      );

      return commentsWithDetails as PostComment[];
    },
    enabled: !!postId,
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content,
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['group-posts'] });
    },
  });
};

export const useAutoJoinGroups = () => {
  const queryClient = useQueryClient();

  const autoJoin = useCallback(async (profile: {
    life_stage?: string;
    baby_birth_date?: string;
    baby_gender?: string;
    multiples_type?: string;
    due_date?: string;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get all auto-join groups
    const { data: groups } = await supabase
      .from('community_groups')
      .select('*')
      .eq('is_active', true)
      .eq('is_auto_join', true);

    if (!groups) return;

    // Get user's current memberships
    const { data: memberships } = await supabase
      .from('group_memberships')
      .select('group_id')
      .eq('user_id', user.id);

    const memberGroupIds = new Set(memberships?.map(m => m.group_id) || []);

    // Check each group's criteria
    for (const group of groups) {
      if (memberGroupIds.has(group.id)) continue;

      const criteria = group.auto_join_criteria as Record<string, any> | null;
      if (!criteria) continue;

      let shouldJoin = true;

      // Check life stage
      if (criteria.life_stage && criteria.life_stage !== profile.life_stage) {
        shouldJoin = false;
      }

      // Check birth month for mommy stage
      if (criteria.birth_month && profile.baby_birth_date) {
        const birthMonth = profile.baby_birth_date.substring(0, 7);
        if (criteria.birth_month !== birthMonth) {
          shouldJoin = false;
        }
      }

      // Check baby gender
      if (criteria.baby_gender && criteria.baby_gender !== profile.baby_gender) {
        shouldJoin = false;
      }

      // Check multiples type
      if (criteria.multiples_type && criteria.multiples_type !== profile.multiples_type) {
        shouldJoin = false;
      }

      // Check pregnancy month
      if (criteria.pregnancy_month && profile.due_date) {
        const dueDate = new Date(profile.due_date);
        const now = new Date();
        const weeksPregnant = Math.floor((dueDate.getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000));
        const monthsPregnant = Math.ceil((40 - weeksPregnant) / 4);
        if (criteria.pregnancy_month !== monthsPregnant) {
          shouldJoin = false;
        }
      }

      if (shouldJoin) {
        await supabase
          .from('group_memberships')
          .insert({ group_id: group.id, user_id: user.id })
          .then(() => {});
      }
    }

    queryClient.invalidateQueries({ queryKey: ['user-memberships'] });
  }, [queryClient]);

  return { autoJoin };
};
