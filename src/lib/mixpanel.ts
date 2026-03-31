/**
 * Mixpanel Analytics Integration for Anacan
 * Provides: autocapture, session replay, user identification,
 * super properties, and custom event tracking for Marketing/Product/Growth.
 */

import mixpanel from 'mixpanel-browser';
import { Capacitor } from '@capacitor/core';

const MIXPANEL_TOKEN = '84aa42d1034b562f06386aebea0f4bc4';

let initialized = false;

/**
 * Initialize Mixpanel with autocapture + session replay
 */
export const initMixpanel = () => {
  if (initialized) return;

  try {
    mixpanel.init(MIXPANEL_TOKEN, {
      // Autocapture all clicks, inputs, form submits
      autocapture: {
        pageview: 'full-url',
        click: true,
        input: true,
        scroll: true,
        submit: true,
      },
      // Session replay
      record_sessions_percent: 100,
      record_block_selector: '[data-mp-block]',
      record_mask_text_selector: '[data-mp-mask]',
      // Privacy & performance
      persistence: 'localStorage',
      ignore_dnt: false,
      batch_requests: true,
      api_host: 'https://api-eu.mixpanel.com',
      // Debug in dev only
      debug: import.meta.env.DEV,
    });

    // Register super properties (sent with every event)
    mixpanel.register({
      app_name: 'Anacan',
      platform: Capacitor.isNativePlatform() ? Capacitor.getPlatform() : 'web',
      app_version: '1.0.0',
    });

    initialized = true;

    if (import.meta.env.DEV) {
      console.log('🔮 Mixpanel initialized');
    }
  } catch (error) {
    console.warn('Mixpanel initialization failed:', error);
  }
};

/**
 * Identify user and set profile properties
 */
export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  if (!initialized) return;

  try {
    mixpanel.identify(userId);

    if (properties) {
      mixpanel.people.set(properties);
    }

    // Set once properties (first time only)
    mixpanel.people.set_once({
      $created: new Date().toISOString(),
      first_platform: Capacitor.isNativePlatform() ? Capacitor.getPlatform() : 'web',
    });
  } catch (error) {
    console.warn('Mixpanel identify failed:', error);
  }
};

/**
 * Update user profile properties
 */
export const setUserProfile = (properties: Record<string, any>) => {
  if (!initialized) return;
  try {
    mixpanel.people.set(properties);
  } catch {
    // silent
  }
};

/**
 * Register super properties (attached to ALL future events)
 */
export const setSuperProperties = (properties: Record<string, any>) => {
  if (!initialized) return;
  try {
    mixpanel.register(properties);
  } catch {
    // silent
  }
};

/**
 * Reset on logout
 */
export const resetMixpanel = () => {
  if (!initialized) return;
  try {
    mixpanel.reset();
  } catch {
    // silent
  }
};

/**
 * Track custom event
 */
export const trackMixpanelEvent = (eventName: string, properties?: Record<string, any>) => {
  if (!initialized) return;
  try {
    mixpanel.track(eventName, properties);
  } catch {
    // silent
  }
};

/**
 * Track page/screen view
 */
export const trackPageView = (pageName: string, properties?: Record<string, any>) => {
  if (!initialized) return;
  try {
    mixpanel.track('Page View', {
      page_name: pageName,
      ...properties,
    });
  } catch {
    // silent
  }
};

/**
 * Increment a numeric user property (e.g. tool_uses, messages_sent)
 */
export const incrementUserProperty = (property: string, value: number = 1) => {
  if (!initialized) return;
  try {
    mixpanel.people.increment(property, value);
  } catch {
    // silent
  }
};

/**
 * Track revenue event
 */
export const trackRevenue = (amount: number, properties?: Record<string, any>) => {
  if (!initialized) return;
  try {
    mixpanel.people.track_charge(amount, properties);
    mixpanel.track('Revenue', { amount, ...properties });
  } catch {
    // silent
  }
};

/**
 * Time an event (call before the action, then track normally after)
 */
export const timeEvent = (eventName: string) => {
  if (!initialized) return;
  try {
    mixpanel.time_event(eventName);
  } catch {
    // silent
  }
};

// ─────────────────────────────────────────
// Pre-built event helpers for Product/Growth/Marketing
// ─────────────────────────────────────────

