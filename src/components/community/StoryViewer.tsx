import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Pause, Play, Trash2, Eye } from 'lucide-react';
import { Story, UserStoryGroup } from '@/hooks/useStories';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { az } from 'date-fns/locale';

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
    if (isPaused || !currentStory) return;

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
  }, [isPaused, currentStory, goToNextStory]);

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

  if (!currentGroup || !currentStory) return null;

  return (
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
          {isOwnStory && (
            <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-1">
              <Eye className="w-4 h-4 text-white" />
              <span className="text-white text-xs">{currentStory.view_count}</span>
            </div>
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
                onDelete(currentStory.id);
                goToNextStory();
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
  );
};

export default StoryViewer;
