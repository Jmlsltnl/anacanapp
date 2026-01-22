import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, MoreHorizontal, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { az } from 'date-fns/locale';
import { CommunityPost, useToggleLike, usePostComments, useCreateComment } from '@/hooks/useCommunity';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { hapticFeedback } from '@/lib/native';
import MediaCarousel from './MediaCarousel';

interface PostCardProps {
  post: CommunityPost;
  groupId: string | null;
}

// Helper to detect media type from URL
const getMediaType = (url: string): 'image' | 'video' => {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext)) ? 'video' : 'image';
};

const PostCard = ({ post, groupId }: PostCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const toggleLike = useToggleLike();
  const { data: comments = [], isLoading: commentsLoading } = usePostComments(post.id);
  const createComment = useCreateComment();

  const handleLike = () => {
    hapticFeedback.light();
    toggleLike.mutate({ postId: post.id, isLiked: post.is_liked || false, groupId });
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    hapticFeedback.light();
    createComment.mutate({ postId: post.id, content: commentText.trim() });
    setCommentText('');
  };

  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: az,
  });

  // Convert media_urls to MediaItems with type detection
  const mediaItems = (post.media_urls || []).map(url => ({
    url,
    type: getMediaType(url),
  }));

  return (
    <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={post.author?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary font-bold">
            {post.author?.name?.charAt(0) || 'İ'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h4 className="font-bold text-foreground text-sm">{post.author?.name || 'İstifadəçi'}</h4>
          <p className="text-xs text-muted-foreground">{timeAgo}</p>
        </div>
        <button className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center">
          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Media Carousel */}
      {mediaItems.length > 0 && (
        <div className="px-4 pb-3">
          <MediaCarousel media={mediaItems} />
        </div>
      )}

      {/* Stats */}
      <div className="px-4 py-2 flex items-center gap-4 text-sm text-muted-foreground border-t border-border/50">
        <span>{post.likes_count} bəyənmə</span>
        <span>{post.comments_count} şərh</span>
      </div>

      {/* Actions */}
      <div className="px-4 py-2 flex items-center gap-2 border-t border-border/50">
        <motion.button
          onClick={handleLike}
          className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 transition-colors ${
            post.is_liked ? 'text-rose-500' : 'text-muted-foreground hover:bg-muted'
          }`}
          whileTap={{ scale: 0.95 }}
        >
          <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`} />
          <span className="text-sm font-medium">Bəyən</span>
        </motion.button>
        <motion.button
          onClick={() => setShowComments(!showComments)}
          className="flex-1 py-2 rounded-xl flex items-center justify-center gap-2 text-muted-foreground hover:bg-muted transition-colors"
          whileTap={{ scale: 0.95 }}
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Şərh</span>
          {showComments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </motion.button>
        <motion.button
          className="flex-1 py-2 rounded-xl flex items-center justify-center gap-2 text-muted-foreground hover:bg-muted transition-colors"
          whileTap={{ scale: 0.95 }}
        >
          <Share2 className="w-5 h-5" />
          <span className="text-sm font-medium">Paylaş</span>
        </motion.button>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border/50 overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Comment Input */}
              <div className="flex gap-2">
                <Input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Şərh yaz..."
                  className="flex-1 h-10 rounded-xl"
                  onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                />
                <Button
                  onClick={handleComment}
                  disabled={!commentText.trim() || createComment.isPending}
                  className="w-10 h-10 rounded-xl gradient-primary p-0"
                >
                  <Send className="w-4 h-4 text-white" />
                </Button>
              </div>

              {/* Comments List */}
              {commentsLoading ? (
                <div className="text-center py-4">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-2">
                  Hələ şərh yoxdur
                </p>
              ) : (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={comment.author?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                          {comment.author?.name?.charAt(0) || 'İ'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 bg-muted rounded-xl p-3">
                        <p className="text-xs font-bold text-foreground">{comment.author?.name}</p>
                        <p className="text-sm text-foreground mt-1">{comment.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: az })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PostCard;