import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reply, Send, X, Heart, Trash2, ChevronDown, ChevronUp, Crown, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { az } from 'date-fns/locale';
import { PostComment, useCreateComment } from '@/hooks/useCommunity';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { hapticFeedback } from '@/lib/native';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from "@/hooks/useTranslation";

interface CommentReplyProps {
  comment: PostComment;
  postId: string;
  postAuthorId: string;
  allComments: PostComment[];
  onRefetch: () => void;
  onUserClick?: (userId: string) => void;
  level?: number;
}

const UserBadge = ({ type }: { type: 'admin' | 'premium' | 'moderator' | null }) => {
  const { t } = useTranslation();
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
    <span className={`inline-flex items-center gap-[2px] px-1 py-[1px] rounded text-[7px] font-bold ${b.className}`}>
      <Icon className="w-[7px] h-[7px]" />{b.label}
    </span>
  );
};

const CommentReply = ({ comment, postId, postAuthorId, allComments, onRefetch, onUserClick, level = 0 }: CommentReplyProps) => {
  const { t } = useTranslation();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showReplies, setShowReplies] = useState(level === 0);
  const [replyText, setReplyText] = useState('');
  const [isLiking, setIsLiking] = useState(false);
  const { isAdmin, user, profile } = useAuth();
  const { toast } = useToast();
  const createComment = useCreateComment();
  const replies = allComments.filter(c => c.parent_comment_id === comment.id);

  const handleLikeComment = async () => {
    if (!user || isLiking) return;
    hapticFeedback.light();
    setIsLiking(true);
    try {
      if (comment.is_liked) {
        await supabase.from('comment_likes').delete().eq('comment_id', comment.id).eq('user_id', user.id);
      } else {
        await supabase.from('comment_likes').insert({ comment_id: comment.id, user_id: user.id });
      }
      onRefetch();
    } catch (error) {
      console.error('Like error:', error);
    } finally { setIsLiking(false); }
  };

  const handleReply = async () => {
    const content = replyText.trim();
    if (!content || !user) return;
    hapticFeedback.light();
    try {
      await createComment.mutateAsync({
        postId, content, parentCommentId: comment.id, postAuthorId,
        commenterName: profile?.name || user.user_metadata?.name || 'İstifadəçi',
      });
      setReplyText(''); setShowReplyInput(false); onRefetch();
    } catch (error: any) {
      toast({ title: t("commentreply_xeta_3cdbb6", 'Xəta'), description: error.message || 'Şərh əlavə edilə bilmədi', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bu şərhi silmək istəyirsiniz?')) return;
    const { error } = await supabase.from('post_comments').delete().eq('id', comment.id);
    if (error) toast({ title: t("commentreply_xeta_3cdbb6", 'Xəta'), description: error.message, variant: 'destructive' });
    else { toast({ title: t("commentreply_ugurlu_7fe64c", 'Uğurlu'), description: t("commentreply_serh_silindi_59cfe5", 'Şərh silindi') }); onRefetch(); }
  };

  const handleAvatarClick = () => { if (comment.user_id && onUserClick) onUserClick(comment.user_id); };
  const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: az });
  const canReply = level < 2;

  return (
    <div className={`relative ${level > 0 ? 'ml-8' : ''}`}>
      {/* Thread line */}
      {level > 0 && (
        <div className="absolute left-[-16px] top-0 bottom-0 w-[2px] bg-border/10 rounded-full" />
      )}
      <div className="flex gap-2.5">
        <motion.button onClick={handleAvatarClick} whileTap={{ scale: 0.95 }} className="flex-shrink-0 mt-1">
          <Avatar className={`${level === 0 ? 'w-8 h-8' : 'w-6 h-6'} cursor-pointer`}>
            <AvatarImage src={comment.author?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/8 text-primary font-bold text-[8px]">
              {comment.author?.name?.charAt(0) || 'İ'}
            </AvatarFallback>
          </Avatar>
        </motion.button>
        <div className="flex-1 min-w-0">
          <div className="bg-muted/12 rounded-2xl px-3 py-2.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <motion.button onClick={handleAvatarClick} className="text-[11px] font-bold text-foreground hover:text-primary transition-colors" whileTap={{ scale: 0.98 }}>
                {comment.author?.name || 'İstifadəçi'}
              </motion.button>
              <UserBadge type={comment.author?.badge_type as any} />
              <span className="text-[8px] text-muted-foreground/30">· {timeAgo}</span>
              {isAdmin && (
                <button onClick={handleDelete} className="ml-auto text-destructive/40 hover:text-destructive p-0.5">
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
            <p className="text-[12px] text-foreground/80 mt-1 leading-relaxed">{comment.content}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-1 ml-2">
            <motion.button
              onClick={handleLikeComment} disabled={isLiking}
              className={`flex items-center gap-0.5 text-[9px] transition-colors ${comment.is_liked ? 'text-rose-500' : 'text-muted-foreground/30 active:text-rose-400'}`}
              whileTap={{ scale: 0.85 }}
            >
              <Heart className={`w-3 h-3 ${comment.is_liked ? 'fill-current' : ''}`} />
              {(comment.likes_count || 0) > 0 && <span>{comment.likes_count}</span>}
            </motion.button>
            {canReply && (
              <button onClick={() => setShowReplyInput(!showReplyInput)} className="text-[9px] text-muted-foreground/30 active:text-primary transition-colors font-semibold">
                Cavab
              </button>
            )}
            {replies.length > 0 && (
              <button onClick={() => setShowReplies(!showReplies)} className="flex items-center gap-0.5 text-[9px] text-primary/60 font-bold">
                {showReplies ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                {replies.length} cavab
              </button>
            )}
          </div>

          {/* Reply Input */}
          <AnimatePresence>
            {showReplyInput && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-2 overflow-hidden">
                <div className="flex gap-2">
                  <Input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder={`@${comment.author?.name || 'İstifadəçi'} cavab...`}
                    className="flex-1 h-8 text-[11px] rounded-full bg-muted/10 border-border/10 px-3.5" onKeyPress={(e) => e.key === 'Enter' && handleReply()} />
                  <Button onClick={handleReply} disabled={!replyText.trim()} size="sm" className="h-8 w-8 rounded-full gradient-primary p-0">
                    <Send className="w-3 h-3 text-primary-foreground" />
                  </Button>
                  <Button onClick={() => setShowReplyInput(false)} variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0">
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nested replies */}
          <AnimatePresence>
            {showReplies && replies.length > 0 && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="space-y-2 mt-2">
                  {replies.map((reply) => (
                    <CommentReply key={reply.id} comment={reply} postId={postId} postAuthorId={postAuthorId} allComments={allComments} onRefetch={onRefetch} onUserClick={onUserClick} level={level + 1} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default CommentReply;
