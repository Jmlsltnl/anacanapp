import { useState, lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import ConversationListScreen from '@/components/community/ConversationListScreen';

const DirectMessageScreen = lazy(() => import('@/components/community/DirectMessageScreen'));
const MotherChatScreen = lazy(() => import('@/components/MotherChatScreen'));

interface MessagesScreenProps {
  onBack: () => void;
  partnerId?: string | null;
}

const suspenseFallback = (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-6 h-6 animate-spin text-primary" />
  </div>
);

const MessagesScreen = ({ onBack, partnerId }: MessagesScreenProps) => {
  const [activeChat, setActiveChat] = useState<{
    type: 'dm' | 'partner';
    userId: string;
    name: string;
    avatar: string | null;
  } | null>(null);

  const handleOpenChat = (userId: string, name: string, avatar: string | null) => {
    // Check if this is the partner chat
    if (partnerId && userId === partnerId) {
      setActiveChat({ type: 'partner', userId, name, avatar });
    } else {
      setActiveChat({ type: 'dm', userId, name, avatar });
    }
  };

  // Individual chat view
  if (activeChat) {
    if (activeChat.type === 'partner') {
      return (
        <Suspense fallback={suspenseFallback}>
          <MotherChatScreen onBack={() => setActiveChat(null)} />
        </Suspense>
      );
    }
    return (
      <Suspense fallback={suspenseFallback}>
        <DirectMessageScreen
          userId={activeChat.userId}
          userName={activeChat.name}
          userAvatar={activeChat.avatar}
          onBack={() => setActiveChat(null)}
        />
      </Suspense>
    );
  }

  // Conversations list
  return (
    <ConversationListScreen
      onBack={onBack}
      onOpenChat={handleOpenChat}
      partnerId={partnerId}
    />
  );
};

export default MessagesScreen;
