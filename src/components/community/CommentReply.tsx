import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Heart, Trash2, Pencil, ImagePlus, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getCurrentDateLocale } from '@/lib/date-utils';
import { PostComment, useCreateComment, useToggleCommentLike, useEditComment, useDeleteComment } from '@/hooks/useCommunity';
import { useAutoGrowTextarea } from '@/hooks/useAutoGrowTextarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { hapticFeedback } from '@/lib/native';
import { useAuth } from '@/hooks/useAuth';
import PhotoGalleryViewer from '@/components/PhotoGalleryViewer';
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
  /** Bildiriş/deep-link vasitəsilə açılanda: bu ID-li şərhi/cavabı tapıb vurğula + ekrana sürüşdür */
  highlightCommentId?: string | null;
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
const CommentReply = ({ comment, postId, postAuthorId, allComments, onRefetch, onUserClick, isReply = false, rootId, highlightCommentId }: CommentReplyProps) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const isHighlighted = !!highlightCommentId && comment.id === highlightCommentId;
  const rowRef = useRef<HTMLDivElement>(null);

  // Bildiriş/deep-link ilə açılan konkret şərhə avtomatik sürüşdür — istifadəçi
  // uzun bir mövzuda hansı şərhin nəzərdə tutulduğunu axtarmasın.
  useEffect(() => {
    if (isHighlighted && rowRef.current) {
      const t = setTimeout(() => {
        rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 250);
      return () => clearTimeout(t);
    }
  }, [isHighlighted]);
  const [showReplies, setShowReplies] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [replyAnonymous, setReplyAnonymous] = useState(false);
  // Cavaba şəkil əlavə etmə — PostCard.tsx-in şərh composer-i ilə eyni pattern
  const [replyImageFile, setReplyImageFile] = useState<File | null>(null);
  const [replyImagePreview, setReplyImagePreview] = useState<string | null>(null);
  const [uploadingReplyImage, setUploadingReplyImage] = useState(false);
  // Şərh şəkli in-app lightbox-da açılır (əvvəl window.open ilə brauzerə çıxırdı)
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const replyFileInputRef = useRef<HTMLInputElement>(null);
  // Öz şərhini redaktə etmə — PostCard.tsx-in post-redaktə pattern-i ilə eyni
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [editImageUrl, setEditImageUrl] = useState<string | null | undefined>(comment.image_url);
  const { ref: replyInputRef } = useAutoGrowTextarea(replyText, 90);
  const { isAdmin, user, profile } = useAuth();
  const { toast } = useToast();
  const createComment = useCreateComment();
  const editComment = useEditComment();
  const deleteComment = useDeleteComment();
  const toggleCommentLike = useToggleCommentLike();

  const isOwnComment = user?.id === comment.user_id;
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
    // DÜZƏLİŞ: əvvəllər burada "@Ad " mətn kimi input-a əlavə edilirdi, AMMA
    // render zamanı `repliedToName` artıq eyni adı parent_comment_id-dən
    // MÜSTƏQİL şəkildə tapıb göstərir (aşağıda) — nəticədə ad İKİ DƏFƏ
    // görünürdü (bir dəfə etiketli/vurğulanmış, bir dəfə isə content-in
    // içində sadə mətn kimi). İndi YALNIZ render-side "@Ad" saxlanılır —
    // input placeholder-i ("{Ad} cavab...") artıq kontekst üçün kifayətdir.
    setShowReplyInput(true);
  };

  const handleReplyImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = '';
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: tr("createpostscreen_fayl_cox_boyukdur_f5cf61", 'Fayl çox böyükdür'), description: 'Max 10MB', variant: 'destructive' });
      return;
    }
    setReplyImageFile(file);
    setReplyImagePreview(URL.createObjectURL(file));
  };

  const uploadCommentImage = async (file: File): Promise<string> => {
    if (!user) throw new Error('Not authenticated');
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { error } = await supabase.storage.from('community-media').upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (error) throw new Error(`${tr("community_file_upload_failed", "Fayl yüklənə bilmədi:")} ${error.message}`);
    const { data: { publicUrl } } = supabase.storage.from('community-media').getPublicUrl(fileName);
    return publicUrl;
  };

  const handleReply = async () => {
    const content = replyText.trim();
    if ((!content && !replyImageFile) || !user) return;
    hapticFeedback.light();

    let imageUrl: string | null = null;
    if (replyImageFile) {
      setUploadingReplyImage(true);
      try {
        imageUrl = await uploadCommentImage(replyImageFile);
      } catch (e: any) {
        setUploadingReplyImage(false);
        toast({ title: tr("commentreply_xeta_3cdbb6", 'Xəta'), description: e?.message, variant: 'destructive' });
        return;
      }
      setUploadingReplyImage(false);
    }

    try {
      await createComment.mutateAsync({
        postId, content, imageUrl, parentCommentId: comment.id, postAuthorId,
        commenterName: profile?.name || user.user_metadata?.name || tr("commentreply_i_stifadeci_b6bdd6", "\u0130stifad\u0259\xE7i"),
        isAnonymous: replyAnonymous
      });
      setReplyText('');setReplyAnonymous(false);setReplyImageFile(null);setReplyImagePreview(null);setShowReplyInput(false);setShowReplies(true);onRefetch();
    } catch (error: any) {
      toast({ title: tr("commentreply_xeta_3cdbb6", 'Xəta'), description: error.message || tr("commentreply_serh_elave_edile_bilmedi_8925d3", "\u015E\u0259rh \u0259lav\u0259 edil\u0259 bilm\u0259di"), variant: 'destructive' });
    }
  };

  // DÜZƏLİŞ: əvvəllər burada xam supabase.delete() (sahiblik yoxlaması olmadan)
  // çağırılırdı və düymə YALNIZ admin üçün göstərilirdi — adi istifadəçi öz
  // şərhini silə bilmirdi. İndi useDeleteComment (RLS-ə əsaslanan) istifadə
  // olunur, düymə həm admin, həm də şərhin sahibi üçün göstərilir.
  const handleDelete = async () => {
    if (!confirm(tr("commentreply_bu_serhi_silmek_isteyirsiniz_fc50c9", "Bu \u015F\u0259rhi silm\u0259k ist\u0259yirsiniz?"))) return;
    deleteComment.mutate({ commentId: comment.id, postId }, { onSuccess: onRefetch });
  };

  const handleEditComment = () => {
    const content = editContent.trim();
    if (!content) return;
    hapticFeedback.light();
    editComment.mutate(
      { commentId: comment.id, content, postId, imageUrl: editImageUrl },
      { onSuccess: () => setIsEditing(false) }
    );
  };

  const handleAvatarClick = () => {if (comment.user_id && onUserClick) onUserClick(comment.user_id);};
  const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: getCurrentDateLocale() });
  const authorBadge = (comment.author?.badge_type as 'admin' | 'premium' | 'moderator' | null) || null;
  const authorVerified = isVerifiedActive(comment.author?.is_verified, comment.author?.verified_until);
  const avatarSize = isReply ? 'w-7 h-7' : 'w-9 h-9';

  return (
    <div
      ref={rowRef}
      style={isHighlighted ? {
        background: 'var(--a-peach-1)',
        borderRadius: 14,
        padding: '8px 8px',
        margin: '-8px -8px 0',
        transition: 'background 1.5s ease-out',
      } : undefined}
    >
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
          {isEditing ?
          <div className="space-y-1.5">
              {editImageUrl &&
            <div style={{ position: 'relative', width: 56, height: 56 }}>
                  <img src={editImageUrl} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover' }} />
                  <button
                type="button"
                onClick={() => setEditImageUrl(null)}
                style={{ position: 'absolute', top: -5, insetInlineEnd: -5, width: 18, height: 18, borderRadius: 999, background: 'var(--a-ink)', color: 'var(--a-bg)', display: 'grid', placeItems: 'center', border: 'none', cursor: 'pointer' }}>
                    <X size={10} />
                  </button>
                </div>
            }
              <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[52px] rounded-xl resize-none text-[12.5px]"
              style={{ background: 'var(--a-surface-soft)', border: '1px solid var(--a-line-strong)', color: 'var(--a-ink)' }}
              autoFocus />
              <div className="flex gap-1.5 justify-end">
                <button onClick={() => { setIsEditing(false); setEditContent(comment.content); setEditImageUrl(comment.image_url); }} className="a-tag" style={{ cursor: 'pointer' }}>
                  {tr("postcard_legv_et_b5e49c", "Ləğv et")}
                </button>
                <button onClick={handleEditComment} disabled={!editContent.trim() || editComment.isPending} className="a-btn-solid">
                  {editComment.isPending ? '...' : tr("common_saxla", "Saxla")}
                </button>
              </div>
            </div> :

          <>
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
              {comment.image_url &&
            <img
              src={comment.image_url}
              alt=""
              style={{ maxWidth: 160, maxHeight: 160, borderRadius: 12, objectFit: 'cover', marginTop: 6, display: 'block', cursor: 'pointer' }}
              onClick={() => setImageViewerOpen(true)} />
            }
            </>
          }

          {/* Meta row: time · likes · reply · (own) edit · (admin/own) delete */}
          {!isEditing &&
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
              {isOwnComment &&
            <button
              onClick={() => { setEditContent(comment.content); setEditImageUrl(comment.image_url); setIsEditing(true); }}
              className="text-[10.5px] text-muted-foreground/45 active:text-primary transition-colors font-bold shrink-0 flex items-center gap-1">
                  <Pencil className="w-2.5 h-2.5" />
                </button>
            }
              {(isAdmin || isOwnComment) &&
            <button onClick={handleDelete} className="text-[10.5px] text-destructive/45 hover:text-destructive font-bold ms-auto flex items-center gap-1 shrink-0">
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
            }
            </div>
          }

          {/* Reply Input */}
          <AnimatePresence>
            {showReplyInput &&
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-2 overflow-hidden">
                {replyImagePreview &&
              <div style={{ position: 'relative', width: 56, height: 56, marginBottom: 6 }}>
                    <img src={replyImagePreview} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover' }} />
                    <button
                  type="button"
                  onClick={() => { setReplyImageFile(null); setReplyImagePreview(null); }}
                  style={{ position: 'absolute', top: -5, insetInlineEnd: -5, width: 18, height: 18, borderRadius: 999, background: 'var(--a-ink)', color: 'var(--a-bg)', display: 'grid', placeItems: 'center', border: 'none', cursor: 'pointer' }}>
                      <X size={10} />
                    </button>
                  </div>
              }
                <div className="flex gap-2 items-end">
                  <input type="file" accept="image/*" ref={replyFileInputRef} onChange={handleReplyImageSelect} style={{ display: 'none' }} />
                  <Button
                  type="button"
                  onClick={() => replyFileInputRef.current?.click()}
                  disabled={uploadingReplyImage}
                  variant="ghost" size="sm" className="h-8 w-8 rounded-full bg-muted/10 p-0 flex-shrink-0"
                  aria-label={tr("postcard_sekil_elave_et", "Şəkil əlavə et")}>
                    <ImagePlus className="w-3.5 h-3.5" />
                  </Button>
                  <textarea
                  ref={replyInputRef}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={tr("commentreply_cavab_yaz_placeholder_123456", "{username} cavab...").replace("{username}", comment.author?.name || tr("commentreply_i_stifadeci_b6bdd6", "İstifadəçi"))}
                  rows={1}
                  className="flex-1 text-[11px] rounded-2xl bg-muted/10 border border-border/10 px-3.5 py-1.5 resize-none focus:outline-none"
                  style={{ lineHeight: 1.4, overflowY: 'hidden' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleReply();
                    }
                  }} />
                  <Button onClick={handleReply} disabled={(!replyText.trim() && !replyImageFile) || uploadingReplyImage} size="sm" className="h-8 w-8 rounded-full gradient-primary p-0 flex-shrink-0">
                    {uploadingReplyImage ? <Loader2 className="w-3 h-3 text-primary-foreground animate-spin" /> : <Send className="w-3 h-3 text-primary-foreground" />}
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
            <CommentReply key={reply.id} comment={reply} postId={postId} postAuthorId={postAuthorId} allComments={allComments} onRefetch={onRefetch} onUserClick={onUserClick} isReply rootId={effectiveRootId} highlightCommentId={highlightCommentId} />
            )}
            </div>
          </motion.div>
        }
      </AnimatePresence>

      {/* Şərh şəkli — in-app lightbox */}
      {imageViewerOpen && comment.image_url &&
      <PhotoGalleryViewer
        photos={[{ id: comment.id, url: comment.image_url }]}
        initialIndex={0}
        isOpen={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)} />
      }
    </div>
  );
};

export default CommentReply;
