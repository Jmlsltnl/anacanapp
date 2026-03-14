import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, MoreHorizontal, ChevronDown, ChevronUp, Send, Trash2, Crown, Shield, Flag, Pencil, EyeOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { az } from 'date-fns/locale';
import { CommunityPost, useToggleLike, usePostComments, useCreateComment, useEditPost, useDeletePost } from '@/hooks/useCommunity';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { hapticFeedback, nativeShare } from '@/lib/native';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MediaCarousel from './MediaCarousel';
import CommentReply from './CommentReply';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface PostCardProps {
  post: CommunityPost;
  groupId: string | null;
  onUserClick?: (userId: string) => void;
}

// Helper to detect media type from URL
const getMediaType = (url: string): 'image' | 'video' => {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext)) ? 'video' : 'image';
};

// Badge component for user types
const UserBadge = ({ type }: { type: 'admin' | 'premium' | 'moderator' | null }) => {
  if (!type) return null;
  
  const config = {
    admin: { label: 'Admin', icon: Shield, className: 'bg-gradient-to-r from-red-500 to-orange-500 text-white' },
    premium: { label: 'Premium', icon: Crown, className: 'bg-gradient-to-r from-amber-400 to-amber-600 text-white' },
    moderator: { label: 'Mod', icon: Shield, className: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' },
  };

  const badgeConfig = config[type];
  if (!badgeConfig) return null;

  const Icon = badgeConfig.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${badgeConfig.className}`}>
      <Icon className="w-2.5 h-2.5" />
      {badgeConfig.label}
    </span>
  );
};

const PostCard = ({ post, groupId, onUserClick }: PostCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const { isAdmin, user, profile } = useAuth();
  const { toast } = useToast();

  const toggleLike = useToggleLike();
  const { data: comments = [], isLoading: commentsLoading, refetch: refetchComments } = usePostComments(post.id);
  const createComment = useCreateComment();
  const editPost = useEditPost();
  const deletePost = useDeletePost();

  const isOwnPost = user?.id === post.user_id;
  const isAnonymous = (post as any).is_anonymous === true;

  const handleLike = () => {
    hapticFeedback.light();
    toggleLike.mutate({ postId: post.id, isLiked: post.is_liked || false, groupId });
  };

  const handleComment = () => {
    const content = commentText.trim();
    if (!content) return;

    hapticFeedback.light();
    createComment.mutate({
      postId: post.id,
      content,
      postAuthorId: post.user_id,
      commenterName: profile?.name || user?.user_metadata?.name || 'İstifadəçi',
    });
    setCommentText('');
  };

  const handleDeletePost = () => {
    if (!confirm('Bu postu silmək istəyirsiniz?')) return;
    hapticFeedback.medium();
    deletePost.mutate(post.id);
  };

  const handleEditPost = () => {
    const content = editContent.trim();
    if (!content) return;
    hapticFeedback.light();
    editPost.mutate({ postId: post.id, content }, {
      onSuccess: () => setIsEditing(false),
    });
  };

  const handleReportPost = async () => {
    if (!reportReason.trim()) {
      toast({ title: 'Xəta', description: 'Şikayət səbəbini qeyd edin', variant: 'destructive' });
      return;
    }

    if (!user) {
      toast({ title: 'Xəta', description: 'Giriş etməlisiniz', variant: 'destructive' });
      return;
    }

    // Use type assertion for new table not yet in types
    const { error } = await (supabase as any)
      .from('post_reports')
      .insert({
        post_id: post.id,
        reporter_id: user.id,
        reason: reportReason,
        status: 'pending'
      });

    if (error) {
      toast({ title: 'Xəta', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Şikayət göndərildi', description: 'Şikayətiniz yoxlanılacaq' });
      setShowReportDialog(false);
      setReportReason('');
    }
  };

  // Generate deep link for app
  const appScheme = 'anacan://';
  const webFallbackUrl = `${window.location.origin}/community/post/${post.id}`;
  const appStoreUrl = 'https://apps.apple.com/app/anacan/id123456789'; // Replace with actual App Store ID
  const playStoreUrl = 'https://play.google.com/store/apps/details?id=app.lovable.e07ee1f93d5848fea7a0068ecf028173';
  
  // Deep link that tries app first, then falls back to store
  const deepLink = `${appScheme}community/post/${post.id}`;
  const universalLink = webFallbackUrl; // For iOS Universal Links

  const handleShare = async () => {
    const shareText = post.content.substring(0, 100) + (post.content.length > 100 ? '...' : '');
    hapticFeedback.medium();
    await nativeShare({
      title: 'Anacan - Paylaşım',
      text: shareText,
    });
  };


  // Try to open in app, fallback to store
  const handleOpenInApp = () => {
    // Try deep link first
    const timeout = setTimeout(() => {
      // If app didn't open after 1.5s, redirect to store
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      window.location.href = isIOS ? appStoreUrl : playStoreUrl;
    }, 1500);

    // Try to open app
    window.location.href = deepLink;
    
    // Clear timeout if page is hidden (app opened)
    window.addEventListener('pagehide', () => clearTimeout(timeout), { once: true });
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

  // Determine user badge type
  const authorBadge = post.author?.badge_type as 'admin' | 'premium' | 'moderator' | null;

  const handleAvatarClick = () => {
    if (post.user_id && onUserClick && !isAnonymous) {
      onUserClick(post.user_id);
    }
  };

  // Filter top-level comments (no parent)
  const topLevelComments = comments.filter(c => !c.parent_comment_id);

  return (
    <>
      <motion.div 
        className="bg-card rounded-xl border border-border/50 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20"
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {/* Header */}
        <div className="p-3 flex items-center gap-2">
          <motion.button onClick={handleAvatarClick} whileTap={{ scale: 0.95 }}>
            <Avatar className="w-9 h-9 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
              <AvatarImage src={post.author?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                {post.author?.name?.charAt(0) || 'İ'}
              </AvatarFallback>
            </Avatar>
          </motion.button>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <motion.button 
                onClick={handleAvatarClick}
                className="font-bold text-foreground text-xs hover:text-primary transition-colors"
                whileTap={{ scale: 0.98 }}
              >
                {post.author?.name || 'İstifadəçi'}
              </motion.button>
              <UserBadge type={authorBadge} />
            </div>
            <p className="text-[10px] text-muted-foreground">{timeAgo}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center">
                <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border z-50">
              {!isOwnPost && (
                <DropdownMenuItem onClick={() => setShowReportDialog(true)} className="text-amber-600 text-xs">
                  <Flag className="w-3.5 h-3.5 mr-1.5" />
                  Şikayət et
                </DropdownMenuItem>
              )}
              {(isAdmin || isOwnPost) && !isOwnPost && <DropdownMenuSeparator />}
              {(isAdmin || isOwnPost) && (
                <DropdownMenuItem onClick={handleDeletePost} className="text-red-600 text-xs">
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Postu Sil
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content with styled hashtags and mentions */}
        <div className="px-3 pb-2">
          <p className="text-foreground whitespace-pre-wrap text-sm">
            {post.content.split(/(\s+)/).map((word, index) => {
              if (word.startsWith('#')) {
                return (
                  <span key={index} className="text-primary font-medium cursor-pointer hover:underline">
                    {word}
                  </span>
                );
              } else if (word.startsWith('@')) {
                return (
                  <span key={index} className="text-blue-500 font-medium cursor-pointer hover:underline">
                    {word}
                  </span>
                );
              }
              return word;
            })}
          </p>
        </div>

        {/* Media Carousel */}
        {mediaItems.length > 0 && (
          <div className="px-3 pb-2">
            <MediaCarousel media={mediaItems} />
          </div>
        )}

        {/* Stats */}
        <div className="px-3 py-1.5 flex items-center gap-3 text-xs text-muted-foreground border-t border-border/50">
          <span>{post.likes_count} bəyənmə</span>
          <span>{post.comments_count} şərh</span>
        </div>

        {/* Actions */}
        <div className="px-3 py-1.5 flex items-center gap-1 border-t border-border/50">
          <motion.button
            onClick={handleLike}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
              post.is_liked ? 'text-rose-500' : 'text-muted-foreground hover:bg-muted'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <Heart className={`w-4 h-4 ${post.is_liked ? 'fill-current' : ''}`} />
            <span className="text-xs font-medium">Bəyən</span>
          </motion.button>
          <motion.button
            onClick={() => setShowComments(!showComments)}
            className="flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-muted-foreground hover:bg-muted transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-xs font-medium">Şərh</span>
            {showComments ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </motion.button>
          <motion.button
            onClick={handleShare}
            className="flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-muted-foreground hover:bg-muted transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <Share2 className="w-4 h-4" />
            <span className="text-xs font-medium">Paylaş</span>
          </motion.button>
        </div>

        {/* Comments Section with Reply System */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-border/50 overflow-hidden"
            >
              <div className="p-3 space-y-3">
                {/* Comment Input */}
                <div className="flex gap-2">
                  <Input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Şərh yaz..."
                    className="flex-1 h-9 rounded-lg text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                  />
                  <Button
                    onClick={handleComment}
                    disabled={!commentText.trim() || createComment.isPending}
                    className="w-9 h-9 rounded-lg gradient-primary p-0"
                  >
                    <Send className="w-3.5 h-3.5 text-white" />
                  </Button>
                </div>

                {/* Comments List with Reply Support */}
                {commentsLoading ? (
                  <div className="text-center py-3">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : topLevelComments.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="relative inline-block mb-2">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/10 to-pink-500/10 flex items-center justify-center">
                        <span className="text-2xl">💭</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Hələ şərh yoxdur. İlk şərhi siz yazın!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {topLevelComments.map((comment) => (
                      <CommentReply
                        key={comment.id}
                        comment={comment}
                        postId={post.id}
                        postAuthorId={post.user_id}
                        allComments={comments}
                        onRefetch={refetchComments}
                        onUserClick={onUserClick}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-md max-w-[90vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Postu Şikayət Et</DialogTitle>
            <DialogDescription>
              Bu postun niyə uyğunsuz olduğunu bildirin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              {['Spam', 'Uyğunsuz məzmun', 'Şiddət / Nifrət', 'Yanlış məlumat', 'Digər'].map((reason) => (
                <motion.button
                  key={reason}
                  onClick={() => setReportReason(reason)}
                  className={`w-full p-3 rounded-xl text-left text-sm font-medium transition-all ${
                    reportReason === reason 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted hover:bg-muted/80 text-foreground'
                  }`}
                  whileTap={{ scale: 0.98 }}
                >
                  {reason}
                </motion.button>
              ))}
            </div>
            <Button
              onClick={handleReportPost}
              disabled={!reportReason}
              className="w-full gradient-primary"
            >
              <Flag className="w-4 h-4 mr-2" />
              Şikayəti Göndər
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PostCard;
