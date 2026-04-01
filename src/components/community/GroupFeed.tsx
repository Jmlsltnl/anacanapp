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
  
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : localSearchQuery;
  const setSearchQuery = setLocalSearchQuery;
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');

  const filteredPosts = useMemo(() => {
    let result = [...posts];
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(post => 
        post.content.toLowerCase().includes(lowerQuery) ||
        post.author?.name?.toLowerCase().includes(lowerQuery)
      );
    }
    if (sortBy === 'popular') {
      result.sort((a, b) => (b.likes_count + b.comments_count) - (a.likes_count + a.comments_count));
    } else {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return result;
  }, [posts, searchQuery, sortBy]);

  const EmptyState = ({ emoji, text, subtext }: { emoji: string; text: string; subtext: string }) => (
    <motion.div className="text-center py-16" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/8 to-accent/5 flex items-center justify-center mx-auto mb-4">
        <span className="text-3xl">{emoji}</span>
      </div>
      <h3 className="font-bold text-foreground mb-1.5 text-[14px]">{text}</h3>
      <p className="text-[12px] text-muted-foreground/40 mb-5 max-w-[240px] mx-auto leading-relaxed">{subtext}</p>
      {!searchQuery && (
        <Button onClick={onCreatePost} size="sm" className="gradient-primary text-[12px] h-9 px-5 rounded-full shadow-sm shadow-primary/20">
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Paylaşım yarat
        </Button>
      )}
    </motion.div>
  );

  if (isEmbedded) {
    return (
      <div ref={ref} className="space-y-3">
        <PostSearchFilter searchQuery={searchQuery} onSearchChange={setSearchQuery} sortBy={sortBy} onSortChange={setSortBy} />
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
          </div>
        ) : filteredPosts.length === 0 ? (
          <EmptyState emoji="💬" text={searchQuery ? 'Nəticə tapılmadı' : 'Hələ paylaşım yoxdur'} subtext={searchQuery ? 'Başqa axtarış sözləri sınayın' : 'İlk paylaşımı siz edin!'} />
        ) : (
          filteredPosts.map((post, index) => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
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
      <div className="sticky top-0 z-40 bg-background/70 backdrop-blur-3xl">
        <div className="px-5 py-3">
          <div className="flex items-center gap-3">
            <motion.button onClick={onBack} className="w-9 h-9 rounded-full bg-muted/40 flex items-center justify-center" whileTap={{ scale: 0.9 }}>
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </motion.button>
            <div className="flex-1 min-w-0 flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-accent/8 flex items-center justify-center">
                <span className="text-lg">{group?.icon_emoji || '👥'}</span>
              </div>
              <div>
                <h1 className="text-[16px] font-black text-foreground truncate leading-tight">{group?.name || 'Ümumi'}</h1>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground/40 font-medium">
                  <Users className="w-3 h-3" />
                  <span>{group?.member_count || 0} üzv</span>
                </div>
              </div>
            </div>
            <Button onClick={onCreatePost} className="w-9 h-9 rounded-full gradient-primary p-0 shadow-sm shadow-primary/20">
              <Plus className="w-4 h-4 text-primary-foreground" />
            </Button>
          </div>
        </div>

        {group && <GroupPresenceBar onlineCount={onlineCount} onlineUsers={onlineUsers} typingUsers={typingUsers} />}
        
        {group && (
          <div className="px-5 pb-2.5">
            <StoriesBar groupId={group.id} />
          </div>
        )}
      </div>

      <div className="px-4 pt-3">
        <PostSearchFilter searchQuery={searchQuery} onSearchChange={setSearchQuery} sortBy={sortBy} onSortChange={setSortBy} />
      </div>

      <div className="px-4 pt-1 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
          </div>
        ) : filteredPosts.length === 0 ? (
          <EmptyState emoji="🌟" text={searchQuery ? 'Nəticə tapılmadı' : 'Hələ paylaşım yoxdur'} subtext={searchQuery ? 'Başqa axtarış sözləri sınayın' : 'Bu qrupda ilk paylaşımı siz edin!'} />
        ) : (
          filteredPosts.map((post, index) => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
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
