/**
 * Push bildirişi → tətbiq-daxili naviqasiya körpüsü.
 *
 * Problem: köhnə handler `window.location.hash = '#/?tab=...'` yazırdı,
 * amma naviqasiya state-əsaslıdır və heç nə hash-ı oxumurdu →
 * push toxunuşları HEÇ YERƏ aparmırdı.
 *
 * Həll: data.type → intent; Index CustomEvent ilə tətbiq edir.
 * Soyuq başlanğıc üçün pending saxlanılır (Index mount olanda istehlak edir).
 */

export interface PushNavIntent {
  tab?: string;
  screen?: string;
  /** Qadın tərəfdə partner söhbəti (MessagesScreen) */
  motherChat?: boolean;
}

export const PUSH_NAV_EVENT = 'anacan-push-nav';

let pending: PushNavIntent | null = null;

/** data.type → intent xəritəsi. Bilinməyən tip = sadəcə tətbiqi aç. */
export function intentFromPushData(data: Record<string, any>): PushNavIntent | null {
  const type = String(data?.type || '');

  switch (type) {
    case 'message':
    case 'partner_message':
    case 'love':
    case 'thank_you':
      return { motherChat: true }; // Index rola görə partner chat tab-ına çevirir
    case 'community_like':
    case 'community_comment':
    case 'like':
    case 'comment':
    case 'community':
      return { tab: 'community' };
    case 'premium_expired':
    case 'subscription':
      return { screen: 'billing' };
    case 'contraction_511':
      return { screen: 'live-contractions' }; // partner tərəf
    case 'appointment':
    case 'appointment_reminder':
      return { screen: 'calendar' };
    case 'flow_reminder':
    case 'period_reminder':
    case 'pill_reminder':
      return { tab: 'home' };
    case 'sos':
    case 'birth':
      // AlertReceiver realtime overlay-i onsuz da açılır — tətbiqi açmaq kifayətdir
      return null;
    default:
      return null;
  }
}

/** Push toxunuşunda çağırılır (useDeviceToken). */
export function navigateFromPush(data: Record<string, any>): void {
  // Açıq URL deeplink-i varsa ona üstünlük ver
  if (data?.deeplink && typeof data.deeplink === 'string') {
    try {
      window.location.href = data.deeplink;
      return;
    } catch {/* aşağıdakı intent yolu ilə davam */}
  }

  const intent = intentFromPushData(data);
  if (!intent) return;

  pending = intent;
  try {
    window.dispatchEvent(new CustomEvent(PUSH_NAV_EVENT, { detail: intent }));
  } catch (e) {
    console.warn('[pushNav] dispatch failed:', e);
  }
}

/** Index mount olanda soyuq başlanğıc intentini götürür. */
export function consumePendingPushNav(): PushNavIntent | null {
  const p = pending;
  pending = null;
  return p;
}
