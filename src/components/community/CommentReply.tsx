import { useState, useRef, useEffect, useMemo } from 'react';
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
  /** true = bu sətir kök şərhin DÜZLƏŞDİRİLMİŞ cavablar siyahısında göstərilir */
  isReply?: boolean;
  /** cavablar üçün: bu nəslin aid olduğu kök şərhin id-si */
  rootId?: string;
}

/**
 * Instagram-tipli DÜZ (flat) cavab görünüşü.
 *
 * ƏVVƏLKİ PROBLEM: hər cavab-səviyyəsi əlavə 38px indent alırdı (rekursiv,
 * limitsiz) — 3-4 səviyyəli mövzularda mətn sütunu 40-50px-ə qədər daralıb
 * hərf-bəhərf sətirlərə bölünürdü, "N bəyənmə" də kəsilib "bəyər" görünürdü.
 *
 * HƏLL: kök şərh özünün BÜTÜN nəslini (istənilən dərinlikdə cavaba-cavab
 * daxil) yığıb VAXTA GÖRƏ düzləşdirir, TƏK sabit indent səviyyəsi ilə göstərir
 * (Instagram/Threads məntiqi) — nə qədər dərin cavablansa da sütun genişliyi
 * DƏYİŞMİR. Verilənlər bazasında əsl parent_comment_id (kim kimə cavab verib)
 * toxunulmaz qalır — yalnız GÖRÜNÜŞ düzləşdirilir. Kökə deyil, başqa cavaba
 * cavab verilibsə, "@Ad" prefiksi ilə kontekst itirilmir.
 */
