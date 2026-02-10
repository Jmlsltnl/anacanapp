import { Capacitor } from '@capacitor/core';

// Product IDs - App Store Connect və Google Play Console-da yaradılmalı
// App ID: com.atlasoon.anacan
export const IAP_PRODUCTS = {
  PREMIUM_MONTHLY: 'com.atlasoon.anacan.premium.monthly',
  PREMIUM_YEARLY: 'com.atlasoon.anacan.premium.yearly',
} as const;

// Plan IDs for Android subscriptions (Google Play Console-da Base Plan ID)
export const IAP_PLANS = {
  MONTHLY_PLAN: 'monthly-plan',
  YEARLY_PLAN: 'yearly-plan',
} as const;

// App configuration
export const APP_CONFIG = {
  APP_ID: 'com.atlasoon.anacan',
  APP_NAME: 'Anacan',
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
