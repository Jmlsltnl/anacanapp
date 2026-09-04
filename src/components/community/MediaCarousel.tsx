import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { useIsRtl, rtlX } from '@/lib/rtl';

interface MediaItem {
  url: string;
  type: 'image' | 'video';
}

interface MediaCarouselProps {
  media: MediaItem[];
  onOpenFullscreen?: (index: number) => void;
}

const MediaCarousel = ({ media, onOpenFullscreen }: MediaCarouselProps) => {
  const isRtl = useIsRtl();
  const [currentIndex, setCurrentIndex] = useState(0);
  // Naviqasiya istiqaməti (1=irəli, -1=geri) — slayd animasiyasının hansı tərəfdən
  // girib-çıxacağını təyin edir (RTL-də əlavə olaraq güzgülənir, aşağıda bax).
  const [direction, setDirection] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);


  if (media.length === 0) return null;

  const goToPrevious = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setDirection(1);
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

  // Standard fixed height for all media - covers without distortion
  const mediaContainerClass = "h-[360px]";

  // Single media item
  if (media.length === 1) {
    return (
      <>
        <div className={`relative ${mediaContainerClass} bg-muted/30 rounded-2xl overflow-hidden`}>
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
                    <Play className="w-8 h-8 text-foreground ms-1" fill="currentColor" />
                  </div>
                )}
              </button>
            </div>
          ) : (
            <img
              src={currentMedia.url}
              alt=""
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => onOpenFullscreen?.(0)}
            />
          )}
        </div>

      </>
    );
  }

  // Multiple media items - Carousel
  return (
    <>
      <div className={`relative ${mediaContainerClass} bg-muted/30 rounded-2xl overflow-hidden`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: rtlX(direction * 50, isRtl) }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: rtlX(direction * -50, isRtl) }}
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
                      <Play className="w-8 h-8 text-foreground ms-1" fill="currentColor" />
                    </div>
                  </button>
                )}
              </div>
            ) : (
              <img
                src={currentMedia.url}
                alt=""
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => onOpenFullscreen?.(currentIndex)}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          className="absolute start-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        >
          <ChevronLeft className="rtl:rotate-180 w-5 h-5" />
        </button>
        <button
          onClick={goToNext}
          className="absolute end-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        >
          <ChevronRight className="rtl:rotate-180 w-5 h-5" />
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
        <div className="absolute top-2 end-2 px-2 py-1 rounded-full bg-black/50 text-white text-xs font-medium">
          {currentIndex + 1} / {media.length}
        </div>

      </div>

    </>
  );
};

export default MediaCarousel;
