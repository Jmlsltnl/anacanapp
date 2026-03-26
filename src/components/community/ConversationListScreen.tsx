import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageCircle, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useDirectMessages, Conversation } from '@/hooks/useDirectMessages';
import { usePartnerConversation } from '@/hooks/usePartnerConversation';
import { formatDistanceToNow } from 'date-fns';
import { az } from 'date-fns/locale';

interface ConversationListScreenProps {
  onBack: () => void;
  onOpenChat: (userId: string, name: string, avatar: string | null) => void;
  partnerId?: string | null;
}

const ConversationListScreen = ({ onBack, onOpenChat, partnerId }: ConversationListScreenProps) => {
  const { conversations, loading } = useDirectMessages();
  const { messages: partnerMessages, loading: partnerLoading } = usePartnerConversation(partnerId);

  // Merge partner conversation into the list
  const allConversations = useMemo(() => {
    const list = [...conversations];
    if (partnerMessages) {
      // Check if partner already exists in DM conversations
      const existingIdx = list.findIndex(c => c.user_id === partnerId);
      if (existingIdx === -1 && partnerMessages.conversation) {
        list.unshift(partnerMessages.conversation);
      }
    }
    return list.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
  }, [conversations, partnerMessages, partnerId]);

  const getLastMessagePreview = (type: string, content: string | null) => {
    switch (type) {
      case 'image': return '📷 Şəkil';
      case 'video': return '🎥 Video';
      case 'audio': return '🎤 Səs mesajı';
      default: return content?.slice(0, 50) || '';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 px-5 py-4 flex items-center gap-3">
        <motion.button onClick={onBack} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center" whileTap={{ scale: 0.9 }}>
          <ArrowLeft className="w-4 h-4" />
        </motion.button>
        <h1 className="text-lg font-bold text-foreground flex-1">Mesajlar</h1>
      </div>

      {loading || partnerLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : allConversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <MessageCircle className="w-7 h-7 text-primary" />
          </div>
          <p className="text-base font-semibold text-foreground mb-1">Hələ mesajınız yoxdur</p>
          <p className="text-sm text-muted-foreground">İstifadəçi profilindən mesaj göndərə bilərsiniz</p>
        </div>
      ) : (
        <div className="divide-y divide-border/30">
          {conversations.map((conv) => (
            <motion.button
              key={conv.user_id}
              onClick={() => onOpenChat(conv.user_id, conv.name, conv.avatar_url)}
              className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors text-left"
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={conv.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">{conv.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                {conv.unread_count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                    {conv.unread_count > 9 ? '9+' : conv.unread_count}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={`text-[14px] font-semibold text-foreground truncate ${conv.unread_count > 0 ? 'font-bold' : ''}`}>
                    {conv.name}
                  </p>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">
                    {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false, locale: az })}
                  </span>
                </div>
                <p className={`text-[12px] truncate mt-0.5 ${conv.unread_count > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  {getLastMessagePreview(conv.last_message_type, conv.last_message)}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConversationListScreen;
