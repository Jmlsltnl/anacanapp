import { useState, useEffect, useRef } from 'react';
import { getLocaleTag } from '@/lib/i18n';
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
          title: `${profile?.name || tr("common_partnyor", 'Partnyor')} 💌`,
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
    return date.toLocaleDateString(getLocaleTag(), { day: 'numeric', month: 'long' });
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
    <div className="a-scope fixed inset-0 z-[60] flex flex-col" style={{ background: 'var(--a-bg)', height: '100dvh' }}>
      {/* Minimal Header */}
      <div className="px-3 pb-2 pt-[max(env(safe-area-inset-top),10px)] flex-shrink-0"
      style={{ background: 'var(--a-nav-bg)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', borderBottom: '1px solid var(--a-line)' }}>
        <div className="flex items-center gap-2">
          <motion.button
            onClick={onBack}
            className="a-icon-btn shrink-0"
            style={{ borderRadius: 999 }}
            whileTap={{ scale: 0.95 }}
            aria-label={tr("common_geri", "Geri")}>

            <ArrowLeft className="rtl:rotate-180" size={16} strokeWidth={2} />
          </motion.button>
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0" style={{ background: 'var(--a-pink-1)' }}>
              {partnerProfile?.life_stage === 'bump' ? '🤰' : partnerProfile?.life_stage === 'mommy' ? '👩‍🍼' : '👩'}
            </div>
            <div className="min-w-0">
              <h1 className="truncate" style={{ fontSize: 14, fontWeight: 700, color: 'var(--a-ink)' }}>{partnerProfile?.name || 'Partner'}</h1>
              <div className="flex items-center gap-1">
                <span className="a-chat-status-dot" style={{ width: 6, height: 6 }} />
                <span style={{ fontSize: 10, color: 'var(--a-ink-soft)' }}>Online</span>
              </div>
            </div>
          </div>
          <motion.button
            onClick={sendLove}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'var(--a-pink-1)' }}
            whileTap={{ scale: 0.9 }}
            aria-label={tr("partnerdashboard_sevgi_gonderildi_4284b1", '💕 Sevgi göndərildi!')}>

            <Heart className="w-4 h-4" style={{ color: 'var(--a-pink-ink)', fill: 'var(--a-pink-ink)' }} />
          </motion.button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loading ?
        <div className="flex items-center justify-center h-full">
            <motion.div
            className="w-8 h-8 rounded-full"
            style={{ border: '4px solid var(--a-blue-2)', borderTopColor: 'transparent' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />

          </div> :
        messages.length === 0 ?
        <div className="flex flex-col items-center justify-center h-full text-center">
            <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
            style={{ background: 'var(--a-surface-soft)' }}>

              <Smile size={38} style={{ color: 'var(--a-ink-faint)' }} />
            </motion.div>
            <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--a-ink-soft)' }}>{tr("partnerchatscreen_hele_mesaj_yoxdur_cf0b5e", "Hələ mesaj yoxdur")}</p>
            <p style={{ fontSize: 12.5, color: 'var(--a-ink-faint)', marginTop: 4 }}>
              {tr("partnerchatscreen_i_lk_mesaji_siz_gonderin_a2529e", "\u0130lk mesaj\u0131 siz g\xF6nd\u0259rin!")}
            </p>
          </div> :

        groupedMessages.map((group) =>
        <div key={group.date}>
              {/* Date separator */}
              <div className="flex items-center justify-center my-4">
                <span style={{ padding: '4px 13px', background: 'var(--a-chip-overlay)', borderRadius: 999, fontSize: 11, fontWeight: 600, color: 'var(--a-ink-soft)' }}>
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
          className="whitespace-nowrap"
          style={{ padding: '5px 12px', background: 'var(--a-surface)', border: '1px solid var(--a-line)', borderRadius: 999, fontSize: 11, fontWeight: 600, color: 'var(--a-ink)', boxShadow: '0 4px 10px -6px rgba(217, 108, 74, 0.3)' }}
          whileTap={{ scale: 0.95 }}>

            {msg}
          </motion.button>
        )}
      </div>

      {/* Input */}
      <div
        className="px-2 pt-2 flex-shrink-0"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)', borderTop: '1px solid var(--a-line)' }}>

        <div className="flex items-end gap-1.5">
          <ChatMediaUpload onUpload={sendMediaMessage} />
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={tr("partnerchatscreen_mesaj_yazin_e69f84", "Mesaj yazın...")}
            className="flex-1 h-10 px-4 rounded-full outline-none transition-colors min-w-0"
            style={{ background: 'var(--a-surface)', border: '1px solid var(--a-line)', fontSize: 13, color: 'var(--a-ink)' }} />

          <motion.button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="a-chat-send shrink-0"
            style={{ width: 40, height: 40 }}
            whileTap={{ scale: 0.95 }}
            aria-label={tr("helpscreen_gonder_3f11bd", "G\xF6nd\u0259r")}>

            <Send size={16} />
          </motion.button>
        </div>
      </div>
    </div>);

};

export default PartnerChatScreen;
