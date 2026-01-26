/**
 * Firebase Analytics integration for Anacan app
 * Handles both web and native platforms via Capacitor
 */

import { Capacitor } from '@capacitor/core';

// Firebase Analytics for web
let firebaseAnalytics: any = null;

// Initialize Firebase for web (lazy loaded)
const initWebAnalytics = async () => {
  if (firebaseAnalytics) return firebaseAnalytics;
  
  try {
    const { initializeApp, getApps } = await import('firebase/app');
    const { getAnalytics, logEvent: firebaseLogEvent, setUserId: firebaseSetUserId, setUserProperties: firebaseSetUserProps } = await import('firebase/analytics');
    
    // Firebase config - these are public/publishable keys
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
    };
    
    // Check if Firebase is configured
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      console.warn('Firebase Analytics not configured. Set VITE_FIREBASE_* environment variables.');
      return null;
    }
    
    // Initialize Firebase app if not already initialized
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    firebaseAnalytics = getAnalytics(app);
    
    console.log('Firebase Analytics initialized for web');
    return { analytics: firebaseAnalytics, logEvent: firebaseLogEvent, setUserId: firebaseSetUserId, setUserProperties: firebaseSetUserProps };
  } catch (error) {
    console.warn('Firebase Analytics initialization failed:', error);
    return null;
  }
};

// Analytics events types
export type AnalyticsEvent = 
  | 'page_view'
  | 'screen_view'
  | 'login'
  | 'sign_up'
  | 'tool_opened'
  | 'tool_used'
  | 'blog_read'
  | 'blog_liked'
  | 'blog_saved'
  | 'community_post_created'
  | 'community_post_liked'
  | 'ai_chat_started'
  | 'ai_chat_message'
  | 'partner_linked'
  | 'premium_subscribed'
  | 'premium_cancelled'
  | 'notification_received'
  | 'notification_clicked'
  | 'water_logged'
  | 'symptom_logged'
  | 'weight_logged'
  | 'kick_counted'
  | 'contraction_timed'
  | 'meal_logged'
  | 'exercise_completed'
  | 'baby_photo_generated'
  | 'shopping_item_added'
  | 'appointment_created'
  | 'mood_logged'
  | 'custom_event';

export interface AnalyticsParams {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Log an analytics event
 */
export const logEvent = async (eventName: AnalyticsEvent, params?: AnalyticsParams): Promise<void> => {
  try {
    if (Capacitor.isNativePlatform()) {
      // Use Capacitor Firebase Analytics for native
      const { FirebaseAnalytics } = await import('@capacitor-firebase/analytics');
      await FirebaseAnalytics.logEvent({
        name: eventName,
        params: params as Record<string, any> || {},
      });
    } else {
      // Use web Firebase Analytics
      const webAnalytics = await initWebAnalytics();
      if (webAnalytics) {
        webAnalytics.logEvent(webAnalytics.analytics, eventName, params);
      }
    }
    
    // Also log to console in development
    if (import.meta.env.DEV) {
      console.log(`📊 Analytics: ${eventName}`, params);
    }
  } catch (error) {
    console.warn('Failed to log analytics event:', error);
  }
};

/**
 * Set user ID for analytics
 */
export const setUserId = async (userId: string | null): Promise<void> => {
  try {
    if (Capacitor.isNativePlatform()) {
      const { FirebaseAnalytics } = await import('@capacitor-firebase/analytics');
      await FirebaseAnalytics.setUserId({ userId: userId || '' });
    } else {
      const webAnalytics = await initWebAnalytics();
      if (webAnalytics) {
        webAnalytics.setUserId(webAnalytics.analytics, userId);
      }
    }
  } catch (error) {
    console.warn('Failed to set analytics user ID:', error);
  }
};

/**
 * Set user properties
 */
export const setUserProperties = async (properties: Record<string, string>): Promise<void> => {
  try {
    if (Capacitor.isNativePlatform()) {
      const { FirebaseAnalytics } = await import('@capacitor-firebase/analytics');
      for (const [key, value] of Object.entries(properties)) {
        await FirebaseAnalytics.setUserProperty({ key, value });
      }
    } else {
      const webAnalytics = await initWebAnalytics();
      if (webAnalytics) {
        webAnalytics.setUserProperties(webAnalytics.analytics, properties);
      }
    }
  } catch (error) {
    console.warn('Failed to set analytics user properties:', error);
  }
};

/**
 * Log screen view
 */
export const logScreenView = async (screenName: string, screenClass?: string): Promise<void> => {
  await logEvent('screen_view', {
    screen_name: screenName,
    screen_class: screenClass || screenName,
  });
};

// Convenience methods for common events
export const analytics = {
  logEvent,
  setUserId,
  setUserProperties,
  logScreenView,
  
  // Auth events
  logLogin: (method: string) => logEvent('login', { method }),
  logSignUp: (method: string) => logEvent('sign_up', { method }),
  
  // Tool events
  logToolOpened: (toolId: string) => logEvent('tool_opened', { tool_id: toolId }),
  logToolUsed: (toolId: string, action: string) => logEvent('tool_used', { tool_id: toolId, action }),
  
  // Blog events
  logBlogRead: (postId: string, category: string) => logEvent('blog_read', { post_id: postId, category }),
  logBlogLiked: (postId: string) => logEvent('blog_liked', { post_id: postId }),
  logBlogSaved: (postId: string) => logEvent('blog_saved', { post_id: postId }),
  
  // Community events
  logPostCreated: (groupId?: string) => logEvent('community_post_created', { group_id: groupId }),
  logPostLiked: (postId: string) => logEvent('community_post_liked', { post_id: postId }),
  
  // AI events
  logAIChatStarted: (chatType: string) => logEvent('ai_chat_started', { chat_type: chatType }),
  logAIChatMessage: (chatType: string) => logEvent('ai_chat_message', { chat_type: chatType }),
  
  // Health tracking events
  logWaterIntake: (glasses: number) => logEvent('water_logged', { glasses }),
  logSymptom: (symptoms: string[]) => logEvent('symptom_logged', { symptom_count: symptoms.length }),
  logWeight: (weight: number) => logEvent('weight_logged', { weight }),
  logKickCount: (count: number) => logEvent('kick_counted', { count }),
  logContraction: (durationSec: number) => logEvent('contraction_timed', { duration_sec: durationSec }),
  logMeal: (mealType: string, calories: number) => logEvent('meal_logged', { meal_type: mealType, calories }),
  logExercise: (exerciseId: string, durationMin: number) => logEvent('exercise_completed', { exercise_id: exerciseId, duration_min: durationMin }),
  logMood: (moodValue: number) => logEvent('mood_logged', { mood_value: moodValue }),
  
  // Feature events
  logBabyPhotoGenerated: (style: string) => logEvent('baby_photo_generated', { style }),
  logShoppingItemAdded: () => logEvent('shopping_item_added'),
  logAppointmentCreated: (type: string) => logEvent('appointment_created', { appointment_type: type }),
  
  // Premium events
  logPremiumSubscribed: (plan: string) => logEvent('premium_subscribed', { plan }),
  logPartnerLinked: () => logEvent('partner_linked'),
};

export default analytics;
