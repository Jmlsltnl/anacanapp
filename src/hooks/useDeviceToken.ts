import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { pushNotifications, isNative } from '@/lib/native';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

export const useDeviceToken = () => {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Register device and save token
  const registerDevice = useCallback(async () => {
    if (!user || !isNative) return null;

    setLoading(true);
    setError(null);

    try {
      // Request permission and register
      let permStatus = await PushNotifications.checkPermissions();
      
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        setError('Push notification permission not granted');
        setLoading(false);
        return null;
      }

      // Register and wait for token
      return new Promise<string | null>((resolve) => {
        PushNotifications.addListener('registration', async (tokenData) => {
          const deviceToken = tokenData.value;
          setToken(deviceToken);

          // Save to database
          try {
            const platform = Capacitor.getPlatform();
            
            // Upsert the token
            const { error: upsertError } = await supabase
              .from('device_tokens')
              .upsert({
                user_id: user.id,
                token: deviceToken,
                platform: platform === 'ios' ? 'ios' : 'android',
                device_name: navigator.userAgent.substring(0, 100),
              }, {
                onConflict: 'user_id,token',
              });

            if (upsertError) {
              console.error('Error saving device token:', upsertError);
              setError('Failed to save device token');
            } else {
              console.log('Device token saved successfully');
            }
          } catch (err) {
            console.error('Error saving token:', err);
          }

          setLoading(false);
          resolve(deviceToken);
        });

        PushNotifications.addListener('registrationError', (err) => {
          console.error('Push registration error:', err);
          setError(err.error);
          setLoading(false);
          resolve(null);
        });

        PushNotifications.register();
      });
    } catch (err: any) {
      console.error('Error registering device:', err);
      setError(err.message);
      setLoading(false);
      return null;
    }
  }, [user]);

  // Remove device token on logout
  const unregisterDevice = useCallback(async () => {
    if (!user || !token) return;

    try {
      await supabase
        .from('device_tokens')
        .delete()
        .eq('user_id', user.id)
        .eq('token', token);
      
      setToken(null);
    } catch (err) {
      console.error('Error removing device token:', err);
    }
  }, [user, token]);

  // Auto-register on mount if native
  useEffect(() => {
    if (user && isNative) {
      registerDevice();
    }
  }, [user, registerDevice]);

  return {
    token,
    loading,
    error,
    isNative,
    registerDevice,
    unregisterDevice,
  };
};
