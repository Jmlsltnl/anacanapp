import { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, Plus, Search, TrendingUp, Compass, Sparkles, X } from 'lucide-react';
import { useCommunityGroups, useUserMemberships } from '@/hooks/useCommunity';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useScreenAnalytics } from '@/hooks/useScreenAnalytics';
import { useUserStore } from '@/store/userStore';
import { useAppSetting } from '@/hooks/useAppSettings';
import GroupsList from './GroupsList';
import GroupFeed from './GroupFeed';
import CreatePostModal from './CreatePostModal';
import StoriesBar from './StoriesBar';
import UserProfileScreen from './UserProfileScreen';
import BannerSlot from '@/components/banners/BannerSlot';

interface CommunityScreenProps {
  onBack?: () => void;
}

const tabs = [
  { id: 'feed', label: 'Lenta', icon: TrendingUp },
  { id: 'my-groups', label: 'Qruplarım', icon: Sparkles },
  { id: 'groups', label: 'Kəşf et', icon: Compass },
] as const;

const CommunityScreen = forwardRef<HTMLDivElement, CommunityScreenProps>(({ onBack }, ref) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'groups' | 'my-groups'>('feed');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  useScrollToTop([activeTab, selectedGroupId, selectedUserId]);
  useScreenAnalytics('Community', 'Social');

  const { lifeStage } = useUserStore();
  const headerKey = `community_header_${lifeStage || 'mommy'}`;
  const dynamicHeader = useAppSetting(headerKey);
  const defaultHeader = 'Digər analar ilə əlaqədə olun';
  const headerText = typeof dynamicHeader === 'string' ? dynamicHeader : defaultHeader;

  const { data: groups = [], isLoading: groupsLoading } = useCommunityGroups();
  const { data: memberships = [] } = useUserMemberships();

  const memberGroupIds = new Set(memberships.map(m => m.group_id));
  const myGroups = groups.filter(g => memberGroupIds.has(g.id));
  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  const handleUserClick = (userId: string) => setSelectedUserId(userId);

  if (selectedUserId) {
    return (
      <UserProfileScreen
        userId={selectedUserId}
        onBack={() => setSelectedUserId(null)}
      />
    );
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
    <div ref={ref} className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40">
        <div className="bg-card/70 backdrop-blur-3xl border-b border-border/20">
          <div className="px-5 pt-4 pb-3">
            {/* Title Row */}
            <div className="flex items-center gap-3 mb-4">
              {onBack && (
                <motion.button
                  onClick={onBack}
                  className="w-10 h-10 rounded-2xl bg-muted/50 flex items-center justify-center hover:bg-muted/80 transition-all duration-200"
                  whileTap={{ scale: 0.88 }}
                >
                  <ArrowLeft className="w-[18px] h-[18px] text-foreground" />
                </motion.button>
              )}
              <div className="flex-1">
                <h1 className="text-[22px] font-black text-foreground tracking-tight leading-none">Cəmiyyət</h1>
                <p className="text-[11px] text-muted-foreground/70 mt-1 font-medium">{headerText}</p>
              </div>
            </div>

            {/* Search */}
            <motion.div
              className="relative mb-4"
              animate={{ scale: searchFocused ? 1.01 : 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-[15px] h-[15px] transition-colors duration-300 ${searchFocused ? 'text-primary' : 'text-muted-foreground/40'}`} />
              <input
                type="text"
                placeholder="Postlarda axtar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className={`w-full h-11 pl-11 pr-10 rounded-2xl text-[13px] font-medium outline-none transition-all duration-300 placeholder:text-muted-foreground/40 ${
                  searchFocused
                    ? 'bg-background border border-primary/25 shadow-[0_0_0_4px_hsl(var(--primary)/0.06),0_4px_16px_-4px_hsl(var(--primary)/0.12)]'
                    : 'bg-muted/30 border border-transparent'
                }`}
              />
              {searchQuery && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-muted/60 flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-muted-foreground" />
                </motion.button>
              )}
            </motion.div>

            {/* Tabs */}
            <div className="flex gap-1 bg-muted/30 rounded-2xl p-[3px]">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`relative flex-1 py-[9px] px-2 rounded-[13px] text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors duration-200 ${
                      isActive
                        ? 'text-primary-foreground'
                        : 'text-muted-foreground/70 hover:text-foreground'
                    }`}
                    whileTap={{ scale: 0.96 }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="community-tab-bg"
                        className="absolute inset-0 rounded-[13px] gradient-primary shadow-[0_2px_12px_-2px_hsl(var(--primary)/0.4)]"
                        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <Icon className="w-[14px] h-[14px]" />
                      {tab.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Top Banner */}
            <BannerSlot placement="community_top" className="mt-3" />
          </div>
        </div>
      </div>

      {/* Stories Bar */}
      <div className="px-5 pt-4 pb-3">
        <StoriesBar groupId={null} />
      </div>
      <div className="h-[0.5px] bg-border/20 mx-5" />

      {/* Content */}
      <div className="px-5 pt-4">
        <AnimatePresence mode="wait">
          {activeTab === 'feed' && (
            <motion.div
              key="feed"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <GroupFeed
                group={null}
                onBack={() => {}}
                onCreatePost={() => setShowCreatePost(true)}
                isEmbedded
                onUserClick={handleUserClick}
                externalSearchQuery={searchQuery}
              />
            </motion.div>
          )}

          {activeTab === 'groups' && (
            <motion.div
              key="groups"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <GroupsList
                groups={groups}
                memberGroupIds={memberGroupIds}
                onSelectGroup={setSelectedGroupId}
                searchQuery={searchQuery}
                isLoading={groupsLoading}
              />
            </motion.div>
          )}

          {activeTab === 'my-groups' && (
            <motion.div
              key="my-groups"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {myGroups.length === 0 ? (
                <motion.div
                  className="text-center py-16"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/10 via-accent/8 to-primary/5 flex items-center justify-center mx-auto mb-5 shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.15)]">
                    <Users className="w-8 h-8 text-primary/70" />
                  </div>
                  <h3 className="font-black text-foreground mb-2 text-[15px]">Hələ qrupunuz yoxdur</h3>
                  <p className="text-[12px] text-muted-foreground/60 mb-6 max-w-[240px] mx-auto leading-relaxed font-medium">
                    Digər analar ilə əlaqə qurmaq üçün qruplara qoşulun
                  </p>
                  <motion.button
                    onClick={() => setActiveTab('groups')}
                    className="px-6 py-3 rounded-2xl gradient-primary text-primary-foreground font-bold text-[13px] shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.4)]"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Qrupları kəşf et
                  </motion.button>
                </motion.div>
              ) : (
                <GroupsList
                  groups={myGroups}
                  memberGroupIds={memberGroupIds}
                  onSelectGroup={setSelectedGroupId}
                  searchQuery={searchQuery}
                  isLoading={false}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FAB */}
      <motion.button
        onClick={() => setShowCreatePost(true)}
        className="fixed bottom-24 right-5 w-[54px] h-[54px] rounded-[18px] gradient-primary shadow-[0_8px_24px_-4px_hsl(var(--primary)/0.45)] flex items-center justify-center z-40"
        whileHover={{ scale: 1.06, y: -2 }}
        whileTap={{ scale: 0.88 }}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 18 }}
      >
        <Plus className="w-[22px] h-[22px] text-primary-foreground" strokeWidth={2.5} />
      </motion.button>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        groupId={selectedGroupId}
        groups={myGroups}
      />
    </div>
  );
});

CommunityScreen.displayName = 'CommunityScreen';

export default CommunityScreen;
