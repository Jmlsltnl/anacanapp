import { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, Plus, Search, TrendingUp, Compass, Sparkles } from 'lucide-react';
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
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-2xl border-b border-border/30">
        <div className="px-4 pt-3 pb-2">
          {/* Title Row */}
          <div className="flex items-center gap-3 mb-3">
            {onBack && (
              <motion.button
                onClick={onBack}
                className="w-9 h-9 rounded-full bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors"
                whileTap={{ scale: 0.9 }}
              >
                <ArrowLeft className="w-4 h-4 text-foreground" />
              </motion.button>
            )}
            <div className="flex-1">
              <h1 className="text-xl font-black text-foreground tracking-tight">Cəmiyyət</h1>
              <p className="text-[11px] text-muted-foreground mt-0.5">{headerText}</p>
            </div>
          </div>

          {/* Search */}
          <motion.div
            className={`relative mb-3 transition-all duration-300 ${searchFocused ? 'scale-[1.02]' : ''}`}
          >
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${searchFocused ? 'text-primary' : 'text-muted-foreground/60'}`} />
            <input
              type="text"
              placeholder="Postlarda axtar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className={`w-full h-10 pl-10 pr-4 rounded-2xl bg-muted/40 text-sm outline-none transition-all duration-300 placeholder:text-muted-foreground/50 ${
                searchFocused
                  ? 'bg-card border border-primary/30 shadow-[0_0_0_3px_hsl(var(--primary)/0.08)]'
                  : 'border border-transparent'
              }`}
            />
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-1.5 bg-muted/40 rounded-2xl p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative flex-1 py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors duration-200 ${
                    isActive
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  whileTap={{ scale: 0.97 }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="community-tab-bg"
                      className="absolute inset-0 rounded-xl gradient-primary shadow-sm"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" />
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
      <div className="h-px bg-border/30 mx-4" />

      {/* Content */}
      <div className="px-4 pt-3">
        <AnimatePresence mode="wait">
          {activeTab === 'feed' && (
            <motion.div
              key="feed"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
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
              exit={{ opacity: 0, y: -8 }}
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
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {myGroups.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-1.5 text-sm">Hələ qrupunuz yoxdur</h3>
                  <p className="text-xs text-muted-foreground mb-4 max-w-[220px] mx-auto leading-relaxed">
                    Digər analar ilə əlaqə qurmaq üçün qruplara qoşulun
                  </p>
                  <motion.button
                    onClick={() => setActiveTab('groups')}
                    className="px-5 py-2.5 rounded-2xl gradient-primary text-primary-foreground font-bold text-sm shadow-sm"
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
        className="fixed bottom-24 right-4 w-14 h-14 rounded-2xl gradient-primary shadow-lg shadow-primary/25 flex items-center justify-center z-40"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        <Plus className="w-6 h-6 text-primary-foreground" />
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
