import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { isNative, isIOS, isAndroid } from '@/lib/native';
import { Capacitor } from '@capacitor/core';

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

      // Delete old tokens for this user on same platform (keep only latest)
      await supabase
        .from('device_tokens')
        .delete()
        .eq('user_id', userId)
        .eq('platform', platform === 'ios' ? 'ios' : 'android');

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

  // Register device and save token using Firebase Messaging (returns FCM token on both iOS & Android)
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

    const platform = Capacitor.getPlatform();
    console.log('[DeviceToken] Starting registration process...');
    console.log('[DeviceToken] Platform:', platform);
    console.log('[DeviceToken] User ID:', user.id);

    try {
      // Use @capacitor-firebase/messaging for proper FCM token on both platforms
      const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');

      // Check current permission status
      let permStatus = await FirebaseMessaging.checkPermissions();
      console.log('[DeviceToken] Current permission:', permStatus.receive);

      if (permStatus.receive === 'prompt') {
        console.log('[DeviceToken] Requesting permissions...');
        permStatus = await FirebaseMessaging.requestPermissions();
        console.log('[DeviceToken] Permission result:', permStatus.receive);
      }

      if (permStatus.receive !== 'granted') {
        const errorMsg = 'Push notification permission denied';
        console.log('[DeviceToken]', errorMsg);
        setError(errorMsg);
        setLoading(false);
        return null;
      }

      // Get FCM token directly - this returns a proper FCM token on BOTH iOS and Android
      console.log('[DeviceToken] Getting FCM token...');
      const tokenResult = await FirebaseMessaging.getToken();
      const deviceToken = tokenResult.token;

      if (!deviceToken) {
        console.error('[DeviceToken] No token returned from FirebaseMessaging.getToken()');
        setError('FCM token alına bilmədi');
        setLoading(false);
        return null;
      }

      console.log('[DeviceToken] FCM token received:', deviceToken.substring(0, 30) + '...');
      setToken(deviceToken);

      // Save to database
      const saved = await saveTokenToDatabase(deviceToken, user.id);
      if (!saved) {
        setError('Token alındı amma saxlanmadı');
      }

      // Listen for token refresh
      FirebaseMessaging.addListener('tokenReceived', async (newTokenData) => {
        const newToken = newTokenData.token;
        console.log('[DeviceToken] Token refreshed:', newToken.substring(0, 30) + '...');
        setToken(newToken);
        await saveTokenToDatabase(newToken, user.id);
      });

      // Listen for push notifications received in foreground
      FirebaseMessaging.addListener('notificationReceived', (notification) => {
        console.log('[DeviceToken] Push received in foreground:', notification);
      });

      // Listen for push notification action
      FirebaseMessaging.addListener('notificationActionPerformed', (action) => {
        console.log('[DeviceToken] Push action performed:', action);
      });

      setLoading(false);
      return deviceToken;

    } catch (err: any) {
      console.error('[DeviceToken] Registration exception:', err);
      
      // Fallback to @capacitor/push-notifications if Firebase Messaging fails
      console.log('[DeviceToken] Trying fallback with @capacitor/push-notifications...');
      try {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        
        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }
        
        if (permStatus.receive !== 'granted') {
          setError('Push notification permission denied');
          setLoading(false);
          return null;
        }

        await PushNotifications.removeAllListeners();
        
        return new Promise<string | null>((resolve) => {
          const timeout = setTimeout(() => {
            console.log('[DeviceToken] Fallback registration timeout');
            setLoading(false);
            resolve(null);
          }, 15000);

          PushNotifications.addListener('registration', async (tokenData) => {
            clearTimeout(timeout);
            const fallbackToken = tokenData.value;
            console.log('[DeviceToken] Fallback token received:', fallbackToken.substring(0, 30) + '...');
            setToken(fallbackToken);
            await saveTokenToDatabase(fallbackToken, user.id);
            setLoading(false);
            resolve(fallbackToken);
          });

          PushNotifications.addListener('registrationError', (regErr) => {
            clearTimeout(timeout);
            console.error('[DeviceToken] Fallback registration error:', regErr);
            setError(regErr.error || 'Registration failed');
            setLoading(false);
            resolve(null);
          });

          PushNotifications.register();
        });
      } catch (fallbackErr) {
        console.error('[DeviceToken] Fallback also failed:', fallbackErr);
        setError(err.message || 'Unknown error');
        setLoading(false);
        return null;
      }
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
      
      // Also delete FCM token from Firebase
      try {
        const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');
        await FirebaseMessaging.deleteToken();
      } catch {
        // Ignore if Firebase Messaging not available
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
