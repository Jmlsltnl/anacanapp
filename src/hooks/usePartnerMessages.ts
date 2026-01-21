import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface PartnerMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message_type: string;
  content: string | null;
  is_read: boolean;
  created_at: string;
}

export const usePartnerMessages = () => {
  const [messages, setMessages] = useState<PartnerMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const fetchMessages = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('partner_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error('Error fetching partner messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (receiverId: string, messageType: string, content?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('partner_messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          message_type: messageType,
          content: content || null,
        })
        .select()
        .single();

      if (error) throw error;

      if (messageType === 'love') {
        toast({
          title: 'Sevgi göndərildi! ❤️',
          description: 'Partnyorunuz bildiriş alacaq',
        });
      } else {
        toast({
          title: 'Mesaj göndərildi! 💬',
        });
      }

      await fetchMessages();
      return data;
    } catch (error: any) {
      console.error('Error sending partner message:', error);
      toast({
        title: 'Xəta baş verdi',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const sendLoveToPartner = async () => {
    if (!profile?.linked_partner_id) {
      toast({
        title: 'Partnyor tapılmadı',
        description: 'Əvvəlcə partnyorla əlaqələnin',
        variant: 'destructive',
      });
      return null;
    }

    // Get partner's user_id from their profile id
    const { data: partnerProfile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('id', profile.linked_partner_id)
      .single();

    if (!partnerProfile) {
      toast({
        title: 'Partnyor tapılmadı',
        variant: 'destructive',
      });
      return null;
    }

    return sendMessage(partnerProfile.user_id, 'love', '❤️');
  };

  const markAsRead = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('partner_messages')
        .update({ is_read: true })
        .eq('id', id)
        .eq('receiver_id', user.id);

      if (error) throw error;
      await fetchMessages();
    } catch (error: any) {
      console.error('Error marking message as read:', error);
    }
  };

  const getUnreadCount = () => {
    return messages.filter(m => m.receiver_id === user?.id && !m.is_read).length;
  };

  useEffect(() => {
    fetchMessages();
  }, [user]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('partner_messages_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'partner_messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          fetchMessages();
          // Show toast for new love messages
          if (payload.new && (payload.new as any).message_type === 'love') {
            toast({
              title: 'Sevgi aldınız! ❤️',
              description: 'Partnyorunuz sizə sevgi göndərdi',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    messages,
    loading,
    sendMessage,
    sendLoveToPartner,
    markAsRead,
    getUnreadCount,
    refetch: fetchMessages,
  };
};
