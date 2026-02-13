import { useEffect, useRef } from 'react';

interface SwipeNavigationOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  enabled?: boolean;
}

/**
 * Hook to enable iOS-style swipe navigation gestures
 * Swipe right to go back, swipe left to go forward
 */
export const useSwipeNavigation = ({
  onSwipeLeft,
  onSwipeRight,
  threshold = 80,
  enabled = true
}: SwipeNavigationOptions = {}) => {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEndX.current = e.touches[0].clientX;
      touchEndY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = () => {
      if (touchStartX.current === null || touchEndX.current === null || touchStartY.current === null) {
        return;
      }

      const deltaX = touchEndX.current - touchStartX.current;
      const deltaY = Math.abs((touchEndY.current ?? touchStartY.current!) - touchStartY.current!);
      
      // Only trigger if horizontal swipe is significant and more horizontal than vertical
      if (Math.abs(deltaX) > threshold && Math.abs(deltaX) > deltaY) {
        // Swipe right (finger moved right) = go back
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        }
        // Swipe left (finger moved left) = go forward  
        else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      }

      // Reset
      touchStartX.current = null;
      touchStartY.current = null;
      touchEndX.current = null;
      touchEndY.current = null;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight, threshold, enabled]);
};

export default useSwipeNavigation;
