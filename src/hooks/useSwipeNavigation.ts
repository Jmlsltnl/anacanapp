import { useEffect, useRef, useCallback } from 'react';

interface SwipeNavigationOptions {
  onSwipeBack?: () => void;
  onSwipeForward?: () => void;
  edgeWidth?: number;
  threshold?: number;
  enabled?: boolean;
}

/**
 * iOS-style edge swipe navigation.
 * Tracks touchmove continuously to avoid scroll containers eating the gesture.
 */
export const useSwipeNavigation = ({
  onSwipeBack,
  onSwipeForward,
  edgeWidth = 50,
  threshold = 40,
  enabled = true,
}: SwipeNavigationOptions = {}) => {
  const onSwipeBackRef = useRef(onSwipeBack);
  const onSwipeForwardRef = useRef(onSwipeForward);
  
  // Keep refs in sync without re-registering listeners
  useEffect(() => {
    onSwipeBackRef.current = onSwipeBack;
    onSwipeForwardRef.current = onSwipeForward;
  }, [onSwipeBack, onSwipeForward]);

  useEffect(() => {
    if (!enabled) return;

    let startX = 0;
    let startY = 0;
    let maxDeltaX = 0;
    let edge: 'left' | 'right' | null = null;
    let settled = false; // once we know it's horizontal vs vertical

    const handleTouchStart = (e: TouchEvent) => {
      const x = e.touches[0].clientX;
      const screenW = window.innerWidth;

      if (x <= edgeWidth) {
        edge = 'left';
      } else if (x >= screenW - edgeWidth) {
        edge = 'right';
      } else {
        edge = null;
        return;
      }

      startX = x;
      startY = e.touches[0].clientY;
      maxDeltaX = 0;
      settled = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!edge) return;
      
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      const deltaX = Math.abs(x - startX);
      const deltaY = Math.abs(y - startY);

      // After 10px of movement, decide if this is horizontal or vertical
      if (!settled && (deltaX > 10 || deltaY > 10)) {
        if (deltaY > deltaX * 1.2) {
          // Vertical scroll — abort
          edge = null;
          return;
        }
        settled = true;
      }

      if (deltaX > maxDeltaX) {
        maxDeltaX = deltaX;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!edge || !settled) {
        edge = null;
        return;
      }

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startX;

      if (Math.abs(deltaX) < threshold && maxDeltaX < threshold) {
        edge = null;
        return;
      }

      // Use maxDeltaX as fallback if touchend delta is small (scroll consumed it)
      const effectiveDelta = Math.abs(deltaX) >= threshold ? deltaX : (edge === 'left' ? maxDeltaX : -maxDeltaX);

      if (edge === 'left' && effectiveDelta > 0) {
        if (onSwipeBackRef.current) {
          onSwipeBackRef.current();
        } else {
          window.history.back();
        }
      } else if (edge === 'right' && effectiveDelta < 0) {
        if (onSwipeForwardRef.current) {
          onSwipeForwardRef.current();
        } else {
          window.history.forward();
        }
      }

      edge = null;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [edgeWidth, threshold, enabled]);
};

export default useSwipeNavigation;
