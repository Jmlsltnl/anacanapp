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

// PERF: localStorage yazısı debounce olunur — əvvəllər scroll zamanı HƏR
// işarələnən post üçün bütün massivin JSON.stringify + sinxron setItem-i
// baş verirdi (main thread-i scroll əsnasında bloklayıb "donma" hissi yaradırdı).
let pendingWriteTimer: ReturnType<typeof setTimeout> | null = null;
let pendingWriteUserId: string | null = null;
let pendingWriteData: SeenPostMap | null = null;

const flushSeenPostIds = () => {
  if (pendingWriteTimer) {
    clearTimeout(pendingWriteTimer);
    pendingWriteTimer = null;
  }
  if (!pendingWriteUserId || !pendingWriteData) return;
  try {
    window.localStorage.setItem(
      `community_seen_posts:${pendingWriteUserId}`,
      JSON.stringify(Object.keys(pendingWriteData))
    );
  } catch {
  }
  pendingWriteUserId = null;
  pendingWriteData = null;
};

const writeSeenPostIds = (userId: string, seenPostIds: SeenPostMap) => {
  if (typeof window === 'undefined') return;
  // Fərqli istifadəçiyə keçiddə əvvəlkini dərhal yaz
  if (pendingWriteUserId && pendingWriteUserId !== userId) flushSeenPostIds();
  pendingWriteUserId = userId;
  pendingWriteData = seenPostIds;
  if (pendingWriteTimer) clearTimeout(pendingWriteTimer);
  pendingWriteTimer = setTimeout(flushSeenPostIds, 800);
};

// App arxa plana keçəndə / bağlananda yarımçıq yazı itməsin
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushSeenPostIds);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushSeenPostIds();
  });
}

let activeUnreadChannel: RealtimeChannel | null = null;
let activeUnreadChannelUserId: string | null = null;
let activeHydrationUserId: string | null = null;
let activeHydrationPromise: Promise<void> | null = null;

const useUnreadCommunityStore = create<UnreadCommunityState>((set, get) => ({
  unreadCount: 0,
  lastSeenAt: null,
  seenPostIds: {},
  initializedUserId: null,
  realtimeReadyForUserId: null,

  hydrateForUser: async (userId: string) => {
    const localSeenPostIds = readSeenPostIds(userId);

    const { data: prefData } = await supabase
      .from('user_preferences')
      .select('community_last_seen_at')
      .eq('user_id', userId)
      .maybeSingle();

    const lastSeenAt = (prefData as any)?.community_last_seen_at ?? null;

    // QEYD: əvvəllər burada "feed dil linzası" filtri var idi (yalnız
    // istifadəçinin seçdiyi dillərdəki postlar sayılırdı) — indi HEÇ bir dil
    // filtri yoxdur, bütün qlobal postlar sayılır (dil yalnız sıralama üçün
    // istifadə olunur, bax useCommunity.ts).
    // KRİTİK PERF DÜZƏLİŞİ: server-side `created_at` sərhədi ilə yalnız son
    // baxışdan bəri olan postlar çəkilir — əvvəllər BÜTÜN tarix boyu postlar
    // (limitsiz!) çəkilib client-side filtrlənirdi; community_posts böyüdükcə
    // bu sorğu hər istifadəçi üçün getdikcə ağırlaşırdı (bu hook BottomNav-da
    // daim mount olunur).
    let postsQuery = supabase
      .from('community_posts')
      .select('id, created_at, user_id')
      .eq('is_active', true)
      .is('group_id', null)
      .neq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(500); // təhlükəsizlik həddi (çox uzun müddət açılmayan tətbiq üçün)

    if (lastSeenAt) {
      postsQuery = postsQuery.gt('created_at', lastSeenAt);
    }

    const { data: posts, error } = await postsQuery;
    if (error) throw error;

    const postIds = (posts || []).map((p: any) => p.id);

    // Yalnız yuxarıdakı (artıq sərhədlənmiş) post dəstinin read-sətirləri —
    // əvvəllər istifadəçinin BÜTÜN read-tarixçəsi (limitsiz, əbədi böyüyən) çəkilirdi.
    let serverSeenPostIds: SeenPostMap = {};
    if (postIds.length > 0) {
      const { data: readRows, error: readsError } = await supabase
        .from('community_post_reads')
        .select('post_id')
        .eq('user_id', userId)
        .in('post_id', postIds);

      if (readsError) throw readsError;

      serverSeenPostIds = Object.fromEntries(
        ((readRows || []) as Array<{ post_id: string }>).map((row) => [row.post_id, true])
      ) as SeenPostMap;
    }

    const seenPostIds = { ...localSeenPostIds, ...serverSeenPostIds } satisfies SeenPostMap;
    writeSeenPostIds(userId, seenPostIds);

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

    // PERF: tək set() çağırışı — əvvəllər 3 ayrı set() (syncing true/false daxil)
    // hər scroll-da bütün abunəçilərdə 3 render dalğası yaradırdı.
    const nextSeenPostIds = { ...state.seenPostIds, [postId]: true } satisfies SeenPostMap;
    set({
      seenPostIds: nextSeenPostIds,
      unreadCount: Math.max(0, state.unreadCount - 1),
    });

    writeSeenPostIds(userId, nextSeenPostIds);

    const { error } = await supabase
      .from('community_post_reads')
      .upsert({ user_id: userId, post_id: postId, seen_at: new Date().toISOString() } as any, { onConflict: 'user_id,post_id' });

    // QEYD: əvvəllər xəta zamanı tam hydrateForUser() işə düşürdü — zəif
    // şəbəkədə scroll əsnasında sorğu partlayışı yaradırdı. Lokal işarə
    // onsuz da optimistik saxlanılır; itirilmiş tək read-marker zərərsizdir.
    if (error) console.warn('markPostSeen upsert failed:', error.message);
  },

  markCommunitySeen: async (userId: string) => {
    // Eyni bounded strategiya: yalnız (indiyədək bilinən) son baxışdan bəri
    // olan postlar çəkilir — 500 həddindən artıq olsa belə, DESC sıralama
    // sayəsində ən son postun created_at-ı düzgün qalır (community_last_seen_at
    // düzgün irəliləyir, geridəki köhnə postlar isə onsuz da "oxunmuş" sayılır).
    const prevLastSeenAt = get().lastSeenAt;

    let postsQuery = supabase
      .from('community_posts')
      .select('id, created_at, user_id')
      .eq('is_active', true)
      .is('group_id', null)
      .neq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(500);

    if (prevLastSeenAt) {
      postsQuery = postsQuery.gt('created_at', prevLastSeenAt);
    }

    const { data: posts } = await postsQuery;

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
    realtimeReadyForUserId: null,
  }),
}));

