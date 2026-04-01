import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, MoreHorizontal, Send, Trash2, Crown, Shield, Flag, Pencil, EyeOff } from 'lucide-react';
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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

interface PostCardProps {
  post: CommunityPost;
  groupId: string | null;
  onUserClick?: (userId: string) => void;
}

const getMediaType = (url: string): 'image' | 'video' => {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
  return videoExtensions.some(ext => url.toLowerCase().includes(ext)) ? 'video' : 'image';
};

const UserBadge = ({ type }: { type: 'admin' | 'premium' | 'moderator' | null }) => {
  if (!type) return null;
  const config = {
    admin: { label: 'Admin', icon: Shield, className: 'bg-gradient-to-r from-red-500 to-orange-500 text-white' },
    premium: { label: 'Premium', icon: Crown, className: 'bg-gradient-to-r from-amber-400 to-amber-600 text-white' },
    moderator: { label: 'Mod', icon: Shield, className: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' },
  };
  const b = config[type];
  if (!b) return null;
  const Icon = b.icon;
  return (
    <span className={`inline-flex items-center gap-[2px] px-1.5 py-[1px] rounded-md text-[7px] font-extrabold tracking-wider uppercase ${b.className}`}>
      <Icon className="w-[7px] h-[7px]" />
      {b.label}
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
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const lastTapRef = useRef(0);
  const { isAdmin, user, profile } = useAuth();
  const { toast } = useToast();

  const toggleLike = useToggleLike();
  const { data: comments = [], isLoading: commentsLoading, refetch: refetchComments } = usePostComments(post.id);
  const createComment = useCreateComment();
  const editPost = useEditPost();
  const deletePost = useDeletePost();

  const isOwnPost = user?.id === post.user_id;
  const isAnonymous = (post as any).is_anonymous === true;

  const handleLike = useCallback(() => {
    hapticFeedback.light();
    toggleLike.mutate({ postId: post.id, isLiked: post.is_liked || false, groupId });
  }, [post.id, post.is_liked, groupId]);

  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!post.is_liked) handleLike();
      setShowHeartBurst(true);
      hapticFeedback.medium();
      setTimeout(() => setShowHeartBurst(false), 900);
    }
    lastTapRef.current = now;
  }, [post.is_liked, handleLike]);

  const handleComment = () => {
    const content = commentText.trim();
    if (!content) return;
    hapticFeedback.light();
    createComment.mutate({
      postId: post.id, content, postAuthorId: post.user_id,
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
    editPost.mutate({ postId: post.id, content }, { onSuccess: () => setIsEditing(false) });
  };

  const handleReportPost = async () => {
    if (!reportReason.trim()) { toast({ title: 'Xəta', description: 'Şikayət səbəbini qeyd edin', variant: 'destructive' }); return; }
    if (!user) { toast({ title: 'Xəta', description: 'Giriş etməlisiniz', variant: 'destructive' }); return; }
    const { error } = await (supabase as any).from('post_reports').insert({ post_id: post.id, reporter_id: user.id, reason: reportReason, status: 'pending' });
    if (error) { toast({ title: 'Xəta', description: error.message, variant: 'destructive' }); }
    else { toast({ title: 'Şikayət göndərildi', description: 'Şikayətiniz yoxlanılacaq' }); setShowReportDialog(false); setReportReason(''); }
  };

  const handleShare = async () => {
    hapticFeedback.medium();
    await nativeShare({ title: 'Anacan - Paylaşım', text: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : '') });
  };

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: az });
  const mediaItems = (post.media_urls || []).map(url => ({ url, type: getMediaType(url) }));
  const authorBadge = post.author?.badge_type as 'admin' | 'premium' | 'moderator' | null;
  const handleAvatarClick = () => { if (post.user_id && onUserClick && !isAnonymous) onUserClick(post.user_id); };
  const topLevelComments = comments.filter(c => !c.parent_comment_id);

  return (
    <>
      <motion.div 
        className="bg-card rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.04)] border border-border/8 overflow-hidden"
        whileTap={{ scale: 0.995 }}
        transition={{ duration: 0.1 }}
      >
        {/* Author row */}
        <div className="px-4 pt-3.5 pb-2 flex items-center gap-3">
          <motion.button onClick={handleAvatarClick} whileTap={{ scale: 0.9 }} disabled={isAnonymous}>
            <div className="relative">
              <Avatar className={`w-10 h-10 ${isAnonymous ? '' : 'cursor-pointer ring-2 ring-border/10 hover:ring-primary/30'} transition-all`}>
                {isAnonymous ? (
                  <AvatarFallback className="bg-muted/30 text-muted-foreground/50"><EyeOff className="w-4 h-4" /></AvatarFallback>
                ) : (
                  <>
                    <AvatarImage src={post.author?.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/15 to-accent/10 text-primary font-black text-xs">{post.author?.name?.charAt(0) || 'İ'}</AvatarFallback>
                  </>
                )}
              </Avatar>
            </div>
          </motion.button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <motion.button
                onClick={handleAvatarClick}
                className={`font-bold text-[13px] leading-tight ${isAnonymous ? 'text-muted-foreground italic' : 'text-foreground hover:text-primary'} transition-colors`}
                whileTap={{ scale: 0.98 }}
                disabled={isAnonymous}
              >
                {isAnonymous ? 'Anonim' : (post.author?.name || 'İstifadəçi')}
              </motion.button>
              {!isAnonymous && <UserBadge type={authorBadge} />}
              <span className="text-[10px] text-muted-foreground/35 font-medium">· {timeAgo}</span>
            </div>
            {isAnonymous && (
              <span className="inline-flex items-center gap-[2px] px-1 py-[1px] rounded text-[7px] font-semibold bg-muted/30 text-muted-foreground/40 mt-0.5">
                <EyeOff className="w-[7px] h-[7px]" /> Anonim
              </span>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 rounded-full hover:bg-muted/40 flex items-center justify-center transition-colors">
                <MoreHorizontal className="w-4 h-4 text-muted-foreground/30" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border/20 z-50 rounded-xl shadow-xl min-w-[150px]">
              {isOwnPost && (
                <DropdownMenuItem onClick={() => { setEditContent(post.content); setIsEditing(true); }} className="text-foreground text-[11px] rounded-lg">
                  <Pencil className="w-3 h-3 mr-2" /> Redaktə et
                </DropdownMenuItem>
              )}
              {!isOwnPost && (
                <DropdownMenuItem onClick={() => setShowReportDialog(true)} className="text-amber-600 text-[11px] rounded-lg">
                  <Flag className="w-3 h-3 mr-2" /> Şikayət et
                </DropdownMenuItem>
              )}
              {(isAdmin || isOwnPost) && <DropdownMenuSeparator className="bg-border/10" />}
              {(isAdmin || isOwnPost) && (
                <DropdownMenuItem onClick={handleDeletePost} className="text-destructive text-[11px] rounded-lg">
                  <Trash2 className="w-3 h-3 mr-2" /> Sil
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content */}
        {isEditing ? (
          <div className="px-4 pb-3 space-y-2">
            <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="min-h-[70px] rounded-xl resize-none text-[13px] bg-muted/10 border-border/15" autoFocus />
            <div className="flex gap-1.5 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="rounded-lg text-[11px] h-7 px-3">Ləğv et</Button>
              <Button size="sm" onClick={handleEditPost} disabled={!editContent.trim() || editPost.isPending} className="gradient-primary rounded-lg text-[11px] h-7 px-4">
                {editPost.isPending ? '...' : 'Saxla'}
              </Button>
            </div>
          </div>
        ) : (
          <div onClick={handleDoubleTap} className="relative">
            <div className="px-4 pb-2.5">
              <p className="text-foreground/90 whitespace-pre-wrap text-[13px] leading-[1.7]">
                {post.content.split(/(\s+)/).map((word, index) => {
                  if (word.startsWith('#')) return <span key={index} className="text-primary font-semibold">{word}</span>;
                  if (word.startsWith('@')) return <span key={index} className="text-blue-500 font-semibold">{word}</span>;
                  return word;
                })}
              </p>
            </div>
            {mediaItems.length > 0 && (
              <div className="mt-1">
                <MediaCarousel media={mediaItems} />
              </div>
            )}
            {/* Heart burst animation */}
            <AnimatePresence>
              {showHeartBurst && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                >
                  <Heart className="w-20 h-20 text-rose-500 fill-rose-500 drop-shadow-lg" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Actions - Instagram style */}
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button onClick={handleLike} className="flex items-center gap-1.5" whileTap={{ scale: 0.8 }}>
              <motion.div animate={post.is_liked ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.3 }}>
                <Heart className={`w-[22px] h-[22px] transition-colors ${post.is_liked ? 'fill-rose-500 text-rose-500' : 'text-foreground/60'}`} />
              </motion.div>
              {post.likes_count > 0 && <span className={`text-[12px] font-bold ${post.is_liked ? 'text-rose-500' : 'text-foreground/50'}`}>{post.likes_count}</span>}
            </motion.button>
            <motion.button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5" whileTap={{ scale: 0.8 }}>
              <MessageCircle className={`w-[21px] h-[21px] transition-colors ${showComments ? 'text-primary' : 'text-foreground/60'}`} />
              {post.comments_count > 0 && <span className="text-[12px] font-bold text-foreground/50">{post.comments_count}</span>}
            </motion.button>
            <motion.button onClick={handleShare} whileTap={{ scale: 0.8 }}>
              <Share2 className="w-[20px] h-[20px] text-foreground/60" />
            </motion.button>
          </div>
        </div>

        {/* Comments section */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="border-t border-border/8 overflow-hidden"
            >
              <div className="p-4 space-y-3">
                <div className="flex gap-2.5">
                  <Input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Şərh yaz..."
                    className="flex-1 h-9 rounded-full text-[12px] bg-muted/15 border-border/10 px-4"
                    onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                  />
                  <Button onClick={handleComment} disabled={!commentText.trim() || createComment.isPending} className="w-9 h-9 rounded-full gradient-primary p-0">
                    <Send className="w-3.5 h-3.5 text-primary-foreground" />
                  </Button>
                </div>
                {commentsLoading ? (
                  <div className="text-center py-4">
                    <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                  </div>
                ) : topLevelComments.length === 0 ? (
                  <p className="text-center py-5 text-[11px] text-muted-foreground/30 font-medium">Hələ şərh yoxdur 💭</p>
                ) : (
                  <div className="space-y-2">
                    {topLevelComments.map((comment) => (
                      <CommentReply key={comment.id} comment={comment} postId={post.id} postAuthorId={post.user_id} allComments={comments} onRefetch={refetchComments} onUserClick={onUserClick} />
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
            <DialogTitle className="text-sm">Postu Şikayət Et</DialogTitle>
            <DialogDescription className="text-xs">Bu postun niyə uyğunsuz olduğunu bildirin</DialogDescription>
          </DialogHeader>
          <Textarea value={reportReason} onChange={(e) => setReportReason(e.target.value)} placeholder="Şikayət səbəbi..." className="rounded-xl text-sm" />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowReportDialog(false)} className="rounded-lg text-xs h-8">Ləğv et</Button>
            <Button onClick={handleReportPost} className="gradient-primary rounded-lg text-xs h-8">Göndər</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PostCard;
