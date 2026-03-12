import { useEffect } from 'react';

/**
 * Hook to automatically track screen views in Firebase Analytics + internal DB.
 * Place at the top of every screen/tool component.
 */
export const useScreenAnalytics = (screenName: string, screenClass?: string) => {
  useEffect(() => {
    import('@/lib/analytics').then(m => 
      m.analytics.logScreenView(screenName, screenClass || screenName)
    ).catch(() => {});
  }, [screenName, screenClass]);
};

/**
 * Fire-and-forget analytics event helper (non-blocking).
 */
export const trackEvent = (
  eventName: Parameters<typeof import('@/lib/analytics').analytics.logEvent>[0] extends never ? string : any,
  params?: Record<string, string | number | boolean | undefined>
) => {
  import('@/lib/analytics').then(m => m.analytics.logEvent(eventName, params)).catch(() => {});
};
