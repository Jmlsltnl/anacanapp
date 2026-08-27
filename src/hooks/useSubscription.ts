import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useAppSetting } from './useAppSettings';
import { readCache, writeCache } from '@/lib/offlineCache';

const SUBSCRIPTION_CACHE = 'subscription';
const HOUSEHOLD_PREMIUM_CACHE = 'household_premium';

interface Subscription {
  id: string;
  user_id: string;
  plan_type: 'free' | 'premium' | 'premium_plus';
  status: 'active' | 'cancelled' | 'expired';
  started_at: string;
  expires_at: string | null;
  updated_at?: string;
  is_trial?: boolean;
  cancelled_at?: string | null;
}

/** Gündəlik say limiti olan feature-lər (usage_tracking.feature_type) */
export type DailyFeature =
  'ai_chat' | 'cry_translator' | 'poop_scanner' | 'fairy_tale' | 'horoscope' | 'baby_insight';

type UsageFeatureType = 'white_noise' | 'baby_photoshoot' | DailyFeature;

interface UsageTracking {
  id: string;
  user_id: string;
  feature_type: UsageFeatureType;
  usage_date: string;
  usage_count: number;
  usage_seconds: number;
}

// Fallback free tier limits (used if DB setting not available)
const DEFAULT_FREE_LIMITS = {
  white_noise_seconds_per_day: 20 * 60,
  baby_photoshoot_count: 3,
  fairy_tale_count_per_day: 3,
  ai_chat_count_per_day: 10,
  cry_translator_count_per_day: 3,
  poop_scanner_count_per_day: 3,
  horoscope_count_per_day: 2,
  baby_insight_count_per_day: 2,
};

const DAILY_LIMIT_KEYS: Record<DailyFeature, keyof typeof DEFAULT_FREE_LIMITS> = {
  ai_chat: 'ai_chat_count_per_day',
  cry_translator: 'cry_translator_count_per_day',
  poop_scanner: 'poop_scanner_count_per_day',
  fairy_tale: 'fairy_tale_count_per_day',
  horoscope: 'horoscope_count_per_day',
  baby_insight: 'baby_insight_count_per_day',
};

