import { useState, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, MoreHorizontal, Send, Trash2, Crown, Shield, Flag, Pencil, EyeOff, Sparkles, Languages } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getCurrentDateLocale } from '@/lib/date-utils';
import { CommunityPost, useToggleLike, usePostComments, useCreateComment, useEditPost, useDeletePost } from '@/hooks/useCommunity';
import { useUserStore } from '@/store/userStore';
import { isFeedLang } from '@/lib/langDetect';
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
import { tr } from "@/lib/tr";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from
'@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from
'@/components/ui/dialog';

interface PostCardProps {
  post: CommunityPost;
  groupId: string | null;
  onUserClick?: (userId: string) => void;
}

const getMediaType = (url: string): 'image' | 'video' => {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
  return videoExtensions.some((ext) => url.toLowerCase().includes(ext)) ? 'video' : 'image';
};

const UserBadge = ({ type }: {type: 'admin' | 'premium' | 'moderator' | null;}) => {
  if (!type) return null;
  const config = {
    admin: { label: 'Admin', icon: Shield, className: 'admin' },
    premium: { label: 'Premium', icon: Sparkles, className: '' },
    moderator: { label: 'Mod', icon: Shield, className: 'moderator' }
  };
  const b = config[type];
  if (!b) return null;
  const Icon = b.icon;
  return (
    <span className={`a-post-badge ${b.className}`}>
      <Icon size={9} />
      {b.label}
    </span>);

};

// Sessiya-daxili tərcümə keşi — toggle təkrar sorğu atmır (server keşi ayrıca var)
const postTranslationCache = new Map<string, string>();

// anacan-demo avatar gradient cycle (stable per user)
const AVATAR_GRADS = ['var(--a-grad-peach)', 'var(--a-grad-pink)', 'var(--a-grad-lav)', 'var(--a-grad-blue)', 'var(--a-grad-green)', 'var(--a-grad-yellow)'];
const avatarGradFor = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffffffff;
  return AVATAR_GRADS[Math.abs(h) % AVATAR_GRADS.length];
};

