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

interface SyncOptions {
  /** Satın alma/bərpa dərhal sonra çağırılır: RC-nin öz REST API-sinin təzə
   * alışı "görməsi" bir neçə saniyə gecikə bilər (eventual consistency) —
   * bu halda tək cəhd kifayət etməyə bilər. true olanda, cavab isPro:false
   * gəlsə belə bir neçə dəfə (artan gecikmə ilə) təkrar sınanılır ki, real
   * ödəniş RC-nin özündə "görünənə qədər" səhvən "pulsuz" kimi yazılmasın. */
  expectPro?: boolean;
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
  const syncWithDatabaseRef = useRef<((opts?: SyncOptions) => Promise<boolean>) | null>(null);


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

        // Check entitlements (yalnız ANİ UI göstəricisi üçün — DB yazısı YOX,
        // bax syncWithDatabase: real yazı yalnız server-side edge function
        // vasitəsilə, RevenueCat-ın öz REST API-sindən müstəqil təsdiqlə olur).
        const ent = await checkEntitlement();
        setIsPro(ent.isPro);

        // Hər açılışda / login-də DB-ni RC-nin HƏQİQİ vəziyyəti ilə sinxronla —
        // istifadəçi heç bir paywall ekranı açmasa belə (məs. auto-renew olub,
        // ya ləğv edilib) DB köhnəlmiş qalmasın (əvvəllər YALNIZ ent.isPro=true
        // olanda sync olunurdu — indi hər iki istiqamətdə, hər açılışda).
        if (user?.id) {
          syncWithDatabaseRef.current?.();
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

  // Server-side sinxron — TƏK etibarlı yazı yolu (bax sync-revenuecat-entitlement
  // edge function). Edge function RevenueCat-ın öz REST API-sindən (məxfi
  // açarla, yalnız serverdə) real entitlement vəziyyətini müstəqil çəkir —
  // klientin sözünə etibar ETMİR. subscriptions cədvəli artıq client-tərəfi
  // yazıla bilmir (Duzelis33.sql).
  //
  // DÜZƏLİŞ (təkrar-cəhd əlavəsi): əvvəllər BİR dəfə cəhd olunurdu — uğursuz
  // olsa (edge function cold-start, alışdan dərhal sonrakı qısa şəbəkə
  // kəsilməsi, RC-nin öz serverinin təzə alışı hələ "görməməsi" kimi adi
  // eventual-consistency gecikməsi) HEÇ bir təkrar cəhd yox idi — istifadəçi
  // ödəyib "Premium aktivləşdi! 🎉" görürdü, DB isə səssizcə köhnə qalırdı.
  // Bir müştəri məhz bu səbəbdən Premium ala bilməyib şikayət etdi.
  const syncWithDatabase = useCallback(async (opts?: SyncOptions): Promise<boolean> => {
    if (!user) return false;
    const maxAttempts = opts?.expectPro ? 4 : 1;
    const delaysMs = [0, 1500, 3000, 6000];

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (delaysMs[attempt]) await new Promise((resolve) => setTimeout(resolve, delaysMs[attempt]));
      try {
        const { data, error } = await supabase.functions.invoke('sync-revenuecat-entitlement');
        if (error) {
          console.error(`sync-revenuecat-entitlement error (cəhd ${attempt + 1}/${maxAttempts}):`, error);
          continue;
        }
        if (typeof data?.isPro === 'boolean') setIsPro(data.isPro);
        // Refresh in-memory profile so the UI unlocks/locks premium immediately
        await refreshProfile();
        if (!opts?.expectPro || data?.isPro === true) {
          return !!data?.isPro;
        }
        // expectPro=true amma isPro=false gəldi → RC serverinin gecikməsi ola
        // bilər, növbəti (daha uzun gözləmə ilə) cəhdə keç.
      } catch (err) {
        console.error(`DB sync error (cəhd ${attempt + 1}/${maxAttempts}):`, err);
      }
    }
    return false;
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
        // DB yazısı + referral konversiya təsdiqi indi TAMAMİLƏ server-side
        // (sync-revenuecat-entitlement edge function RC-nin öz REST API-sini
        // çağırıb müstəqil təsdiqləyir — klient artıq bunu tətikləmir).
        // expectPro:true — RC serveri bu təzə alışı hələ "görməyə" bilər,
        // isPro:false gəlsə bir neçə dəfə təkrar sınanılsın.
        await syncWithDatabase({ expectPro: true });

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
        // Məhsul ID/tarixi ötürməyə ehtiyac yoxdur — edge function RC-dən
        // real, düzgün (illik/lifetime daxil) məlumatı özü çəkir (əvvəllər
        // bura parametr ötürülmürdü deyə həmişə "+1 ay" fallback-a düşürdü,
        // illik/lifetime abunəçiləri səhvən 1 ay sonra "bitmiş" göstərirdi).
        await syncWithDatabase({ expectPro: true });
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
      await syncWithDatabase({ expectPro: true });
      return true;
    }
    return false;
  }, [syncWithDatabase]);

  // Expose whether the native paywall flow is actually available
  const showPaywallSafe = useCallback(async (): Promise<{didPurchase: boolean;available: boolean;}> => {
    const result = await presentPaywall();
    if (result.available && result.didPurchase) {
      setIsPro(true);
      await syncWithDatabase({ expectPro: true });
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
    // Customer Center-də istənilən dəyişiklik (ləğv/bərpa/itki) — hər iki
    // istiqamətdə server-side sinxronlanır (edge function RC-dən real vəziyyəti çəkir).
    await syncWithDatabase();
  }, [syncWithDatabase]);

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