import { useState, forwardRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Users } from 'lucide-react';
import { CommunityGroup, useGroupPosts } from '@/hooks/useCommunity';
import { useGroupPresence } from '@/hooks/useGroupPresence';
import PostCard from './PostCard';
import GroupPresenceBar from './GroupPresenceBar';
import StoriesBar from './StoriesBar';
import PostSearchFilter from './PostSearchFilter';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface GroupFeedProps {
  group: CommunityGroup | null;
  onBack: () => void;
  onCreatePost: () => void;
  isEmbedded?: boolean;
  onUserClick?: (userId: string) => void;
  externalSearchQuery?: string;
}

const GroupFeed = forwardRef<HTMLDivElement, GroupFeedProps>(({ group, onBack, onCreatePost, isEmbedded = false, onUserClick, externalSearchQuery }, ref) => {
  const { data: posts = [], isLoading } = useGroupPosts(group?.id || null);
  const { onlineCount, onlineUsers, typingUsers } = useGroupPresence(group?.id || null);
  
  // Search and filter state - use external query if provided
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : localSearchQuery;
  const setSearchQuery = setLocalSearchQuery;
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');

  // Filter and sort posts
  const filteredPosts = useMemo(() => {
    let result = [...posts];

    // Filter by search query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(post => 
        post.content.toLowerCase().includes(lowerQuery) ||
        post.author?.name?.toLowerCase().includes(lowerQuery)
      );
    }

    // Sort
    if (sortBy === 'popular') {
      result.sort((a, b) => (b.likes_count + b.comments_count) - (a.likes_count + a.comments_count));
    } else {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }, [posts, searchQuery, sortBy]);

  if (isEmbedded) {
    // Embedded view for general feed
    return (
      <div ref={ref} className="space-y-3">
        {/* Search & Filter */}
        <PostSearchFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-foreground mb-1 text-sm">
              {searchQuery ? 'Nəticə tapılmadı' : 'Hələ paylaşım yoxdur'}
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              {searchQuery ? 'Başqa axtarış sözləri sınayın' : 'İlk paylaşımı siz edin!'}
            </p>
            {!searchQuery && (
              <Button onClick={onCreatePost} className="gradient-primary text-sm h-9">
                <Plus className="w-4 h-4 mr-1.5" />
                Paylaşım yarat
              </Button>
            )}
          </div>
        ) : (
          filteredPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <PostCard post={post} groupId={group?.id || null} onUserClick={onUserClick} />
            </motion.div>
          ))
        )}
      </div>
    );
  }

  return (
    <div ref={ref} className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="px-3 py-3">
          <div className="flex items-center gap-3">
            <motion.button
              onClick={onBack}
              className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center"
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-4 h-4" />
            </motion.button>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xl">{group?.icon_emoji || '👥'}</span>
                <h1 className="text-lg font-black text-foreground truncate">
                  {group?.name || 'Ümumi'}
                </h1>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="w-3 h-3" />
                <span>{group?.member_count || 0} üzv</span>
              </div>
            </div>
            <Button
              onClick={onCreatePost}
              className="w-9 h-9 rounded-xl gradient-primary p-0"
            >
              <Plus className="w-4 h-4 text-white" />
            </Button>
          </div>
        </div>

        {/* Presence Bar */}
        {group && (
          <GroupPresenceBar
            onlineCount={onlineCount}
            onlineUsers={onlineUsers}
            typingUsers={typingUsers}
          />
        )}
        
        {/* Stories */}
        {group && (
          <div className="px-3 pb-2 border-b border-border/50">
            <StoriesBar groupId={group.id} />
          </div>
        )}
      </div>

      {/* Search & Filter */}
      <div className="px-3 pt-3">
        <PostSearchFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      </div>

      {/* Feed */}
      <div className="px-3 pt-3 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-foreground mb-1 text-sm">
              {searchQuery ? 'Nəticə tapılmadı' : 'Hələ paylaşım yoxdur'}
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              {searchQuery ? 'Başqa axtarış sözləri sınayın' : 'Bu qrupda ilk paylaşımı siz edin!'}
            </p>
            {!searchQuery && (
              <Button onClick={onCreatePost} className="gradient-primary text-sm h-9">
                <Plus className="w-4 h-4 mr-1.5" />
                Paylaşım yarat
              </Button>
            )}
          </div>
        ) : (
          filteredPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <PostCard post={post} groupId={group?.id || null} onUserClick={onUserClick} />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
});

GroupFeed.displayName = 'GroupFeed';

export default GroupFeed;
