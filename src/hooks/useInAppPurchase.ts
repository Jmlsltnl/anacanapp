import { tr } from "@/lib/tr";import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import {
  isNativePlatform,
  hasRevenueCatPlugin,
  initRevenueCat,
  identifyUser,
  checkEntitlement,
  getOfferings,
  purchasePackage,
  restorePurchases as rcRestore,
  presentPaywall,
  presentCustomerCenter,
  RC_PRODUCTS,
  RC_OFFERING_ID,
  REVENUECAT_CONFIG } from
'@/lib/revenuecat';

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
    defaultOptionId?: string | null;
    defaultOptionHasFreeTrial?: boolean;
    defaultOptionTrialPeriod?: string | null;
    defaultOptionTags?: string[];
    subscriptionOptions?: Array<{
      id: string;
      isBasePlan: boolean;
      tags: string[];
      hasFreeTrial: boolean;
      trialPeriod: string | null;
      fullPricePeriod: string | null;
    }>;
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
  showPaywallSafe: () => Promise<{didPurchase: boolean;available: boolean;}>;
  showCustomerCenter: () => Promise<void>;
  refreshEntitlements: () => Promise<void>;
}

export function useInAppPurchase(): UseInAppPurchaseReturn {
  const { user, refreshProfile } = useAuth();
  const [packages, setPackages] = useState<RCPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const syncWithDatabaseRef = useRef<
    ((isPro: boolean, productId?: string, expiresAtOverride?: string | null, willRenew?: boolean) => Promise<void>) | null>(
    null);


  // Initialize RevenueCat
  useEffect(() => {
    const init = async () => {
      if (!isNativePlatform()) {
        setIsSupported(false);
        setIsLoading(false);
        return;
      }

      if (!hasRevenueCatPlugin()) {
        setIsSupported(false);
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

        // Self-heal: if store says Pro but DB/profile is out of sync, re-sync now.
        // willRenew ötürülür → store-dan ləğv (auto-renew off) hər açılışda tutulur.
        if (ent.isPro && user?.id) {
          syncWithDatabaseRef.current?.(true, ent.productId || undefined, ent.expiresAt || null, ent.willRenew);
        }

        // Referral: trial→premium konversiyasını aşkarla (dəvət edənə +7 gün)
        if (user?.id) {
          import('@/lib/referralSync').then((m) =>
          m.syncReferralStatusFromEntitlement(ent.periodType, ent.isPro)
          ).catch(() => {});
        }

        // Load offerings — YENİ build versiyalı offering-i üstün tutur
        // (pricing_2026: $3.99 ay trial-sız / $29.99 il). Tapılmasa current-ə
        // düşür. Köhnə build-lər bu kodu daşımadığından current-də qalır →
        // qiymət/trial dəyişikliyini görmürlər.
        const offerings = await getOfferings();
        const activeOffering =
        offerings?.all?.[RC_OFFERING_ID]?.availablePackages?.length ?
        offerings.all[RC_OFFERING_ID] :
        offerings?.current;
        if (activeOffering?.availablePackages) {
          const pkgs: RCPackage[] = activeOffering.availablePackages.map((pkg: any) => {
            const defaultOption = pkg.product?.defaultOption;
            const subscriptionOptions = Array.isArray(pkg.product?.subscriptionOptions) ?
            pkg.product.subscriptionOptions.map((option: any) => ({
              id: option?.id || '',
              isBasePlan: !!option?.isBasePlan,
              tags: Array.isArray(option?.tags) ? option.tags : [],
              hasFreeTrial: !!option?.freePhase,
              trialPeriod: option?.freePhase?.billingPeriod || null,
              fullPricePeriod: option?.fullPricePhase?.billingPeriod || null
            })) :
            [];

            return {
              identifier: pkg.identifier,
              packageType: pkg.packageType,
              product: {
                identifier: pkg.product?.identifier || '',
                title: pkg.product?.title || '',
                description: pkg.product?.description || '',
                priceString: pkg.product?.priceString || '',
                price: pkg.product?.price || 0,
                currencyCode: pkg.product?.currencyCode || '',
                defaultOptionId: defaultOption?.id || null,
                defaultOptionHasFreeTrial: !!defaultOption?.freePhase,
                defaultOptionTrialPeriod: defaultOption?.freePhase?.billingPeriod || null,
                defaultOptionTags: Array.isArray(defaultOption?.tags) ? defaultOption.tags : [],
                subscriptionOptions
              },
              _raw: pkg
            };
          });
          setPackages(pkgs);
        }
      } catch (err) {
        console.error('RevenueCat init error:', err);
        setError(tr("useinapppurchase_odenis_sistemi_yuklene_bilmedi_90af92", "\xD6d\u0259ni\u015F sistemi y\xFCkl\u0259n\u0259 bilm\u0259di"));
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [user?.id]);

  const syncWithDatabase = useCallback(async (isPro: boolean, productId?: string, expiresAtOverride?: string | null, willRenew?: boolean) => {
    if (!user) return;
    try {
      const planType = productId?.includes('yearly') || productId?.includes('lifetime') ?
      'premium_plus' : 'premium';

      // Store-dan ləğv edilmiş amma hələ aktiv abunə: RC willRenew=false →
      // DB status 'cancelled' (win-back axını bunu görür). willRenew yenidən
      // açılıbsa 'active'-ə sağalır. Əvvəllər store-side ləğvlər DB-yə düşmürdü.
      const status = !isPro ? 'expired' : willRenew === false ? 'cancelled' : 'active';

      const expiresAt = expiresAtOverride ?
      new Date(expiresAtOverride) :
      (() => {
        const fallback = new Date();
        if (productId?.includes('lifetime')) {
          fallback.setFullYear(fallback.getFullYear() + 100);
        } else if (productId?.includes('yearly')) {
          fallback.setFullYear(fallback.getFullYear() + 1);
        } else {
          fallback.setMonth(fallback.getMonth() + 1);
        }
        return fallback;
      })();

      const { error: subError } = await supabase.
      from('subscriptions').
      upsert({
        user_id: user.id,
        plan_type: isPro ? planType : 'free',
        status,
        started_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString()
      }, { onConflict: 'user_id' });
      if (subError) console.error('Subscription sync error:', subError);

      const { error: profileError } = await supabase.
      from('profiles').
      update({
        is_premium: isPro,
        premium_until: isPro ? expiresAt.toISOString() : null
      }).
      eq('user_id', user.id);
      if (profileError) console.error('Profile sync error:', profileError);

      // Refresh in-memory profile so the UI unlocks premium immediately
      await refreshProfile();
    } catch (err) {
      console.error('DB sync error:', err);
    }
  }, [user, refreshProfile]);

  useEffect(() => {
    syncWithDatabaseRef.current = syncWithDatabase;
  }, [syncWithDatabase]);

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
        const entitlement = result.customerInfo?.entitlements?.active?.[REVENUECAT_CONFIG.ENTITLEMENT_ID];
        await syncWithDatabase(true, pkg.product.identifier, entitlement?.expirationDate || null, (entitlement as any)?.willRenew ?? true);

        // Analytics: real qiymət/valyuta ilə (FB value-optimization + GA4 purchase).
        // Trial başlanğıcı ayrıca konversiyadır (Meta StartTrial / GA4).
        const isTrial = (entitlement as any)?.periodType === 'TRIAL' || (entitlement as any)?.periodType === 'INTRO';
        import('@/lib/analytics').then((m) => {
          if (isTrial) {
            m.analytics.logTrialStarted(pkg.identifier, pkg.product.price, pkg.product.currencyCode);
          } else {
            m.analytics.logPremiumSubscribed(pkg.identifier, pkg.product.price, pkg.product.currencyCode);
          }
        }).catch(() => {});

        // Referral: alış anında statusu sinxronla (TRIAL → 'trial', NORMAL → 'converted')
        import('@/lib/referralSync').then((m) =>
        m.syncReferralStatusFromEntitlement((entitlement as any)?.periodType || 'NORMAL', true)
        ).catch(() => {});
        return true;
      }

      setError(result.error || tr("useinapppurchase_alis_tamamlana_bilmedi_yeniden_8c3980", "Al\u0131\u015F tamamlana bilm\u0259di. Yenid\u0259n c\u0259hd edin."));
      return false;
    } catch (err: any) {
      console.error('Purchase error:', err);
      setError(tr("useinapppurchase_purchase_error", "Alış zamanı xəta: {error}").replace("{error}", err?.message || tr("useinapppurchase_namelum_xeta_aa30e7", "Nam\u0259lum x\u0259ta")));
      return false;
    } finally {
      setIsPurchasing(false);
    }
  }, [syncWithDatabase]);

  const purchaseByIdentifier = useCallback(async (identifier: string): Promise<boolean> => {
    // packageType uyğunluğu: məhsul ID-lərində 'monthly'/'yearly' olmasa belə işləsin
    // (məs. yeni pricing_2026 məhsulları 'annual' adlandırıla bilər)
    const TYPE_MAP: Record<string, string> = { monthly: 'MONTHLY', yearly: 'ANNUAL', lifetime: 'LIFETIME' };
    const pkg = packages.find((p) =>
    p.identifier === identifier ||
    p.product.identifier.includes(identifier) ||
    (TYPE_MAP[identifier] ? p.packageType === TYPE_MAP[identifier] : false) ||
    (identifier === 'yearly' && p.product.identifier.includes('annual'))
    );
    if (!pkg) {
      setError(tr("useinapppurchase_mehsul_tapilmadi_ff5957", "M\u0259hsul tap\u0131lmad\u0131"));
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
      setError(tr("useinapppurchase_alislar_berpa_edile_bilmedi_33b266", "Al\u0131\u015Flar b\u0259rpa edil\u0259 bilm\u0259di"));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [syncWithDatabase]);

  const showPaywall = useCallback(async (): Promise<boolean> => {
    const result = await presentPaywall();
    // If RC paywall is not available (plugin missing / no paywall configured),
    // signal caller to keep the custom modal open. We return false here; the
    // caller checks `result.available` only when needed.
    if (!result.available) return false;
    if (result.didPurchase) {
      setIsPro(true);
      await syncWithDatabase(true);
      return true;
    }
    return false;
  }, [syncWithDatabase]);

  // Expose whether the native paywall flow is actually available
  const showPaywallSafe = useCallback(async (): Promise<{didPurchase: boolean;available: boolean;}> => {
    const result = await presentPaywall();
    if (result.available && result.didPurchase) {
      setIsPro(true);
      await syncWithDatabase(true);
    }
    return result;
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
    } else if (ent.isPro) {
      // Customer Center-də ləğv / bərpa oluna bilər → willRenew statusunu dərhal əks etdir
      await syncWithDatabase(true, ent.productId || undefined, ent.expiresAt || null, ent.willRenew);
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
    showPaywallSafe,
    showCustomerCenter,
    refreshEntitlements
  };
}