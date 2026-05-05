import { Capacitor } from '@capacitor/core';

// ⚡ FEATURE FLAG: Set to true to enable RevenueCat, false for standard IAP
export const REVENUECAT_ENABLED = true;

// RevenueCat Configuration
// NOTE: RevenueCat requires PLATFORM-SPECIFIC public API keys (Android & iOS).
// Get them from: RevenueCat Dashboard → Project Settings → API Keys → Public app-specific
export const REVENUECAT_CONFIG = {
  // Android Google Play public key (starts with "goog_")
  ANDROID_API_KEY: 'goog_REPLACE_WITH_ANDROID_KEY',
  // iOS App Store public key (starts with "appl_")
  IOS_API_KEY: 'appl_REPLACE_WITH_IOS_KEY',
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
  if (!REVENUECAT_ENABLED || !isNativePlatform()) return;

  try {
    const { Purchases, LOG_LEVEL } = await import('@revenuecat/purchases-capacitor');

    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    await Purchases.configure({
      apiKey: REVENUECAT_CONFIG.API_KEY,
      appUserID: appUserID || undefined,
    });

    console.log('RevenueCat SDK configured successfully');
  } catch (err) {
    console.error('RevenueCat init error:', err);
  }
}

/**
 * Identify user in RevenueCat (call after login)
 */
export async function identifyUser(appUserID: string): Promise<void> {
  if (!REVENUECAT_ENABLED || !isNativePlatform()) return;
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
  if (!REVENUECAT_ENABLED || !isNativePlatform()) return;
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
  if (!REVENUECAT_ENABLED || !isNativePlatform()) {
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
  if (!REVENUECAT_ENABLED || !isNativePlatform()) return null;

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
 * Purchase a package
 */
export async function purchasePackage(packageToPurchase: any): Promise<{
  success: boolean;
  customerInfo?: any;
  error?: string;
}> {
  if (!REVENUECAT_ENABLED || !isNativePlatform()) {
    return { success: false, error: 'RevenueCat is disabled or not on native platform' };
  }

  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    const { customerInfo } = await Purchases.purchasePackage({
      aPackage: packageToPurchase,
    });

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
  if (!REVENUECAT_ENABLED || !isNativePlatform()) return { success: false };

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
 * Present RevenueCat native paywall
 */
export async function presentPaywall(): Promise<{
  didPurchase: boolean;
}> {
  if (!REVENUECAT_ENABLED || !isNativePlatform()) return { didPurchase: false };

  try {
    const { RevenueCatUI } = await import('@revenuecat/purchases-capacitor-ui');
    const { PAYWALL_RESULT } = await import('@revenuecat/purchases-capacitor-ui');
    const result = await RevenueCatUI.presentPaywall();
    return { didPurchase: result?.result === PAYWALL_RESULT.PURCHASED || result?.result === PAYWALL_RESULT.RESTORED };
  } catch (err) {
    console.error('RevenueCat paywall error:', err);
    return { didPurchase: false };
  }
}

/**
 * Present RevenueCat Customer Center
 */
export async function presentCustomerCenter(): Promise<void> {
  if (!REVENUECAT_ENABLED || !isNativePlatform()) return;

  try {
    const { RevenueCatUI } = await import('@revenuecat/purchases-capacitor-ui');
    await RevenueCatUI.presentCustomerCenter();
  } catch (err) {
    console.error('RevenueCat Customer Center error:', err);
  }
}
