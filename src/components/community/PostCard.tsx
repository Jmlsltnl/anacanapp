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

const getMediaType = (url: string): 'image' | 'video' => {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext)) ? 'video' : 'image';
};

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
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold ${badgeConfig.className}`}>
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

  const handleShare = async () => {
    const shareText = post.content.substring(0, 100) + (post.content.length > 100 ? '...' : '');
    hapticFeedback.medium();
    await nativeShare({
      title: 'Anacan - Paylaşım',
      text: shareText,
    });
  };

  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: az,
  });

  const mediaItems = (post.media_urls || []).map(url => ({
    url,
    type: getMediaType(url),
  }));

  const authorBadge = post.author?.badge_type as 'admin' | 'premium' | 'moderator' | null;

  const handleAvatarClick = () => {
    if (post.user_id && onUserClick && !isAnonymous) {
      onUserClick(post.user_id);
    }
  };

  const topLevelComments = comments.filter(c => !c.parent_comment_id);

  return (
    <>
      <div className="bg-card rounded-2xl border border-border/20 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-border/40">
        {/* Header */}
        <div className="p-3.5 pb-2 flex items-center gap-2.5">
          <motion.button onClick={handleAvatarClick} whileTap={{ scale: 0.95 }} disabled={isAnonymous}>
            <Avatar className={`w-10 h-10 ${isAnonymous ? '' : 'cursor-pointer ring-2 ring-transparent hover:ring-primary/30'} transition-all`}>
              {isAnonymous ? (
                <AvatarFallback className="bg-muted text-muted-foreground">
                  <EyeOff className="w-4 h-4" />
                </AvatarFallback>
              ) : (
                <>
                  <AvatarImage src={post.author?.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/15 to-accent/15 text-primary font-bold text-sm">
                    {post.author?.name?.charAt(0) || 'İ'}
                  </AvatarFallback>
                </>
              )}
            </Avatar>
          </motion.button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <motion.button
                onClick={handleAvatarClick}
                className={`font-bold text-[13px] ${isAnonymous ? 'text-muted-foreground italic' : 'text-foreground hover:text-primary'} transition-colors`}
                whileTap={{ scale: 0.98 }}
                disabled={isAnonymous}
              >
                {isAnonymous ? 'Anonim' : (post.author?.name || 'İstifadəçi')}
              </motion.button>
              {!isAnonymous && <UserBadge type={authorBadge} />}
              {isAnonymous && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-muted text-muted-foreground">
                  <EyeOff className="w-2.5 h-2.5" />
                  Anonim
                </span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">{timeAgo}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 rounded-full hover:bg-muted/60 flex items-center justify-center transition-colors">
                <MoreHorizontal className="w-4 h-4 text-muted-foreground/60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border z-50 rounded-xl">
              {isOwnPost && (
                <DropdownMenuItem onClick={() => { setEditContent(post.content); setIsEditing(true); }} className="text-foreground text-xs">
                  <Pencil className="w-3.5 h-3.5 mr-1.5" />
                  Redaktə et
                </DropdownMenuItem>
              )}
              {!isOwnPost && (
                <DropdownMenuItem onClick={() => setShowReportDialog(true)} className="text-amber-600 text-xs">
                  <Flag className="w-3.5 h-3.5 mr-1.5" />
                  Şikayət et
                </DropdownMenuItem>
              )}
              {(isAdmin || isOwnPost) && <DropdownMenuSeparator />}
              {(isAdmin || isOwnPost) && (
                <DropdownMenuItem onClick={handleDeletePost} className="text-red-600 text-xs">
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Postu Sil
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Edit Mode or Content */}
        {isEditing ? (
          <div className="px-3.5 pb-3 space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[80px] rounded-xl resize-none text-sm"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Ləğv et</Button>
              <Button size="sm" onClick={handleEditPost} disabled={!editContent.trim() || editPost.isPending} className="gradient-primary rounded-xl">
                {editPost.isPending ? 'Saxlanılır...' : 'Yadda saxla'}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Content */}
            <div className="px-3.5 pb-2.5">
              <p className="text-foreground whitespace-pre-wrap text-[13px] leading-relaxed">
                {post.content.split(/(\s+)/).map((word, index) => {
                  if (word.startsWith('#')) {
                    return (
                      <span key={index} className="text-primary font-semibold cursor-pointer hover:underline">
                        {word}
                      </span>
                    );
                  } else if (word.startsWith('@')) {
                    return (
                      <span key={index} className="text-blue-500 font-semibold cursor-pointer hover:underline">
                        {word}
                      </span>
                    );
                  }
                  return word;
                })}
              </p>
            </div>

            {/* Media */}
            {mediaItems.length > 0 && (
              <div className="px-3.5 pb-2.5">
                <MediaCarousel media={mediaItems} />
              </div>
            )}
          </>
        )}

        {/* Engagement Stats */}
        <div className="px-3.5 py-2 flex items-center gap-4 text-[11px] text-muted-foreground/60 font-medium">
          {post.likes_count > 0 && <span>{post.likes_count} bəyənmə</span>}
          {post.comments_count > 0 && <span>{post.comments_count} şərh</span>}
        </div>

        {/* Actions */}
        <div className="px-2 py-1 flex items-center border-t border-border/15">
          <motion.button
            onClick={handleLike}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              post.is_liked ? 'text-rose-500' : 'text-muted-foreground hover:bg-muted/40'
            }`}
            whileTap={{ scale: 0.92 }}
          >
            <motion.div
              animate={post.is_liked ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <Heart className={`w-[18px] h-[18px] ${post.is_liked ? 'fill-current' : ''}`} />
            </motion.div>
            <span className="text-xs font-semibold">Bəyən</span>
          </motion.button>
          <motion.button
            onClick={() => setShowComments(!showComments)}
            className="flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 text-muted-foreground hover:bg-muted/40 transition-all"
            whileTap={{ scale: 0.92 }}
          >
            <MessageCircle className="w-[18px] h-[18px]" />
            <span className="text-xs font-semibold">Şərh</span>
            {showComments ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
          </motion.button>
          <motion.button
            onClick={handleShare}
            className="flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 text-muted-foreground hover:bg-muted/40 transition-all"
            whileTap={{ scale: 0.92 }}
          >
            <Share2 className="w-[18px] h-[18px]" />
            <span className="text-xs font-semibold">Paylaş</span>
          </motion.button>
        </div>

        {/* Comments Section */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-border/15 overflow-hidden"
            >
              <div className="p-3.5 space-y-3">
                {/* Comment Input */}
                <div className="flex gap-2">
                  <Input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Şərh yaz..."
                    className="flex-1 h-9 rounded-xl text-sm bg-muted/30 border-border/30"
                    onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                  />
                  <Button
                    onClick={handleComment}
                    disabled={!commentText.trim() || createComment.isPending}
                    className="w-9 h-9 rounded-xl gradient-primary p-0"
                  >
                    <Send className="w-3.5 h-3.5 text-primary-foreground" />
                  </Button>
                </div>

                {/* Comments */}
                {commentsLoading ? (
                  <div className="text-center py-3">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : topLevelComments.length === 0 ? (
                  <div className="text-center py-5">
                    <p className="text-[11px] text-muted-foreground/60">
                      Hələ şərh yoxdur. İlk şərhi siz yazın! 💭
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
      </div>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-md max-w-[90vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Postu Şikayət Et</DialogTitle>
            <DialogDescription>
              Bu postun niyə uyğunsuz olduğunu bildirin
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Şikayət səbəbi..."
            className="rounded-xl"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowReportDialog(false)} className="rounded-xl">
              Ləğv et
            </Button>
            <Button onClick={handleReportPost} className="gradient-primary rounded-xl">
              Göndər
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PostCard;
