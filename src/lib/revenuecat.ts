import { Capacitor } from '@capacitor/core';

// ⚡ FEATURE FLAG: RevenueCat enabled for full IAP + Paywall support.
// REQUIREMENTS for Android:
//   1. After pulling this code, run: npm install && npx cap sync android
//   2. Configure a Paywall in RevenueCat Dashboard → Paywalls (otherwise
//      presentPaywall() silently no-ops and the JS custom UI is used).
//   3. Ensure offerings & products are set in RevenueCat Dashboard.
export const REVENUECAT_ENABLED = true;

// RevenueCat Configuration
// NOTE: RevenueCat requires PLATFORM-SPECIFIC public API keys (Android & iOS).
// Get them from: RevenueCat Dashboard → Project Settings → API Keys → Public app-specific
export const REVENUECAT_CONFIG = {
  // Android Google Play public key (starts with "goog_")
  ANDROID_API_KEY: 'goog_oMjcZonQOQKsqInQGZdfeBeJEDg',
  // iOS App Store public key (starts with "appl_")
  IOS_API_KEY: 'appl_QFkRqVsmtObOxwBjvTUKChSFubL',
  // Fallback (used if platform-specific is not set) — keep for backwards compat
  API_KEY: 'test_bXWdDDnuTuBrVDYOOviwZDCLvIW',
  ENTITLEMENT_ID: 'Anacan LLC Pro',
} as const;

function getApiKey(): string {
  const platform = Capacitor.getPlatform();
  if (platform === 'android' && !REVENUECAT_CONFIG.ANDROID_API_KEY.startsWith('goog_REPLACE')) {
    return REVENUECAT_CONFIG.ANDROID_API_KEY;
  }
  if (platform === 'ios' && !REVENUECAT_CONFIG.IOS_API_KEY.startsWith('appl_REPLACE')) {
    return REVENUECAT_CONFIG.IOS_API_KEY;
  }
  return REVENUECAT_CONFIG.API_KEY;
}

// Product identifiers (must match RevenueCat dashboard)
export const RC_PRODUCTS = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  LIFETIME: 'lifetime',
} as const;

export const isNativePlatform = (): boolean => Capacitor.isNativePlatform();

export const hasRevenueCatPlugin = (): boolean =>
  isNativePlatform() && Capacitor.isPluginAvailable('Purchases');

// Android-də native RevenueCat UI (paywall/customer center) crash path verdiyi
// üçün yalnız iOS-da aktiv saxlayırıq. Android custom paywall + direct purchase
// flow istifadə edir.
export const canUseNativePaywallUI = (): boolean =>
  REVENUECAT_ENABLED &&
  isNativePlatform() &&
  Capacitor.getPlatform() === 'ios' &&
  Capacitor.isPluginAvailable('RevenueCatUI');

export const hasRevenueCatUIPlugin = (): boolean =>
  canUseNativePaywallUI();

export const getPlatform = (): 'ios' | 'android' | 'web' => {
  const p = Capacitor.getPlatform();
  if (p === 'ios') return 'ios';
  if (p === 'android') return 'android';
  return 'web';
};

/**
 * Initialize RevenueCat SDK. Call once at app startup on native platforms.
 */
export async function initRevenueCat(appUserID?: string): Promise<void> {
  if (!REVENUECAT_ENABLED || !hasRevenueCatPlugin()) return;

  try {
    const { Purchases, LOG_LEVEL } = await import('@revenuecat/purchases-capacitor');

    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    await Purchases.configure({
      apiKey: getApiKey(),
      appUserID: appUserID || undefined,
    });

    console.log('[RevenueCat] SDK configured successfully on', Capacitor.getPlatform());
  } catch (err) {
    console.error('[RevenueCat] init error:', err);
  }
}

/**
 * Identify user in RevenueCat (call after login)
 */
export async function identifyUser(appUserID: string): Promise<void> {
  if (!REVENUECAT_ENABLED || !hasRevenueCatPlugin()) return;
  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    await Purchases.logIn({ appUserID });
  } catch (err) {
    console.error('RevenueCat identify error:', err);
  }
}

/**
 * Log out user from RevenueCat (call after logout)
 */
export async function logOutRevenueCat(): Promise<void> {
  if (!REVENUECAT_ENABLED || !hasRevenueCatPlugin()) return;
  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    await Purchases.logOut();
  } catch (err) {
    console.error('RevenueCat logout error:', err);
  }
}

/**
 * Check if user has the Pro entitlement
 */
export async function checkEntitlement(): Promise<{
  isPro: boolean;
  expiresAt: string | null;
  productId: string | null;
  willRenew: boolean;
}> {
  if (!REVENUECAT_ENABLED || !hasRevenueCatPlugin()) {
    return { isPro: false, expiresAt: null, productId: null, willRenew: false };
  }

  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    const { customerInfo } = await Purchases.getCustomerInfo();
    const entitlement = customerInfo.entitlements.active[REVENUECAT_CONFIG.ENTITLEMENT_ID];

    if (entitlement) {
      return {
        isPro: true,
        expiresAt: entitlement.expirationDate || null,
        productId: entitlement.productIdentifier || null,
        willRenew: entitlement.willRenew ?? false,
      };
    }

    return { isPro: false, expiresAt: null, productId: null, willRenew: false };
  } catch (err) {
    console.error('RevenueCat entitlement check error:', err);
    return { isPro: false, expiresAt: null, productId: null, willRenew: false };
  }
}

/**
 * Get available offerings/packages
 */
export async function getOfferings() {
  if (!REVENUECAT_ENABLED || !hasRevenueCatPlugin()) return null;

  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    const result = await Purchases.getOfferings();
    // Workaround: TS types say PurchasesOfferings directly, but runtime wraps in { offerings }
    const offerings = ('offerings' in result) ? (result as any).offerings : result;
    return offerings;
  } catch (err) {
    console.error('RevenueCat offerings error:', err);
    return null;
  }
}

