import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { isNative, isIOS, isAndroid } from '@/lib/native';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

export const useDeviceToken = () => {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const registrationAttempted = useRef(false);

  // Save token to database
  const saveTokenToDatabase = useCallback(async (deviceToken: string, userId: string) => {
    try {
      const platform = Capacitor.getPlatform();
      console.log('[DeviceToken] Saving token to database:', {
        userId,
        platform,
        tokenPreview: deviceToken.substring(0, 20) + '...',
      });

      // First check if token already exists
      const { data: existing } = await supabase
        .from('device_tokens')
        .select('id')
        .eq('user_id', userId)
        .eq('token', deviceToken)
        .single();

      if (existing) {
        console.log('[DeviceToken] Token already exists, updating timestamp');
        const { error: updateError } = await supabase
          .from('device_tokens')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', existing.id);

        if (updateError) {
          console.error('[DeviceToken] Update error:', updateError);
        }
        return true;
      }

      // Insert new token
      const { error: insertError } = await supabase
        .from('device_tokens')
        .insert({
          user_id: userId,
          token: deviceToken,
          platform: platform === 'ios' ? 'ios' : 'android',
          device_name: `${platform} - ${navigator.userAgent.substring(0, 50)}`,
        });

      if (insertError) {
        console.error('[DeviceToken] Insert error:', insertError);
        
        // If duplicate key error, try upsert
        if (insertError.code === '23505') {
          console.log('[DeviceToken] Duplicate detected, trying upsert...');
          const { error: upsertError } = await supabase
            .from('device_tokens')
            .upsert({
              user_id: userId,
              token: deviceToken,
              platform: platform === 'ios' ? 'ios' : 'android',
              device_name: `${platform} - ${navigator.userAgent.substring(0, 50)}`,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id,token',
            });

          if (upsertError) {
            console.error('[DeviceToken] Upsert error:', upsertError);
            return false;
          }
        } else {
          return false;
        }
      }

      console.log('[DeviceToken] Token saved successfully!');
      return true;
    } catch (err) {
      console.error('[DeviceToken] Exception saving token:', err);
      return false;
    }
  }, []);

  // Register device and save token
  const registerDevice = useCallback(async () => {
    if (!user) {
      console.log('[DeviceToken] No user, skipping registration');
      return null;
    }

    if (!isNative) {
      console.log('[DeviceToken] Not native platform, skipping');
      return null;
    }

    if (registrationAttempted.current) {
      console.log('[DeviceToken] Registration already attempted');
      return token;
    }

    registrationAttempted.current = true;
    setLoading(true);
    setError(null);

    console.log('[DeviceToken] Starting registration process...');
    console.log('[DeviceToken] Platform:', Capacitor.getPlatform());
    console.log('[DeviceToken] User ID:', user.id);

    try {
      // Check current permission status
      let permStatus = await PushNotifications.checkPermissions();
      console.log('[DeviceToken] Current permission:', permStatus.receive);

      if (permStatus.receive === 'prompt') {
        console.log('[DeviceToken] Requesting permissions...');
        permStatus = await PushNotifications.requestPermissions();
        console.log('[DeviceToken] Permission result:', permStatus.receive);
      }

      if (permStatus.receive !== 'granted') {
        const errorMsg = 'Push notification permission denied';
        console.log('[DeviceToken]', errorMsg);
        setError(errorMsg);
        setLoading(false);
        return null;
      }

      // Set up listeners BEFORE registering
      console.log('[DeviceToken] Setting up listeners...');

      // Remove any existing listeners first
      await PushNotifications.removeAllListeners();

      // Registration success listener
      PushNotifications.addListener('registration', async (tokenData) => {
        const deviceToken = tokenData.value;
        console.log('[DeviceToken] Registration successful!');
        console.log('[DeviceToken] Token received:', deviceToken.substring(0, 30) + '...');
        
        setToken(deviceToken);
        
        // Save to database
        const saved = await saveTokenToDatabase(deviceToken, user.id);
        if (!saved) {
          setError('Token alındı amma saxlanmadı');
        }
        
        setLoading(false);
      });

      // Registration error listener
      PushNotifications.addListener('registrationError', (err) => {
        console.error('[DeviceToken] Registration error:', err);
        setError(err.error || 'Registration failed');
        setLoading(false);
      });

      // Push received listener (for debugging)
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('[DeviceToken] Push received:', notification);
      });

      // Now register
      console.log('[DeviceToken] Calling register()...');
      await PushNotifications.register();
      console.log('[DeviceToken] register() called, waiting for callback...');

      // Return a promise that resolves when registration completes
      return new Promise<string | null>((resolve) => {
        // Timeout after 10 seconds
        const timeout = setTimeout(() => {
          console.log('[DeviceToken] Registration timeout');
          setLoading(false);
          resolve(null);
        }, 10000);

        // Check periodically if token was set
        const checkInterval = setInterval(() => {
          if (token) {
            clearTimeout(timeout);
            clearInterval(checkInterval);
            resolve(token);
          }
        }, 500);
      });

    } catch (err: any) {
      console.error('[DeviceToken] Registration exception:', err);
      setError(err.message || 'Unknown error');
      setLoading(false);
      return null;
    }
  }, [user, token, saveTokenToDatabase]);

  // Remove device token on logout
  const unregisterDevice = useCallback(async () => {
    if (!user || !token) return;

    console.log('[DeviceToken] Unregistering device...');
    try {
      const { error } = await supabase
        .from('device_tokens')
        .delete()
        .eq('user_id', user.id)
        .eq('token', token);

      if (error) {
        console.error('[DeviceToken] Unregister error:', error);
      } else {
        console.log('[DeviceToken] Device unregistered');
      }
      
      setToken(null);
      registrationAttempted.current = false;
    } catch (err) {
      console.error('[DeviceToken] Unregister exception:', err);
    }
  }, [user, token]);

  // Auto-register on mount if native and user exists
  useEffect(() => {
    if (user && isNative && !registrationAttempted.current) {
      console.log('[DeviceToken] Auto-registering on mount...');
      registerDevice();
    }
  }, [user, registerDevice]);

  // Reset registration flag when user changes
  useEffect(() => {
    if (!user) {
      registrationAttempted.current = false;
      setToken(null);
    }
  }, [user]);

  return {
    token,
    loading,
    error,
    isNative,
    isIOS,
    isAndroid,
    registerDevice,
    unregisterDevice,
  };
};
