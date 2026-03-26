import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string | null;
  message_type: string;
  media_url: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  user_id: string;
  name: string;
  avatar_url: string | null;
  last_message: string | null;
  last_message_type: string;
  last_message_at: string;
  unread_count: number;
}

export const useDirectMessages = (otherUserId?: string) => {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      if (!data || data.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Group by conversation partner
      const convMap = new Map<string, { messages: any[]; unread: number }>();
      for (const msg of data) {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        if (!convMap.has(partnerId)) {
          convMap.set(partnerId, { messages: [], unread: 0 });
        }
        const conv = convMap.get(partnerId)!;
        conv.messages.push(msg);
        if (msg.receiver_id === user.id && !msg.is_read) conv.unread++;
      }

      // Fetch profile info for all partners
      const partnerIds = Array.from(convMap.keys());
      const { data: profiles } = await (supabase as any)
        .from('public_profile_cards')
        .select('user_id, name, avatar_url')
        .in('user_id', partnerIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

      const convList: Conversation[] = partnerIds.map(pid => {
        const conv = convMap.get(pid)!;
        const lastMsg = conv.messages[0];
        const profile = profileMap.get(pid) as any;
        return {
          user_id: pid,
          name: profile?.name || 'İstifadəçi',
          avatar_url: profile?.avatar_url || null,
          last_message: lastMsg.content,
          last_message_type: lastMsg.message_type,
          last_message_at: lastMsg.created_at,
          unread_count: conv.unread,
        };
      });

      convList.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
      setConversations(convList);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchMessages = useCallback(async () => {
    if (!user || !otherUserId) return;
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
        )
        .order('created_at', { ascending: true })
        .limit(200);

      if (error) throw error;
      setMessages((data as DirectMessage[]) || []);

      // Mark unread as read
      const unread = (data || []).filter(m => m.receiver_id === user.id && !m.is_read);
      if (unread.length > 0) {
        await supabase
          .from('direct_messages')
          .update({ is_read: true })
          .in('id', unread.map(m => m.id));
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  }, [user, otherUserId]);

  const sendMessage = async (content: string, type: string = 'text', mediaUrl?: string) => {
    if (!user || !otherUserId) return null;
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          receiver_id: otherUserId,
          content: type === 'text' ? content : null,
          message_type: type,
          media_url: mediaUrl || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Send push notification
      try {
        await supabase.functions.invoke('send-push-notification', {
          body: {
            userId: otherUserId,
            title: 'Yeni mesaj 💬',
            body: type === 'text' ? (content.length > 60 ? content.slice(0, 60) + '...' : content)
              : type === 'image' ? '📷 Şəkil göndərdi'
              : type === 'video' ? '🎥 Video göndərdi'
              : type === 'audio' ? '🎤 Səs mesajı göndərdi'
              : 'Yeni mesaj',
            data: { type: 'direct_message', sender_id: user.id },
          },
        });
      } catch (pushErr) {
        console.warn('Push notification failed:', pushErr);
      }

      return data;
    } catch (err: any) {
      console.error('Error sending DM:', err);
      toast({ title: 'Mesaj göndərilmədi', description: err.message, variant: 'destructive' });
      return null;
    }
  };

  const uploadMedia = async (file: Blob, type: 'image' | 'video' | 'audio') => {
    if (!user) return null;
    const ext = type === 'image' ? 'jpg' : type === 'video' ? 'mp4' : 'webm';
    const fileName = `dm/${user.id}/${Date.now()}.${ext}`;
    const contentType = type === 'image' ? 'image/jpeg' : type === 'video' ? 'video/mp4' : 'audio/webm';

    const { data, error } = await supabase.storage
      .from('chat-media')
      .upload(fileName, file, { contentType, upsert: false });

    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('chat-media').getPublicUrl(data.path);
    return publicUrl;
  };

  // Initial fetch
  useEffect(() => {
    if (otherUserId) {
      fetchMessages();
    } else {
      fetchConversations();
    }
  }, [otherUserId, fetchMessages, fetchConversations]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('dm_realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
        filter: `receiver_id=eq.${user.id}`,
      }, () => {
        if (otherUserId) fetchMessages();
        else fetchConversations();
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
        filter: `sender_id=eq.${user.id}`,
      }, () => {
        if (otherUserId) fetchMessages();
        else fetchConversations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, otherUserId, fetchMessages, fetchConversations]);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  return {
    messages,
    conversations,
    loading,
    sendMessage,
    uploadMedia,
    totalUnread,
    refetch: otherUserId ? fetchMessages : fetchConversations,
  };
};
