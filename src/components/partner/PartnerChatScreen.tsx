import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Heart, Smile } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePartnerData } from '@/hooks/usePartnerData';
import { supabase } from '@/integrations/supabase/client';
import { hapticFeedback } from '@/lib/native';
import ChatMediaUpload from '@/components/chat/ChatMediaUpload';
import ChatMessageBubble from '@/components/chat/ChatMessageBubble';

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string | null;
  message_type: string;
  created_at: string;
  is_read: boolean;
}

interface PartnerChatScreenProps {
  onBack: () => void;
}

const PartnerChatScreen = ({ onBack }: PartnerChatScreenProps) => {
  const { user, profile } = useAuth();
  const { partnerProfile } = usePartnerData();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    if (!user || !partnerProfile) return;

    try {
      const { data, error } = await supabase
        .from('partner_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerProfile.user_id}),and(sender_id.eq.${partnerProfile.user_id},receiver_id.eq.${user.id})`)
        .in('message_type', ['text', 'love', 'image', 'audio'])
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      
      // Mark received messages as read
      const unreadIds = data?.filter(m => m.receiver_id === user.id && !m.is_read).map(m => m.id) || [];
      if (unreadIds.length > 0) {
        await supabase
          .from('partner_messages')
          .update({ is_read: true })
          .in('id', unreadIds);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [user, partnerProfile]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Realtime subscription
  useEffect(() => {
    if (!user || !partnerProfile) return;

    const channel = supabase
      .channel('partner_chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'partner_messages',
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          if (
            (newMsg.sender_id === user.id && newMsg.receiver_id === partnerProfile.user_id) ||
            (newMsg.sender_id === partnerProfile.user_id && newMsg.receiver_id === user.id)
          ) {
            if (['text', 'love', 'image', 'audio'].includes(newMsg.message_type)) {
              setMessages(prev => [...prev, newMsg]);
              // Auto-mark as read if we're receiving
              if (newMsg.receiver_id === user.id) {
                supabase
                  .from('partner_messages')
                  .update({ is_read: true })
                  .eq('id', newMsg.id);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, partnerProfile]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !partnerProfile) return;

    await hapticFeedback.light();

    try {
      await supabase.from('partner_messages').insert({
        sender_id: user.id,
        receiver_id: partnerProfile.user_id,
        message_type: 'text',
        content: newMessage.trim(),
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const sendLove = async () => {
    if (!user || !partnerProfile) return;

    await hapticFeedback.heavy();

    try {
      await supabase.from('partner_messages').insert({
        sender_id: user.id,
        receiver_id: partnerProfile.user_id,
        message_type: 'love',
        content: '❤️',
      });
    } catch (error) {
      console.error('Error sending love:', error);
    }
  };

  const sendMediaMessage = async (type: 'image' | 'audio', url: string) => {
    if (!user || !partnerProfile) return;

    await hapticFeedback.medium();

    try {
      await supabase.from('partner_messages').insert({
        sender_id: user.id,
        receiver_id: partnerProfile.user_id,
        message_type: type,
        content: url,
      });
    } catch (error) {
      console.error('Error sending media:', error);
    }
  };

  const quickMessages = [
    'Səni sevirəm! ❤️',
    'Necəsən?',
    'Evə gəlirəm 🏠',
    'Yaxşıyam, narahat olma 💪'
  ];

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateSeparator = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Bu gün';
    if (date.toDateString() === yesterday.toDateString()) return 'Dünən';
    return date.toLocaleDateString('az-AZ', { day: 'numeric', month: 'long' });
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: ChatMessage[] }[] = [];
  messages.forEach(msg => {
    const date = msg.created_at.split('T')[0];
    const lastGroup = groupedMessages[groupedMessages.length - 1];
    if (lastGroup && lastGroup.date === date) {
      lastGroup.messages.push(msg);
    } else {
      groupedMessages.push({ date, messages: [msg] });
    }
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="gradient-primary px-5 pt-4 pb-6 safe-top">
        <div className="flex items-center gap-4">
          <motion.button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-pink-400/30 flex items-center justify-center text-xl">
              🤰
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">{partnerProfile?.name || 'Partner'}</h1>
              <p className="text-white/70 text-xs">Online</p>
            </div>
          </div>
          <motion.button
            onClick={sendLove}
            className="w-10 h-10 rounded-full bg-pink-500/30 flex items-center justify-center"
            whileTap={{ scale: 0.9 }}
          >
            <Heart className="w-5 h-5 text-white fill-white" />
          </motion.button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Smile className="w-10 h-10 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Hələ mesaj yoxdur</p>
            <p className="text-sm text-muted-foreground mt-1">
              İlk mesajı siz göndərin!
            </p>
          </div>
        ) : (
          groupedMessages.map((group, groupIdx) => (
            <div key={group.date}>
              {/* Date separator */}
              <div className="flex items-center justify-center my-4">
                <span className="px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground">
                  {formatDateSeparator(group.messages[0].created_at)}
                </span>
              </div>

              {/* Messages for this date */}
              {group.messages.map((msg, msgIdx) => {
                const isMe = msg.sender_id === user?.id;

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: msgIdx * 0.02 }}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2`}
                  >
                    <ChatMessageBubble message={msg} isMe={isMe} />
                  </motion.div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Messages */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
        {quickMessages.map(msg => (
          <motion.button
            key={msg}
            onClick={() => setNewMessage(msg)}
            className="px-3 py-1.5 bg-muted rounded-full text-xs font-medium whitespace-nowrap"
            whileTap={{ scale: 0.95 }}
          >
            {msg}
          </motion.button>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 bg-card border-t border-border safe-bottom">
        <div className="flex items-center gap-2">
          <ChatMediaUpload onUpload={sendMediaMessage} />
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Mesaj yazın..."
            className="flex-1 h-12 px-4 rounded-2xl bg-muted text-sm outline-none"
          />
          <motion.button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center disabled:opacity-50"
            whileTap={{ scale: 0.95 }}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default PartnerChatScreen;
