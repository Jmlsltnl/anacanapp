import { useEffect, useRef, useCallback } from 'react';

interface SwipeNavigationOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  edgeWidth?: number;
  enabled?: boolean;
}

/**
 * Hook to enable swipe navigation gestures on mobile devices
 * Swipe right to go back, swipe left to go forward
 * Works reliably on Capacitor WebView (iOS & Android)
 */
export const useSwipeNavigation = ({
  onSwipeLeft,
  onSwipeRight,
  threshold = 60,
  edgeWidth = 40,
  enabled = true
}: SwipeNavigationOptions = {}) => {
  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);
  const isSwiping = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    startTime.current = Date.now();
    isSwiping.current = true;
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!isSwiping.current) return;
    isSwiping.current = false;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startX.current;
    const deltaY = Math.abs(touch.clientY - startY.current);
    const elapsed = Date.now() - startTime.current;

    // Ignore if too slow (>800ms) or more vertical than horizontal
    if (elapsed > 800 || deltaY > Math.abs(deltaX)) return;

    // Must exceed threshold
    if (Math.abs(deltaX) < threshold) return;

    // Swipe right (finger moved right) = go back
    if (deltaX > 0 && onSwipeRight) {
      onSwipeRight();
    }
    // Swipe left (finger moved left) = go forward
    else if (deltaX < 0 && onSwipeLeft) {
      onSwipeLeft();
    }
  }, [onSwipeLeft, onSwipeRight, threshold]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd, enabled]);
};

export default useSwipeNavigation;