// memo(): community feed hər post üçün ayrıca bu komponenti render edir —
// props (post/groupId/onUserClick) dəyişməyəndə belə, valideynin (GroupFeed)
// istənilən re-render-i bütün görünən postları yenidən render edirdi.
// Effektiv olması üçün onUserClick CommunityScreen-də useCallback ilə sabitlənib,
// post obyekt referansı isə react-query-nin struktur paylaşımı ilə sabitdir.
const PostCard = memo(({ post, groupId, onUserClick }: PostCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentAnonymous, setCommentAnonymous] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [translation, setTranslation] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const lastTapRef = useRef(0);
  const { isAdmin, user, profile } = useAuth();
  const { toast } = useToast();
  const uiLang = useUserStore((s) => s.language) || 'az';

  const toggleLike = useToggleLike();
  const { data: comments = [], isLoading: commentsLoading, refetch: refetchComments } = usePostComments(post.id);
  const createComment = useCreateComment();
  const editPost = useEditPost();
  const deletePost = useDeletePost();

  const isOwnPost = user?.id === post.user_id;
  const isAnonymous = (post as any).is_anonymous === true;

  const handleLike = useCallback(() => {
    // Uçuşda ikinci toxunuşu udmaq — köhnə isLiked ilə yarışın (duplicate 23505) qarşısını alır
    if (toggleLike.isPending) return;
    hapticFeedback.light();
    toggleLike.mutate({ postId: post.id, isLiked: post.is_liked || false, groupId });
  }, [post.id, post.is_liked, groupId, toggleLike.isPending]);

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
      commenterName: profile?.name || user?.user_metadata?.name || tr("postcard_i_stifadeci_b6bdd6", "\u0130stifad\u0259\xE7i"),
      isAnonymous: commentAnonymous
    });
    setCommentText('');
  };

  const handleDeletePost = () => {
    if (!confirm(tr("postcard_bu_postu_silmek_isteyirsiniz_2fbc75", "Bu postu silm\u0259k ist\u0259yirsiniz?"))) return;
    hapticFeedback.medium();
    deletePost.mutate(post.id);
  };

  const handleEditPost = () => {
    const content = editContent.trim();
    if (!content) return;
    hapticFeedback.light();
    // Redaktədən sonra köhnə tərcümə göstərilməsin (server keşini DB trigger silir)
    setShowTranslation(false);
    setTranslation(null);
    postTranslationCache.delete(`${post.id}:${uiLang}`);
    editPost.mutate({ postId: post.id, content, currentLanguage: post.language }, { onSuccess: () => setIsEditing(false) });
  };

  // ── Tərcümə: post dili ≠ UI dili olduqda "Tərcüməni gör" düyməsi ──
  const postLang = post.language || 'az';
  const hasTranslatableText = /[A-Za-zА-Яа-яЁёƏəĞğIıİÖöŞşÜüÇç]/.test(post.content);
  const canTranslate = hasTranslatableText && isFeedLang(uiLang) && postLang !== uiLang;

  const handleTranslate = async () => {
    hapticFeedback.light();
    // Artıq göstərilirsə → orijinala qayıt (sorğusuz)
    if (showTranslation) { setShowTranslation(false); return; }

    const cacheKey = `${post.id}:${uiLang}`;
    const cached = translation || postTranslationCache.get(cacheKey);
    if (cached) { setTranslation(cached); setShowTranslation(true); return; }

    setTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke('translate-post', {
        body: { post_id: post.id, target_lang: uiLang }
      });
      if (error || !data?.success || !data?.content) {
        throw new Error(data?.error || error?.message || 'translate failed');
      }
      postTranslationCache.set(cacheKey, data.content);
      setTranslation(data.content);
      setShowTranslation(true);
    } catch (e) {
      console.error('Post translate error:', e);
      toast({ title: tr("postcard_tercume_xetasi", "Tərcümə alınmadı — yenidən cəhd edin"), variant: 'destructive' });
    } finally {
      setTranslating(false);
    }
  };

  const handleReportPost = async () => {
    if (!reportReason.trim()) {toast({ title: tr("postcard_xeta_3cdbb6", 'Xəta'), description: tr("postcard_sikayet_sebebini_qeyd_edin_9d11b9", 'Şikayət səbəbini qeyd edin'), variant: 'destructive' });return;}
    if (!user) {toast({ title: tr("postcard_xeta_3cdbb6", 'Xəta'), description: tr("postcard_giris_etmelisiniz_6c2220", 'Giriş etməlisiniz'), variant: 'destructive' });return;}
    const { error } = await (supabase as any).from('post_reports').insert({ post_id: post.id, reporter_id: user.id, reason: reportReason, status: 'pending' });
    if (error) {toast({ title: tr("postcard_xeta_3cdbb6", 'Xəta'), description: error.message, variant: 'destructive' });} else
    {toast({ title: tr("postcard_sikayet_gonderildi_b7b528", 'Şikayət göndərildi'), description: tr("postcard_sikayetiniz_yoxlanilacaq_ad512c", 'Şikayətiniz yoxlanılacaq') });setShowReportDialog(false);setReportReason('');}
  };

  const handleShare = async () => {
    hapticFeedback.medium();
    await nativeShare({ title: tr("postcard_anacan_paylasim_9618d9", 'Anacan - Paylaşım'), text: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : '') });
  };



  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: getCurrentDateLocale() });
  const mediaItems = (post.media_urls || []).map((url) => ({ url, type: getMediaType(url) }));
  const authorBadge = post.author?.badge_type as 'admin' | 'premium' | 'moderator' | null;
  const handleAvatarClick = () => {if (post.user_id && onUserClick && (!isAnonymous || isAdmin)) onUserClick(post.user_id);};
  const topLevelComments = comments.filter((c) => !c.parent_comment_id);

  return (
    <>
      <motion.article
        className="a-post a-fade-in"
        transition={{ duration: 0.1 }}>
        
        {/* Author row */}
        <div className="a-post-head">
          <motion.button
            onClick={handleAvatarClick}
            whileTap={{ scale: 0.9 }}
            disabled={isAnonymous && !isAdmin}
            style={{ background: 'none', border: 'none', padding: 0, cursor: isAnonymous && !isAdmin ? 'default' : 'pointer' }}>
            
            <span
              className="a-post-avatar"
              style={{ background: isAnonymous && !isAdmin ? 'linear-gradient(135deg, #d8d3c6, #b3ac9a)' : avatarGradFor(post.user_id || post.id) }}>
              
              {isAnonymous && !isAdmin ?
              <EyeOff size={15} /> :
              post.author?.avatar_url ?
              <img src={post.author.avatar_url} alt="" /> :

              (post.author?.name?.charAt(0) || tr("common_initial_i", "İ")).toUpperCase()
              }
            </span>
          </motion.button>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="a-post-name-row">
              <motion.button
                onClick={handleAvatarClick}
                className="a-post-name"
                style={{ background: 'none', border: 'none', padding: 0, cursor: isAnonymous && !isAdmin ? 'default' : 'pointer', fontStyle: isAnonymous && !isAdmin ? 'italic' : 'normal', color: isAnonymous && !isAdmin ? 'var(--a-ink-soft)' : 'var(--a-ink)' }}
                whileTap={{ scale: 0.98 }}
                disabled={isAnonymous && !isAdmin}>
                
                {isAnonymous ?
                isAdmin ?
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontStyle: 'italic', color: 'var(--a-ink-soft)' }}>{tr("untranslated_anonim_89j5l6", "Anonim")}</span>
                      <span style={{ fontSize: 11, color: 'var(--a-peach-2)', fontWeight: 600 }}>({post.author?.name || tr("postcard_i_stifadeci_b6bdd6", "İstifadəçi")})</span>
                    </span> :
                tr("untranslated_anonim_89j5l6", "Anonim") :
                post.author?.name || tr("postcard_i_stifadeci_b6bdd6", "İstifadəçi")}
              </motion.button>
              {!isAnonymous && <UserBadge type={authorBadge} />}
              {isAnonymous && isAdmin && <UserBadge type={authorBadge} />}
              {isAnonymous && <span className="a-post-anon">({tr("untranslated_anonim_89j5l6", "Anonim")})</span>}
            </div>
            <span className="a-post-time">· {timeAgo}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                style={{ width: 30, height: 30, borderRadius: 999, display: 'grid', placeItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--a-ink-faint)', flexShrink: 0 }}>
                <MoreHorizontal size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border/20 z-50 rounded-xl shadow-xl min-w-[150px]">
              {isOwnPost &&
              <DropdownMenuItem onClick={() => {setEditContent(post.content);setIsEditing(true);}} className="text-foreground text-[11px] rounded-lg">
                  <Pencil className="w-3 h-3 me-2" /> {tr("postcard_redakte_et_66cf3b", "Redakt\u0259 et")}
                </DropdownMenuItem>
              }
              {!isOwnPost &&
              <DropdownMenuItem onClick={() => setShowReportDialog(true)} className="text-amber-600 text-[11px] rounded-lg">
                  <Flag className="w-3 h-3 me-2" /> {tr("postcard_sikayet_et_e8b63a", "\u015Eikay\u0259t et")}
                </DropdownMenuItem>
              }
              {(isAdmin || isOwnPost) && <DropdownMenuSeparator className="bg-border/10" />}
              {(isAdmin || isOwnPost) &&
              <DropdownMenuItem onClick={handleDeletePost} className="text-destructive text-[11px] rounded-lg">
                  <Trash2 className="w-3 h-3 me-2" />{tr("untranslated_sil_zwa7lz", "Sil")}</DropdownMenuItem>
              }
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content */}
        {isEditing ?
        <div className="space-y-2" style={{ paddingBottom: 4 }}>
            <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="min-h-[70px] rounded-xl resize-none text-[13px]" style={{ background: 'var(--a-surface-soft)', border: '1px solid var(--a-line-strong)', color: 'var(--a-ink)' }} autoFocus />
            <div className="flex gap-1.5 justify-end">
              <button onClick={() => setIsEditing(false)} className="a-tag" style={{ cursor: 'pointer' }}>{tr("postcard_legv_et_b5e49c", "Ləğv et")}</button>
              <button onClick={handleEditPost} disabled={!editContent.trim() || editPost.isPending} className="a-btn-solid">
                {editPost.isPending ? '...' : tr("common_saxla", "Saxla")}
              </button>
            </div>
          </div> :

        <div onClick={handleDoubleTap} className="relative">
            <p className="a-post-text" dir="auto">
              {(showTranslation && translation ? translation : post.content).split(/(\s+)/).map((word, index) => {
              if (word.startsWith('#')) return <span key={index} className="a-post-tag">{word}</span>;
              if (word.startsWith('@')) return <span key={index} style={{ color: 'var(--a-blue-2)', fontWeight: 700 }}>{word}</span>;
              if (/^https?:\/\/\S+/.test(word)) return <a key={index} href={word} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--a-blue-2)', textDecoration: 'underline', wordBreak: 'break-all' }} onClick={(e) => e.stopPropagation()}>{word}</a>;
              return word;
            })}
            </p>
            {canTranslate &&
          <button
            onClick={(e) => { e.stopPropagation(); void handleTranslate(); }}
            disabled={translating}
            style={{ background: 'none', border: 'none', padding: '6px 0 0', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: 'var(--a-blue-2)', opacity: translating ? 0.6 : 1 }}>
                <Languages size={12} strokeWidth={2.2} />
                {translating ?
            tr("postcard_tercume_olunur", "Tərcümə olunur…") :
            showTranslation ?
            tr("postcard_orijinali_goster", "Orijinalı göstər") :
            tr("postcard_tercumeni_gor", "Tərcüməni gör")}
                {showTranslation && !translating &&
            <span style={{ color: 'var(--a-ink-faint)', fontWeight: 600 }}>· {postLang.toUpperCase()} → {uiLang.toUpperCase()}</span>
            }
              </button>
          }
            {mediaItems.length > 0 &&
          <div style={{ marginTop: 12, borderRadius: 'var(--a-radius-md)', overflow: 'hidden' }}>
                <MediaCarousel media={mediaItems} />
              </div>
          }
            {/* Heart burst animation */}
            <AnimatePresence>
              {showHeartBurst &&
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              
                  <Heart className="w-20 h-20 drop-shadow-lg" style={{ color: '#e05575', fill: '#e05575' }} />
                </motion.div>
            }
            </AnimatePresence>
          </div>
        }

        {/* Actions (anacan-demo post footer) */}
        <div className="a-post-footer">
          <motion.button onClick={handleLike} className={`a-post-action${post.is_liked ? ' liked' : ''}`} whileTap={{ scale: 0.8 }}>
            <motion.span animate={post.is_liked ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.3 }} style={{ display: 'inline-flex' }}>
              <Heart size={15} strokeWidth={2.2} fill={post.is_liked ? 'currentColor' : 'none'} />
            </motion.span>
            {post.likes_count > 0 && <span>{post.likes_count}</span>}
          </motion.button>
          <motion.button onClick={() => setShowComments(!showComments)} className="a-post-action" style={showComments ? { color: 'var(--a-accent-ink)' } : undefined} whileTap={{ scale: 0.8 }}>
            <MessageCircle size={15} strokeWidth={2.2} />
            {post.comments_count > 0 && <span>{post.comments_count}</span>}
          </motion.button>
          <motion.button onClick={handleShare} className="a-post-action" whileTap={{ scale: 0.8 }}>
            <Share2 size={14} strokeWidth={2.2} />
          </motion.button>
        </div>

        {/* Comments section */}
        <AnimatePresence>
          {showComments &&
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
            style={{ borderTop: '1px solid var(--a-line)', marginTop: 12 }}>
            
              <div className="space-y-3" style={{ paddingTop: 12 }}>
                <div className="flex gap-2.5">
                  <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={commentAnonymous ? tr("postcard_anonim_serh_yaz_9af1ca", "Anonim \u015F\u0259rh yaz...") : tr("postcard_serh_yaz_54a89a", "Şərh yaz...")}
                  className="a-input"
                  style={{ borderRadius: 999 }}
                  onKeyPress={(e) => e.key === 'Enter' && handleComment()} />
                
                  <button
                  onClick={handleComment}
                  disabled={!commentText.trim() || createComment.isPending}
                  style={{ width: 36, height: 36, borderRadius: 999, flexShrink: 0, background: 'var(--a-ink)', color: 'var(--a-bg)', display: 'grid', placeItems: 'center', border: 'none', cursor: 'pointer', opacity: !commentText.trim() ? 0.4 : 1 }}>
                    <Send size={14} />
                  </button>
                </div>
                <button
                type="button"
                onClick={() => setCommentAnonymous((v) => !v)}
                className={`a-tag${commentAnonymous ? ' on' : ''}`}
                style={{ cursor: 'pointer' }}>
                
                  <span style={{ width: 12, height: 12, borderRadius: 999, border: commentAnonymous ? '1px solid var(--a-peach-2)' : '1px solid var(--a-ink-faint)', background: commentAnonymous ? 'var(--a-peach-2)' : 'transparent' }} />
                  {tr("postcard_anonim_olaraq_yaz_abc123", "Anonim olaraq yaz")}
                </button>
                {commentsLoading ?
              <div className="text-center py-4">
                    <div className="w-5 h-5 rounded-full animate-spin mx-auto" style={{ border: '2px solid var(--a-peach-2)', borderTopColor: 'transparent' }} />
                  </div> :
              topLevelComments.length === 0 ?
              <p className="a-list-sub text-center" style={{ padding: '16px 0', margin: 0 }}>{tr("postcard_hele_serh_yoxdur_89ce09", "Hələ şərh yoxdur 💭")}</p> :

              <div className="space-y-2">
                    {topLevelComments.map((comment) =>
                <CommentReply key={comment.id} comment={comment} postId={post.id} postAuthorId={post.user_id} allComments={comments} onRefetch={refetchComments} onUserClick={onUserClick} />
                )}
                  </div>
              }
              </div>
            </motion.div>
          }
        </AnimatePresence>
      </motion.article>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-md max-w-[90vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm">{tr("postcard_postu_sikayet_et_fd45d9", "Postu Şikayət Et")}</DialogTitle>
            <DialogDescription className="text-xs">{tr("postcard_bu_postun_niye_uygunsuz_oldugunu_bildiri_b86b7c", "Bu postun niyə uyğunsuz olduğunu bildirin")}</DialogDescription>
          </DialogHeader>
          <Textarea value={reportReason} onChange={(e) => setReportReason(e.target.value)} placeholder={tr("postcard_sikayet_sebebi_a49b6b", "Şikayət səbəbi...")} className="rounded-xl text-sm" />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowReportDialog(false)} className="rounded-lg text-xs h-8">{tr("postcard_legv_et_b5e49c", "Ləğv et")}</Button>
            <Button onClick={handleReportPost} className="gradient-primary rounded-lg text-xs h-8">{tr("postcard_gonder_3f11bd", "Göndər")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>);

});

PostCard.displayName = 'PostCard';

export default PostCard;