import { tr } from "@/lib/tr";import { useState, forwardRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Users } from 'lucide-react';
import { CommunityGroup, useGroupPosts } from '@/hooks/useCommunity';
import { useGroupPresence } from '@/hooks/useGroupPresence';
import PostCard from './PostCard';
import PostSeenObserver from './PostSeenObserver';
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
      result = result.filter((post) =>
      post.content.toLowerCase().includes(lowerQuery) ||
      post.author?.name?.toLowerCase().includes(lowerQuery)
      );
    }
    if (sortBy === 'popular') {
      result.sort((a, b) => b.likes_count + b.comments_count - (a.likes_count + a.comments_count));
    }
    // 'recent' (default) — useGroupPosts artıq düzgün sırada qaytarır (pinlənmiş →
    // ölkəyə görə dil prioriteti → tarix). Əvvəllər burada YENIDƏN sırf tarixə görə
    // sort edilirdi ki, bu, dil prioritet sırasını POZURDU.
    return result;
  }, [posts, searchQuery, sortBy]);

  const EmptyState = ({ emoji, text, subtext }: {emoji: string;text: string;subtext: string;}) =>
  <motion.div className="a-card text-center" style={{ padding: '36px 18px' }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
      <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--a-surface-soft)' }}>
        <span className="text-3xl">{emoji}</span>
      </div>
      <h3 className="a-list-title" style={{ marginBottom: 4 }}>{text}</h3>
      <p className="a-list-sub" style={{ margin: '0 auto 16px', maxWidth: 240, whiteSpace: 'normal', lineHeight: 1.5 }}>{subtext}</p>
      {!searchQuery &&
    <button onClick={onCreatePost} className="a-cta-btn">
          <Plus size={14} strokeWidth={2.4} /> {tr("groupfeed_paylasim_yarat_69bdcd", "Payla\u015F\u0131m yarat")}
        </button>
    }
    </motion.div>;


  if (isEmbedded) {
    return (
      <div ref={ref} className="space-y-3">
        <PostSearchFilter searchQuery={searchQuery} onSearchChange={setSearchQuery} sortBy={sortBy} onSortChange={setSortBy} />
        {isLoading ?
        <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
          </div> :
        filteredPosts.length === 0 ?
        <EmptyState emoji="💬" text={searchQuery ? tr("groupfeed_netice_tapilmadi_4b1b52", "N\u0259tic\u0259 tap\u0131lmad\u0131") : tr("groupfeed_hele_paylasim_yoxdur_a0a7fa", "H\u0259l\u0259 payla\u015F\u0131m yoxdur")} subtext={searchQuery ? tr("groupfeed_basqa_axtaris_sozleri_sinayin_20e63c", "Ba\u015Fqa axtar\u0131\u015F s\xF6zl\u0259ri s\u0131nay\u0131n") : tr("groupfeed_i_lk_paylasimi_siz_edin_1ec33a", "\u0130lk payla\u015F\u0131m\u0131 siz edin!")} /> :

        filteredPosts.map((post, index) =>
        <motion.div key={post.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
              <PostSeenObserver postId={post.id} createdAt={post.created_at} postUserId={post.user_id}>
                <PostCard post={post} groupId={group?.id || null} onUserClick={onUserClick} />
              </PostSeenObserver>
            </motion.div>
        )
        }
      </div>);

  }

  return (
    <div ref={ref} className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/70 backdrop-blur-3xl">
        <div className="px-5 py-3">
          <div className="flex items-center gap-3">
            <motion.button onClick={onBack} className="w-9 h-9 rounded-full bg-muted/40 flex items-center justify-center" whileTap={{ scale: 0.9 }}>
              <ArrowLeft className="rtl:rotate-180 w-4 h-4 text-foreground" />
            </motion.button>
            <div className="flex-1 min-w-0 flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-accent/8 flex items-center justify-center shrink-0">
                <span className="text-lg">{group?.icon_emoji || '👥'}</span>
              </div>
              <div className="min-w-0">
                <h1 className="text-[16px] font-black text-foreground truncate leading-tight">{group?.name ? tr(`group_name_${group.name.replace(/\s+/g, '_').toLowerCase()}`, group.name) : tr("groupfeed_umumi_1b5521", "\xDCmumi")}</h1>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground/40 font-medium">
                  <Users className="w-3 h-3" />
                  <span>{group?.member_count || 0} {tr("groupfeed_uzv_3f0dbc", "\xFCzv")}</span>
                </div>
              </div>
            </div>
            <Button onClick={onCreatePost} className="w-9 h-9 rounded-full gradient-primary p-0 shadow-sm shadow-primary/20">
              <Plus className="w-4 h-4 text-primary-foreground" />
            </Button>
          </div>
        </div>

        {group && <GroupPresenceBar onlineCount={onlineCount} onlineUsers={onlineUsers} typingUsers={typingUsers} />}
        
        {group &&
        <div className="px-5 pb-2.5">
            <StoriesBar groupId={group.id} />
          </div>
        }
      </div>

      <div className="px-4 pt-3 pb-1">
        <PostSearchFilter searchQuery={searchQuery} onSearchChange={setSearchQuery} sortBy={sortBy} onSortChange={setSortBy} />
      </div>

      <div className="pt-1">
        {isLoading ?
        <div className="space-y-2 px-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-36" />)}
          </div> :
        filteredPosts.length === 0 ?
        <EmptyState emoji="🌟" text={searchQuery ? tr("groupfeed_netice_tapilmadi_4b1b52", "N\u0259tic\u0259 tap\u0131lmad\u0131") : tr("groupfeed_hele_paylasim_yoxdur_a0a7fa", "H\u0259l\u0259 payla\u015F\u0131m yoxdur")} subtext={searchQuery ? tr("groupfeed_basqa_axtaris_sozleri_sinayin_20e63c", "Ba\u015Fqa axtar\u0131\u015F s\xF6zl\u0259ri s\u0131nay\u0131n") : tr("groupfeed_bu_qrupda_ilk_paylasimi_siz_ed_124fe7", "Bu qrupda ilk payla\u015F\u0131m\u0131 siz edin!")} /> :

        filteredPosts.map((post, index) =>
        <motion.div key={post.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
              <PostSeenObserver postId={post.id} createdAt={post.created_at} postUserId={post.user_id}>
                <PostCard post={post} groupId={group?.id || null} onUserClick={onUserClick} />
              </PostSeenObserver>
            </motion.div>
        )
        }
      </div>
    </div>);

});

GroupFeed.displayName = 'GroupFeed';

export default GroupFeed;