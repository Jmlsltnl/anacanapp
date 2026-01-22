import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, MoreHorizontal, ChevronDown, ChevronUp, Send, Trash2, Crown, Shield, Copy, Check, Flag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { az } from 'date-fns/locale';
import { CommunityPost, useToggleLike, usePostComments, useCreateComment } from '@/hooks/useCommunity';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { hapticFeedback } from '@/lib/native';
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
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();

  const toggleLike = useToggleLike();
  const { data: comments = [], isLoading: commentsLoading, refetch: refetchComments } = usePostComments(post.id);
  const createComment = useCreateComment();
  
  const isOwnPost = user?.id === post.user_id;

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

  const handleDeletePost = async () => {
    if (!confirm('Bu postu silmək istəyirsiniz?')) return;
    
    const { error } = await supabase
      .from('community_posts')
      .delete()
      .eq('id', post.id);

    if (error) {
      toast({ title: 'Xəta', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Uğurlu', description: 'Post silindi' });
    }
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
    hapticFeedback.light();
    
    // Use universal link for sharing (works with deep linking)
    const shareUrl = webFallbackUrl;
    const shareText = `${post.author?.name || 'İstifadəçi'} paylaşdı: ${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}`;
    
    // Check if native share is available
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Anacan - Paylaşım',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed, show dialog instead
        if ((err as Error).name !== 'AbortError') {
          setShowShareDialog(true);
        }
      }
    } else {
      // Fallback to custom share dialog
      setShowShareDialog(true);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(webFallbackUrl);
      setLinkCopied(true);
      hapticFeedback.medium();
      toast({ title: 'Link kopyalandı!' });
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      toast({ title: 'Xəta', description: 'Link kopyalana bilmədi', variant: 'destructive' });
    }
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
    if (post.user_id && onUserClick) {
      onUserClick(post.user_id);
    }
  };

  // Filter top-level comments (no parent)
  const topLevelComments = comments.filter(c => !c.parent_comment_id);

  return (
    <>
      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
        {/* Header */}
        <div className="p-4 flex items-center gap-3">
          <motion.button onClick={handleAvatarClick} whileTap={{ scale: 0.95 }}>
            <Avatar className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
              <AvatarImage src={post.author?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {post.author?.name?.charAt(0) || 'İ'}
              </AvatarFallback>
            </Avatar>
          </motion.button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <motion.button 
                onClick={handleAvatarClick}
                className="font-bold text-foreground text-sm hover:text-primary transition-colors"
                whileTap={{ scale: 0.98 }}
              >
                {post.author?.name || 'İstifadəçi'}
              </motion.button>
              <UserBadge type={authorBadge} />
            </div>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center">
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border z-50">
              {!isOwnPost && (
                <DropdownMenuItem onClick={() => setShowReportDialog(true)} className="text-amber-600">
                  <Flag className="w-4 h-4 mr-2" />
                  Şikayət et
                </DropdownMenuItem>
              )}
              {(isAdmin || isOwnPost) && !isOwnPost && <DropdownMenuSeparator />}
              {(isAdmin || isOwnPost) && (
                <DropdownMenuItem onClick={handleDeletePost} className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Postu Sil
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content with styled hashtags and mentions */}
        <div className="px-4 pb-3">
          <p className="text-foreground whitespace-pre-wrap">
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
            onClick={handleShare}
            className="flex-1 py-2 rounded-xl flex items-center justify-center gap-2 text-muted-foreground hover:bg-muted transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <Share2 className="w-5 h-5" />
            <span className="text-sm font-medium">Paylaş</span>
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

                {/* Comments List with Reply Support */}
                {commentsLoading ? (
                  <div className="text-center py-4">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : topLevelComments.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-2">
                    Hələ şərh yoxdur
                  </p>
                ) : (
                  <div className="space-y-3">
                    {topLevelComments.map((comment) => (
                      <CommentReply
                        key={comment.id}
                        comment={comment}
                        postId={post.id}
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
      </div>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md max-w-[90vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">Postu Paylaş</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Copy Link */}
            <div className="flex items-center gap-2">
              <Input
                value={webFallbackUrl}
                readOnly
                className="flex-1 text-sm"
              />
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="shrink-0"
              >
                {linkCopied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Open in App button */}
            <Button
              onClick={handleOpenInApp}
              className="w-full gradient-primary"
            >
              📱 Tətbiqdə Aç
            </Button>

            {/* Social Share Buttons */}
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(post.content.substring(0, 50) + '... ' + webFallbackUrl)}`, '_blank')}
                className="flex-1"
              >
                WhatsApp
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(webFallbackUrl)}&text=${encodeURIComponent(post.content.substring(0, 50))}`, '_blank')}
                className="flex-1"
              >
                Telegram
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
