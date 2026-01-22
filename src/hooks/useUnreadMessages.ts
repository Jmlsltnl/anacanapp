import { useMemo } from 'react';
import { usePartnerMessages } from './usePartnerMessages';
import { useAuth } from './useAuth';

/**
 * Hook to get unread message count for use in badges
 */
export const useUnreadMessages = () => {
  const { messages, loading } = usePartnerMessages();
  const { user } = useAuth();

  const unreadCount = useMemo(() => {
    if (!user || !messages) return 0;
    return messages.filter(m => m.receiver_id === user.id && !m.is_read).length;
  }, [messages, user]);

  return {
    unreadCount,
    loading,
    hasUnread: unreadCount > 0,
  };
};