export const mpEvents = {
  // ── Onboarding & Auth ──
  signUp: (method: string) => {
    trackMixpanelEvent('Sign Up', { method });
    incrementUserProperty('sign_up_count');
  },
  login: (method: string) => {
    trackMixpanelEvent('Login', { method });
    incrementUserProperty('login_count');
  },
  onboardingCompleted: (lifeStage: string) => {
    trackMixpanelEvent('Onboarding Completed', { life_stage: lifeStage });
  },

  // ── Tool Usage (Product) ──
  toolOpened: (toolId: string, toolName: string) => {
    trackMixpanelEvent('Tool Opened', { tool_id: toolId, tool_name: toolName });
    incrementUserProperty('tools_opened');
  },
  toolUsed: (toolId: string, action: string, metadata?: Record<string, any>) => {
    trackMixpanelEvent('Tool Used', { tool_id: toolId, action, ...metadata });
    incrementUserProperty('tools_used');
  },

  // ── AI (Product) ──
  aiChatStarted: (chatType: string) => {
    trackMixpanelEvent('AI Chat Started', { chat_type: chatType });
    incrementUserProperty('ai_chats_started');
  },
  aiChatMessage: (chatType: string) => {
    trackMixpanelEvent('AI Chat Message', { chat_type: chatType });
    incrementUserProperty('ai_messages_sent');
  },

  // ── Content (Growth) ──
  blogRead: (postId: string, category: string, title?: string) => {
    trackMixpanelEvent('Blog Read', { post_id: postId, category, title });
    incrementUserProperty('blogs_read');
  },
  blogLiked: (postId: string) => {
    trackMixpanelEvent('Blog Liked', { post_id: postId });
  },
  blogSaved: (postId: string) => {
    trackMixpanelEvent('Blog Saved', { post_id: postId });
  },
  recipeViewed: (recipeId: string, title?: string) => {
    trackMixpanelEvent('Recipe Viewed', { recipe_id: recipeId, title });
    incrementUserProperty('recipes_viewed');
  },

  // ── Community (Growth) ──
  postCreated: (groupId?: string) => {
    trackMixpanelEvent('Community Post Created', { group_id: groupId });
    incrementUserProperty('posts_created');
  },
  postLiked: (postId: string) => {
    trackMixpanelEvent('Community Post Liked', { post_id: postId });
  },

  // ── Health Tracking (Product) ──
  waterLogged: (glasses: number) => {
    trackMixpanelEvent('Water Logged', { glasses });
    incrementUserProperty('water_logs');
  },
  symptomLogged: (count: number) => {
    trackMixpanelEvent('Symptom Logged', { symptom_count: count });
    incrementUserProperty('symptom_logs');
  },
  weightLogged: (weight: number) => {
    trackMixpanelEvent('Weight Logged', { weight });
  },
  kickCounted: (count: number) => {
    trackMixpanelEvent('Kick Counted', { count });
    incrementUserProperty('kick_counts');
  },
  contractionTimed: (durationSec: number) => {
    trackMixpanelEvent('Contraction Timed', { duration_sec: durationSec });
  },
  mealLogged: (mealType: string, calories: number) => {
    trackMixpanelEvent('Meal Logged', { meal_type: mealType, calories });
    incrementUserProperty('meals_logged');
  },
  exerciseCompleted: (exerciseId: string, durationMin: number) => {
    trackMixpanelEvent('Exercise Completed', { exercise_id: exerciseId, duration_min: durationMin });
  },
  moodLogged: (moodValue: number) => {
    trackMixpanelEvent('Mood Logged', { mood_value: moodValue });
    incrementUserProperty('mood_logs');
  },

  // ── Premium / Revenue (Marketing) ──
  paywallShown: (source: string) => {
    trackMixpanelEvent('Paywall Shown', { source });
  },
  paywallClicked: (source: string, plan: string) => {
    trackMixpanelEvent('Paywall Clicked', { source, plan });
  },
  premiumSubscribed: (plan: string, amount?: number) => {
    trackMixpanelEvent('Premium Subscribed', { plan });
    setUserProfile({ is_premium: true, premium_plan: plan });
    if (amount) trackRevenue(amount, { plan });
  },
  premiumCancelled: () => {
    trackMixpanelEvent('Premium Cancelled');
    setUserProfile({ is_premium: false });
  },

  // ── Feature-specific (Product) ──
  babyPhotoGenerated: (style: string) => {
    trackMixpanelEvent('Baby Photo Generated', { style });
    incrementUserProperty('photos_generated');
  },
  cryAnalyzed: () => {
    trackMixpanelEvent('Cry Analyzed');
    incrementUserProperty('cry_analyses');
  },
  poopAnalyzed: () => {
    trackMixpanelEvent('Poop Analyzed');
    incrementUserProperty('poop_analyses');
  },
  fairyTaleGenerated: () => {
    trackMixpanelEvent('Fairy Tale Generated');
    incrementUserProperty('fairy_tales_generated');
  },
  breathingExerciseDone: (exerciseId: string) => {
    trackMixpanelEvent('Breathing Exercise Done', { exercise_id: exerciseId });
  },
  whiteNoisePlayed: (soundId: string) => {
    trackMixpanelEvent('White Noise Played', { sound_id: soundId });
  },
  nameSearched: (query: string) => {
    trackMixpanelEvent('Name Searched', { query });
    incrementUserProperty('name_searches');
  },
  partnerLinked: () => {
    trackMixpanelEvent('Partner Linked');
  },
  appointmentCreated: (type: string) => {
    trackMixpanelEvent('Appointment Created', { appointment_type: type });
  },
  shoppingItemAdded: () => {
    trackMixpanelEvent('Shopping Item Added');
    incrementUserProperty('shopping_items_added');
  },

  // ── Notifications (Marketing) ──
  notificationReceived: (type?: string) => {
    trackMixpanelEvent('Notification Received', { notification_type: type });
  },
  notificationClicked: (type?: string) => {
    trackMixpanelEvent('Notification Clicked', { notification_type: type });
  },

  // ── Deeplink (Marketing) ──
  deeplinkOpened: (path: string, source?: string) => {
    trackMixpanelEvent('Deeplink Opened', { path, source });
  },

  // ── Shop / Orders (Revenue) ──
  productViewed: (productId: string, name?: string) => {
    trackMixpanelEvent('Product Viewed', { product_id: productId, name });
  },
  orderPlaced: (orderType: string, amount: number) => {
    trackMixpanelEvent('Order Placed', { order_type: orderType, amount });
    trackRevenue(amount, { order_type: orderType });
  },
};

export default mixpanel;
