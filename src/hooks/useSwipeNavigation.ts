import { useEffect, useRef } from 'react';

interface SwipeNavigationOptions {
  onSwipeBack?: () => void;
  onSwipeForward?: () => void;
  edgeWidth?: number;
  threshold?: number;
  enabled?: boolean;
}

/**
 * Edge-only swipe navigation hook.
 * Swipe from left edge → go back, swipe from right edge → go forward.
 * Only triggers when the touch starts within `edgeWidth` px of the screen edge.
 */
export const useSwipeNavigation = ({
  onSwipeBack,
  onSwipeForward,
  edgeWidth = 30,
  threshold = 60,
  enabled = true,
}: SwipeNavigationOptions = {}) => {
  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);
  const edge = useRef<'left' | 'right' | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      const x = e.touches[0].clientX;
      const screenW = window.innerWidth;

      if (x <= edgeWidth) {
        edge.current = 'left';
      } else if (x >= screenW - edgeWidth) {
        edge.current = 'right';
      } else {
        edge.current = null;
        return;
      }

      startX.current = x;
      startY.current = e.touches[0].clientY;
      startTime.current = Date.now();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!edge.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startX.current;
      const deltaY = Math.abs(touch.clientY - startY.current);
      const elapsed = Date.now() - startTime.current;

      // Ignore if too slow, too vertical, or too short
      if (elapsed > 800 || deltaY > Math.abs(deltaX) || Math.abs(deltaX) < threshold) {
        edge.current = null;
        return;
      }

      if (edge.current === 'left' && deltaX > 0) {
        // Swiped right from left edge → go back
        if (onSwipeBack) {
          onSwipeBack();
        } else {
          window.history.back();
        }
      } else if (edge.current === 'right' && deltaX < 0) {
        // Swiped left from right edge → go forward
        if (onSwipeForward) {
          onSwipeForward();
        } else {
          window.history.forward();
        }
      }

      edge.current = null;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeBack, onSwipeForward, edgeWidth, threshold, enabled]);
};

export default useSwipeNavigation;
