import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Clock, Eye, Heart, Bookmark, MessageCircle, 
  Send, MoreVertical, Trash2, ChevronDown, ChevronUp
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

  const renderComment = (comment: BlogComment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-8 mt-3' : ''}`}>
      <div className="flex gap-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={comment.user_avatar || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {comment.user_name?.charAt(0) || '?'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-foreground">{comment.user_name}</span>
            {comment.user_badge && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {comment.user_badge === 'admin' ? '👑 Admin' : 
                 comment.user_badge === 'premium' ? '⭐ Premium' : '🛡️ Mod'}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {format(new Date(comment.created_at), 'd MMM', { locale: az })}
            </span>
          </div>

          <p className="text-sm text-foreground mb-2">{comment.content}</p>

          <div className="flex items-center gap-4">
            <button
              onClick={() => toggleCommentLike(comment.id)}
              className={`flex items-center gap-1 text-xs ${comment.is_liked ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <Heart className={`w-3.5 h-3.5 ${comment.is_liked ? 'fill-current' : ''}`} />
              <span>{comment.likes_count || ''}</span>
            </button>

            {!isReply && (
              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="text-xs text-muted-foreground hover:text-primary"
              >
                Cavab yaz
              </button>
            )}

            {user?.id === comment.user_id && (
              <button
                onClick={() => deleteComment(comment.id)}
                className="text-xs text-red-500 hover:text-red-600"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Reply input */}
          {replyingTo === comment.id && (
            <div className="mt-3 flex gap-2">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Cavabınızı yazın..."
                className="text-sm min-h-[60px]"
              />
              <div className="flex flex-col gap-1">
                <Button 
                  size="sm" 
                  onClick={() => handleReply(comment.id)}
                  disabled={submitting}
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
            </div>
          )}

          {/* Replies toggle */}
          {comment.replies && comment.replies.length > 0 && (
            <button
              onClick={() => toggleReplies(comment.id)}
              className="flex items-center gap-1 mt-2 text-xs text-primary"
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
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Cover Image */}
      {post.cover_image_url && (
        <div className="relative h-48 w-full">
          <img 
            src={post.cover_image_url} 
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          <motion.button
            onClick={onBack}
            className="absolute top-3 left-3 w-9 h-9 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </motion.button>
        </div>
      )}

      {!post.cover_image_url && (
        <div className="gradient-primary px-3 pt-3 pb-4">
          <motion.button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center mb-3"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </motion.button>
        </div>
      )}

      <div className="px-3 py-3">
        {/* Category badge */}
        <Badge variant="secondary" className="mb-2 bg-primary/10 text-primary border-0 text-xs">
          {categories.find(c => c.slug === post.category)?.name || post.category}
        </Badge>

        {/* Title */}
        <h1 className="text-xl font-black text-foreground mb-2">
          {post.title}
        </h1>

        {/* Meta info */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{post.reading_time} dəq</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span>{post.view_count} baxış</span>
          </div>
          <span>
            {format(new Date(post.created_at), 'd MMM yyyy', { locale: az })}
          </span>
        </div>

        {/* Like/Save/Comment actions */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
          <motion.button
            onClick={toggleLike}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-sm ${
              isLiked 
                ? 'bg-red-500/10 text-red-500' 
                : 'bg-muted text-muted-foreground'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span className="font-medium">{likesCount}</span>
          </motion.button>

          <motion.button
            onClick={toggleSave}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-sm ${
              isSaved 
                ? 'bg-primary/10 text-primary' 
                : 'bg-muted text-muted-foreground'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            <span className="font-medium">{isSaved ? 'Saxlanıldı' : 'Saxla'}</span>
          </motion.button>

          <div className="flex items-center gap-1 text-muted-foreground text-sm">
            <MessageCircle className="w-4 h-4" />
            <span className="font-medium">{commentsCount}</span>
          </div>
        </div>

        {/* Content */}
        <div className="mb-4">
          <MarkdownContent content={post.content} variant="blog" />
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {post.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Author */}
        <div className="p-3 bg-card rounded-2xl border border-border/50 flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
            ✍️
          </div>
          <div>
            <p className="font-bold text-foreground text-sm">{post.author_name}</p>
            <p className="text-xs text-muted-foreground">Məqalə müəllifi</p>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-card rounded-2xl border border-border/50 p-3">
          <h3 className="font-bold text-foreground mb-3 flex items-center gap-2 text-sm">
            <MessageCircle className="w-4 h-4 text-primary" />
            Şərhlər ({commentsCount})
          </h3>

          {/* New comment input */}
          <div className="flex gap-2 mb-4">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={user ? "Şərhinizi yazın..." : "Şərh yazmaq üçün giriş edin"}
              className="min-h-[60px] text-sm"
              disabled={!user}
            />
            <Button 
              onClick={handleAddComment} 
              disabled={submitting || !newComment.trim()}
              className="shrink-0 h-9"
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* Comments list */}
          {comments.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-3xl mb-2">💬</div>
              <p className="text-muted-foreground text-sm">Hələ şərh yoxdur</p>
              <p className="text-xs text-muted-foreground">İlk şərhi siz yazın!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map(comment => renderComment(comment))}
            </div>
          )}
        </div>

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