/**
 * Find the best subscription option for purchase on Android (Google Play).
 * Google Play free trials live on OFFERS, not on the base plan. To guarantee
 * the trial is applied we must explicitly purchase the SubscriptionOption that
 * contains a freePhase, instead of relying on defaultOption.
 */
export function findFreeTrialOption(pkg: any): any | null {
  const options = pkg?.product?.subscriptionOptions;
  if (!Array.isArray(options) || options.length === 0) return null;

  // 1) Prefer an offer (non base-plan) with a free trial phase
  const trialOffer = options.find((o: any) => o?.freePhase && !o?.isBasePlan);
  if (trialOffer) return trialOffer;

  // 2) Any option with a free phase
  const anyTrial = options.find((o: any) => o?.freePhase);
  if (anyTrial) return anyTrial;

  return null;
}

/**
 * Purchase a package.
 * On Android, explicitly purchases the free-trial SubscriptionOption when one
 * exists and the defaultOption doesn't already include it (eligibility-safe).
 */
export async function purchasePackage(packageToPurchase: any): Promise<{
  success: boolean;
  customerInfo?: any;
  error?: string;
}> {
  if (!REVENUECAT_ENABLED || !hasRevenueCatPlugin()) {
    return { success: false, error: 'RevenueCat is disabled or not on native platform' };
  }

  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    let customerInfo: any;

    if (Capacitor.getPlatform() === 'android') {
      const trialOption = findFreeTrialOption(packageToPurchase);
      const defaultHasTrial = !!packageToPurchase?.product?.defaultOption?.freePhase;

      if (trialOption && !defaultHasTrial) {
        // Default option would skip the trial — force the trial offer.
        console.log('[RevenueCat] Purchasing free-trial subscription option:', trialOption?.id);
        try {
          const result = await Purchases.purchaseSubscriptionOption({
            subscriptionOption: trialOption,
          });
          customerInfo = result.customerInfo;
        } catch (optionErr: any) {
          if (optionErr?.code === 1 || optionErr?.message?.includes('cancel') || optionErr?.userCancelled) {
            return { success: false, error: 'USER_CANCELLED' };
          }
          // Fall back to standard package purchase (e.g. user not trial-eligible)
          console.warn('[RevenueCat] Trial option purchase failed, falling back to package purchase:', optionErr?.message);
          const fallback = await Purchases.purchasePackage({ aPackage: packageToPurchase });
          customerInfo = fallback.customerInfo;
        }
      } else {
        if (trialOption) {
          console.log('[RevenueCat] defaultOption already includes free trial — purchasing package');
        } else {
          console.log('[RevenueCat] No free-trial option found on product — purchasing base plan');
        }
        const result = await Purchases.purchasePackage({ aPackage: packageToPurchase });
        customerInfo = result.customerInfo;
      }
    } else {
      const result = await Purchases.purchasePackage({ aPackage: packageToPurchase });
      customerInfo = result.customerInfo;
    }

    const isPro = !!customerInfo.entitlements.active[REVENUECAT_CONFIG.ENTITLEMENT_ID];
    return { success: isPro, customerInfo };
  } catch (err: any) {
    if (err?.code === 1 || err?.message?.includes('cancel') || err?.userCancelled) {
      return { success: false, error: 'USER_CANCELLED' };
    }
    console.error('RevenueCat purchase error:', err);
    return { success: false, error: err?.message || 'Purchase failed' };
  }
}

/**
 * Restore purchases
 */
export async function restorePurchases(): Promise<{
  success: boolean;
  customerInfo?: any;
}> {
  if (!REVENUECAT_ENABLED || !hasRevenueCatPlugin()) return { success: false };

  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    const { customerInfo } = await Purchases.restorePurchases();
    const isPro = !!customerInfo.entitlements.active[REVENUECAT_CONFIG.ENTITLEMENT_ID];
    return { success: isPro, customerInfo };
  } catch (err) {
    console.error('RevenueCat restore error:', err);
    return { success: false };
  }
}

/**
 * Present RevenueCat native paywall.
 * Returns { didPurchase: false, available: false } when the RevenueCat UI
 * plugin or a configured paywall is not available — caller should fall back
 * to the custom in-app modal UI.
 */
export async function presentPaywall(): Promise<{
  didPurchase: boolean;
  available: boolean;
}> {
  if (!canUseNativePaywallUI()) {
    return { didPurchase: false, available: false };
  }

  try {
    const mod = await import('@revenuecat/purchases-capacitor-ui').catch(() => null);
    if (!mod || !mod.RevenueCatUI) {
      console.warn('[RevenueCat] UI plugin not available — falling back to custom paywall');
      return { didPurchase: false, available: false };
    }
    const { RevenueCatUI, PAYWALL_RESULT } = mod;
    const result = await RevenueCatUI.presentPaywall();
    const didPurchase =
      result?.result === PAYWALL_RESULT.PURCHASED ||
      result?.result === PAYWALL_RESULT.RESTORED;
    return { didPurchase, available: true };
  } catch (err) {
    console.error('[RevenueCat] paywall error — falling back to custom UI:', err);
    return { didPurchase: false, available: false };
  }
}

/**
 * Present RevenueCat Customer Center
 */
export async function presentCustomerCenter(): Promise<void> {
  if (!canUseNativePaywallUI()) return;

  try {
    const { RevenueCatUI } = await import('@revenuecat/purchases-capacitor-ui');
    await RevenueCatUI.presentCustomerCenter();
  } catch (err) {
    console.error('RevenueCat Customer Center error:', err);
  }
}
