import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Heart, Smile } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePartnerData } from '@/hooks/usePartnerData';
import { supabase } from '@/integrations/supabase/client';
import { hapticFeedback } from '@/lib/native';
import { useToast } from '@/hooks/use-toast';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import ChatMediaUpload from '@/components/chat/ChatMediaUpload';
import ChatMessageBubble from '@/components/chat/ChatMessageBubble';
import { tr } from "@/lib/tr";

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
  useScrollToTop();

  const { user, profile } = useAuth();
  const { partnerProfile } = usePartnerData();
  const { toast } = useToast();
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
      const { data, error } = await supabase.
      from('partner_messages').
      select('*').
      or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerProfile.user_id}),and(sender_id.eq.${partnerProfile.user_id},receiver_id.eq.${user.id})`).
      in('message_type', ['text', 'love', 'image', 'audio']).
      order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark received messages as read
      const unreadIds = data?.filter((m) => m.receiver_id === user.id && !m.is_read).map((m) => m.id) || [];
      if (unreadIds.length > 0) {
        await supabase.
        from('partner_messages').
        update({ is_read: true }).
        in('id', unreadIds);
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

    const channel = supabase.
    channel('partner_chat').
    on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'partner_messages'
      },
      (payload) => {
        const newMsg = payload.new as ChatMessage;
        if (
        newMsg.sender_id === user.id && newMsg.receiver_id === partnerProfile.user_id ||
        newMsg.sender_id === partnerProfile.user_id && newMsg.receiver_id === user.id)
        {
          if (['text', 'love', 'image', 'audio'].includes(newMsg.message_type)) {
            setMessages((prev) => [...prev, newMsg]);
            // Auto-mark as read if we're receiving
            if (newMsg.receiver_id === user.id) {
              supabase.
              from('partner_messages').
              update({ is_read: true }).
              eq('id', newMsg.id);
            }
          }
        }
      }
    ).
    subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, partnerProfile]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !partnerProfile) return;

    await hapticFeedback.light();

    try {
      const content = newMessage.trim();
      await supabase.from('partner_messages').insert({
        sender_id: user.id,
        receiver_id: partnerProfile.user_id,
        message_type: 'text',
        content
      });
      setNewMessage('');

      // Fire-and-forget FCM push so receiver gets notified even if app is closed
      supabase.functions.invoke('send-push-notification', {
        body: {
          userId: partnerProfile.user_id,
          title: `${profile?.name || 'Partnyor'} 💌`,
          body: content.slice(0, 80),
          data: { type: 'partner_message' }
        }
      }).catch((e) => console.warn('Push invoke failed:', e));
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: tr("partnerchatscreen_xeta_3cdbb6", 'Xəta'),
        description: tr("partnerchatscreen_mesaj_gonderile_bilmedi_0cd095", 'Mesaj göndərilə bilmədi'),
        variant: 'destructive'
      });
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
        content: '❤️'
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
        content: url
      });
    } catch (error) {
      console.error('Error sending media:', error);
    }
  };

  const quickMessages = [tr("partnerchatscreen_seni_sevirem_aed14c", "S\u0259ni sevir\u0259m! \u2764\uFE0F"), tr("partnerchatscreen_necesen_2df00b", "Nec\u0259s\u0259n?"), tr("partnerchatscreen_eve_gelirem_afaae4", "Ev\u0259 g\u0259lir\u0259m \uD83C\uDFE0"), tr("partnerchatscreen_yaxsiyam_narahat_olma_b915b4", "Yax\u015F\u0131yam, narahat olma \uD83D\uDCAA"), tr("partnerchatscreen_zeng_et_eb550f", "Z\u0259ng et \uD83D\uDCDE")];







  const sendQuickMessage = async (msg: string) => {
    if (!user || !partnerProfile) return;

    await hapticFeedback.light();

    try {
      await supabase.from('partner_messages').insert({
        sender_id: user.id,
        receiver_id: partnerProfile.user_id,
        message_type: 'text',
        content: msg
      });
    } catch (error) {
      console.error('Error sending quick message:', error);
    }
  };

  const formatDateSeparator = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return tr("partnerchatscreen_bu_gun_786fd4", "Bu g\xFCn");
    if (date.toDateString() === yesterday.toDateString()) return tr("partnerchatscreen_dunen_52b701", "D\xFCn\u0259n");
    return date.toLocaleDateString('az-AZ', { day: 'numeric', month: 'long' });
  };

  // Group messages by date
  const groupedMessages: {date: string;messages: ChatMessage[];}[] = [];
  messages.forEach((msg) => {
    const date = msg.created_at.split('T')[0];
    const lastGroup = groupedMessages[groupedMessages.length - 1];
    if (lastGroup && lastGroup.date === date) {
      lastGroup.messages.push(msg);
    } else {
      groupedMessages.push({ date, messages: [msg] });
    }
  });

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col" style={{ height: '100dvh' }}>
      {/* Minimal Header */}
      <div className="bg-card border-b border-border px-3 pb-2 pt-[max(env(safe-area-inset-top),10px)] flex-shrink-0">
        <div className="flex items-center gap-2">
          <motion.button
            onClick={onBack}
            className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center"
            whileTap={{ scale: 0.95 }}>
            
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-lg">
              {partnerProfile?.life_stage === 'bump' ? '🤰' : partnerProfile?.life_stage === 'mommy' ? '👩‍🍼' : '👩'}
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-foreground truncate">{partnerProfile?.name || 'Partner'}</h1>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-muted-foreground text-[10px]">Online</span>
              </div>
            </div>
          </div>
          <motion.button
            onClick={sendLove}
            className="w-9 h-9 rounded-full hover:bg-pink-50 dark:hover:bg-pink-900/20 flex items-center justify-center"
            whileTap={{ scale: 0.9 }}>
            
            <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
          </motion.button>
        </div>
      </div>

      {/* Messages - Same styling as Mother Chat */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loading ?
        <div className="flex items-center justify-center h-full">
            <motion.div
            className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
          
          </div> :
        messages.length === 0 ?
        <div className="flex flex-col items-center justify-center h-full text-center">
            <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            
              <Smile className="w-10 h-10 text-muted-foreground" />
            </motion.div>
            <p className="text-muted-foreground">{tr("partnerchatscreen_hele_mesaj_yoxdur_cf0b5e", "Hələ mesaj yoxdur")}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {tr("partnerchatscreen_i_lk_mesaji_siz_gonderin_a2529e", "\u0130lk mesaj\u0131 siz g\xF6nd\u0259rin!")}
            </p>
          </div> :

        groupedMessages.map((group) =>
        <div key={group.date}>
              {/* Date separator */}
              <div className="flex items-center justify-center my-4">
                <span className="px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground">
                  {formatDateSeparator(group.messages[0].created_at)}
                </span>
              </div>

              {/* Messages for this date */}
              <AnimatePresence>
                {group.messages.map((msg, msgIdx) => {
              const isMe = msg.sender_id === user?.id;

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: msgIdx * 0.02 }}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2`}>
                  
                      <ChatMessageBubble message={msg} isMe={isMe} />
                    </motion.div>);

            })}
              </AnimatePresence>
            </div>
        )
        }
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Messages */}
      <div className="px-3 py-1.5 flex gap-1.5 overflow-x-auto scrollbar-hide flex-shrink-0">
        {quickMessages.map((msg) =>
        <motion.button
          key={msg}
          onClick={() => sendQuickMessage(msg)}
          className="px-2.5 py-1 bg-muted rounded-full text-[11px] font-medium whitespace-nowrap"
          whileTap={{ scale: 0.95 }}>
          
            {msg}
          </motion.button>
        )}
      </div>

      {/* Input */}
      <div
        className="px-2 pt-2 bg-card border-t border-border flex-shrink-0"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>
        
        <div className="flex items-end gap-1.5">
          <ChatMediaUpload onUpload={sendMediaMessage} />
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={tr("partnerchatscreen_mesaj_yazin_e69f84", "Mesaj yazın...")}
            className="flex-1 h-10 px-3.5 rounded-full bg-muted text-sm outline-none border border-transparent focus:border-primary/40 transition-colors" />
          
          <motion.button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40"
            whileTap={{ scale: 0.95 }}>
            
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>);

};

export default PartnerChatScreen;