export function useSubscription() {
  const { user, profile } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [householdPremium, setHouseholdPremium] = useState(false);

  // Read free limits from DB (app_settings -> free_limits)
  const dbFreeLimits = useAppSetting('free_limits');
  
  const freeLimits = useMemo(() => {
    if (dbFreeLimits && typeof dbFreeLimits === 'object') {
      return { ...DEFAULT_FREE_LIMITS, ...dbFreeLimits };
    }
    return DEFAULT_FREE_LIMITS;
  }, [dbFreeLimits]);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (subData) {
        setSubscription(subData as Subscription);
        writeCache(SUBSCRIPTION_CACHE, user.id, subData);
      }
      // QEYD: əvvəllər burada sətir yoxdursa klient özü INSERT edirdi.
      // subscriptions cədvəli artıq yalnız admin/service-role tərəfindən
      // yazıla bilir (Duzelis33.sql — özünə sonsuz Premium yazma bug-ı
      // düzəldilib) — default 'free' sətri artıq profil yaranan kimi
      // avtomatik trigger ilə yaranır (ensure_default_subscription). Sətir
      // hələ də tapılmasa (məs. miqrasiya işlədilməyibsə), subscription
      // null qalır — ownPremium hesablaması bunu təhlükəsiz "free" sayır.

      const today = new Date().toISOString().split('T')[0];
      const { data: usageData } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', user.id)
        .eq('usage_date', today);

      if (usageData) {
        setUsage(usageData as UsageTracking[]);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      // Offline → son bilinən abunə vəziyyəti (expires_at yoxlaması ownPremium-da qalır)
      const cached = readCache<Subscription>(SUBSCRIPTION_CACHE, user.id);
      if (cached) setSubscription(cached);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Household premium: linked partnyorun abunəsi hər iki tərəfi açır.
  // RPC mövcud deyilsə (migration tətbiq olunmayıbsa) səssizcə false qalır.
  useEffect(() => {
    let cancelled = false;
    const checkHousehold = async () => {
      if (!user || !profile?.linked_partner_id) {
        setHouseholdPremium(false);
        return;
      }
      try {
        const { data, error } = await (supabase.rpc as any)('get_linked_partner_premium');
        if (!cancelled) {
          if (error) {
            // RPC xətası (offline/migration yoxdur) → son bilinən dəyər
            setHouseholdPremium(readCache<boolean>(HOUSEHOLD_PREMIUM_CACHE, user.id) === true);
          } else {
            setHouseholdPremium(data === true);
            writeCache(HOUSEHOLD_PREMIUM_CACHE, user.id, data === true);
          }
        }
      } catch {
        // Şəbəkə xətası → son bilinən dəyər (yoxdursa false)
        if (!cancelled) setHouseholdPremium(readCache<boolean>(HOUSEHOLD_PREMIUM_CACHE, user.id) === true);
      }
    };
    checkHousehold();
    return () => {cancelled = true;};
  }, [user, profile?.linked_partner_id]);

  // Müddət yoxlaması: expires_at/premium_until KEÇMİŞDƏDİRSƏ premium sayılmır.
  // (Əvvəllər 'active' status və is_premium flag-ı tarixsiz yoxlanılırdı →
  // heç bir cron/webhook olmadığı üçün premium praktikada HEÇ VAXT bitmirdi.)
  const notExpired = (until?: string | null) => !until || new Date(until) > new Date();

  const ownPremium =
  (subscription?.plan_type === 'premium' || subscription?.plan_type === 'premium_plus') &&
  (subscription?.status === 'active' || subscription?.status === 'cancelled') &&
  notExpired(subscription?.expires_at) ||
  profile?.is_premium === true && notExpired((profile as any)?.premium_until);

  // Household: linked partnyorun premiumu da sayılır
  const isPremium = ownPremium || householdPremium;

  const isCancelled = subscription?.status === 'cancelled';
  const cancelledButActive = isCancelled && ownPremium;

  const getUsageForFeature = useCallback(
    (featureType: UsageFeatureType): UsageTracking | undefined => {
      return usage.find(u => u.feature_type === featureType);
    },
    [usage]
  );

  /**
   * Gündəlik say limiti: yoxla və İSTİFADƏ ET (premium → limitsiz).
   * usage_tracking-də (user_id, feature_type, usage_date) UNIQUE olduğundan
   * upsert təhlükəsizdir. İcazə yoxdursa sayğac artırılmır.
   */
  const checkAndConsume = useCallback(async (
    feature: DailyFeature
  ): Promise<{ allowed: boolean; remaining: number; limit: number }> => {
    const limit = Number(freeLimits[DAILY_LIMIT_KEYS[feature]] ?? 0);
    if (isPremium) return { allowed: true, remaining: Infinity, limit };
    if (!user) return { allowed: false, remaining: 0, limit };

    const today = new Date().toISOString().split('T')[0];
    try {
      const { data: row } = await supabase
        .from('usage_tracking')
        .select('id, usage_count')
        .eq('user_id', user.id)
        .eq('feature_type', feature)
        .eq('usage_date', today)
        .maybeSingle();

      const used = row?.usage_count || 0;
      if (used >= limit) return { allowed: false, remaining: 0, limit };

      if (row) {
        await supabase.from('usage_tracking').update({ usage_count: used + 1 }).eq('id', row.id);
      } else {
        await supabase.from('usage_tracking').upsert({
          user_id: user.id,
          feature_type: feature,
          usage_date: today,
          usage_count: 1,
        }, { onConflict: 'user_id,feature_type,usage_date' });
      }
      return { allowed: true, remaining: Math.max(0, limit - used - 1), limit };
    } catch (e) {
      // Şəbəkə xətasında istifadəçini bloklamırıq (limit "best effort"-dur)
      console.error('checkAndConsume failed:', e);
      return { allowed: true, remaining: 0, limit };
    }
  }, [isPremium, user, freeLimits]);

  /** Gündəlik limitdən nə qədər qalıb — YALNIZ oxuyur (UI sayğacları üçün). */
  const peekRemainingDaily = useCallback(async (
    feature: DailyFeature
  ): Promise<{ remaining: number; limit: number }> => {
    const limit = Number(freeLimits[DAILY_LIMIT_KEYS[feature]] ?? 0);
    if (isPremium) return { remaining: Infinity, limit };
    if (!user) return { remaining: 0, limit };
    const today = new Date().toISOString().split('T')[0];
    try {
      const { data: row } = await supabase
        .from('usage_tracking')
        .select('usage_count')
        .eq('user_id', user.id)
        .eq('feature_type', feature)
        .eq('usage_date', today)
        .maybeSingle();
      return { remaining: Math.max(0, limit - (row?.usage_count || 0)), limit };
    } catch {
      return { remaining: limit, limit };
    }
  }, [isPremium, user, freeLimits]);

  const canUseWhiteNoise = useCallback((): { allowed: boolean; remainingSeconds: number } => {
    if (isPremium) {
      return { allowed: true, remainingSeconds: Infinity };
    }

    const whiteNoiseUsage = getUsageForFeature('white_noise');
    const usedSeconds = whiteNoiseUsage?.usage_seconds || 0;
    const remaining = freeLimits.white_noise_seconds_per_day - usedSeconds;

    return {
      allowed: remaining > 0,
      remainingSeconds: Math.max(0, remaining),
    };
  }, [getUsageForFeature, isPremium, freeLimits]);

  const canUseBabyPhotoshoot = useCallback(async (): Promise<{ allowed: boolean; remainingCount: number }> => {
    if (isPremium) {
      return { allowed: true, remainingCount: Infinity };
    }

    if (!user) {
      return { allowed: false, remainingCount: 0 };
    }

    const { count } = await supabase
      .from('baby_photos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const totalPhotos = count || 0;
    const remaining = freeLimits.baby_photoshoot_count - totalPhotos;

    return {
      allowed: remaining > 0,
      remainingCount: Math.max(0, remaining),
    };
  }, [isPremium, user, freeLimits]);

  const trackWhiteNoiseUsage = useCallback(async (seconds: number) => {
    if (!user || isPremium) return;

    const today = new Date().toISOString().split('T')[0];
    const existingUsage = getUsageForFeature('white_noise');

    if (existingUsage) {
      await supabase
        .from('usage_tracking')
        .update({ usage_seconds: existingUsage.usage_seconds + seconds })
        .eq('id', existingUsage.id);
    } else {
      await supabase
        .from('usage_tracking')
        .insert({
          user_id: user.id,
          feature_type: 'white_noise',
          usage_date: today,
          usage_seconds: seconds,
        });
    }

    fetchSubscription();
  }, [fetchSubscription, getUsageForFeature, isPremium, user]);

  // !!! DEPRECATED (Duzelis33 təhlükəsizlik düzəlişi) !!!
  // Əvvəllər bu 2 funksiya subscriptions.status-u BİRBAŞA DB-də dəyişirdi —
  // real Store/RevenueCat vəziyyətinə heç toxunmadan. Nəticədə:
  //  - "Cancel" — Google Play/App Store-da abunəlik REAL olaraq davam edir,
  //    istifadəçi ödənişi almağa davam edir, amma tətbiq "ləğv edilib" göstərir.
  //  - "Restore" — heç bir yoxlama olmadan statusu "active"-ə qaytarırdı.
  // subscriptions cədvəli artıq client-tərəfi yazıla bilmir (RLS, Duzelis33).
  // Doğru axın: BillingScreen.tsx Android-də Play Store-un abunəlik idarəetmə
  // səhifəsinə yönləndirir (real ləğv), iOS-da RC Customer Center (artıq belə
  // idi), "Restore" isə useInAppPurchase().restorePurchases()-i çağırır (real
  // RC restore + server-side sync-revenuecat-entitlement). Bu 2 funksiya heç
  // yerdən çağırılmır, saxlanılıb ki tarixçə/kontekst itməsin.
  const cancelSubscription = useCallback(async (): Promise<boolean> => {
    console.warn('cancelSubscription() deprecated — see BillingScreen.tsx Play Store deep-link / RC Customer Center');
    return false;
  }, []);

  const restoreSubscription = useCallback(async (): Promise<boolean> => {
    console.warn('restoreSubscription() deprecated — use useInAppPurchase().restorePurchases() instead');
    return false;
  }, []);

  const upgradeToPremium = () => {
    return {
      showUpgradeModal: true,
      monthlyPrice: 3.99,
      yearlyPrice: 29.99,
    };
  };

  return {
    subscription,
    isPremium,
    ownPremium,
    householdPremium,
    isCancelled,
    cancelledButActive,
    loading,
    canUseWhiteNoise,
    canUseBabyPhotoshoot,
    trackWhiteNoiseUsage,
    checkAndConsume,
    peekRemainingDaily,
    cancelSubscription,
    restoreSubscription,
    upgradeToPremium,
    refetch: fetchSubscription,
    freeLimits,
  };
}
