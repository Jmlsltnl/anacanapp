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
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-[2px] rounded-md text-[8px] font-extrabold tracking-wide uppercase ${badgeConfig.className}`}>
      <Icon className="w-2 h-2" />
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
      <motion.div
        className="bg-card rounded-[20px] border border-border/15 overflow-hidden"
        whileHover={{ y: -1 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="p-4 pb-2.5 flex items-center gap-3">
          <motion.button onClick={handleAvatarClick} whileTap={{ scale: 0.92 }} disabled={isAnonymous}>
            <Avatar className={`w-11 h-11 ${isAnonymous ? '' : 'cursor-pointer ring-[2.5px] ring-border/20 hover:ring-primary/30'} transition-all duration-300`}>
              {isAnonymous ? (
                <AvatarFallback className="bg-muted/60 text-muted-foreground">
                  <EyeOff className="w-4 h-4" />
                </AvatarFallback>
              ) : (
                <>
                  <AvatarImage src={post.author?.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/12 to-accent/12 text-primary font-black text-sm">
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
                className={`font-bold text-[13px] ${isAnonymous ? 'text-muted-foreground italic' : 'text-foreground hover:text-primary'} transition-colors duration-200`}
                whileTap={{ scale: 0.98 }}
                disabled={isAnonymous}
              >
                {isAnonymous ? 'Anonim' : (post.author?.name || 'İstifadəçi')}
              </motion.button>
              {!isAnonymous && <UserBadge type={authorBadge} />}
              {isAnonymous && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-[2px] rounded-md text-[8px] font-semibold bg-muted/50 text-muted-foreground/70">
                  <EyeOff className="w-2 h-2" />
                  Anonim
                </span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground/50 mt-0.5 font-medium">{timeAgo}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 rounded-xl hover:bg-muted/40 flex items-center justify-center transition-colors duration-200">
                <MoreHorizontal className="w-4 h-4 text-muted-foreground/40" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border/30 z-50 rounded-2xl shadow-xl min-w-[160px]">
              {isOwnPost && (
                <DropdownMenuItem onClick={() => { setEditContent(post.content); setIsEditing(true); }} className="text-foreground text-xs rounded-xl">
                  <Pencil className="w-3.5 h-3.5 mr-2" />
                  Redaktə et
                </DropdownMenuItem>
              )}
              {!isOwnPost && (
                <DropdownMenuItem onClick={() => setShowReportDialog(true)} className="text-amber-600 text-xs rounded-xl">
                  <Flag className="w-3.5 h-3.5 mr-2" />
                  Şikayət et
                </DropdownMenuItem>
              )}
              {(isAdmin || isOwnPost) && <DropdownMenuSeparator className="bg-border/20" />}
              {(isAdmin || isOwnPost) && (
                <DropdownMenuItem onClick={handleDeletePost} className="text-red-500 text-xs rounded-xl">
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  Postu Sil
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Edit Mode or Content */}
        {isEditing ? (
          <div className="px-4 pb-3 space-y-2.5">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[80px] rounded-2xl resize-none text-sm bg-muted/20 border-border/20"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="rounded-xl text-xs">Ləğv et</Button>
              <Button size="sm" onClick={handleEditPost} disabled={!editContent.trim() || editPost.isPending} className="gradient-primary rounded-xl text-xs">
                {editPost.isPending ? 'Saxlanılır...' : 'Yadda saxla'}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Content */}
            <div className="px-4 pb-3">
              <p className="text-foreground/90 whitespace-pre-wrap text-[13px] leading-[1.65]">
                {post.content.split(/(\s+)/).map((word, index) => {
                  if (word.startsWith('#')) {
                    return (
                      <span key={index} className="text-primary font-semibold cursor-pointer hover:underline decoration-primary/30 underline-offset-2">
                        {word}
                      </span>
                    );
                  } else if (word.startsWith('@')) {
                    return (
                      <span key={index} className="text-blue-500 font-semibold cursor-pointer hover:underline decoration-blue-500/30 underline-offset-2">
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
              <div className="px-4 pb-3">
                <div className="rounded-2xl overflow-hidden">
                  <MediaCarousel media={mediaItems} />
                </div>
              </div>
            )}
          </>
        )}

        {/* Engagement Stats */}
        {(post.likes_count > 0 || post.comments_count > 0) && (
          <div className="px-4 py-2 flex items-center gap-3 text-[11px] text-muted-foreground/50 font-medium">
            {post.likes_count > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-4 h-4 rounded-full bg-gradient-to-br from-rose-400 to-rose-500 flex items-center justify-center">
                  <Heart className="w-2 h-2 text-white fill-white" />
                </span>
                {post.likes_count}
              </span>
            )}
            {post.comments_count > 0 && <span>{post.comments_count} şərh</span>}
          </div>
        )}

        {/* Actions */}
        <div className="px-3 py-1.5 flex items-center border-t border-border/10">
          <motion.button
            onClick={handleLike}
            className={`flex-1 py-2.5 rounded-2xl flex items-center justify-center gap-1.5 transition-all duration-200 ${
              post.is_liked ? 'text-rose-500' : 'text-muted-foreground/60 hover:bg-muted/30'
            }`}
            whileTap={{ scale: 0.9 }}
          >
            <motion.div
              animate={post.is_liked ? { scale: [1, 1.35, 1] } : {}}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <Heart className={`w-[17px] h-[17px] ${post.is_liked ? 'fill-current' : ''}`} />
            </motion.div>
            <span className="text-[12px] font-bold">Bəyən</span>
          </motion.button>
          <motion.button
            onClick={() => setShowComments(!showComments)}
            className="flex-1 py-2.5 rounded-2xl flex items-center justify-center gap-1.5 text-muted-foreground/60 hover:bg-muted/30 transition-all duration-200"
            whileTap={{ scale: 0.9 }}
          >
            <MessageCircle className="w-[17px] h-[17px]" />
            <span className="text-[12px] font-bold">Şərh</span>
            {showComments ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </motion.button>
          <motion.button
            onClick={handleShare}
            className="flex-1 py-2.5 rounded-2xl flex items-center justify-center gap-1.5 text-muted-foreground/60 hover:bg-muted/30 transition-all duration-200"
            whileTap={{ scale: 0.9 }}
          >
            <Share2 className="w-[17px] h-[17px]" />
            <span className="text-[12px] font-bold">Paylaş</span>
          </motion.button>
        </div>

        {/* Comments Section */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="border-t border-border/10 overflow-hidden"
            >
              <div className="p-4 space-y-3">
                {/* Comment Input */}
                <div className="flex gap-2.5">
                  <Input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Şərh yaz..."
                    className="flex-1 h-10 rounded-2xl text-[13px] bg-muted/20 border-border/15 focus:border-primary/25 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.06)]"
                    onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                  />
                  <Button
                    onClick={handleComment}
                    disabled={!commentText.trim() || createComment.isPending}
                    className="w-10 h-10 rounded-2xl gradient-primary p-0 shadow-[0_2px_8px_-2px_hsl(var(--primary)/0.3)]"
                  >
                    <Send className="w-[14px] h-[14px] text-primary-foreground" />
                  </Button>
                </div>

                {/* Comments */}
                {commentsLoading ? (
                  <div className="text-center py-4">
                    <div className="w-5 h-5 border-2 border-primary/40 border-t-primary rounded-full animate-spin mx-auto" />
                  </div>
                ) : topLevelComments.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-[11px] text-muted-foreground/40 font-medium">
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
      </motion.div>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-md max-w-[90vw] rounded-3xl">
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
            className="rounded-2xl"
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
