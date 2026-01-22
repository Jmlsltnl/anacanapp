import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SilentHoursSettings {
  enabled: boolean;
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
}

const defaultSettings: SilentHoursSettings = {
  enabled: false,
  startTime: '22:00',
  endTime: '08:00',
};

export const useSilentHours = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SilentHoursSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  // Load settings from user_preferences
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!error && data) {
          // Parse silent hours from JSON if stored
          // For now, we'll store in localStorage until we extend the schema
          const stored = localStorage.getItem(`silent_hours_${user.id}`);
          if (stored) {
            setSettings(JSON.parse(stored));
          }
        }
      } catch (err) {
        console.error('Error loading silent hours:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  // Update settings
  const updateSettings = useCallback(async (newSettings: Partial<SilentHoursSettings>) => {
    if (!user) return;
    
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    
    // Store in localStorage for now
    localStorage.setItem(`silent_hours_${user.id}`, JSON.stringify(updated));
  }, [user, settings]);

  // Check if current time is within silent hours
  const isInSilentHours = useCallback((): boolean => {
    if (!settings.enabled) return false;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const [startH, startM] = settings.startTime.split(':').map(Number);
    const [endH, endM] = settings.endTime.split(':').map(Number);
    
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    // Handle overnight ranges (e.g., 22:00 - 08:00)
    if (startMinutes > endMinutes) {
      // Silent if after start OR before end
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    } else {
      // Silent if between start and end
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }
  }, [settings]);

  return {
    settings,
    loading,
    updateSettings,
    isInSilentHours,
  };
};
