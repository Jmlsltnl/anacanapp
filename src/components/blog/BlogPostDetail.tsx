import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Clock, Eye, Heart, Bookmark, MessageCircle, 
  Send, Trash2, ChevronDown, ChevronUp, Share2, User
} from 'lucide-react';
import { BlogPost, BlogCategory } from '@/hooks/useBlog';
import { useBlogInteractions, BlogComment } from '@/hooks/useBlogInteractions';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { az } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import RelatedPosts from './RelatedPosts';
import MarkdownContent from '@/components/MarkdownContent';

interface BlogPostDetailProps {
  post: BlogPost;
  categories: BlogCategory[];
  allPosts: BlogPost[];
  onBack: () => void;
  onSelectPost: (post: BlogPost) => void;
}

const BlogPostDetail = ({ post, categories, allPosts, onBack, onSelectPost }: BlogPostDetailProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    isLiked,
    isSaved,
    likesCount,
    comments,
    commentsCount,
    toggleLike,
    toggleSave,
    addComment,
    toggleCommentLike,
    deleteComment
  } = useBlogInteractions(post.id);

  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedComments, setExpandedComments] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleAddComment = async () => {
    if (!user) {
      toast({ title: 'Giriş edin', description: 'Şərh yazmaq üçün hesabınıza daxil olun' });
      return;
    }
    if (!newComment.trim()) return;

    setSubmitting(true);
    const result = await addComment(newComment);
    setSubmitting(false);

    if (!result.error) {
      setNewComment('');
      toast({ title: 'Şərh əlavə edildi!' });
    }
  };

  const handleReply = async (parentId: string) => {
    if (!user) {
      toast({ title: 'Giriş edin', description: 'Cavab yazmaq üçün hesabınıza daxil olun' });
      return;
    }
    if (!replyContent.trim()) return;

    setSubmitting(true);
    const result = await addComment(replyContent, parentId);
    setSubmitting(false);

    if (!result.error) {
      setReplyContent('');
      setReplyingTo(null);
      toast({ title: 'Cavab əlavə edildi!' });
    }
  };

  const toggleReplies = (commentId: string) => {
    setExpandedComments(prev => 
      prev.includes(commentId) 
        ? prev.filter(id => id !== commentId)
        : [...prev, commentId]
    );
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: post.title,
        text: post.excerpt || '',
        url: window.location.href
      });
    } catch (e) {
      toast({ title: 'Link kopyalandı!' });
    }
  };

  const renderComment = (comment: BlogComment, isReply = false) => (
    <motion.div 
      key={comment.id} 
      className={`${isReply ? 'ml-10 mt-3' : ''}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex gap-3">
        <Avatar className="w-10 h-10 border-2 border-border">
          <AvatarImage src={comment.user_avatar || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-sm">
            {comment.user_name?.charAt(0) || '?'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="bg-muted/50 rounded-2xl rounded-tl-none p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm text-foreground">{comment.user_name}</span>
              {comment.user_badge && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-violet-500/10 text-violet-600">
                  {comment.user_badge === 'admin' ? '👑 Admin' : 
                   comment.user_badge === 'premium' ? '⭐ Premium' : '🛡️ Mod'}
                </Badge>
              )}
            </div>
            <p className="text-sm text-foreground">{comment.content}</p>
          </div>

          <div className="flex items-center gap-4 mt-2 px-2">
            <button
              onClick={() => toggleCommentLike(comment.id)}
              className={`flex items-center gap-1 text-xs font-medium transition-colors ${comment.is_liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
            >
              <Heart className={`w-3.5 h-3.5 ${comment.is_liked ? 'fill-current' : ''}`} />
              <span>{comment.likes_count || ''}</span>
            </button>

            {!isReply && (
              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="text-xs font-medium text-muted-foreground hover:text-violet-500 transition-colors"
              >
                Cavab yaz
              </button>
            )}

            <span className="text-xs text-muted-foreground">
              {format(new Date(comment.created_at), 'd MMM', { locale: az })}
            </span>

            {user?.id === comment.user_id && (
              <button
                onClick={() => deleteComment(comment.id)}
                className="text-xs text-red-500 hover:text-red-600 ml-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Reply input */}
          {replyingTo === comment.id && (
            <motion.div 
              className="mt-3 flex gap-2"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Cavabınızı yazın..."
                className="text-sm min-h-[60px] rounded-xl bg-muted/50"
              />
              <div className="flex flex-col gap-1">
                <Button 
                  size="sm" 
                  onClick={() => handleReply(comment.id)}
                  disabled={submitting}
                  className="bg-gradient-to-r from-violet-600 to-purple-600"
                >
                  <Send className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => setReplyingTo(null)}
                >
                  ✕
                </Button>
              </div>
            </motion.div>
          )}

          {/* Replies toggle */}
          {comment.replies && comment.replies.length > 0 && (
            <button
              onClick={() => toggleReplies(comment.id)}
              className="flex items-center gap-1 mt-2 px-2 text-xs font-medium text-violet-600"
            >
              {expandedComments.includes(comment.id) ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  Cavabları gizlə
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  {comment.replies.length} cavab göstər
                </>
              )}
            </button>
          )}

          {/* Replies */}
          {expandedComments.includes(comment.id) && comment.replies?.map(reply => 
            renderComment(reply, true)
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Image */}
      <div className="relative">
        {post.cover_image_url ? (
          <div className="relative h-64 w-full">
            <img 
              src={post.cover_image_url} 
              alt={post.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </div>
        ) : (
          <div className="h-40 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600" />
        )}
        
        {/* Floating Back Button */}
        <motion.button
          onClick={onBack}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center safe-area-top"
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </motion.button>

        {/* Floating Share Button */}
        <motion.button
          onClick={handleShare}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center safe-area-top"
          whileTap={{ scale: 0.95 }}
        >
          <Share2 className="w-5 h-5 text-white" />
        </motion.button>
      </div>

      <div className="px-4 -mt-8 relative z-10">
        {/* Main Content Card */}
        <motion.div
          className="bg-card rounded-3xl shadow-xl border border-border/50 p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Category */}
          <Badge className="mb-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white border-0">
            {categories.find(c => c.slug === post.category)?.icon} {categories.find(c => c.slug === post.category)?.name || post.category}
          </Badge>

          {/* Title */}
          <h1 className="text-2xl font-black text-foreground mb-3 leading-tight">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {post.reading_time} dəq
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {post.view_count} baxış
            </span>
            <span>
              {format(new Date(post.created_at), 'd MMMM yyyy', { locale: az })}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pb-4 border-b border-border">
            <motion.button
              onClick={toggleLike}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
                isLiked 
                  ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30' 
                  : 'bg-muted hover:bg-muted/80 text-foreground'
              }`}
              whileTap={{ scale: 0.98 }}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span>{likesCount}</span>
            </motion.button>

            <motion.button
              onClick={toggleSave}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
                isSaved 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30' 
                  : 'bg-muted hover:bg-muted/80 text-foreground'
              }`}
              whileTap={{ scale: 0.98 }}
            >
              <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
              <span>{isSaved ? 'Saxlanıldı' : 'Saxla'}</span>
            </motion.button>

            <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-muted text-muted-foreground">
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold">{commentsCount}</span>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div 
          className="mt-4 bg-card rounded-3xl shadow-lg border border-border/50 p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <MarkdownContent content={post.content} variant="blog" />
        </motion.div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <motion.div 
            className="flex flex-wrap gap-2 mt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            {post.tags.map(tag => (
              <Badge key={tag} variant="outline" className="rounded-full text-sm px-3 py-1">
                #{tag}
              </Badge>
            ))}
          </motion.div>
        )}

        {/* Author */}
        <motion.div 
          className="mt-4 p-4 bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-2xl border border-violet-500/20 flex items-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <User className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="font-bold text-foreground">{post.author_name}</p>
            <p className="text-sm text-muted-foreground">Məqalə müəllifi</p>
          </div>
        </motion.div>

        {/* Comments Section */}
        <motion.div 
          className="mt-4 bg-card rounded-3xl shadow-lg border border-border/50 p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            Şərhlər ({commentsCount})
          </h3>

          {/* New comment */}
          <div className="flex gap-3 mb-6">
            <Avatar className="w-10 h-10 border-2 border-border">
              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                <User className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 flex gap-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={user ? "Şərhinizi yazın..." : "Şərh yazmaq üçün giriş edin"}
                className="min-h-[50px] rounded-xl bg-muted/50 resize-none"
                disabled={!user}
              />
              <Button 
                onClick={handleAddComment} 
                disabled={submitting || !newComment.trim()}
                className="shrink-0 bg-gradient-to-r from-violet-600 to-purple-600"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Comments list */}
          {comments.length === 0 ? (
            <div className="text-center py-8 bg-muted/30 rounded-2xl">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center">
                <MessageCircle className="w-7 h-7 text-violet-500" />
              </div>
              <p className="font-semibold text-foreground">Hələ şərh yoxdur</p>
              <p className="text-sm text-muted-foreground">İlk şərhi siz yazın!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map(comment => renderComment(comment))}
            </div>
          )}
        </motion.div>

        {/* Related Posts */}
        <RelatedPosts 
          currentPost={post} 
          allPosts={allPosts} 
          onSelectPost={onSelectPost} 
        />
      </div>
    </div>
  );
};

export default BlogPostDetail;
