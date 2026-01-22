import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Subscription {
  id: string;
  user_id: string;
  plan_type: 'free' | 'premium' | 'premium_plus';
  status: 'active' | 'cancelled' | 'expired';
  started_at: string;
  expires_at: string | null;
}

interface UsageTracking {
  id: string;
  user_id: string;
  feature_type: 'white_noise' | 'baby_photoshoot';
  usage_date: string;
  usage_count: number;
  usage_seconds: number;
}

// Free tier limits
const FREE_LIMITS = {
  white_noise_seconds_per_day: 20 * 60, // 20 minutes
  baby_photoshoot_count: 3, // First 3 photos free
};

export function useSubscription() {
  const { user, profile } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageTracking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch subscription
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (subData) {
        setSubscription(subData as Subscription);
      } else {
        // Create default free subscription
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

      // Fetch today's usage
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

  // Check both subscription table AND profile.is_premium flag
  const isPremium = 
    subscription?.plan_type === 'premium' || 
    subscription?.plan_type === 'premium_plus' ||
    profile?.is_premium === true;

  const getUsageForFeature = (featureType: 'white_noise' | 'baby_photoshoot'): UsageTracking | undefined => {
    return usage.find(u => u.feature_type === featureType);
  };

  const canUseWhiteNoise = (): { allowed: boolean; remainingSeconds: number } => {
    if (isPremium) {
      return { allowed: true, remainingSeconds: Infinity };
    }

    const whiteNoiseUsage = getUsageForFeature('white_noise');
    const usedSeconds = whiteNoiseUsage?.usage_seconds || 0;
    const remaining = FREE_LIMITS.white_noise_seconds_per_day - usedSeconds;

    return {
      allowed: remaining > 0,
      remainingSeconds: Math.max(0, remaining),
    };
  };

  const canUseBabyPhotoshoot = async (): Promise<{ allowed: boolean; remainingCount: number }> => {
    if (isPremium) {
      return { allowed: true, remainingCount: Infinity };
    }

    if (!user) {
      return { allowed: false, remainingCount: 0 };
    }

    // Get total photo count
    const { count } = await supabase
      .from('baby_photos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const totalPhotos = count || 0;
    const remaining = FREE_LIMITS.baby_photoshoot_count - totalPhotos;

    return {
      allowed: remaining > 0,
      remainingCount: Math.max(0, remaining),
    };
  };

  const trackWhiteNoiseUsage = async (seconds: number) => {
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

    // Refresh usage
    fetchSubscription();
  };

  const upgradeToPremium = () => {
    // This would integrate with Stripe or another payment provider
    // For now, we'll just show a message
    return {
      showUpgradeModal: true,
      monthlyPrice: 9.99,
      yearlyPrice: 79.99,
    };
  };

  return {
    subscription,
    isPremium,
    loading,
    canUseWhiteNoise,
    canUseBabyPhotoshoot,
    trackWhiteNoiseUsage,
    upgradeToPremium,
    refetch: fetchSubscription,
    freeLimits: FREE_LIMITS,
  };
}
