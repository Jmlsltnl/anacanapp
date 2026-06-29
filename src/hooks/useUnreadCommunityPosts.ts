import { useCallback, useEffect } from 'react';
import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { RealtimeChannel } from '@supabase/supabase-js';

type SeenPostMap = Record<string, boolean>;

type UnreadCommunityState = {
  unreadCount: number;
  lastSeenAt: string | null;
  seenPostIds: SeenPostMap;
  initializedUserId: string | null;
  syncing: boolean;
  realtimeReadyForUserId: string | null;
  hydrateForUser: (userId: string) => Promise<void>;
  markPostSeen: (params: { userId: string; postId: string; createdAt: string; postUserId?: string }) => Promise<void>;
  markCommunitySeen: (userId: string) => Promise<void>;
  registerNewPost: (params: { userId: string; postId: string; createdAt: string; postUserId?: string }) => void;
  isPostUnread: (params: { userId: string; postId: string; createdAt: string; postUserId?: string }) => boolean;
  reset: () => void;
};

const readSeenPostIds = (userId: string) => {
  if (typeof window === 'undefined') return {} as SeenPostMap;
  try {
    const raw = window.localStorage.getItem(`community_seen_posts:${userId}`);
    if (!raw) return {} as SeenPostMap;
    const parsed = JSON.parse(raw) as string[];
    return Object.fromEntries(parsed.map((id) => [id, true])) as SeenPostMap;
  } catch {
    return {} as SeenPostMap;
  }
};

const writeSeenPostIds = (userId: string, seenPostIds: SeenPostMap) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`community_seen_posts:${userId}`, JSON.stringify(Object.keys(seenPostIds)));
  } catch {
  }
};

let activeUnreadChannel: RealtimeChannel | null = null;
let activeUnreadChannelUserId: string | null = null;
let activeHydrationUserId: string | null = null;
let activeHydrationPromise: Promise<void> | null = null;

const useUnreadCommunityStore = create<UnreadCommunityState>((set, get) => ({
  unreadCount: 0,
  lastSeenAt: null,
  seenPostIds: {},
  initializedUserId: null,
  syncing: false,
  realtimeReadyForUserId: null,

  hydrateForUser: async (userId: string) => {
    const localSeenPostIds = readSeenPostIds(userId);

    const { data: prefData } = await supabase
      .from('user_preferences')
      .select('community_last_seen_at')
      .eq('user_id', userId)
      .maybeSingle();

    const lastSeenAt = (prefData as any)?.community_last_seen_at ?? null;

    const { data: readRows, error: readsError } = await supabase
      .from('community_post_reads')
      .select('post_id')
      .eq('user_id', userId);

    if (readsError) throw readsError;

    const serverSeenPostIds = Object.fromEntries(
      ((readRows || []) as Array<{ post_id: string }>).map((row) => [row.post_id, true])
    ) as SeenPostMap;
    const seenPostIds = { ...localSeenPostIds, ...serverSeenPostIds } satisfies SeenPostMap;
    writeSeenPostIds(userId, seenPostIds);

    const currentLanguage = localStorage.getItem('language') || 'az';
    const { data: posts, error } = await supabase
      .from('community_posts')
      .select('id, created_at, user_id')
      .eq('language', currentLanguage)
      .eq('is_active', true)
      .is('group_id', null)
      .neq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const unreadCount = (posts || []).filter((post: any) => {
      if (seenPostIds[post.id]) return false;
      if (!lastSeenAt) return true;
      return new Date(post.created_at) > new Date(lastSeenAt);
    }).length;

    set({
      unreadCount,
      lastSeenAt,
      seenPostIds,
      initializedUserId: userId,
    });
  },

  markPostSeen: async ({ userId, postId, createdAt, postUserId }) => {
    if (postUserId && postUserId === userId) return;

    const state = get();
    if (state.initializedUserId !== userId) return;
    if (state.seenPostIds[postId]) return;

    const nextSeenPostIds = { ...state.seenPostIds, [postId]: true } satisfies SeenPostMap;
    set({
      seenPostIds: nextSeenPostIds,
      unreadCount: Math.max(0, state.unreadCount - 1),
      syncing: true,
    });

    writeSeenPostIds(userId, nextSeenPostIds);

    const { error } = await supabase
      .from('community_post_reads')
      .upsert({ user_id: userId, post_id: postId, seen_at: new Date().toISOString() } as any, { onConflict: 'user_id,post_id' });

    if (!error) {
      set({ syncing: false });
      return;
    }

    set({ syncing: false });
    if (error) await get().hydrateForUser(userId);
  },

  markCommunitySeen: async (userId: string) => {
    const currentLanguage = localStorage.getItem('language') || 'az';
    const { data: posts } = await supabase
      .from('community_posts')
      .select('id, created_at, user_id')
      .eq('language', currentLanguage)
      .eq('is_active', true)
      .is('group_id', null)
      .neq('user_id', userId)
      .order('created_at', { ascending: false });

    const seenPostIds = {
      ...get().seenPostIds,
      ...Object.fromEntries(((posts || []) as any[]).map((post) => [post.id, true])),
    } satisfies SeenPostMap;
    const latestPostAt = (posts || [])[0]?.created_at ?? new Date().toISOString();

    set({ unreadCount: 0, seenPostIds, lastSeenAt: latestPostAt });
    writeSeenPostIds(userId, seenPostIds);

    if ((posts || []).length > 0) {
      await supabase.from('community_post_reads').upsert(
        ((posts || []) as any[]).map((post) => ({ user_id: userId, post_id: post.id, seen_at: new Date().toISOString() })) as any,
        { onConflict: 'user_id,post_id' }
      );
    }

    await supabase
      .from('user_preferences')
      .upsert({ user_id: userId, community_last_seen_at: latestPostAt } as any, { onConflict: 'user_id' });
  },

  registerNewPost: ({ userId, postId, createdAt, postUserId }) => {
    if (postUserId && postUserId === userId) return;

    const state = get();
    if (state.initializedUserId !== userId) return;
    if (state.seenPostIds[postId]) return;
    if (state.lastSeenAt && new Date(createdAt) <= new Date(state.lastSeenAt)) return;

    set({ unreadCount: state.unreadCount + 1 });
  },

  isPostUnread: ({ userId, postId, createdAt, postUserId }) => {
    const state = get();
    if (postUserId && postUserId === userId) return false;
    if (state.initializedUserId !== userId) return false;
    if (state.seenPostIds[postId]) return false;
    if (!state.lastSeenAt) return true;
    return new Date(createdAt) > new Date(state.lastSeenAt);
  },

  reset: () => set({
    unreadCount: 0,
    lastSeenAt: null,
    seenPostIds: {},
    initializedUserId: null,
    syncing: false,
    realtimeReadyForUserId: null,
  }),
}));

