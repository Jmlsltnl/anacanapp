import { useEffect, useId, useMemo } from 'react';
import { useInfiniteQuery, useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useUserStore } from '@/store/userStore';
import { matchesFeedLanguage } from './useFeedLanguages';
import { normalizeAppLanguage } from '@/lib/app-languages';
import { enrichPosts, type CommunityPost } from './useCommunity';
import { communityPostFilter, patchCommunityPost, restoreCommunityPostFields } from '@/lib/community-post-cache';
import { getPublicProfileCards, type PublicProfileCard } from '@/lib/public-profile-cards';
import { tr } from '@/lib/tr';

export type CommunityFeedView = 'recent' | 'popular' | 'mine' | 'saved' | 'following' | 'profile';
export type ConnectionDirection = 'followers' | 'following';
export interface CommunityProfileStats {
  user_id: string;
  posts_count: number;
  likes_count: number;
  followers_count: number;
  following_count: number;
  is_following: boolean;
}
export type CommunityConnection = PublicProfileCard & { is_following: boolean; followed_at: string };
const PAGE_SIZE = 30;

export function useCommunityFeed(view: CommunityFeedView, groupId: string | null = null, authorId: string | null = null, search = '') {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const language = normalizeAppLanguage(useUserStore((state) => state.language));
  const client = useQueryClient();
  const instance = useId();
  const query = useInfiniteQuery({
    queryKey: ['community-feed', userId, view, groupId, authorId, search, language],
    initialPageParam: 0,
    enabled: !!userId && !authLoading && (view !== 'profile' || !!authorId),
    staleTime: 0,
    queryFn: async ({ pageParam, signal }) => {
      const { data, error } = await (supabase as any).rpc('get_community_feed_v2', {
        p_language: language,
        p_view: view, p_group_id: groupId, p_author_id: authorId, p_search: search.trim() || null,
        p_limit: PAGE_SIZE + 1, p_offset: pageParam,
      }).abortSignal(signal);
      if (error) throw error;
      const rows = (data || []) as CommunityPost[];
      if (rows.some(post => !matchesFeedLanguage(post, language))) throw new Error('COMMUNITY_LANGUAGE_RESPONSE_MISMATCH');
      return { posts: await enrichPosts(rows.slice(0, PAGE_SIZE), userId), nextOffset: rows.length > PAGE_SIZE ? pageParam + PAGE_SIZE : undefined };
    },
    getNextPageParam: (last) => last.nextOffset,
  });

  useEffect(() => {
    if (!userId) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const channel = supabase.channel(`community-feed-${userId}-${instance}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_posts' }, (event) => {
        if (event.eventType === 'INSERT' && !matchesFeedLanguage(event.new as CommunityPost, language)) return;
        if (timer) return;
        timer = setTimeout(() => {
          timer = undefined;
          void client.invalidateQueries({ queryKey: ['community-feed', userId] });
          void client.invalidateQueries({ queryKey: ['community-profile-stats', userId] });
        }, 1500);
      }).subscribe();
    return () => { clearTimeout(timer); void supabase.removeChannel(channel); };
  }, [userId, instance, client, language]);

  const posts = useMemo(() => {
    const unique = new Map<string, CommunityPost>();
    query.data?.pages.forEach((page) => page.posts.forEach((post) => { if (matchesFeedLanguage(post, language)) unique.set(post.id, post); }));
    return [...unique.values()];
  }, [query.data, language]);
  return { ...query, posts };
}

export function useCommunityProfileStats(profileId: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['community-profile-stats', user?.id ?? null, profileId],
    enabled: !!user && !!profileId,
    staleTime: 10000,
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_community_profile_stats', { p_user_id: profileId });
      if (error) throw error;
      return data as CommunityProfileStats;
    },
  });
}

export function useCommunityConnections(profileId: string, direction: ConnectionDirection | null) {
  const { user } = useAuth();
  const query = useInfiniteQuery({
    queryKey: ['community-connections', user?.id ?? null, profileId, direction],
    initialPageParam: 0,
    enabled: !!user && !!direction,
    staleTime: 0,
    queryFn: async ({ pageParam, signal }) => {
      const { data, error } = await (supabase as any).rpc('get_community_connections', {
        p_user_id: profileId, p_direction: direction, p_limit: PAGE_SIZE + 1, p_offset: pageParam,
      }).abortSignal(signal);
      if (error) throw error;
      const rows = (data || []) as CommunityConnection[];
      const page = rows.slice(0, PAGE_SIZE);
      const effective = await getPublicProfileCards(page.map(person => person.user_id));
      return { connections: page.map(person => ({ ...person, ...effective[person.user_id] })), nextOffset: rows.length > PAGE_SIZE ? pageParam + PAGE_SIZE : undefined };
    },
    getNextPageParam: (last) => last.nextOffset,
  });
  return { ...query, connections: query.data?.pages.flatMap((page) => page.connections) || [] };
}

export function useCommunityFollow(targetId: string) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const client = useQueryClient();
  const { toast } = useToast();
  const mutationKey = ['community-follow', userId, targetId];
  const pending = useIsMutating({ mutationKey });
  const mutation = useMutation({
    mutationKey,
    mutationFn: async ({ following, actorId }: { following: boolean; actorId: string }) => {
      const { data, error } = await (supabase as any).rpc('set_community_follow', {
        p_expected_user_id: actorId, p_following_id: targetId, p_follow: following,
      });
      if (error) throw error;
      return data;
    },
    onMutate: async ({ following, actorId }) => {
      const targetKey = ['community-profile-stats', actorId, targetId];
      await client.cancelQueries({ queryKey: targetKey });
      const previous = client.getQueryData<CommunityProfileStats>(targetKey);
      if (previous) client.setQueryData(targetKey, {
        ...previous, is_following: following,
        followers_count: Math.max(0, previous.followers_count + (previous.is_following === following ? 0 : following ? 1 : -1)),
      });
      return { targetKey, previous };
    },
    onError: (_error, vars, context) => {
      if (context?.previous) client.setQueryData(context.targetKey, context.previous);
      if (vars.actorId === userId) toast({ title: tr('community_follow_failed', 'İzləmə dəyişdirilmədi. Yenidən cəhd edin.'), variant: 'destructive' });
    },
    onSettled: async (_data, _error, { actorId }) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['community-profile-stats', actorId] }),
        client.invalidateQueries({ queryKey: ['community-connections', actorId] }),
        client.invalidateQueries({ queryKey: ['community-feed', actorId, 'following'] }),
      ]);
    },
  });
  return { ...mutation, isPending: mutation.isPending || pending > 0,
    setFollowing: (following: boolean) => { if (userId && userId !== targetId) mutation.mutate({ following, actorId: userId }); },
  };
}

export function useCommunityBookmark(postId: string) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const client = useQueryClient();
  const { toast } = useToast();
  const mutationKey = ['community-bookmark', userId, postId];
  const pending = useIsMutating({ mutationKey });
  const mutation = useMutation({
    mutationKey,
    mutationFn: async ({ saved, actorId }: { saved: boolean; actorId: string }) => {
      const { data, error } = await (supabase as any).rpc('set_community_bookmark', {
        p_expected_user_id: actorId, p_post_id: postId, p_saved: saved,
      });
      if (error) throw error;
      return data;
    },
    onMutate: async ({ saved, actorId }) => {
      const filter = communityPostFilter(actorId);
      await client.cancelQueries(filter);
      const previous = client.getQueriesData(filter);
      patchCommunityPost(client, actorId, postId, (post) => ({ ...post, is_saved: saved }));
      return { previous };
    },
    onError: (_error, vars, context) => {
      if (context) restoreCommunityPostFields(client, context.previous, postId, ['is_saved']);
      if (vars.actorId === userId) toast({ title: tr('community_save_failed', 'Paylaşım saxlanılmadı. Yenidən cəhd edin.'), variant: 'destructive' });
    },
    onSettled: async (_data, _error, { actorId }) => {
      await client.invalidateQueries({ queryKey: ['community-feed', actorId, 'saved'] });
    },
  });
  return { ...mutation, isPending: mutation.isPending || pending > 0,
    setSaved: (saved: boolean) => { if (userId) mutation.mutate({ saved, actorId: userId }); },
  };
}
