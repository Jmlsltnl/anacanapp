/**
 * Facebook / Meta App Events wrapper
 *
 * Native (iOS/Android) üçün Meta SDK-na real `AppEvents` göndərir
 * (Meta Ads Manager-də konversiya optimizasiyası üçün istifadə olunur).
 * Web-də heç nə etmir — Meta web pikseli ayrıca quraşdırılmalıdır.
 */

import { Capacitor } from '@capacitor/core';
import { FacebookEvents } from 'capacitor-facebook-events';

// IMPORTANT: Capacitor plugin proxies can be treated as thenables if they cross
// async/promise boundaries. Keep plugin lookup synchronous and only await real
// native method calls like `logEvent()` or `setAdvertiserTrackingEnabled()`.
let fbPlugin: any | null = null;
let initialized = false;

const getPlugin = (): any | null => {
  if (!Capacitor.isNativePlatform()) return null;
  if (fbPlugin) return fbPlugin;
  try {
    fbPlugin = FacebookEvents ?? null;
    return fbPlugin;
  } catch (e) {
    console.warn('[fb-events] plugin not available:', e);
    return null;
  }
};

/**
 * iOS ATT (App Tracking Transparency) icazəsi verildikdən sonra çağırılır.
 * Bu olmadan Meta reklam atribusiyası limit olur.
 */
export const setFacebookAdvertiserTracking = async (enabled: boolean) => {
  const p = getPlugin();
  if (!p) return;
  try {
    await p.setAdvertiserTrackingEnabled({ enabled });
  } catch (e) {
    console.warn('[fb-events] setAdvertiserTrackingEnabled failed', e);
  }
};

/**
 * Daxili event adlarını Facebook standart event adlarına çevirir.
 * Standart adlar Meta Ads Manager-də konversiya kampaniyaları üçün istifadə olunur.
 * Tanınmayan eventlər custom event kimi öz adı ilə göndərilir.
 */
const EVENT_MAP: Record<string, string> = {
  sign_up: 'fb_mobile_complete_registration',
  login: 'fb_mobile_login',
  premium_subscribed: 'Subscribe',
  premium_paywall_shown: 'fb_mobile_initiated_checkout',
  premium_paywall_clicked: 'fb_mobile_add_payment_info',
  premium_cancelled: 'CancelSubscription',
  tool_opened: 'fb_mobile_content_view',
  tool_used: 'fb_mobile_activate_app',
  ai_chat_started: 'StartChat',
  ai_chat_message: 'SendChatMessage',
  blog_read: 'fb_mobile_content_view',
  community_post_created: 'fb_mobile_achievement_unlocked',
  partner_linked: 'fb_mobile_complete_registration',
  baby_photo_generated: 'GenerateContent',
  fairy_tale_generated: 'GenerateContent',
  appointment_created: 'fb_mobile_schedule',
  shopping_item_added: 'fb_mobile_add_to_cart',
};

/**
 * Sanitize params: Facebook params yalnız string/number/bool qəbul edir, undefined-ləri sil.
 */
const cleanParams = (params?: Record<string, any>) => {
  if (!params) return {};
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    if (typeof v === 'object') {
      try { out[k] = JSON.stringify(v).slice(0, 200); } catch { /* skip */ }
    } else {
      out[k] = v;
    }
  }
  return out;
};

/**
 * Bütün analytics eventlərini Facebook-a da log edir (paralel olaraq).
 * Səssiz fail — analytics heç vaxt app-ı sındırmamalıdır.
 */
export const logFacebookEvent = async (eventName: string, params?: Record<string, any>) => {
  const p = getPlugin();
  if (!p) return;
  try {
    const fbEvent = EVENT_MAP[eventName] || eventName;
    const cleaned = cleanParams(params);

    // Purchase üçün _valueToSum və fb_currency vacibdir
    if (eventName === 'premium_subscribed' && params?.price && !cleaned._valueToSum) {
      cleaned._valueToSum = Number(params.price);
      cleaned.fb_currency = params.currency || 'USD';
    }

    await p.logEvent({ event: fbEvent, params: cleaned });
  } catch (e) {
    // sakitcə uğursuz ol
  }
};

/**
 * App start zamanı çağırılır — pluginin yüklənməsini "isti" tutur.
 */
export const initFacebookEvents = async () => {
  if (initialized) return;
  initialized = true;
  if (!Capacitor.isNativePlatform()) return;
  getPlugin();
};
