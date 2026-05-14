import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Tracks how many community posts have been created since the user
 * last opened the Community tab. Stored on user_preferences.community_last_seen_at.
 */
export const useUnreadCommunityPosts = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);

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
  }, [fetchLastSeen, fetchCount]);

  // Mark community as seen now
  const markCommunitySeen = useCallback(async () => {
    if (!user?.id) return;
    const now = new Date().toISOString();
    await supabase
      .from('user_preferences')
      .upsert({ user_id: user.id, community_last_seen_at: now } as any, { onConflict: 'user_id' });
    setLastSeenAt(now);
    setUnreadCount(0);
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return { unreadCount, markCommunitySeen, refresh };
};
