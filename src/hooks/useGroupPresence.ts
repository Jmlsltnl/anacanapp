import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface PresenceState {
  onlineCount: number;
  onlineUsers: Array<{
    id: string;
    name: string;
    avatar_url?: string;
  }>;
  typingUsers: Array<{
    id: string;
    name: string;
  }>;
}

export const useGroupPresence = (groupId: string | null) => {
  const [presenceState, setPresenceState] = useState<PresenceState>({
    onlineCount: 0,
    onlineUsers: [],
    typingUsers: [],
  });
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (!groupId) {
      setPresenceState({ onlineCount: 0, onlineUsers: [], typingUsers: [] });
      return;
    }

    const setupPresence = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('user_id', user.id)
        .single();

      const channelName = `group_presence:${groupId}`;
      const channel = supabase.channel(channelName, {
        config: {
          presence: { key: user.id },
        },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const users: PresenceState['onlineUsers'] = [];
          const typing: PresenceState['typingUsers'] = [];

          Object.entries(state).forEach(([userId, presences]) => {
            const presence = (presences as any[])[0];
            if (presence) {
              users.push({
                id: userId,
                name: presence.name || 'İstifadəçi',
                avatar_url: presence.avatar_url,
              });
              if (presence.isTyping && userId !== user.id) {
                typing.push({
                  id: userId,
                  name: presence.name || 'İstifadəçi',
                });
              }
            }
          });

          setPresenceState({
            onlineCount: users.length,
            onlineUsers: users,
            typingUsers: typing,
          });
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          // Handle user join
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          // Handle user leave
        });

      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            name: profile?.name || 'İstifadəçi',
            avatar_url: profile?.avatar_url,
            isTyping: false,
            online_at: new Date().toISOString(),
          });
        }
      });

      channelRef.current = channel;
    };

    setupPresence();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [groupId]);

  const setTyping = useCallback(async (isTyping: boolean) => {
    if (!channelRef.current || isTypingRef.current === isTyping) return;
    
    isTypingRef.current = isTyping;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('name, avatar_url')
      .eq('user_id', user.id)
      .single();

    await channelRef.current.track({
      name: profile?.name || 'İstifadəçi',
      avatar_url: profile?.avatar_url,
      isTyping,
      online_at: new Date().toISOString(),
    });

    // Auto-stop typing after 3 seconds
    if (isTyping) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(false);
      }, 3000);
    }
  }, []);

  const startTyping = useCallback(() => setTyping(true), [setTyping]);
  const stopTyping = useCallback(() => setTyping(false), [setTyping]);

  return {
    ...presenceState,
    startTyping,
    stopTyping,
  };
};
