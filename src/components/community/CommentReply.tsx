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
  allComments: PostComment[];
  onRefetch: () => void;
  level?: number;
}

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

const CommentReply = ({ comment, postId, allComments, onRefetch, level = 0 }: CommentReplyProps) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showReplies, setShowReplies] = useState(level === 0);
  const [replyText, setReplyText] = useState('');
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const createComment = useCreateComment();

  // Get replies to this comment
  const replies = allComments.filter(c => c.parent_comment_id === comment.id);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    hapticFeedback.light();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        parent_comment_id: comment.id,
        content: replyText.trim(),
      });

    if (error) {
      toast({ title: 'Xəta', description: error.message, variant: 'destructive' });
    } else {
      setReplyText('');
      setShowReplyInput(false);
      onRefetch();
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bu şərhi silmək istəyirsiniz?')) return;
    
    const { error } = await supabase
      .from('post_comments')
      .delete()
      .eq('id', comment.id);

    if (error) {
      toast({ title: 'Xəta', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Uğurlu', description: 'Şərh silindi' });
      onRefetch();
    }
  };

  const timeAgo = formatDistanceToNow(new Date(comment.created_at), {
    addSuffix: true,
    locale: az,
  });

  // Limit nesting to 2 levels
  const canReply = level < 2;

  return (
    <div className={`${level > 0 ? 'ml-8 mt-2' : ''}`}>
      <div className="flex gap-3">
        <Avatar className={level === 0 ? 'w-8 h-8' : 'w-6 h-6'}>
          <AvatarImage src={comment.author?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
            {comment.author?.name?.charAt(0) || 'İ'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="bg-muted rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-foreground">{comment.author?.name}</span>
                <UserBadge type={comment.author?.badge_type as any} />
                <span className="text-xs text-muted-foreground">· {timeAgo}</span>
              </div>
              {isAdmin && (
                <button
                  onClick={handleDelete}
                  className="text-red-500 hover:text-red-600 p-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
            <p className="text-sm text-foreground mt-1">{comment.content}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-1 ml-1">
            <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
              <Heart className="w-3 h-3" />
              <span>{comment.likes_count || 0}</span>
            </button>
            {canReply && (
              <button
                onClick={() => setShowReplyInput(!showReplyInput)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <Reply className="w-3 h-3" />
                <span>Cavab</span>
              </button>
            )}
            {replies.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-1 text-xs text-primary font-medium"
              >
                {showReplies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                <span>{replies.length} cavab</span>
              </button>
            )}
          </div>

          {/* Reply Input */}
          <AnimatePresence>
            {showReplyInput && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-2 overflow-hidden"
              >
                <div className="flex gap-2">
                  <Input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`@${comment.author?.name || 'İstifadəçi'} cavab yaz...`}
                    className="flex-1 h-9 text-sm rounded-lg"
                    onKeyPress={(e) => e.key === 'Enter' && handleReply()}
                  />
                  <Button
                    onClick={handleReply}
                    disabled={!replyText.trim()}
                    size="sm"
                    className="h-9 w-9 rounded-lg gradient-primary p-0"
                  >
                    <Send className="w-3 h-3 text-white" />
                  </Button>
                  <Button
                    onClick={() => setShowReplyInput(false)}
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 rounded-lg p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nested Replies */}
          <AnimatePresence>
            {showReplies && replies.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 mt-2">
                  {replies.map((reply) => (
                    <CommentReply
                      key={reply.id}
                      comment={reply}
                      postId={postId}
                      allComments={allComments}
                      onRefetch={onRefetch}
                      level={level + 1}
                    />
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
