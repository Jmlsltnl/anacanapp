import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Heart, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getCurrentDateLocale } from '@/lib/date-utils';
import { PostComment, useCreateComment, useToggleCommentLike } from '@/hooks/useCommunity';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { hapticFeedback } from '@/lib/native';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserBadge, VerifiedTick, isVerifiedActive } from './UserBadge';
import { tr } from "@/lib/tr";

interface CommentReplyProps {
  comment: PostComment;
  postId: string;
  postAuthorId: string;
  allComments: PostComment[];
  onRefetch: () => void;
  onUserClick?: (userId: string) => void;
  level?: number;
}

// Instagram-tipli düz siyahı görünüşü: ad + mətn eyni paraqrafda axır, meta
// sətri (vaxt · bəyənmə · Cavab ver) altında, ürək düyməsi sağda ayrıca.
const CommentReply = ({ comment, postId, postAuthorId, allComments, onRefetch, onUserClick, level = 0 }: CommentReplyProps) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showReplies, setShowReplies] = useState(level === 0);
  const [replyText, setReplyText] = useState('');
  const { isAdmin, user, profile } = useAuth();
  const { toast } = useToast();
  const createComment = useCreateComment();
  const toggleCommentLike = useToggleCommentLike();
  const replies = allComments.filter((c) => c.parent_comment_id === comment.id);

  // Optimistic — ürək dərhal dolur, tam refetch YOXDUR (əvvəllər hər like bütün şərhləri yenidən çəkirdi)
  const handleLikeComment = () => {
    if (!user || toggleCommentLike.isPending) return;
    hapticFeedback.light();
    toggleCommentLike.mutate({ commentId: comment.id, isLiked: comment.is_liked || false, postId });
  };

  const handleReply = async () => {
    const content = replyText.trim();
    if (!content || !user) return;
    hapticFeedback.light();
    try {
      await createComment.mutateAsync({
        postId, content, parentCommentId: comment.id, postAuthorId,
        commenterName: profile?.name || user.user_metadata?.name || tr("commentreply_i_stifadeci_b6bdd6", "\u0130stifad\u0259\xE7i")
      });
      setReplyText('');setShowReplyInput(false);setShowReplies(true);onRefetch();
    } catch (error: any) {
      toast({ title: tr("commentreply_xeta_3cdbb6", 'Xəta'), description: error.message || tr("commentreply_serh_elave_edile_bilmedi_8925d3", "\u015E\u0259rh \u0259lav\u0259 edil\u0259 bilm\u0259di"), variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!confirm(tr("commentreply_bu_serhi_silmek_isteyirsiniz_fc50c9", "Bu \u015F\u0259rhi silm\u0259k ist\u0259yirsiniz?"))) return;
    const { error } = await supabase.from('post_comments').delete().eq('id', comment.id);
    if (error) toast({ title: tr("commentreply_xeta_3cdbb6", 'Xəta'), description: error.message, variant: 'destructive' });else
    {toast({ title: tr("commentreply_ugurlu_7fe64c", 'Uğurlu'), description: tr("commentreply_serh_silindi_59cfe5", 'Şərh silindi') });onRefetch();}
  };

  const handleAvatarClick = () => {if (comment.user_id && onUserClick) onUserClick(comment.user_id);};
  const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: getCurrentDateLocale() });
  const canReply = level < 2;
  const authorBadge = (comment.author?.badge_type as 'admin' | 'premium' | 'moderator' | null) || null;
  const authorVerified = isVerifiedActive(comment.author?.is_verified, comment.author?.verified_until);
  const avatarSize = level === 0 ? 'w-8 h-8' : 'w-6 h-6';

  return (
    <div className={level > 0 ? 'ms-[38px]' : ''}>
      <div className="flex gap-2.5 items-start">
        {/* Avatar */}
        <motion.button onClick={handleAvatarClick} whileTap={{ scale: 0.94 }} className="flex-shrink-0">
          <Avatar className={`${avatarSize} cursor-pointer`}>
            <AvatarImage src={comment.author?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/8 text-primary font-bold text-[9px]">
              {comment.author?.name?.charAt(0) || tr("common_initial_i", "İ")}
            </AvatarFallback>
          </Avatar>
        </motion.button>

        {/* Content column: name+text flow together, meta row below */}
        <div className="flex-1 min-w-0">
          <p className="text-[12.5px] leading-[1.45] text-foreground" dir="auto">
            <motion.button
              onClick={handleAvatarClick}
              whileTap={{ scale: 0.98 }}
              className="font-bold text-foreground align-baseline">
              {comment.author?.name || tr("commentreply_i_stifadeci_b6bdd6", "\u0130stifad\u0259\xE7i")}
            </motion.button>
            {authorVerified &&
            <span className="inline-flex align-middle mx-1" style={{ transform: 'translateY(-1px)' }}>
                <VerifiedTick size={11} />
              </span>
            }
            {authorBadge &&
            <span className="inline-flex align-middle ms-1 mb-0.5">
                <UserBadge type={authorBadge} />
              </span>
            }
            {' '}
            <span className="text-foreground/85">{comment.content}</span>
          </p>

          {/* Meta row: time · likes · reply · (admin) delete */}
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[10.5px] text-muted-foreground/45 font-medium">{timeAgo}</span>
            {(comment.likes_count || 0) > 0 &&
            <span className="text-[10.5px] text-muted-foreground/45 font-bold">
                {comment.likes_count} {tr("commentreply_beyenme_sayi", "bəyənmə")}
              </span>
            }
            {canReply &&
            <button onClick={() => setShowReplyInput(!showReplyInput)} className="text-[10.5px] text-muted-foreground/45 active:text-primary transition-colors font-bold">
                {tr("commentreply_action_reply", "Cavab")}
              </button>
            }
            {isAdmin &&
            <button onClick={handleDelete} className="text-[10.5px] text-destructive/45 hover:text-destructive font-bold ms-auto flex items-center gap-1">
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            }
          </div>

          {/* Reply Input */}
          <AnimatePresence>
            {showReplyInput &&
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-2 overflow-hidden">
                <div className="flex gap-2">
                  <Input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder={tr("commentreply_cavab_yaz_placeholder_123456", "{username} cavab...").replace("{username}", comment.author?.name || tr("commentreply_i_stifadeci_b6bdd6", "İstifadəçi"))}
                className="flex-1 h-8 text-[11px] rounded-full bg-muted/10 border-border/10 px-3.5" onKeyPress={(e) => e.key === 'Enter' && handleReply()} />
                  <Button onClick={handleReply} disabled={!replyText.trim()} size="sm" className="h-8 w-8 rounded-full gradient-primary p-0">
                    <Send className="w-3 h-3 text-primary-foreground" />
                  </Button>
                  <Button onClick={() => setShowReplyInput(false)} variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0">
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            }
          </AnimatePresence>

          {/* "View N replies" toggle — Instagram-style short line + label */}
          {replies.length > 0 &&
          <button onClick={() => setShowReplies(!showReplies)} className="flex items-center gap-2.5 mt-2.5 text-[10.5px] text-muted-foreground/55 font-extrabold">
              <span className="w-6 h-px bg-border/40" />
              {showReplies ?
            tr("commentreply_cavablari_gizle", "Cavabları gizlə") :
            tr("commentreply_n_cavab_goster", "{n} cavab göstər").replace('{n}', String(replies.length))
            }
            </button>
          }

          {/* Nested replies */}
          <AnimatePresence>
            {showReplies && replies.length > 0 &&
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="space-y-3 mt-3">
                  {replies.map((reply) =>
                <CommentReply key={reply.id} comment={reply} postId={postId} postAuthorId={postAuthorId} allComments={allComments} onRefetch={onRefetch} onUserClick={onUserClick} level={level + 1} />
                )}
                </div>
              </motion.div>
            }
          </AnimatePresence>
        </div>

        {/* Like heart — sağda, Instagram məntiqi */}
        <motion.button
          onClick={handleLikeComment}
          whileTap={{ scale: 0.8 }}
          className="flex-shrink-0 pt-1"
          aria-label={tr("commentreply_beyen", "Bəyən")}>
          <Heart
            className={`w-3 h-3 transition-colors ${comment.is_liked ? 'text-rose-500 fill-current' : 'text-muted-foreground/30 active:text-rose-400'}`} />
        </motion.button>
      </div>
    </div>
  );
};

export default CommentReply;
