import { useState, forwardRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, Plus, Search, TrendingUp, Compass, Sparkles, X, Pen, MessageCircle } from 'lucide-react';
import { useCommunityGroups, useUserMemberships } from '@/hooks/useCommunity';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useScreenAnalytics } from '@/hooks/useScreenAnalytics';
import { useUserStore } from '@/store/userStore';
import { useAppSetting } from '@/hooks/useAppSettings';
import { useDirectMessages } from '@/hooks/useDirectMessages';


import GroupsList from './GroupsList';
import GroupFeed from './GroupFeed';
import CreatePostScreen from './CreatePostScreen';
import StoriesBar from './StoriesBar';
import UserProfileScreen from './UserProfileScreen';
import ConversationListScreen from './ConversationListScreen';
import DirectMessageScreen from './DirectMessageScreen';
import BannerSlot from '@/components/banners/BannerSlot';
import { tr } from "@/lib/tr";

interface CommunityScreenProps {
  onBack?: () => void;
}

// Groups temporarily disabled
const tabs = [
  { id: 'feed', label: tr("communityscreen_umumi_1b5521", 'Ümumi'), icon: TrendingUp },
] as const;

const CommunityScreen = forwardRef<HTMLDivElement, CommunityScreenProps>(({ onBack }, ref) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'groups' | 'my-groups'>('feed');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [showConversations, setShowConversations] = useState(false);
  const [dmChat, setDmChat] = useState<{ userId: string; name: string; avatar: string | null } | null>(null);

  useScrollToTop([activeTab, selectedGroupId, selectedUserId]);
  useScreenAnalytics('Community', 'Social');

  // Note: do NOT auto mark-all-seen here. Posts are marked individually as
  // they enter the viewport in GroupFeed via the SeenObserver wrapper.

  const { lifeStage } = useUserStore();
  const headerKey = `community_header_${lifeStage || 'mommy'}`;
  const dynamicHeader = useAppSetting(headerKey);
  const defaultHeader = 'Digər analar ilə əlaqədə olun';
  const headerText = typeof dynamicHeader === 'string' ? dynamicHeader : defaultHeader;

  const { data: groups = [], isLoading: groupsLoading } = useCommunityGroups();
  const { data: memberships = [] } = useUserMemberships();
  const { totalUnread } = useDirectMessages();

  const memberGroupIds = new Set(memberships.map(m => m.group_id));
  const myGroups = groups.filter(g => memberGroupIds.has(g.id));
  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  const handleUserClick = (userId: string) => setSelectedUserId(userId);

  const handleOpenDmChat = (userId: string, name: string, avatar: string | null) => {
    setDmChat({ userId, name, avatar });
    setSelectedUserId(null);
    setShowConversations(false);
  };

  // DM Chat screen
  if (dmChat) {
    return <DirectMessageScreen userId={dmChat.userId} userName={dmChat.name} userAvatar={dmChat.avatar} onBack={() => setDmChat(null)} />;
  }

  // Conversations list
  if (showConversations) {
    return <ConversationListScreen onBack={() => setShowConversations(false)} onOpenChat={handleOpenDmChat} />;
  }

  if (selectedUserId) {
    return <UserProfileScreen userId={selectedUserId} onBack={() => setSelectedUserId(null)} onSendMessage={handleOpenDmChat} />;
  }

  // Full screen create post
  if (showCreatePost) {
    return <CreatePostScreen onBack={() => setShowCreatePost(false)} groupId={selectedGroupId} groups={myGroups} />;
  }

  if (selectedGroupId && selectedGroup) {
    return (
      <GroupFeed
        group={selectedGroup}
        onBack={() => setSelectedGroupId(null)}
        onCreatePost={() => setShowCreatePost(true)}
        onUserClick={handleUserClick}
      />
    );
  }

  return (
    <div ref={ref} className={`min-h-screen pb-24 bg-background ${Capacitor.isNativePlatform() ? 'community-native-text' : ''}`}>
      {/* Header */}
      <div className="bg-card border-b border-border/60 shadow-sm">
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center gap-3 mb-3">
            {onBack && (
              <motion.button onClick={onBack} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center active:bg-muted/80 transition-colors" whileTap={{ scale: 0.9 }}>
                <ArrowLeft className="w-4 h-4 text-foreground" />
              </motion.button>
            )}
            <div className="flex-1">
              <h1 className="text-[26px] font-black text-foreground tracking-tight leading-none">{tr("communityscreen_cemiyyet_2dc44d", "Cəmiyyət")}</h1>
              <p className="text-[13px] text-muted-foreground mt-1 font-medium">{headerText}</p>
            </div>
            <motion.button
              onClick={() => setShowConversations(true)}
              className="relative w-9 h-9 rounded-full bg-muted flex items-center justify-center"
              whileTap={{ scale: 0.9 }}
            >
              <MessageCircle className="w-4 h-4 text-foreground" />
              {totalUnread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center min-w-[18px] h-[18px]">
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              )}
            </motion.button>
          </div>

          <motion.div className="relative" animate={{ scale: searchFocused ? 1.01 : 1 }} transition={{ duration: 0.2 }}>
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${searchFocused ? 'text-primary' : 'text-muted-foreground/70'}`} />
            <input
              type="text"
              placeholder="Axtar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className={`w-full h-9 pl-9 pr-8 rounded-xl text-[14px] font-medium outline-none transition-all duration-300 placeholder:text-muted-foreground/60 ${
                searchFocused ? 'bg-background border border-primary/30 shadow-[0_0_0_3px_hsl(var(--primary)/0.08)]' : 'bg-muted/60 border border-border/40'
              }`}
            />
            <AnimatePresence>
              {searchQuery && (
                <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                  <X className="w-2.5 h-2.5 text-muted-foreground" />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

          <BannerSlot placement="community_top" className="mt-2" />
        </div>
      </div>

      <div className="px-5 pt-2 pb-1">
        <StoriesBar groupId={null} />
      </div>

      {/* Facebook-style post input - compact */}
      <div className="bg-card border-b border-border/30 px-4 py-2.5">
        <motion.button
          onClick={() => setShowCreatePost(true)}
          className="w-full flex items-center gap-2.5 active:bg-muted/30 transition-colors rounded-lg"
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center flex-shrink-0">
            <Pen className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-[14px] text-muted-foreground/70 font-medium">{tr("communityscreen_ne_dusunursunuz_0378b3", "Nə düşünürsünüz?")}</span>
        </motion.button>
      </div>

      <div className="pt-0">
        <GroupFeed group={null} onBack={() => {}} onCreatePost={() => setShowCreatePost(true)} isEmbedded onUserClick={handleUserClick} externalSearchQuery={searchQuery} />
      </div>

    </div>
  );
});

CommunityScreen.displayName = 'CommunityScreen';

export default CommunityScreen;
