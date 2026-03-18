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
    <motion.div className="text-center py-14" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/8 to-accent/6 flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl">{emoji}</span>
      </div>
      <h3 className="font-bold text-foreground mb-1 text-[13px]">{text}</h3>
      <p className="text-[11px] text-muted-foreground/50 mb-4 max-w-[220px] mx-auto">{subtext}</p>
      {!searchQuery && (
        <Button onClick={onCreatePost} size="sm" className="gradient-primary text-[11px] h-8 px-4 rounded-xl">
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Paylaşım yarat
        </Button>
      )}
    </motion.div>
  );

  if (isEmbedded) {
    return (
      <div ref={ref} className="space-y-2.5">
        <PostSearchFilter searchQuery={searchQuery} onSearchChange={setSearchQuery} sortBy={sortBy} onSortChange={setSortBy} />
        {isLoading ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
        ) : filteredPosts.length === 0 ? (
          <EmptyState emoji="💬" text={searchQuery ? 'Nəticə tapılmadı' : 'Hələ paylaşım yoxdur'} subtext={searchQuery ? 'Başqa axtarış sözləri sınayın' : 'İlk paylaşımı siz edin!'} />
        ) : (
          filteredPosts.map((post, index) => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
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
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-2xl border-b border-border/15">
        <div className="px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <motion.button onClick={onBack} className="w-8 h-8 rounded-xl bg-muted/40 flex items-center justify-center" whileTap={{ scale: 0.9 }}>
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </motion.button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-base">{group?.icon_emoji || '👥'}</span>
                <h1 className="text-[15px] font-black text-foreground truncate">{group?.name || 'Ümumi'}</h1>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground/50 font-medium">
                <Users className="w-2.5 h-2.5" />
                <span>{group?.member_count || 0} üzv</span>
              </div>
            </div>
            <Button onClick={onCreatePost} className="w-8 h-8 rounded-xl gradient-primary p-0">
              <Plus className="w-4 h-4 text-primary-foreground" />
            </Button>
          </div>
        </div>

        {group && (
          <GroupPresenceBar onlineCount={onlineCount} onlineUsers={onlineUsers} typingUsers={typingUsers} />
        )}
        
        {group && (
          <div className="px-4 pb-2 border-b border-border/10">
            <StoriesBar groupId={group.id} />
          </div>
        )}
      </div>

      <div className="px-4 pt-3">
        <PostSearchFilter searchQuery={searchQuery} onSearchChange={setSearchQuery} sortBy={sortBy} onSortChange={setSortBy} />
      </div>

      <div className="px-4 pt-2 space-y-2.5">
        {isLoading ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
        ) : filteredPosts.length === 0 ? (
          <EmptyState emoji="🌟" text={searchQuery ? 'Nəticə tapılmadı' : 'Hələ paylaşım yoxdur'} subtext={searchQuery ? 'Başqa axtarış sözləri sınayın' : 'Bu qrupda ilk paylaşımı siz edin!'} />
        ) : (
          filteredPosts.map((post, index) => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
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
