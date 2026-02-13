import { useEffect, useRef } from 'react';

interface SwipeNavigationOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  enabled?: boolean;
}

/**
 * Hook to enable swipe navigation gestures on mobile devices
 * Swipe right to go back, swipe left to go forward
 */
export const useSwipeNavigation = ({
  onSwipeLeft,
  onSwipeRight,
  threshold = 60,
  enabled = true
}: SwipeNavigationOptions = {}) => {
  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      startX.current = touch.clientX;
      startY.current = touch.clientY;
      startTime.current = Date.now();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startX.current;
      const deltaY = Math.abs(touch.clientY - startY.current);
      const elapsed = Date.now() - startTime.current;

      if (elapsed > 800 || deltaY > Math.abs(deltaX)) return;
      if (Math.abs(deltaX) < threshold) return;

      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight, threshold, enabled]);
};

export default useSwipeNavigation;
