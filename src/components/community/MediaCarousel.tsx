import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Pause, X, Maximize2 } from 'lucide-react';

interface MediaItem {
  url: string;
  type: 'image' | 'video';
}

interface MediaCarouselProps {
  media: MediaItem[];
  onOpenFullscreen?: (index: number) => void;
}

const MediaCarousel = ({ media, onOpenFullscreen }: MediaCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (media.length === 0) return null;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const currentMedia = media[currentIndex];

  // Single media item
  if (media.length === 1) {
    return (
      <>
        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
          {currentMedia.type === 'video' ? (
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                src={currentMedia.url}
                className="w-full h-full object-cover"
                onClick={togglePlay}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity hover:bg-black/30"
              >
                {!isPlaying && (
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="w-8 h-8 text-foreground ml-1" fill="currentColor" />
                  </div>
                )}
              </button>
            </div>
          ) : (
            <img
              src={currentMedia.url}
              alt=""
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setShowFullscreen(true)}
            />
          )}
          <button
            onClick={() => setShowFullscreen(true)}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Fullscreen Modal */}
        <AnimatePresence>
          {showFullscreen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
              onClick={() => setShowFullscreen(false)}
            >
              <button
                onClick={() => setShowFullscreen(false)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white z-10"
              >
                <X className="w-6 h-6" />
              </button>
              {currentMedia.type === 'video' ? (
                <video
                  src={currentMedia.url}
                  className="max-w-full max-h-full"
                  controls
                  autoPlay
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <img
                  src={currentMedia.url}
                  alt=""
                  className="max-w-full max-h-full object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Multiple media items - Carousel
  return (
    <>
      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            {currentMedia.type === 'video' ? (
              <div className="relative w-full h-full">
                <video
                  ref={videoRef}
                  src={currentMedia.url}
                  className="w-full h-full object-cover"
                  onClick={togglePlay}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                {!isPlaying && (
                  <button
                    onClick={togglePlay}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="w-8 h-8 text-foreground ml-1" fill="currentColor" />
                    </div>
                  </button>
                )}
              </div>
            ) : (
              <img
                src={currentMedia.url}
                alt=""
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setShowFullscreen(true)}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={goToNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {media.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-white w-4' 
                  : 'bg-white/50 hover:bg-white/70'
              }`}
            />
          ))}
        </div>

        {/* Counter */}
        <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-black/50 text-white text-xs font-medium">
          {currentIndex + 1} / {media.length}
        </div>

        {/* Fullscreen button */}
        <button
          onClick={() => setShowFullscreen(true)}
          className="absolute top-2 left-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {showFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
          >
            <button
              onClick={() => setShowFullscreen(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation in fullscreen */}
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {currentMedia.type === 'video' ? (
              <video
                src={currentMedia.url}
                className="max-w-full max-h-full"
                controls
                autoPlay
              />
            ) : (
              <img
                src={currentMedia.url}
                alt=""
                className="max-w-full max-h-full object-contain"
              />
            )}

            {/* Dots in fullscreen */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
              {media.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentIndex 
                      ? 'bg-white' 
                      : 'bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MediaCarousel;
