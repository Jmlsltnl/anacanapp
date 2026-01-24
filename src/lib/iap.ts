import { Capacitor } from '@capacitor/core';

// Product IDs - bu ID-ləri App Store Connect və Google Play Console-da yaratmalısınız
export const IAP_PRODUCTS = {
  PREMIUM_MONTHLY: 'app.lovable.anacan.premium.monthly',
  PREMIUM_YEARLY: 'app.lovable.anacan.premium.yearly',
} as const;

// Plan IDs for Android subscriptions
export const IAP_PLANS = {
  MONTHLY_PLAN: 'monthly-plan',
  YEARLY_PLAN: 'yearly-plan',
} as const;

export interface IAPProduct {
  productId: string;
  title: string;
  description: string;
  price: string;
  priceAmount: number;
  currency: string;
}

export interface IAPTransaction {
  transactionId: string;
  productId: string;
  purchaseToken?: string;
  receipt?: string;
  purchaseTime: number;
}

// Check if running on native platform
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

// Get current platform
export const getPlatform = (): 'ios' | 'android' | 'web' => {
  const platform = Capacitor.getPlatform();
  if (platform === 'ios') return 'ios';
  if (platform === 'android') return 'android';
  return 'web';
};
