import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useAppSetting } from './useAppSettings';

interface Subscription {
  id: string;
  user_id: string;
  plan_type: 'free' | 'premium' | 'premium_plus';
  status: 'active' | 'cancelled' | 'expired';
  started_at: string;
  expires_at: string | null;
  updated_at?: string;
}

interface UsageTracking {
  id: string;
  user_id: string;
  feature_type: 'white_noise' | 'baby_photoshoot';
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
};

export function useSubscription() {
  const { user, profile } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageTracking[]>([]);
  const [loading, setLoading] = useState(true);

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
      } else {
        const { data: newSub } = await supabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            plan_type: 'free',
            status: 'active',
          })
          .select()
          .single();
        
        if (newSub) {
          setSubscription(newSub as Subscription);
        }
      }

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
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Premium if active subscription OR cancelled but not yet expired OR profile flag
  const isPremium = 
    (subscription?.plan_type === 'premium' || subscription?.plan_type === 'premium_plus') &&
    (subscription?.status === 'active' || 
      (subscription?.status === 'cancelled' && subscription?.expires_at && new Date(subscription.expires_at) > new Date())
    ) ||
    profile?.is_premium === true;

  const isCancelled = subscription?.status === 'cancelled';
  const cancelledButActive = isCancelled && isPremium;

  const getUsageForFeature = useCallback(
    (featureType: 'white_noise' | 'baby_photoshoot'): UsageTracking | undefined => {
      return usage.find(u => u.feature_type === featureType);
    },
    [usage]
  );

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

  const cancelSubscription = useCallback(async (): Promise<boolean> => {
    if (!user || !subscription) return false;
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', subscription.id);
      if (error) throw error;
      await fetchSubscription();
      return true;
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      return false;
    }
  }, [user, subscription, fetchSubscription]);

  const restoreSubscription = useCallback(async (): Promise<boolean> => {
    if (!user || !subscription) return false;
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'active' })
        .eq('id', subscription.id);
      if (error) throw error;
      await fetchSubscription();
      return true;
    } catch (err) {
      console.error('Error restoring subscription:', err);
      return false;
    }
  }, [user, subscription, fetchSubscription]);

  const upgradeToPremium = () => {
    return {
      showUpgradeModal: true,
      monthlyPrice: 9.99,
      yearlyPrice: 79.99,
    };
  };

  return {
    subscription,
    isPremium,
    isCancelled,
    cancelledButActive,
    loading,
    canUseWhiteNoise,
    canUseBabyPhotoshoot,
    trackWhiteNoiseUsage,
    cancelSubscription,
    restoreSubscription,
    upgradeToPremium,
    refetch: fetchSubscription,
    freeLimits,
  };
}
