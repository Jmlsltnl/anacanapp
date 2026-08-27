import { motion } from 'framer-motion';
import { ArrowLeft, FileQuestion } from 'lucide-react';
import { useSinglePost } from '@/hooks/useCommunity';
import PostCard from './PostCard';
import PostSeenObserver from './PostSeenObserver';
import { Skeleton } from '@/components/ui/skeleton';
import { tr } from '@/lib/tr';

interface SinglePostViewProps {
  postId: string;
  /** Bildirişin aid olduğu konkret şərh/cavab — verilibsə, panel açılıb ona sürüşür + vurğulanır */
  commentId?: string | null;
  onBack: () => void;
  onUserClick?: (userId: string) => void;
}

/**
 * Bildiriş/deep-link vasitəsilə "MƏHZ bu paylaşımı" açmaq üçün xüsusi ekran.
 *
 * NİYƏ AYRICA EKRAN (adi feed-də scroll/highlight YOX): `useGroupPosts` cəmi
 * son 150 paylaşımı (dil/pin sırasına görə) gətirir — bildirişin aid olduğu
 * paylaşım bu 150-ə düşməyə bilər (daha köhnə, ya da başqa qrup/istifadəçi).
 * `useSinglePost` isə ID-yə görə TƏK bu paylaşımı, üst siyahıdan asılı olmadan
 * çəkir — RLS (is_same_country/is_group_member) burada da eyni tətbiq olunur,
 * yəni görə bilmədiyin bir paylaşımı açmaq cəhdi sadəcə "tapılmadı" göstərər.
 */
const SinglePostView = ({ postId, commentId, onBack, onUserClick }: SinglePostViewProps) => {
  const { data: post, isLoading } = useSinglePost(postId);

  return (
    <div className="min-h-screen pb-24">
      <div className="sticky top-0 z-40 bg-background/70 backdrop-blur-3xl">
        <div className="px-5 py-3 flex items-center gap-3">
          <motion.button onClick={onBack} className="w-9 h-9 rounded-full bg-muted/40 flex items-center justify-center" whileTap={{ scale: 0.9 }}>
            <ArrowLeft className="rtl:rotate-180 w-4 h-4 text-foreground" />
          </motion.button>
          <h1 className="text-[16px] font-black text-foreground truncate leading-tight">
            {tr('singlepostview_title', 'Paylaşım')}
          </h1>
        </div>
      </div>

      <div className="px-4 pt-3">
        {isLoading ? (
          <Skeleton className="h-48 rounded-2xl" />
        ) : !post ? (
          <motion.div
            className="a-card text-center"
            style={{ padding: '36px 18px' }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--a-surface-soft)' }}>
              <FileQuestion className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="a-list-title" style={{ marginBottom: 4 }}>
              {tr('singlepostview_not_found_title', 'Paylaşım tapılmadı')}
            </h3>
            <p className="a-list-sub" style={{ margin: '0 auto', maxWidth: 280, whiteSpace: 'normal', lineHeight: 1.5 }}>
              {tr('singlepostview_not_found_subtitle', 'Bu paylaşım silinmiş ola bilər, ya da onu görmək üçün icazəniz yoxdur.')}
            </p>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <PostSeenObserver postId={post.id} createdAt={post.created_at} postUserId={post.user_id}>
              <PostCard
                post={post}
                groupId={post.group_id ?? null}
                onUserClick={onUserClick}
                forceShowComments
                highlightCommentId={commentId}
              />
            </PostSeenObserver>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SinglePostView;
