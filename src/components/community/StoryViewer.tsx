import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, Pause, Play, Trash2, Eye, Users, ChevronUp } from 'lucide-react';
import { Story, UserStoryGroup } from '@/hooks/useStories';
import { useStoryViewers } from '@/hooks/useStoryViewers';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { az } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface StoryViewerProps {
  storyGroups: UserStoryGroup[];
  initialGroupIndex: number;
  onClose: () => void;
  onViewed: (storyId: string) => void;
  onDelete?: (storyId: string) => void;
}

const StoryViewer = ({
  storyGroups,
  initialGroupIndex,
  onClose,
  onViewed,
  onDelete,
}: StoryViewerProps) => {
  const { user } = useAuth();
  const [currentGroupIndex, setCurrentGroupIndex] = useState(initialGroupIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
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

  const goToNextStory = useCallback(() => {
    if (!currentGroup) return;
    if (currentStoryIndex < currentGroup.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
    } else if (currentGroupIndex < storyGroups.length - 1) {
      setCurrentGroupIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentGroup, currentStoryIndex, currentGroupIndex, storyGroups.length, onClose]);

  const goToPrevStory = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
    } else if (currentGroupIndex > 0) {
      setCurrentGroupIndex(prev => prev - 1);
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
    if (isPaused || !currentStory || showDeleteConfirm || showViewers) return;

    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          goToNextStory();
          return 0;
        }
        return prev + (100 / (storyDuration / 100));
      });
    }, 100);

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isPaused, currentStory, goToNextStory, showDeleteConfirm, showViewers]);

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
    // Tap navigation
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    if (x < width / 3) {
      goToPrevStory();
    } else if (x > width / 3) {
      goToNextStory();
    }
  };

  const handleDrag = (_: any, info: PanInfo) => {
    if (Math.abs(info.offset.y) > 100 && info.offset.y > 0) {
      onClose(); // Swipe down to close
    } else if (info.offset.x > 80) {
      goToPrevStory();
    } else if (info.offset.x < -80) {
      goToNextStory();
    }
  };

  const handleDelete = () => {
    if (currentStory && onDelete) {
      onDelete(currentStory.id);
      setShowDeleteConfirm(false);
      goToNextStory();
    }
  };

  if (!currentGroup || !currentStory) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black"
      >
        {/* Full screen story container */}
        <motion.div
          className="w-full h-full relative"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={handleDrag}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          {/* Story media - full screen */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStory.id}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0"
              style={{ backgroundColor: currentStory.background_color || '#000' }}
            >
              {currentStory.media_type === 'video' ? (
                <video
                  src={currentStory.media_url}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  playsInline
                  loop
                />
              ) : (
                <img
                  src={currentStory.media_url}
                  alt="Story"
                  className="w-full h-full object-cover"
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Gradient overlays for readability */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/60 to-transparent z-10 pointer-events-none" />

          {/* Progress bars */}
          <div className="absolute top-0 left-0 right-0 flex gap-[3px] z-20 px-2 pt-[calc(env(safe-area-inset-top,8px)+8px)]">
            {currentGroup.stories.map((_, index) => (
              <div
                key={index}
                className="flex-1 h-[2.5px] bg-white/30 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{
                    width:
                      index < currentStoryIndex
                        ? '100%'
                        : index === currentStoryIndex
                        ? `${progress}%`
                        : '0%',
                    transitionDuration: index === currentStoryIndex ? '100ms' : '0ms',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute left-0 right-0 z-20 px-4" style={{ top: 'calc(env(safe-area-inset-top, 8px) + 20px)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full ring-2 ring-white/80 overflow-hidden">
                  {currentGroup.user_avatar ? (
                    <img
                      src={currentGroup.user_avatar}
                      alt={currentGroup.user_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {currentGroup.user_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-white font-semibold text-[13px] leading-tight">{currentGroup.user_name}</p>
                  <p className="text-white/50 text-[11px]">
                    {formatDistanceToNow(new Date(currentStory.created_at), {
                      addSuffix: true,
                      locale: az,
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => { e.stopPropagation(); setIsPaused(!isPaused); }}
                  className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
                >
                  {isPaused ? <Play className="w-4 h-4 text-white" /> : <Pause className="w-4 h-4 text-white" />}
                </button>
                {isOwnStory && onDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); setIsPaused(true); }}
                    className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onClose(); }}
                  className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Text overlay */}
          {currentStory.text_overlay && (
            <div className="absolute bottom-24 left-4 right-4 text-center z-20 pointer-events-none">
              <p className="text-white text-lg font-medium drop-shadow-lg bg-black/30 backdrop-blur-sm rounded-2xl px-5 py-3">
                {currentStory.text_overlay}
              </p>
            </div>
          )}

          {/* Bottom: View count for own stories (swipe up to see viewers) */}
          {isOwnStory && (
            <div className="absolute bottom-0 left-0 right-0 z-20 pb-[calc(env(safe-area-inset-bottom,16px)+16px)]">
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowViewers(true);
                  setIsPaused(true);
                }}
                className="mx-auto flex flex-col items-center gap-1"
                whileTap={{ scale: 0.95 }}
              >
                <ChevronUp className="w-5 h-5 text-white/70" />
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-4 py-2">
                  <Eye className="w-4 h-4 text-white" />
                  <span className="text-white text-sm font-medium">{currentStory.view_count} baxış</span>
                </div>
              </motion.button>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={(open) => {
        setShowDeleteConfirm(open);
        if (!open) setIsPaused(false);
      }}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Story silinsin?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu story həmişəlik silinəcək. Bu əməliyyat geri alına bilməz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsPaused(false)}>Ləğv et</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Viewers Bottom Sheet */}
      <AnimatePresence>
        {showViewers && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50"
            onClick={() => { setShowViewers(false); setIsPaused(false); }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 max-h-[70vh] bg-card rounded-t-3xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
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
                    <h3 className="font-bold text-base text-foreground">Baxışlar</h3>
                    <p className="text-xs text-muted-foreground">{currentStory.view_count} nəfər</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowViewers(false); setIsPaused(false); }}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Viewers List */}
              <div className="overflow-y-auto max-h-[50vh]" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 20px)' }}>
                {viewersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : viewers.length === 0 ? (
                  <div className="text-center py-12">
                    <Eye className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Hələ heç kim baxmayıb</p>
                  </div>
                ) : (
                  <div className="px-5 py-2">
                    {viewers.map((viewer) => (
                      <div
                        key={viewer.user_id}
                        className="flex items-center gap-3 py-3"
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                          {viewer.avatar_url ? (
                            <img
                              src={viewer.avatar_url}
                              alt={viewer.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/30 to-pink-500/30 flex items-center justify-center">
                              <span className="text-sm font-bold text-primary">
                                {viewer.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">{viewer.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {formatDistanceToNow(new Date(viewer.viewed_at), {
                              addSuffix: true,
                              locale: az,
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default StoryViewer;
