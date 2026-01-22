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
        <div className="px-5 py-4">
          <div className="flex items-center gap-4 mb-4">
            {onBack && (
              <motion.button
                onClick={onBack}
                className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-black text-foreground">Cəmiyyət</h1>
              <p className="text-sm text-muted-foreground">Digər analar ilə əlaqədə olun</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Qrup axtar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-11 pr-4 rounded-xl bg-muted/50 border border-border/50 text-sm outline-none focus:border-primary/50"
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
                  className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stories Bar */}
      <div className="px-5 pt-4 border-b border-border/50 pb-4">
        <StoriesBar groupId={null} />
      </div>

      {/* Content */}
      <div className="px-5 pt-4">
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
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">Qruplarınız yoxdur</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Digər analar ilə əlaqə qurmaq üçün qruplara qoşulun
                  </p>
                  <motion.button 
                    onClick={() => setActiveTab('groups')}
                    className="px-6 py-3 rounded-xl gradient-primary text-white font-bold"
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
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full gradient-primary shadow-elevated flex items-center justify-center z-40"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <Plus className="w-6 h-6 text-white" />
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
