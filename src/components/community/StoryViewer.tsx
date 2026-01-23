import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Pause, Play, Trash2, Eye, Users } from 'lucide-react';
import { Story, UserStoryGroup } from '@/hooks/useStories';
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
  const storyDuration = 5000; // 5 seconds per story

  const currentGroup = storyGroups[currentGroupIndex];
  const currentStory = currentGroup?.stories[currentStoryIndex];
  const isOwnStory = currentStory?.user_id === user?.id;

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
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isPaused, currentStory, goToNextStory, showDeleteConfirm, showViewers]);

  const handleDrag = (_: any, info: PanInfo) => {
    if (info.offset.x > 100) {
      goToPrevStory();
    } else if (info.offset.x < -100) {
      goToNextStory();
    }
  };

  const handleTap = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    if (x < width / 3) {
      goToPrevStory();
    } else if (x > (width * 2) / 3) {
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
        className="fixed inset-0 z-50 bg-black flex items-center justify-center"
        onClick={handleTap}
      >
        {/* Progress bars */}
        <div className="absolute top-2 left-2 right-2 flex gap-1 z-20 safe-top">
          {currentGroup.stories.map((_, index) => (
            <div
              key={index}
              className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
            >
              <motion.div
                className="h-full bg-white"
                initial={{ width: 0 }}
                animate={{
                  width:
                    index < currentStoryIndex
                      ? '100%'
                      : index === currentStoryIndex
                      ? `${progress}%`
                      : '0%',
                }}
                transition={{ duration: 0.1 }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-20 safe-top">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-pink-500 flex items-center justify-center overflow-hidden">
              {currentGroup.user_avatar ? (
                <img
                  src={currentGroup.user_avatar}
                  alt={currentGroup.user_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-bold">
                  {currentGroup.user_name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{currentGroup.user_name}</p>
              <p className="text-white/60 text-xs">
                {formatDistanceToNow(new Date(currentStory.created_at), {
                  addSuffix: true,
                  locale: az,
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View count button - shows viewers modal for own stories */}
            {isOwnStory && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowViewers(true);
                  setIsPaused(true);
                }}
                className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1.5"
              >
                <Eye className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-medium">{currentStory.view_count}</span>
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPaused(!isPaused);
              }}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
            >
              {isPaused ? (
                <Play className="w-4 h-4 text-white" />
              ) : (
                <Pause className="w-4 h-4 text-white" />
              )}
            </button>
            {isOwnStory && onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                  setIsPaused(true);
                }}
                className="w-8 h-8 rounded-full bg-red-500/80 flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4 text-white" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Story content */}
        <motion.div
          className="w-full h-full flex items-center justify-center"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDrag}
          onPointerDown={() => setIsPaused(true)}
          onPointerUp={() => setIsPaused(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStory.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative w-full h-full"
              style={{
                backgroundColor: currentStory.background_color || 'transparent',
              }}
            >
              {currentStory.media_type === 'video' ? (
                <video
                  src={currentStory.media_url}
                  className="w-full h-full object-contain"
                  autoPlay
                  muted
                  playsInline
                  loop
                />
              ) : (
                <img
                  src={currentStory.media_url}
                  alt="Story"
                  className="w-full h-full object-contain"
                />
              )}

              {/* Text overlay */}
              {currentStory.text_overlay && (
                <div className="absolute bottom-20 left-4 right-4 text-center">
                  <p className="text-white text-lg font-medium drop-shadow-lg bg-black/30 rounded-xl px-4 py-2">
                    {currentStory.text_overlay}
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Navigation hints */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-8 z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrevStory();
            }}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-white/60" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNextStory();
            }}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
          >
            <ChevronRight className="w-5 h-5 text-white/60" />
          </button>
        </div>
      </motion.div>

      {/* Delete Confirmation Dialog */}
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

      {/* Viewers Modal */}
      <AnimatePresence>
        {showViewers && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/70 flex items-end justify-center"
            onClick={() => {
              setShowViewers(false);
              setIsPaused(false);
            }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-full max-h-[70vh] bg-card rounded-t-3xl p-6 overflow-y-auto"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 100px)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Story Baxışları</h3>
                  <p className="text-sm text-muted-foreground">{currentStory.view_count} nəfər baxıb</p>
                </div>
              </div>

              {currentStory.view_count === 0 ? (
                <div className="text-center py-8">
                  <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Hələ heç kim baxmayıb</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                  {/* In a real implementation, you'd fetch actual viewers list */}
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">
                      {currentStory.view_count} nəfər bu story-ni baxıb
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setShowViewers(false);
                  setIsPaused(false);
                }}
                className="w-full h-12 rounded-2xl bg-muted text-foreground font-bold mt-4"
              >
                Bağla
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default StoryViewer;
