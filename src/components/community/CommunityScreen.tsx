import { useState, forwardRef, useCallback, useEffect } from 'react';

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
import SinglePostView from './SinglePostView';
import UserProfileScreen from './UserProfileScreen';
import ConversationListScreen from './ConversationListScreen';
import DirectMessageScreen from './DirectMessageScreen';
import BannerSlot from '@/components/banners/BannerSlot';
import { tr } from "@/lib/tr";

export interface CommunityDeepLinkTarget {
  postId?: string;
  commentId?: string;
  storyId?: string;
}

interface CommunityScreenProps {
  onBack?: () => void;
  /** Bildiriş/push-tap vasitəsilə: "MƏHZ bu paylaşımı/şərhi aç" — bax Index.tsx */
  deepLinkTarget?: CommunityDeepLinkTarget | null;
  /** Deep-link "istehlak" olunduqdan sonra valideyndə təmizləmək üçün (geri qayıdanda təkrar açılmasın) */
  onDeepLinkConsumed?: () => void;
}

// Groups temporarily disabled
const tabs = [
{ id: 'feed', label: tr("communityscreen_umumi_1b5521", 'Ümumi'), icon: TrendingUp }] as
const;

const CommunityScreen = forwardRef<HTMLDivElement, CommunityScreenProps>(({ onBack, deepLinkTarget, onDeepLinkConsumed }, ref) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'groups' | 'my-groups'>('feed');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  // Bildirişdən gələn "məhz bu postu aç" niyyəti — öz state-inə köçürülür ki,
  // istifadəçi geri düyməsi ilə bağlayanda (deepLinkTarget prop-u valideyndə
  // hələ təmizlənməmiş olsa belə) bu ekran YENİDƏN açılmasın.
  const [openPostId, setOpenPostId] = useState<string | null>(deepLinkTarget?.postId || null);
  const [openCommentId, setOpenCommentId] = useState<string | null>(deepLinkTarget?.commentId || null);
  const [openStoryId, setOpenStoryId] = useState<string | null>(deepLinkTarget?.storyId || null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [showConversations, setShowConversations] = useState(false);
  const [dmChat, setDmChat] = useState<{userId: string;name: string;avatar: string | null;} | null>(null);

  useScrollToTop([activeTab, selectedGroupId, selectedUserId]);
  useScreenAnalytics('Community', 'Social');

  // CommunityScreen artıq ekranda olsa belə (istifadəçi Community-də ikən YENİ
  // bir bildiriş klik edilsə), yeni deep-link niyyətini qəbul et.
  useEffect(() => {
    if (deepLinkTarget?.postId) {
      setOpenPostId(deepLinkTarget.postId);
      setOpenCommentId(deepLinkTarget.commentId || null);
    } else if (deepLinkTarget?.storyId) {
      setOpenStoryId(deepLinkTarget.storyId);
    }
  }, [deepLinkTarget]);

  const handleCloseSinglePost = useCallback(() => {
    setOpenPostId(null);
    setOpenCommentId(null);
    onDeepLinkConsumed?.();
  }, [onDeepLinkConsumed]);

  const handleStoryAutoOpenConsumed = useCallback(() => {
    setOpenStoryId(null);
    onDeepLinkConsumed?.();
  }, [onDeepLinkConsumed]);

  // Note: do NOT auto mark-all-seen here. Posts are marked individually as
  // they enter the viewport in GroupFeed via the SeenObserver wrapper.

  const lifeStage = useUserStore((s) => s.lifeStage);
  const headerKey = `community_header_${lifeStage || 'mommy'}`;
  const dynamicHeader = useAppSetting(headerKey);
  const defaultHeader = tr("communityscreen_diger_analar_ile_elaqede_olun_4830a3", "Dig\u0259r analar il\u0259 \u0259laq\u0259d\u0259 olun");
  const headerText = typeof dynamicHeader === 'string' ? tr(headerKey, dynamicHeader) : defaultHeader;

  const { data: groups = [], isLoading: groupsLoading } = useCommunityGroups();
  const { data: memberships = [] } = useUserMemberships();
  const { totalUnread } = useDirectMessages();

  const memberGroupIds = new Set(memberships.map((m) => m.group_id));
  const myGroups = groups.filter((g) => memberGroupIds.has(g.id));
  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  // useCallback: PostCard artıq memo() ilə saramalanıb — bu referansın hər
  // render-də dəyişməsi feed-dəki bütün post kartlarının memo-sunu boşa çıxarardı.
  const handleUserClick = useCallback((userId: string) => setSelectedUserId(userId), []);

  const handleOpenDmChat = useCallback((userId: string, name: string, avatar: string | null) => {
    setDmChat({ userId, name, avatar });
    setSelectedUserId(null);
    setShowConversations(false);
  }, []);

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

  // Bildiriş/deep-link ilə "məhz bu paylaşımı" açma
  if (openPostId) {
    return <SinglePostView postId={openPostId} commentId={openCommentId} onBack={handleCloseSinglePost} onUserClick={handleUserClick} />;
  }

  if (selectedGroupId && selectedGroup) {
    return (
      <GroupFeed
        group={selectedGroup}
        onBack={() => setSelectedGroupId(null)}
        onCreatePost={() => setShowCreatePost(true)}
        onUserClick={handleUserClick} />);


  }

  return (
    <div ref={ref} className="a-scope pb-8 community-native-text" style={{ background: 'var(--a-bg)', minHeight: '100%' }}>
      <div className="a-shell">
        {/* Top bar */}
        <header className="a-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {onBack &&
            <motion.button onClick={onBack} className="a-icon-btn" whileTap={{ scale: 0.9 }}>
                <ArrowLeft className="rtl:rotate-180" size={16} strokeWidth={2} />
              </motion.button>
            }
            <div>
              <p className="a-eyebrow">{headerText}</p>
              <p className="a-wordmark" style={{ fontSize: 18 }}>{tr("communityscreen_cemiyyet_2dc44d", "Cəmiyyət")}</p>
            </div>
          </div>
          <div className="a-topbar-actions">
            <motion.button
              onClick={() => setShowConversations(true)}
              className="a-icon-btn"
              aria-label={tr("bottomnav_mesajlar", "Mesajlar")}
              whileTap={{ scale: 0.9 }}>
              
              <MessageCircle size={16} strokeWidth={2} />
              {totalUnread > 0 &&
              <span
                style={{
                  position: 'absolute',
                  top: -4,
                  insetInlineEnd: -4,
                  minWidth: 15,
                  height: 15,
                  padding: '0 4px',
                  borderRadius: 999,
                  background: '#e05555',
                  color: '#fff',
                  fontSize: 8.5,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              }
            </motion.button>
          </div>
        </header>

        {/* Search */}
        <motion.div animate={{ scale: searchFocused ? 1.01 : 1 }} transition={{ duration: 0.2 }}>
          <div className="a-search">
            <Search size={15} strokeWidth={2} color={searchFocused ? 'var(--a-peach-2)' : 'var(--a-ink-faint)'} />
            <input
              type="text"
              placeholder={tr("untranslated_axtar_92w4nn", "Axtar...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)} />
            
            <AnimatePresence>
              {searchQuery &&
              <motion.button
                initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                onClick={() => setSearchQuery('')}
                style={{ width: 20, height: 20, borderRadius: 999, background: 'var(--a-surface-soft)', display: 'grid', placeItems: 'center', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                  <X size={11} style={{ color: 'var(--a-ink-soft)' }} />
                </motion.button>
              }
            </AnimatePresence>
          </div>
        </motion.div>

        <BannerSlot placement="community_top" className="mt-4" />

        {/* Stories */}
        <div style={{ marginTop: 14 }}>
          <StoriesBar groupId={null} autoOpenStoryId={openStoryId} onAutoOpenConsumed={handleStoryAutoOpenConsumed} />
        </div>

        {/* Composer prompt (anacan-demo) */}
        <motion.button
          onClick={() => setShowCreatePost(true)}
          className="a-composer"
          style={{ marginTop: 12 }}
          whileTap={{ scale: 0.98 }}>
          
          <span className="a-composer-avatar">🙂</span>
          <span className="a-composer-text">{tr("communityscreen_ne_dusunursunuz_0378b3", "Nə düşünürsünüz?")}</span>
          <span className="a-cta-btn" style={{ padding: '9px 14px', fontSize: 11.5 }}>
            <Sparkles size={12} /> {tr("storiesbar_elave_et_6e1b9b", "\u018Flav\u0259 et")}
          </span>
        </motion.button>

        {/* Feed */}
        <div style={{ marginTop: 16 }}>
          <GroupFeed group={null} onBack={() => {}} onCreatePost={() => setShowCreatePost(true)} isEmbedded onUserClick={handleUserClick} externalSearchQuery={searchQuery} />
        </div>
      </div>
    </div>);

});

CommunityScreen.displayName = 'CommunityScreen';

export default CommunityScreen;