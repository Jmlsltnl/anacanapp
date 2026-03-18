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
  { id: 'feed', label: 'Ümumi', icon: TrendingUp },
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
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-2xl border-b border-border/15">
        <div className="px-4 pt-3 pb-2.5">
          {/* Title Row */}
          <div className="flex items-center gap-2.5 mb-3">
            {onBack && (
              <motion.button
                onClick={onBack}
                className="w-9 h-9 rounded-xl bg-muted/40 flex items-center justify-center active:bg-muted/60 transition-colors"
                whileTap={{ scale: 0.9 }}
              >
                <ArrowLeft className="w-4 h-4 text-foreground" />
              </motion.button>
            )}
            <div className="flex-1">
              <h1 className="text-lg font-black text-foreground tracking-tight leading-tight">Cəmiyyət</h1>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5 font-medium leading-tight">{headerText}</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-2.5">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors duration-200 ${searchFocused ? 'text-primary' : 'text-muted-foreground/35'}`} />
            <input
              type="text"
              placeholder="Postlarda axtar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className={`w-full h-9 pl-9 pr-8 rounded-xl text-[12px] font-medium outline-none transition-all duration-200 placeholder:text-muted-foreground/35 ${
                searchFocused
                  ? 'bg-card border border-primary/20 shadow-[0_0_0_3px_hsl(var(--primary)/0.05)]'
                  : 'bg-muted/25 border border-transparent'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted/50 flex items-center justify-center"
              >
                <X className="w-2.5 h-2.5 text-muted-foreground/60" />
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex bg-muted/25 rounded-xl p-[2px]">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative flex-1 py-[7px] px-1.5 rounded-[10px] text-[11px] font-bold flex items-center justify-center gap-1 transition-colors ${
                    isActive
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground/60 active:text-foreground'
                  }`}
                  whileTap={{ scale: 0.97 }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="community-tab-bg"
                      className="absolute inset-0 rounded-[10px] gradient-primary shadow-sm"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1">
                    <Icon className="w-3 h-3" />
                    {tab.label}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Top Banner */}
          <BannerSlot placement="community_top" className="mt-2" />
        </div>
      </div>

      {/* Stories Bar */}
      <div className="px-4 pt-3 pb-2">
        <StoriesBar groupId={null} />
      </div>
      <div className="h-px bg-border/10 mx-4" />

      {/* Content */}
      <div className="px-4 pt-3">
        <AnimatePresence mode="wait">
          {activeTab === 'feed' && (
            <motion.div
              key="feed"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
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
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
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
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {myGroups.length === 0 ? (
                <div className="text-center py-14">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/8 to-accent/6 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-7 h-7 text-primary/60" />
                  </div>
                  <h3 className="font-bold text-foreground mb-1.5 text-[13px]">Hələ qrupunuz yoxdur</h3>
                  <p className="text-[11px] text-muted-foreground/50 mb-5 max-w-[200px] mx-auto leading-relaxed">
                    Digər analar ilə əlaqə qurmaq üçün qruplara qoşulun
                  </p>
                  <motion.button
                    onClick={() => setActiveTab('groups')}
                    className="px-5 py-2.5 rounded-xl gradient-primary text-primary-foreground font-bold text-[12px] shadow-sm"
                    whileTap={{ scale: 0.95 }}
                  >
                    Qrupları kəşf et
                  </motion.button>
                </div>
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
        className="fixed bottom-24 right-4 w-12 h-12 rounded-2xl gradient-primary shadow-[0_4px_16px_-2px_hsl(var(--primary)/0.4)] flex items-center justify-center z-40"
        whileTap={{ scale: 0.88 }}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        <Plus className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
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
