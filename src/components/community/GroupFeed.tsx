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
}

const GroupFeed = forwardRef<HTMLDivElement, GroupFeedProps>(({ group, onBack, onCreatePost, isEmbedded = false }, ref) => {
  const { data: posts = [], isLoading } = useGroupPosts(group?.id || null);
  const { onlineCount, onlineUsers, typingUsers } = useGroupPresence(group?.id || null);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
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
      <div ref={ref} className="space-y-4">
        {/* Search & Filter */}
        <PostSearchFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-foreground mb-2">
              {searchQuery ? 'Nəticə tapılmadı' : 'Hələ paylaşım yoxdur'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery ? 'Başqa axtarış sözləri sınayın' : 'İlk paylaşımı siz edin!'}
            </p>
            {!searchQuery && (
              <Button onClick={onCreatePost} className="gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
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
              <PostCard post={post} groupId={group?.id || null} />
            </motion.div>
          ))
        )}
      </div>
    );
  }

  return (
    <div ref={ref} className="min-h-screen pb-28">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="px-5 py-4">
          <div className="flex items-center gap-4">
            <motion.button
              onClick={onBack}
              className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{group?.icon_emoji || '👥'}</span>
                <h1 className="text-xl font-black text-foreground truncate">
                  {group?.name || 'Ümumi'}
                </h1>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="w-3 h-3" />
                <span>{group?.member_count || 0} üzv</span>
              </div>
            </div>
            <Button
              onClick={onCreatePost}
              className="w-10 h-10 rounded-xl gradient-primary p-0"
            >
              <Plus className="w-5 h-5 text-white" />
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
          <div className="px-5 pb-2 border-b border-border/50">
            <StoriesBar groupId={group.id} />
          </div>
        )}
      </div>

      {/* Search & Filter */}
      <div className="px-5 pt-4">
        <PostSearchFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      </div>

      {/* Feed */}
      <div className="px-5 pt-4 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-foreground mb-2">
              {searchQuery ? 'Nəticə tapılmadı' : 'Hələ paylaşım yoxdur'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery ? 'Başqa axtarış sözləri sınayın' : 'Bu qrupda ilk paylaşımı siz edin!'}
            </p>
            {!searchQuery && (
              <Button onClick={onCreatePost} className="gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
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
              <PostCard post={post} groupId={group?.id || null} />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
});

GroupFeed.displayName = 'GroupFeed';

export default GroupFeed;
