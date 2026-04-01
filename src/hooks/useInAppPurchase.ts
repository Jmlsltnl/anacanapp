import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import {
  isNativePlatform,
  initRevenueCat,
  identifyUser,
  checkEntitlement,
  getOfferings,
  purchasePackage,
  restorePurchases as rcRestore,
  presentPaywall,
  presentCustomerCenter,
  RC_PRODUCTS,
  REVENUECAT_CONFIG,
} from '@/lib/revenuecat';

export interface RCPackage {
  identifier: string;
  packageType: string;
  product: {
    identifier: string;
    title: string;
    description: string;
    priceString: string;
    price: number;
    currencyCode: string;
  };
  _raw: any; // full package object for purchasePackage
}

interface UseInAppPurchaseReturn {
  packages: RCPackage[];
  isLoading: boolean;
  isPurchasing: boolean;
  error: string | null;
  isSupported: boolean;
  isPro: boolean;
  purchaseByIdentifier: (identifier: string) => Promise<boolean>;
  purchaseMonthly: () => Promise<boolean>;
  purchaseYearly: () => Promise<boolean>;
  purchaseLifetime: () => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  showPaywall: () => Promise<boolean>;
  showCustomerCenter: () => Promise<void>;
  refreshEntitlements: () => Promise<void>;
}

export function useInAppPurchase(): UseInAppPurchaseReturn {
  const { user } = useAuth();
  const [packages, setPackages] = useState<RCPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isPro, setIsPro] = useState(false);

  // Initialize RevenueCat
  useEffect(() => {
    const init = async () => {
      if (!isNativePlatform()) {
        setIsLoading(false);
        return;
      }

      try {
        await initRevenueCat(user?.id);
        if (user?.id) await identifyUser(user.id);

        setIsSupported(true);

        // Check entitlements
        const ent = await checkEntitlement();
        setIsPro(ent.isPro);

        // Load offerings
        const offerings = await getOfferings();
        if (offerings?.current?.availablePackages) {
          const pkgs: RCPackage[] = offerings.current.availablePackages.map((pkg: any) => ({
            identifier: pkg.identifier,
            packageType: pkg.packageType,
            product: {
              identifier: pkg.product?.identifier || '',
              title: pkg.product?.title || '',
              description: pkg.product?.description || '',
              priceString: pkg.product?.priceString || '',
              price: pkg.product?.price || 0,
              currencyCode: pkg.product?.currencyCode || '',
            },
            _raw: pkg,
          }));
          setPackages(pkgs);
        }
      } catch (err) {
        console.error('RevenueCat init error:', err);
        setError('Ödəniş sistemi yüklənə bilmədi');
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [user?.id]);

  const syncWithDatabase = useCallback(async (isPro: boolean, productId?: string) => {
    if (!user) return;
    try {
      const planType = productId?.includes('yearly') || productId?.includes('lifetime')
        ? 'premium_plus' : 'premium';

      const expiresAt = new Date();
      if (productId?.includes('lifetime')) {
        expiresAt.setFullYear(expiresAt.getFullYear() + 100);
      } else if (productId?.includes('yearly')) {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          plan_type: isPro ? planType : 'free',
          status: isPro ? 'active' : 'expired',
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        }, { onConflict: 'user_id' });

      await supabase
        .from('profiles')
        .update({
          is_premium: isPro,
          premium_until: isPro ? expiresAt.toISOString() : null,
        })
        .eq('user_id', user.id);
    } catch (err) {
      console.error('DB sync error:', err);
    }
  }, [user]);

  const executePurchase = useCallback(async (pkg: RCPackage): Promise<boolean> => {
    setIsPurchasing(true);
    setError(null);

    try {
      const result = await purchasePackage(pkg._raw);

      if (result.error === 'USER_CANCELLED') {
        setError(null);
        return false;
      }

      if (result.success) {
        setIsPro(true);
        await syncWithDatabase(true, pkg.product.identifier);
        import('@/lib/analytics').then(m => m.analytics.logPremiumSubscribed(pkg.identifier)).catch(() => {});
        return true;
      }

      setError(result.error || 'Alış tamamlana bilmədi. Yenidən cəhd edin.');
      return false;
    } catch (err: any) {
      console.error('Purchase error:', err);
      setError(`Alış zamanı xəta: ${err?.message || 'Naməlum xəta'}`);
      return false;
    } finally {
      setIsPurchasing(false);
    }
  }, [syncWithDatabase]);

  const purchaseByIdentifier = useCallback(async (identifier: string): Promise<boolean> => {
    const pkg = packages.find(p =>
      p.identifier === identifier ||
      p.product.identifier.includes(identifier)
    );
    if (!pkg) {
      setError('Məhsul tapılmadı');
      return false;
    }
    return executePurchase(pkg);
  }, [packages, executePurchase]);

  const purchaseMonthly = useCallback(() => purchaseByIdentifier(RC_PRODUCTS.MONTHLY), [purchaseByIdentifier]);
  const purchaseYearly = useCallback(() => purchaseByIdentifier(RC_PRODUCTS.YEARLY), [purchaseByIdentifier]);
  const purchaseLifetime = useCallback(() => purchaseByIdentifier(RC_PRODUCTS.LIFETIME), [purchaseByIdentifier]);

  const handleRestore = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await rcRestore();
      if (result.success) {
        setIsPro(true);
        await syncWithDatabase(true);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Restore error:', err);
      setError('Alışlar bərpa edilə bilmədi');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [syncWithDatabase]);

  const showPaywall = useCallback(async (): Promise<boolean> => {
    const result = await presentPaywall();
    if (result.didPurchase) {
      setIsPro(true);
      await syncWithDatabase(true);
      return true;
    }
    return false;
  }, [syncWithDatabase]);

  const showCustomerCenter = useCallback(async () => {
    await presentCustomerCenter();
    // Refresh entitlements after customer center closes
    await refreshEntitlements();
  }, []);

  const refreshEntitlements = useCallback(async () => {
    const ent = await checkEntitlement();
    setIsPro(ent.isPro);
    if (!ent.isPro && isPro) {
      // User lost entitlement, sync DB
      await syncWithDatabase(false);
    }
  }, [isPro, syncWithDatabase]);

  return {
    packages,
    isLoading,
    isPurchasing,
    error,
    isSupported,
    isPro,
    purchaseByIdentifier,
    purchaseMonthly,
    purchaseYearly,
    purchaseLifetime,
    restorePurchases: handleRestore,
    showPaywall,
    showCustomerCenter,
    refreshEntitlements,
  };
}