export const useUnreadCommunityPosts = () => {
  const { user } = useAuth();
  const {
    unreadCount,
    lastSeenAt,
    seenPostIds,
    initializedUserId,
    hydrateForUser,
    markPostSeen: markPostSeenInStore,
    markCommunitySeen: markCommunitySeenInStore,
    registerNewPost,
    isPostUnread,
    reset,
  } = useUnreadCommunityStore();

  useEffect(() => {
    if (!user?.id) {
      if (activeUnreadChannel) {
        supabase.removeChannel(activeUnreadChannel);
        activeUnreadChannel = null;
      }
      activeUnreadChannelUserId = null;
      activeHydrationUserId = null;
      activeHydrationPromise = null;
      reset();
      return;
    }

    if (initializedUserId !== user.id && activeHydrationUserId !== user.id) {
      activeHydrationUserId = user.id;
      activeHydrationPromise = hydrateForUser(user.id).finally(() => {
        activeHydrationUserId = null;
        activeHydrationPromise = null;
      });
    }

    if (activeUnreadChannelUserId !== user.id) {
      if (activeUnreadChannel) supabase.removeChannel(activeUnreadChannel);
      activeUnreadChannel = supabase
        .channel(`community-unread-${user.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_posts' }, (payload) => {
          const newRow: any = payload.new;
          registerNewPost({ userId: user.id, postId: newRow.id, createdAt: newRow.created_at, postUserId: newRow.user_id });
        })
        .subscribe();
      activeUnreadChannelUserId = user.id;
    }
  }, [user?.id, hydrateForUser, initializedUserId, registerNewPost, reset]);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    await hydrateForUser(user.id);
  }, [user?.id, hydrateForUser]);

  const markPostSeen = useCallback(async (postId: string, createdAt: string, postUserId?: string) => {
    if (!user?.id) return;
    await markPostSeenInStore({ userId: user.id, postId, createdAt, postUserId });
  }, [user?.id, markPostSeenInStore]);

  const markCommunitySeen = useCallback(async () => {
    if (!user?.id) return;
    await markCommunitySeenInStore(user.id);
  }, [user?.id, markCommunitySeenInStore]);

  const isUnreadPost = useCallback((postId: string, createdAt: string, postUserId?: string) => {
    if (!user?.id) return false;
    return isPostUnread({ userId: user.id, postId, createdAt, postUserId });
  }, [user?.id, isPostUnread, seenPostIds, lastSeenAt, initializedUserId]);

  return { unreadCount, markCommunitySeen, markPostSeen, refresh, lastSeenAt, isUnreadPost, seenPostIds };
};