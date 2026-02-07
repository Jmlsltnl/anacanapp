import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Capacitor } from '@capacitor/core';

interface AppRatingState {
  shouldShowPrompt: boolean;
  loading: boolean;
  recordAction: (action: 'later' | 'rated' | 'never') => Promise<void>;
  checkAndShowPrompt: () => Promise<boolean>;
}

export const useAppRating = (): AppRatingState => {
  const { user } = useAuth();
  const [shouldShowPrompt, setShouldShowPrompt] = useState(false);
  const [loading, setLoading] = useState(true);

  const getPlatform = (): string => {
    if (Capacitor.isNativePlatform()) {
      return Capacitor.getPlatform(); // 'ios' or 'android'
    }
    return 'web';
  };

  const checkAndShowPrompt = useCallback(async (): Promise<boolean> => {
    if (!user) {
      setLoading(false);
      return false;
    }

    try {
      // Get user's profile to check when they registered
      const { data: profile } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        setLoading(false);
        return false;
      }

      const registrationDate = new Date(profile.created_at);
      const now = new Date();
      const daysSinceRegistration = Math.floor((now.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24));

      // Only show after 2 days of usage
      if (daysSinceRegistration < 2) {
        setLoading(false);
        return false;
      }

      // Check rating prompt history
      const { data: ratingPrompt } = await supabase
        .from('app_rating_prompts')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!ratingPrompt) {
        // First time - show prompt
        setShouldShowPrompt(true);
        setLoading(false);
        return true;
      }

      // Already rated or chose 'never' - don't show
      if (ratingPrompt.last_action === 'rated' || ratingPrompt.last_action === 'never') {
        setLoading(false);
        return false;
      }

      // Check if 'later' was chosen and 1 day has passed
      if (ratingPrompt.last_action === 'later') {
        const lastShown = new Date(ratingPrompt.last_shown_at);
        const hoursSinceLastShown = (now.getTime() - lastShown.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastShown >= 24) {
          setShouldShowPrompt(true);
          setLoading(false);
          return true;
        }
      }

      setLoading(false);
      return false;
    } catch (error) {
      console.error('Error checking app rating:', error);
      setLoading(false);
      return false;
    }
  }, [user]);

  const recordAction = useCallback(async (action: 'later' | 'rated' | 'never') => {
    if (!user) return;

    try {
      const platform = getPlatform();
      const now = new Date().toISOString();

      const { data: existing } = await supabase
        .from('app_rating_prompts')
        .select('id, show_count')
        .eq('user_id', user.id)
        .single();

      if (existing) {
        await supabase
          .from('app_rating_prompts')
          .update({
            last_action: action,
            last_shown_at: now,
            show_count: (existing.show_count || 1) + 1,
            rated_at: action === 'rated' ? now : null,
            platform,
            updated_at: now
          })
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('app_rating_prompts')
          .insert({
            user_id: user.id,
            last_action: action,
            platform,
            rated_at: action === 'rated' ? now : null
          });
      }

      setShouldShowPrompt(false);
    } catch (error) {
      console.error('Error recording rating action:', error);
    }
  }, [user]);

  useEffect(() => {
    checkAndShowPrompt();
  }, [checkAndShowPrompt]);

  return {
    shouldShowPrompt,
    loading,
    recordAction,
    checkAndShowPrompt
  };
};

// Helper to open app store
export const openAppStore = () => {
  const platform = Capacitor.getPlatform();
  
  if (platform === 'ios') {
    // Replace with your actual App Store ID
    window.open('https://apps.apple.com/app/id123456789', '_blank');
  } else if (platform === 'android') {
    // Replace with your actual package name
    window.open('https://play.google.com/store/apps/details?id=app.lovable.anacan', '_blank');
  }
};