export const useUnreadCommunityPosts = () => {
  const { user } = useAuth();
  // PERF: per-field selektorlar — selektorsuz useStore() HƏR store dəyişikliyində
  // bütün abunəçiləri (feed-dəki hər PostSeenObserver + BottomNav) re-render edirdi.
  const unreadCount = useUnreadCommunityStore((s) => s.unreadCount);
  const lastSeenAt = useUnreadCommunityStore((s) => s.lastSeenAt);
  const seenPostIds = useUnreadCommunityStore((s) => s.seenPostIds);
  const initializedUserId = useUnreadCommunityStore((s) => s.initializedUserId);
  const hydrateForUser = useUnreadCommunityStore((s) => s.hydrateForUser);
  const markPostSeenInStore = useUnreadCommunityStore((s) => s.markPostSeen);
  const markCommunitySeenInStore = useUnreadCommunityStore((s) => s.markCommunitySeen);
  const registerNewPost = useUnreadCommunityStore((s) => s.registerNewPost);
  const isPostUnread = useUnreadCommunityStore((s) => s.isPostUnread);
  const reset = useUnreadCommunityStore((s) => s.reset);

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
          // Hydrate ilə EYNİ semantika: yalnız qlobal feed (dil filtri artıq
          // yoxdur — bütün yeni qlobal postlar badge-ə daxildir).
          if (newRow.group_id) return;
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

// ── Feed-dəki hər post üçün YÜNGÜL abunəliklər ──────────────────────────────
// PostSeenObserver bunlarla yalnız ÖZ postunun statusu dəyişəndə render olunur
// (boolean selektor). Əvvəl bütün seenPostIds xəritəsinə abunə idi — hər
// işarələnən post feed-dəki BÜTÜN postları re-render edirdi (scroll donması).

export const usePostSeenFlag = (postId: string) =>
  useUnreadCommunityStore((s) => !!s.seenPostIds[postId]);

export const usePostUnreadFlag = (
  userId: string | undefined,
  postId: string,
  createdAt: string,
  postUserId?: string
) =>
  useUnreadCommunityStore((s) => {
    if (!userId) return false;
    if (postUserId && postUserId === userId) return false;
    if (s.initializedUserId !== userId) return false;
    if (s.seenPostIds[postId]) return false;
    if (!s.lastSeenAt) return true;
    return new Date(createdAt) > new Date(s.lastSeenAt);
  });

// Store-a abunə olmadan imperativ işarələmə (stabil referans)
export const markPostSeenDirect = (
  userId: string,
  postId: string,
  createdAt: string,
  postUserId?: string
) => useUnreadCommunityStore.getState().markPostSeen({ userId, postId, createdAt, postUserId });