const CommentReply = ({ comment, postId, postAuthorId, allComments, onRefetch, onUserClick, isReply = false, rootId }: CommentReplyProps) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [replyAnonymous, setReplyAnonymous] = useState(false);
  const replyInputRef = useRef<HTMLInputElement>(null);
  const { isAdmin, user, profile } = useAuth();
  const { toast } = useToast();
  const createComment = useCreateComment();
  const toggleCommentLike = useToggleCommentLike();

  const effectiveRootId = rootId ?? comment.id;

  // Kökün bütün nəsli (istənilən dərinlikdə) — TƏK düzləşdirilmiş siyahı, vaxta görə sıralı
  const replies = useMemo(() => {
    if (isReply) return [];
    const collect = (parentId: string): PostComment[] => {
      const direct = allComments.filter((c) => c.parent_comment_id === parentId);
      if (direct.length === 0) return [];
      return direct.concat(direct.flatMap((c) => collect(c.id)));
    };
    return collect(comment.id).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [isReply, allComments, comment.id]);

  // Kökə yox, başqa cavaba cavabdırsa (köhnə dərin zəncirlər daxil) — "@Ad" göstər
  const repliedToName = useMemo(() => {
    if (!isReply || comment.parent_comment_id === effectiveRootId) return null;
    return allComments.find((c) => c.id === comment.parent_comment_id)?.author?.name || null;
  }, [isReply, comment.parent_comment_id, effectiveRootId, allComments]);

  // Cavab input-u açılanda: cavab sətirlərində "@Ad " ilə önqeyd et, kursoru sona apar
  useEffect(() => {
    if (showReplyInput && replyInputRef.current) {
      const el = replyInputRef.current;
      el.focus();
      const len = el.value.length;
      requestAnimationFrame(() => el.setSelectionRange(len, len));
    }
  }, [showReplyInput]);

  // Optimistic — ürək dərhal dolur, tam refetch YOXDUR (əvvəllər hər like bütün şərhləri yenidən çəkirdi)
  const handleLikeComment = () => {
    if (!user || toggleCommentLike.isPending) return;
    hapticFeedback.light();
    toggleCommentLike.mutate({ commentId: comment.id, isLiked: comment.is_liked || false, postId });
  };

  const handleOpenReplyInput = () => {
    if (!showReplyInput && isReply) {
      const name = comment.author?.name || tr("commentreply_i_stifadeci_b6bdd6", "İstifadəçi");
      setReplyText(`@${name} `);
    }
    setShowReplyInput(true);
  };

  const handleReply = async () => {
    const content = replyText.trim();
    if (!content || !user) return;
    hapticFeedback.light();
    try {
      await createComment.mutateAsync({
        postId, content, parentCommentId: comment.id, postAuthorId,
        commenterName: profile?.name || user.user_metadata?.name || tr("commentreply_i_stifadeci_b6bdd6", "\u0130stifad\u0259\xE7i"),
        isAnonymous: replyAnonymous
      });
      setReplyText('');setReplyAnonymous(false);setShowReplyInput(false);setShowReplies(true);onRefetch();
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
  const authorBadge = (comment.author?.badge_type as 'admin' | 'premium' | 'moderator' | null) || null;
  const authorVerified = isVerifiedActive(comment.author?.is_verified, comment.author?.verified_until);
  const avatarSize = isReply ? 'w-7 h-7' : 'w-9 h-9';

  return (
    <div>
      <div className="flex gap-2.5 items-start">
        {/* Avatar */}
        <motion.button onClick={handleAvatarClick} whileTap={{ scale: 0.94 }} className="flex-shrink-0">
          <Avatar className={`${avatarSize} cursor-pointer`}>
            <AvatarImage src={comment.author?.avatar_url || undefined} />
            <AvatarFallback className={`bg-primary/8 text-primary font-bold ${isReply ? 'text-[9px]' : 'text-[11px]'}`}>
              {comment.author?.name?.charAt(0) || tr("common_initial_i", "İ")}
            </AvatarFallback>
          </Avatar>
        </motion.button>

        {/* Content column: name+text flow together, meta row below */}
        <div className="flex-1 min-w-0">
          <p className="text-[12.5px] leading-[1.45] text-foreground break-words" dir="auto">
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
            {repliedToName &&
            <span className="text-primary font-semibold">@{repliedToName} </span>
            }
            <span className="text-foreground/85">{comment.content}</span>
          </p>

          {/* Meta row: time · likes · reply · (admin) delete */}
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[10.5px] text-muted-foreground/45 font-medium shrink-0">{timeAgo}</span>
            {(comment.likes_count || 0) > 0 &&
            <span className="text-[10.5px] text-muted-foreground/45 font-bold shrink-0">
                {comment.likes_count} {tr("commentreply_beyenme_sayi", "bəyənmə")}
              </span>
            }
            <button onClick={handleOpenReplyInput} className="text-[10.5px] text-muted-foreground/45 active:text-primary transition-colors font-bold shrink-0">
              {tr("commentreply_action_reply", "Cavab")}
            </button>
            {isAdmin &&
            <button onClick={handleDelete} className="text-[10.5px] text-destructive/45 hover:text-destructive font-bold ms-auto flex items-center gap-1 shrink-0">
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            }
          </div>

          {/* Reply Input */}
          <AnimatePresence>
            {showReplyInput &&
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-2 overflow-hidden">
                <div className="flex gap-2">
                  <Input ref={replyInputRef} value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder={tr("commentreply_cavab_yaz_placeholder_123456", "{username} cavab...").replace("{username}", comment.author?.name || tr("commentreply_i_stifadeci_b6bdd6", "İstifadəçi"))}
                className="flex-1 h-8 text-[11px] rounded-full bg-muted/10 border-border/10 px-3.5" onKeyPress={(e) => e.key === 'Enter' && handleReply()} />
                  <Button onClick={handleReply} disabled={!replyText.trim()} size="sm" className="h-8 w-8 rounded-full gradient-primary p-0 flex-shrink-0">
                    <Send className="w-3 h-3 text-primary-foreground" />
                  </Button>
                  <Button onClick={() => setShowReplyInput(false)} variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0 flex-shrink-0">
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyAnonymous((v) => !v)}
                  className={`a-tag${replyAnonymous ? ' on' : ''}`}
                  style={{ cursor: 'pointer', marginTop: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 999, border: replyAnonymous ? '1px solid var(--a-peach-2)' : '1px solid var(--a-ink-faint)', background: replyAnonymous ? 'var(--a-peach-2)' : 'transparent' }} />
                  {tr("postcard_anonim_olaraq_yaz_abc123", "Anonim olaraq yaz")}
                </button>
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

      {/* "N cavab göstər/gizlə" — TƏK dəfə, kök şərh üçün (cavab sətirlərinin öz alt-mövzusu yoxdur) */}
      {!isReply && replies.length > 0 &&
      <button onClick={() => setShowReplies(!showReplies)} className="ms-[46px] flex items-center gap-2.5 mt-2.5 text-[10.5px] text-muted-foreground/55 font-extrabold">
          <span className="w-6 h-px bg-border/40" />
          {showReplies ?
        tr("commentreply_cavablari_gizle", "Cavabları gizlə") :
        tr("commentreply_n_cavab_goster", "{n} cavab göstər").replace('{n}', String(replies.length))
        }
        </button>
      }

      {/* Düzləşdirilmiş cavablar — TƏK sabit indent + bağlayıcı xətt (mövzunu qruplaşdırır) */}
      <AnimatePresence>
        {!isReply && showReplies && replies.length > 0 &&
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="ms-[18px] ps-[22px] border-s-2 border-border/20 space-y-4 mt-3">
              {replies.map((reply) =>
            <CommentReply key={reply.id} comment={reply} postId={postId} postAuthorId={postAuthorId} allComments={allComments} onRefetch={onRefetch} onUserClick={onUserClick} isReply rootId={effectiveRootId} />
            )}
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </div>
  );
};

export default CommentReply;
