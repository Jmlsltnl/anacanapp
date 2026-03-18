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
    <span className={`inline-flex items-center gap-[2px] px-1 py-[1px] rounded text-[7px] font-bold ${badgeConfig.className}`}>
      <Icon className="w-[7px] h-[7px]" />
      {badgeConfig.label}
    </span>
  );
};

const CommentReply = ({ comment, postId, postAuthorId, allComments, onRefetch, onUserClick, level = 0 }: CommentReplyProps) => {
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
      toast({ title: 'Xəta', description: error.message || 'Şərh əlavə edilə bilmədi', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bu şərhi silmək istəyirsiniz?')) return;
    const { error } = await supabase.from('post_comments').delete().eq('id', comment.id);
    if (error) toast({ title: 'Xəta', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Uğurlu', description: 'Şərh silindi' }); onRefetch(); }
  };

  const handleAvatarClick = () => { if (comment.user_id && onUserClick) onUserClick(comment.user_id); };

  const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: az });
  const canReply = level < 2;

  return (
    <div className={`${level > 0 ? 'ml-7 mt-1.5' : ''}`}>
      <div className="flex gap-2">
        <motion.button onClick={handleAvatarClick} whileTap={{ scale: 0.95 }} className="flex-shrink-0 mt-0.5">
          <Avatar className={`${level === 0 ? 'w-7 h-7' : 'w-5 h-5'} cursor-pointer`}>
            <AvatarImage src={comment.author?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/8 text-primary font-bold text-[8px]">
              {comment.author?.name?.charAt(0) || 'İ'}
            </AvatarFallback>
          </Avatar>
        </motion.button>
        <div className="flex-1 min-w-0">
          <div className="bg-muted/20 rounded-xl px-2.5 py-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <motion.button onClick={handleAvatarClick} className="text-[10px] font-bold text-foreground hover:text-primary transition-colors" whileTap={{ scale: 0.98 }}>
                {comment.author?.name || 'İstifadəçi'}
              </motion.button>
              <UserBadge type={comment.author?.badge_type as any} />
              <span className="text-[8px] text-muted-foreground/35">· {timeAgo}</span>
              {isAdmin && (
                <button onClick={handleDelete} className="ml-auto text-destructive/50 hover:text-destructive p-0.5">
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
            <p className="text-[11px] text-foreground/80 mt-0.5 leading-relaxed">{comment.content}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5 mt-0.5 ml-1">
            <motion.button
              onClick={handleLikeComment} disabled={isLiking}
              className={`flex items-center gap-0.5 text-[9px] transition-colors ${comment.is_liked ? 'text-rose-500' : 'text-muted-foreground/35 active:text-rose-400'}`}
              whileTap={{ scale: 0.9 }}
            >
              <Heart className={`w-2.5 h-2.5 ${comment.is_liked ? 'fill-current' : ''}`} />
              <span>{comment.likes_count || 0}</span>
            </motion.button>
            {canReply && (
              <button onClick={() => setShowReplyInput(!showReplyInput)} className="flex items-center gap-0.5 text-[9px] text-muted-foreground/35 active:text-primary transition-colors">
                <Reply className="w-2.5 h-2.5" /> Cavab
              </button>
            )}
            {replies.length > 0 && (
              <button onClick={() => setShowReplies(!showReplies)} className="flex items-center gap-0.5 text-[9px] text-primary/70 font-semibold">
                {showReplies ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                {replies.length} cavab
              </button>
            )}
          </div>

          {/* Reply Input */}
          <AnimatePresence>
            {showReplyInput && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-1.5 overflow-hidden">
                <div className="flex gap-1.5">
                  <Input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder={`@${comment.author?.name || 'İstifadəçi'} cavab...`}
                    className="flex-1 h-7 text-[10px] rounded-lg bg-muted/15 border-border/10" onKeyPress={(e) => e.key === 'Enter' && handleReply()} />
                  <Button onClick={handleReply} disabled={!replyText.trim()} size="sm" className="h-7 w-7 rounded-lg gradient-primary p-0">
                    <Send className="w-2.5 h-2.5 text-primary-foreground" />
                  </Button>
                  <Button onClick={() => setShowReplyInput(false)} variant="ghost" size="sm" className="h-7 w-7 rounded-lg p-0">
                    <X className="w-2.5 h-2.5" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nested */}
          <AnimatePresence>
            {showReplies && replies.length > 0 && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="space-y-1 mt-1.5">
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
