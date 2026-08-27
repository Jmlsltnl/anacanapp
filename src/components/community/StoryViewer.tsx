import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { tr } from '@/lib/tr';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, Pause, Play, Trash2, Eye, Users, ChevronUp, Heart, MessageCircle, Send } from 'lucide-react';
import { Story, UserStoryGroup } from '@/hooks/useStories';
import { useStoryViewers } from '@/hooks/useStoryViewers';
import { useStoryReplies, useCreateStoryReply, useDeleteStoryReply } from '@/hooks/useStoryReplies';
import { useAutoGrowTextarea } from '@/hooks/useAutoGrowTextarea';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { getCurrentDateLocale } from '@/lib/date-utils';
import { useIsRtl } from '@/lib/rtl';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle } from
"@/components/ui/alert-dialog";

interface StoryViewerProps {
  storyGroups: UserStoryGroup[];
  initialGroupIndex: number;
  onClose: () => void;
  onViewed: (storyId: string) => void;
  onDelete?: (storyId: string) => void;
  onToggleLike?: (storyId: string, isLiked: boolean) => void;
}

const StoryViewer = ({
  storyGroups,
  initialGroupIndex,
  onClose,
  onViewed,
  onDelete,
  onToggleLike
}: StoryViewerProps) => {
  const { user, profile, isAdmin } = useAuth();
  const isRtl = useIsRtl();
  const [currentGroupIndex, setCurrentGroupIndex] = useState(initialGroupIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState('');
  const { ref: replyTextareaRef } = useAutoGrowTextarea(replyText, 80);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);
  const storyDuration = 5000;

  const currentGroup = storyGroups[currentGroupIndex];
  const currentStory = currentGroup?.stories[currentStoryIndex];
  const isOwnStory = currentStory?.user_id === user?.id;

  // Fetch actual viewers for own stories
  const { data: viewers = [], isLoading: viewersLoading } = useStoryViewers(
    isOwnStory && showViewers ? currentStory?.id : null
  );

  // Story-yə cavablar — hamı üçün (yalnız sheet açıq olanda yüklənir)
  const { data: replies = [], isLoading: repliesLoading } = useStoryReplies(
    showReplies ? currentStory?.id ?? null : null,
    showReplies
  );
  const createStoryReply = useCreateStoryReply();
  const deleteStoryReply = useDeleteStoryReply();

  const goToNextStory = useCallback(() => {
    if (!currentGroup) return;
    if (currentStoryIndex < currentGroup.stories.length - 1) {
      setCurrentStoryIndex((prev) => prev + 1);
      setProgress(0);
    } else if (currentGroupIndex < storyGroups.length - 1) {
      setCurrentGroupIndex((prev) => prev + 1);
      setCurrentStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentGroup, currentStoryIndex, currentGroupIndex, storyGroups.length, onClose]);

  const goToPrevStory = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((prev) => prev - 1);
      setProgress(0);
    } else if (currentGroupIndex > 0) {
      setCurrentGroupIndex((prev) => prev - 1);
      const prevGroup = storyGroups[currentGroupIndex - 1];
      setCurrentStoryIndex(prevGroup.stories.length - 1);
      setProgress(0);
    }
  }, [currentStoryIndex, currentGroupIndex, storyGroups]);

  // Mark story as viewed
  useEffect(() => {
    if (currentStory && !currentStory.is_viewed && !isOwnStory) {
      onViewed(currentStory.id);
    }
  }, [currentStory, isOwnStory, onViewed]);

  // Progress timer
  useEffect(() => {
    if (isPaused || !currentStory || showDeleteConfirm || showViewers || showReplies) return;

    progressInterval.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          goToNextStory();
          return 0;
        }
        return prev + 100 / (storyDuration / 100);
      });
    }, 100);

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isPaused, currentStory, goToNextStory, showDeleteConfirm, showViewers, showReplies]);

  // Long press to pause (Instagram-style)
  const handlePointerDown = () => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setIsPaused(true);
    }, 200);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (isLongPress.current) {
      setIsPaused(false);
      isLongPress.current = false;
      return;
    }
    // Tap navigation — RTL-də oxu istiqamətinə uyğun güzgülənir (sağ tərəf = əvvəlki)
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const tappedFirstThird = x < width / 3;
    if (tappedFirstThird) {
      isRtl ? goToNextStory() : goToPrevStory();
    } else if (!tappedFirstThird && x > width / 3) {
      isRtl ? goToPrevStory() : goToNextStory();
    }
  };

  const handleDrag = (_: any, info: PanInfo) => {
    if (Math.abs(info.offset.y) > 100 && info.offset.y > 0) {
      onClose(); // Swipe down to close
    } else if (info.offset.x > 80) {
      isRtl ? goToNextStory() : goToPrevStory();
    } else if (info.offset.x < -80) {
      isRtl ? goToPrevStory() : goToNextStory();
    }
  };

  const handleDelete = () => {
    if (currentStory && onDelete) {
      onDelete(currentStory.id);
      setShowDeleteConfirm(false);
      goToNextStory();
    }
  };

  const handleToggleLike = () => {
    if (currentStory && onToggleLike) {
      onToggleLike(currentStory.id, !!currentStory.is_liked);
    }
  };

  const handleSendReply = () => {
    const content = replyText.trim();
    if (!content || !currentStory) return;
    createStoryReply.mutate({
      storyId: currentStory.id,
      content,
      storyAuthorId: currentStory.user_id,
      replierName: profile?.name
    });
    setReplyText('');
  };

  const handleDeleteReply = (replyId: string) => {
    if (!currentStory) return;
    deleteStoryReply.mutate({ replyId, storyId: currentStory.id });
  };

  if (!currentGroup || !currentStory) return null;
  // Community tab-ın .a-shell (z-index: 1, öz stacking context-i) və səhifə-keçid
  // motion.div-inin (transform → fixed üçün containing block yaradır) içərisindən
  // adi "fixed inset-0" alt naviqasiyanın (BottomNav, z-40) ARXASINDA qalırdı —
  // DailyStoryCards.tsx-dəki eyni problemin həllini təkrarlayaraq body-ə portallanır.
  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
        
        {/* Instagram-tipli standart 9:16 (1080x1920) "story kətanı" — cihazın öz ekran
            nisbətindən ASILI OLMAYARAQ sabit qalır. Ekran 9:16-dan enlidirsə (planşet və s.)
            yanlarda, dardırsa (bugünkü çox telefon 9:19-19.5-dir) yuxarı/aşağı qara zolaq
            (letterbox) əlavə olunur — Instagram/YouTube-un standart üsulu. Əvvəllər tam
            ekrana (cihazın öz nisbətinə) "object-cover" ilə uzadılırdı, bu da fərqli
            cihazlarda fərqli hissələrin kəsilməsinə səbəb olurdu.
            CSS min()-trick: hər iki ölçünü ekrana həm sığdırır, həm nisbəti qoruyur. */}
        <div
          className="relative bg-black overflow-hidden"
          style={{
            aspectRatio: '9 / 16',
            width: 'min(100dvw, 100dvh * 9 / 16)',
            height: 'min(100dvh, 100dvw * 16 / 9)'
          }}>
          
          <motion.div
            className="w-full h-full relative"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDrag}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}>
            
            {/* Story media — tam görünmə təmin edilir (object-contain): heç bir hissəsi kəsilmir,
                mənbə şəkil/video 9:16-dan fərqlidirsə çərçivə daxilində öz fon rəngi ilə tamamlanır */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStory.id}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0"
                style={{ backgroundColor: currentStory.background_color || '#000' }}>
                
                {currentStory.media_type === 'video' ?
                <video
                  src={currentStory.media_url}
                  className="w-full h-full object-contain"
                  autoPlay
                  muted
                  playsInline
                  loop /> :


                <img
                  src={currentStory.media_url}
                  alt="Story"
                  className="w-full h-full object-contain" />

                }
              </motion.div>
            </AnimatePresence>

          {/* Gradient overlays for readability */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/60 to-transparent z-10 pointer-events-none" />

          {/* Progress bars */}
          <div className="absolute top-0 start-0 end-0 flex gap-[3px] z-20 px-2 pt-[calc(env(safe-area-inset-top,8px)+8px)]">
            {currentGroup.stories.map((_, index) =>
            <div
              key={index}
              className="flex-1 h-[2.5px] bg-white/30 rounded-full overflow-hidden">
              
                <div
                className="h-full bg-white rounded-full transition-all"
                style={{
                  width:
                  index < currentStoryIndex ?
                  '100%' :
                  index === currentStoryIndex ?
                  `${progress}%` :
                  '0%',
                  transitionDuration: index === currentStoryIndex ? '100ms' : '0ms'
                }} />
              
              </div>
            )}
          </div>

          {/* Header */}
          <div className="absolute start-0 end-0 z-20 px-4" style={{ top: 'calc(env(safe-area-inset-top, 8px) + 20px)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full ring-2 ring-white/80 overflow-hidden">
                  {currentGroup.user_avatar ?
                  <img
                    src={currentGroup.user_avatar}
                    alt={currentGroup.user_name}
                    className="w-full h-full object-cover" /> :


                  <div className="w-full h-full bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {currentGroup.user_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  }
                </div>
                <div>
                  <p className="text-white font-semibold text-[13px] leading-tight">{currentGroup.user_name}</p>
                  <p className="text-white/50 text-[11px]">
                    {formatDistanceToNow(new Date(currentStory.created_at), {
                      addSuffix: true,
                      locale: getCurrentDateLocale()
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => {e.stopPropagation();setIsPaused(!isPaused);}}
                  className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                  
                  {isPaused ? <Play className="w-4 h-4 text-white" /> : <Pause className="w-4 h-4 text-white" />}
                </button>
                {isOwnStory && onDelete &&
                <button
                  onClick={(e) => {e.stopPropagation();setShowDeleteConfirm(true);setIsPaused(true);}}
                  className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                  
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                }
                <button
                  onClick={(e) => {e.stopPropagation();onClose();}}
                  className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                  
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Text overlay */}
          {currentStory.text_overlay &&
          <div className="absolute bottom-24 start-4 end-4 text-center z-20 pointer-events-none">
              <p className="text-white text-lg font-medium drop-shadow-lg bg-black/30 backdrop-blur-sm rounded-2xl px-5 py-3">
                {currentStory.text_overlay}
              </p>
            </div>
          }

          {/* Bottom cluster: (sahib) baxış+bəyənmə → (hamı) cavab sayı → (hamı) cavab yaz + bəyən.
              Toxunma/sürüşdürmə naviqasiyasına qarışmasın deyə bütün blok pointer hadisələrini
              özündə saxlayır (dış konteynerin tap-zone/drag handler-lərinə çatmır). */}
          <div
            className="absolute bottom-0 start-0 end-0 z-20 pb-[calc(env(safe-area-inset-bottom,16px)+12px)] px-3 flex flex-col items-center gap-2"
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}>
            
            {isOwnStory &&
            <div className="flex items-center gap-2">
                <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowViewers(true);
                  setIsPaused(true);
                }}
                className="flex flex-col items-center gap-1"
                whileTap={{ scale: 0.95 }}>
                
                  <ChevronUp className="w-5 h-5 text-white/70" />
                  <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-4 py-2">
                    <Eye className="w-4 h-4 text-white" />
                    <span className="text-white text-sm font-medium">{currentStory.view_count} {tr("storyviewer_baxis_d4da3e", "bax\u0131\u015F")}</span>
                  </div>
                </motion.button>
                {currentStory.likes_count > 0 &&
              <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-full px-3.5 py-2">
                    <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                    <span className="text-white text-sm font-medium">{currentStory.likes_count}</span>
                  </div>
              }
              </div>
            }

            {currentStory.replies_count > 0 &&
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                setShowReplies(true);
                setIsPaused(true);
              }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-full px-3.5 py-1.5">
              
                <MessageCircle className="w-3.5 h-3.5 text-white" />
                <span className="text-white text-xs font-medium">
                  {currentStory.replies_count} {tr('storyviewer_cavab_sayi', 'cavab')}
                </span>
              </motion.button>
            }

            <div className="w-full flex items-end gap-2">
              <textarea
                ref={replyTextareaRef}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onFocus={() => setIsPaused(true)}
                onBlur={() => setIsPaused(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendReply();
                  }
                }}
                placeholder={tr('storyviewer_cavab_yaz', 'Cavab yaz...')}
                rows={1}
                className="flex-1 min-w-0 px-4 py-2.5 rounded-2xl bg-white/15 backdrop-blur-sm text-white placeholder:text-white/60 text-sm border border-white/20 focus:outline-none focus:border-white/40 resize-none"
                style={{ lineHeight: 1.35, overflowY: 'hidden', maxHeight: 80 }} />
              
              {replyText.trim() &&
              <motion.button
                onClick={(e) => {e.stopPropagation();handleSendReply();}}
                disabled={createStoryReply.isPending}
                whileTap={{ scale: 0.9 }}
                className="w-11 h-11 flex-shrink-0 rounded-full bg-white flex items-center justify-center disabled:opacity-50">
                
                  <Send className="w-4 h-4 text-black" />
                </motion.button>
              }
              {!isOwnStory && onToggleLike &&
              <motion.button
                onClick={(e) => {e.stopPropagation();handleToggleLike();}}
                whileTap={{ scale: 1.25 }}
                className="w-11 h-11 flex-shrink-0 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center gap-1">
                
                  <motion.span
                  key={currentStory.is_liked ? 'liked' : 'unliked'}
                  initial={{ scale: 0.6 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
                  
                    <Heart
                    className="w-5 h-5"
                    style={currentStory.is_liked ? { fill: '#ef4444', color: '#ef4444' } : { color: '#fff' }} />
                  
                  </motion.span>
                </motion.button>
              }
            </div>
          </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={(open) => {
        setShowDeleteConfirm(open);
        if (!open) setIsPaused(false);
      }}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{tr("untranslated_story_silinsin_yil9td", "Story silinsin?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tr("storyviewer_bu_story_hemiselik_silinecek_b_577f00", "Bu story h\u0259mi\u015F\u0259lik silin\u0259c\u0259k. Bu \u0259m\u0259liyyat geri al\u0131na bilm\u0259z.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsPaused(false)}>{tr("storyviewer_legv_et_b5e49c", "Ləğv et")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">{tr("untranslated_sil_zwa7lz", "Sil")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Viewers Bottom Sheet */}
      <AnimatePresence>
        {showViewers &&
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] bg-black/50"
          onClick={() => {setShowViewers(false);setIsPaused(false);}}>
          
            <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="absolute bottom-0 start-0 end-0 max-h-[70vh] bg-card rounded-t-3xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Eye className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-foreground">{tr("storyviewer_baxislar_e938f5", "Baxışlar")}</h3>
                    <p className="text-xs text-muted-foreground">{currentStory.view_count} {tr("storyviewer_nefer_dbca98", "n\u0259f\u0259r")}</p>
                  </div>
                </div>
                <button
                onClick={() => {setShowViewers(false);setIsPaused(false);}}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Viewers List */}
              <div className="overflow-y-auto max-h-[50vh]" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 20px)' }}>
                {viewersLoading ?
              <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div> :
              viewers.length === 0 ?
              <div className="text-center py-12">
                    <Eye className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">{tr("storyviewer_hele_hec_kim_baxmayib_30427f", "Hələ heç kim baxmayıb")}</p>
                  </div> :

              <div className="px-5 py-2">
                    {viewers.map((viewer) =>
                <div
                  key={viewer.user_id}
                  className="flex items-center gap-3 py-3">
                  
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                          {viewer.avatar_url ?
                    <img
                      src={viewer.avatar_url}
                      alt={viewer.name}
                      className="w-full h-full object-cover" /> :


                    <div className="w-full h-full bg-gradient-to-br from-primary/30 to-pink-500/30 flex items-center justify-center">
                              <span className="text-sm font-bold text-primary">
                                {viewer.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                    }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">{viewer.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {formatDistanceToNow(new Date(viewer.viewed_at), {
                        addSuffix: true,
                        locale: getCurrentDateLocale()
                      })}
                          </p>
                        </div>
                      </div>
                )}
                  </div>
              }
              </div>
            </motion.div>
          </motion.div>
        }
      </AnimatePresence>

      {/* Replies Bottom Sheet */}
      <AnimatePresence>
        {showReplies &&
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] bg-black/50"
          onClick={() => {setShowReplies(false);setIsPaused(false);}}>
          
            <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="absolute bottom-0 start-0 end-0 max-h-[70vh] bg-card rounded-t-3xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}>
            
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
                <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-4 border-b border-border/50 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-foreground">{tr('storyviewer_cavablar_basliq', 'Cavablar')}</h3>
                    <p className="text-xs text-muted-foreground">{currentStory.replies_count} {tr("storyviewer_nefer_dbca98", "n\u0259f\u0259r")}</p>
                  </div>
                </div>
                <button
                onClick={() => {setShowReplies(false);setIsPaused(false);}}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Replies List */}
              <div className="overflow-y-auto flex-1" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 20px)' }}>
                {repliesLoading ?
              <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div> :
              replies.length === 0 ?
              <div className="text-center py-12">
                    <MessageCircle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">{tr('storyviewer_hele_cavab_yoxdur', 'Hələ heç kim cavab verməyib')}</p>
                  </div> :

              <div className="px-5 py-2">
                    {replies.map((reply) =>
                <div
                  key={reply.id}
                  className="flex items-start gap-3 py-3">
                  
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-muted flex-shrink-0">
                          {reply.author?.avatar_url ?
                    <img
                      src={reply.author.avatar_url}
                      alt={reply.author.name}
                      className="w-full h-full object-cover" /> :


                    <div className="w-full h-full bg-gradient-to-br from-primary/30 to-pink-500/30 flex items-center justify-center">
                              <span className="text-xs font-bold text-primary">
                                {(reply.author?.name || '?').charAt(0).toUpperCase()}
                              </span>
                            </div>
                    }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">
                            <span className="font-semibold">{reply.author?.name}</span>{' '}
                            <span className="text-foreground/90">{reply.content}</span>
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {formatDistanceToNow(new Date(reply.created_at), {
                        addSuffix: true,
                        locale: getCurrentDateLocale()
                      })}
                          </p>
                        </div>
                        {(reply.user_id === user?.id || isAdmin) &&
                  <button
                    onClick={() => handleDeleteReply(reply.id)}
                    className="w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive">
                    
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                  }
                      </div>
                )}
                  </div>
              }
              </div>
            </motion.div>
          </motion.div>
        }
      </AnimatePresence>
    </>,
    document.body
  );

};

export default StoryViewer;