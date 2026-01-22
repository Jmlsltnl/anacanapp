import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface PushSettings {
  push_enabled: boolean;
  push_messages: boolean;
  push_likes: boolean;
  push_comments: boolean;
  push_community: boolean;
}

const defaultSettings: PushSettings = {
  push_enabled: true,
  push_messages: true,
  push_likes: true,
  push_comments: true,
  push_community: true,
};

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PushSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('push_enabled, push_messages, push_likes, push_comments, push_community')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching push settings:', error);
      }

      if (data) {
        setSettings({
          push_enabled: data.push_enabled ?? true,
          push_messages: data.push_messages ?? true,
          push_likes: data.push_likes ?? true,
          push_comments: data.push_comments ?? true,
          push_community: data.push_community ?? true,
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSetting = useCallback(async <K extends keyof PushSettings>(
    key: K,
    value: PushSettings[K]
  ) => {
    if (!user) return;

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          [key]: value,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error updating push setting:', error);
        // Revert on error
        setSettings(settings);
      }
    } catch (error) {
      console.error('Error:', error);
      setSettings(settings);
    }
  }, [user, settings]);

  const sendPushToUser = useCallback(async (
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>
  ) => {
    try {
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: { userId, title, body, data },
      });

      if (error) {
        console.error('Error sending push:', error);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }, []);

  return {
    settings,
    loading,
    updateSetting,
    sendPushToUser,
    refetch: fetchSettings,
  };
};

// Hook for triggering push notifications on community events
export const useCommunityPushNotifications = () => {
  const { user } = useAuth();

  const notifyNewLike = useCallback(async (postAuthorId: string, likerName: string) => {
    if (!user || postAuthorId === user.id) return;

    try {
      await supabase.functions.invoke('send-push-notification', {
        body: {
          userId: postAuthorId,
          title: 'Yeni bəyənmə! ❤️',
          body: `${likerName} paylaşımınızı bəyəndi`,
          data: { type: 'like' },
        },
      });
    } catch (error) {
      console.error('Error sending like notification:', error);
    }
  }, [user]);

  const notifyNewComment = useCallback(async (
    postAuthorId: string,
    commenterName: string,
    commentPreview: string
  ) => {
    if (!user || postAuthorId === user.id) return;

    try {
      await supabase.functions.invoke('send-push-notification', {
        body: {
          userId: postAuthorId,
          title: 'Yeni şərh! 💬',
          body: `${commenterName}: ${commentPreview.slice(0, 50)}${commentPreview.length > 50 ? '...' : ''}`,
          data: { type: 'comment' },
        },
      });
    } catch (error) {
      console.error('Error sending comment notification:', error);
    }
  }, [user]);

  const notifyNewMessage = useCallback(async (
    receiverId: string,
    senderName: string,
    messagePreview: string
  ) => {
    if (!user || receiverId === user.id) return;

    try {
      await supabase.functions.invoke('send-push-notification', {
        body: {
          userId: receiverId,
          title: `${senderName} 💌`,
          body: messagePreview.slice(0, 50) + (messagePreview.length > 50 ? '...' : ''),
          data: { type: 'message' },
        },
      });
    } catch (error) {
      console.error('Error sending message notification:', error);
    }
  }, [user]);

  return {
    notifyNewLike,
    notifyNewComment,
    notifyNewMessage,
  };
};
