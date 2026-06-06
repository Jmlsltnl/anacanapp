import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Tracks how many community posts have been created since the user
 * last opened the Community tab. Stored on user_preferences.community_last_seen_at.
 *
 * Behavior:
 *  - On mount, fetch lastSeenAt and count of new posts after it.
 *  - Realtime: increment count when a new post arrives from another user.
 *  - markPostSeen(postId, createdAt): decrement count for a previously-unseen post
 *    and bump server-side lastSeenAt to the latest seen post timestamp (debounced).
 *  - markCommunitySeen(): mark everything as read (used for "mark all" actions).
 */
export const useUnreadCommunityPosts = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);

  // Track which posts have already been marked seen this session
  const seenIdsRef = useRef<Set<string>>(new Set());
  // Track the latest (max) created_at among posts we have marked seen
  const latestSeenTsRef = useRef<string | null>(null);
  // Debounce timer for syncing lastSeenAt to the server
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchLastSeen = useCallback(async () => {
    if (!user?.id) return null;
    const { data } = await supabase
      .from('user_preferences')
      .select('community_last_seen_at')
      .eq('user_id', user.id)
      .maybeSingle();
    const ts = (data as any)?.community_last_seen_at ?? null;
    setLastSeenAt(ts);
    return ts as string | null;
  }, [user?.id]);

  const fetchCount = useCallback(async (since: string | null) => {
    if (!user?.id) return;
    let query = supabase
      .from('community_posts')
      .select('id', { count: 'exact', head: true })
      .neq('user_id', user.id);
    if (since) query = query.gt('created_at', since);
    const { count, error } = await query;
    if (!error) setUnreadCount(count ?? 0);
  }, [user?.id]);

  const refresh = useCallback(async () => {
    const ts = await fetchLastSeen();
    await fetchCount(ts);
    // Reset session seen tracking when we refresh from server
    seenIdsRef.current = new Set();
    latestSeenTsRef.current = null;
  }, [fetchLastSeen, fetchCount]);

  // Persist current latest-seen-ts to server (debounced)
  const scheduleSync = useCallback(() => {
    if (!user?.id) return;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(async () => {
      const ts = latestSeenTsRef.current;
      if (!ts) return;
      // Only push forward, never backward
      if (lastSeenAt && new Date(ts) <= new Date(lastSeenAt)) return;
      await supabase
        .from('user_preferences')
        .upsert({ user_id: user.id, community_last_seen_at: ts } as any, { onConflict: 'user_id' });
      setLastSeenAt(ts);
    }, 1500);
  }, [user?.id, lastSeenAt]);

  // Mark a single post as seen (decrement badge + push lastSeenAt forward)
  const markPostSeen = useCallback((postId: string, createdAt: string, postUserId?: string) => {
    if (!user?.id) return;
    if (postUserId && postUserId === user.id) return; // own posts don't count
    if (seenIdsRef.current.has(postId)) return;
    // Only decrement if this post is actually "new" relative to lastSeenAt
    if (lastSeenAt && new Date(createdAt) <= new Date(lastSeenAt)) {
      seenIdsRef.current.add(postId);
      return;
    }
    seenIdsRef.current.add(postId);
    setUnreadCount((c) => Math.max(0, c - 1));
    // Track latest seen timestamp
    if (!latestSeenTsRef.current || new Date(createdAt) > new Date(latestSeenTsRef.current)) {
      latestSeenTsRef.current = createdAt;
    }
    scheduleSync();
  }, [user?.id, lastSeenAt, scheduleSync]);

  // Mark community as fully seen (used as a "mark all read" fallback)
  const markCommunitySeen = useCallback(async () => {
    if (!user?.id) return;
    const now = new Date().toISOString();
    await supabase
      .from('user_preferences')
      .upsert({ user_id: user.id, community_last_seen_at: now } as any, { onConflict: 'user_id' });
    setLastSeenAt(now);
    setUnreadCount(0);
    seenIdsRef.current = new Set();
    latestSeenTsRef.current = null;
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    refresh();

    // Realtime: listen for new posts
    const channel = supabase
      .channel('community-unread-' + user.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_posts' }, (payload) => {
        const newRow: any = payload.new;
        if (newRow?.user_id === user.id) return;
        if (!lastSeenAt || new Date(newRow.created_at) > new Date(lastSeenAt)) {
          setUnreadCount((c) => c + 1);
        }
      })
      .subscribe();

    // Refresh periodically
    const interval = setInterval(refresh, 60_000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return { unreadCount, markCommunitySeen, markPostSeen, refresh, lastSeenAt };
};
