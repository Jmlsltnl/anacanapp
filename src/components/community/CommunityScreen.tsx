import { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, Plus, Search, TrendingUp } from 'lucide-react';
import { useCommunityGroups, useUserMemberships } from '@/hooks/useCommunity';
import GroupsList from './GroupsList';
import GroupFeed from './GroupFeed';
import CreatePostModal from './CreatePostModal';
import StoriesBar from './StoriesBar';
import UserProfileScreen from './UserProfileScreen';

interface CommunityScreenProps {
  onBack?: () => void;
}

const CommunityScreen = forwardRef<HTMLDivElement, CommunityScreenProps>(({ onBack }, ref) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'groups' | 'my-groups'>('feed');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data: groups = [], isLoading: groupsLoading } = useCommunityGroups();
  const { data: memberships = [] } = useUserMemberships();

  const memberGroupIds = new Set(memberships.map(m => m.group_id));
  const myGroups = groups.filter(g => memberGroupIds.has(g.id));

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
  };

  // If viewing a user profile
  if (selectedUserId) {
    return (
      <UserProfileScreen
        userId={selectedUserId}
        onBack={() => setSelectedUserId(null)}
      />
    );
  }

  // If a group is selected, show its feed
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
    <div ref={ref} className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b border-border/50">
        <div className="px-3 py-3">
          <div className="flex items-center gap-3 mb-3">
            {onBack && (
              <motion.button
                onClick={onBack}
                className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center"
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-4 h-4" />
              </motion.button>
            )}
            <div className="flex-1">
              <h1 className="text-lg font-black text-foreground">Cəmiyyət</h1>
              <p className="text-xs text-muted-foreground">Digər analar ilə əlaqədə olun</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Qrup axtar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-3 rounded-xl bg-muted/50 border border-border/50 text-sm outline-none focus:border-primary/50"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {[
              { id: 'feed', label: 'Ümumi', icon: TrendingUp },
              { id: 'my-groups', label: 'Qruplarım', icon: Users },
              { id: 'groups', label: 'Bütün Qruplar', icon: Users },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stories Bar */}
      <div className="px-3 pt-3 border-b border-border/50 pb-3">
        <StoriesBar groupId={null} />
      </div>

      {/* Content */}
      <div className="px-3 pt-3">
        <AnimatePresence mode="wait">
          {activeTab === 'feed' && (
            <motion.div
              key="feed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <GroupFeed
                group={null}
                onBack={() => {}}
                onCreatePost={() => setShowCreatePost(true)}
                isEmbedded
                onUserClick={handleUserClick}
              />
            </motion.div>
          )}

          {activeTab === 'groups' && (
            <motion.div
              key="groups"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {myGroups.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-bold text-foreground mb-1 text-sm">Qruplarınız yoxdur</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Digər analar ilə əlaqə qurmaq üçün qruplara qoşulun
                  </p>
                  <motion.button 
                    onClick={() => setActiveTab('groups')}
                    className="px-4 py-2 rounded-xl gradient-primary text-white font-bold text-sm"
                    whileTap={{ scale: 0.98 }}
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

      {/* Floating Action Button for Create Post */}
      <motion.button
        onClick={() => setShowCreatePost(true)}
        className="fixed bottom-24 right-3 w-12 h-12 rounded-full gradient-primary shadow-elevated flex items-center justify-center z-40"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <Plus className="w-5 h-5 text-white" />
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
