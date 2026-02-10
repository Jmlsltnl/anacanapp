import { useEffect } from 'react';

/**
 * Hook that scrolls to top when component mounts.
 * Used to ensure consistent scroll position on navigation.
 */
export const useScrollToTop = () => {
  useEffect(() => {
    // Scroll window to top
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    
    // Also find and scroll any overflow containers to top
    const scrollContainers = document.querySelectorAll('[data-scroll-container], .overflow-y-auto, .overflow-auto');
    scrollContainers.forEach((container) => {
      if (container instanceof HTMLElement) {
        container.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      }
    });
  }, []);
};

export default useScrollToTop;
