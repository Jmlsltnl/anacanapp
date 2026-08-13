import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Privacy toggle-larının DB persist-i (user_preferences).
 * Əvvəllər bu ayarlar yalnız local state idi — heç yerə yazılmırdı.
 * Sütunlar migration-a qədər yoxdursa → default-larla işləyir, yazma xətası revert edir.
 */

export interface PrivacyPrefs {
  privacy_profile_visible: boolean;
  privacy_show_in_community: boolean;
  privacy_allow_messages: boolean;
  privacy_share_analytics: boolean;
  privacy_location_sharing: boolean;
  privacy_notification_sounds: boolean;
}

export const DEFAULT_PRIVACY: PrivacyPrefs = {
  privacy_profile_visible: true,
  privacy_show_in_community: true,
  privacy_allow_messages: true,
  privacy_share_analytics: false,
  privacy_location_sharing: true,
  privacy_notification_sounds: true
};

const KEYS = Object.keys(DEFAULT_PRIVACY) as (keyof PrivacyPrefs)[];

export const usePrivacyPreferences = () => {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<PrivacyPrefs>(DEFAULT_PRIVACY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) {setLoading(false);return;}
      try {
        const { data, error } = await (supabase as any).
        from('user_preferences').
        select(KEYS.join(', ')).
        eq('user_id', user.id).
        maybeSingle();

        if (!cancelled && !error && data) {
          const next = { ...DEFAULT_PRIVACY };
          for (const k of KEYS) {
            if (typeof data[k] === 'boolean') next[k] = data[k];
          }
          setPrefs(next);
        }
      } catch (e) {
        console.warn('privacy prefs unavailable:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {cancelled = true;};
  }, [user]);

  const updatePref = useCallback(async (key: keyof PrivacyPrefs, value: boolean): Promise<boolean> => {
    if (!user) return false;
    const prev = prefs;
    setPrefs((p) => ({ ...p, [key]: value })); // optimistic
    try {
      const { error } = await (supabase as any).
      from('user_preferences').
      upsert({ user_id: user.id, [key]: value }, { onConflict: 'user_id' });
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('privacy pref save failed:', e);
      setPrefs(prev); // revert
      return false;
    }
  }, [user, prefs]);

  return { prefs, updatePref, loading };
};
