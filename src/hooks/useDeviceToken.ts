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

  // Save token using safe upsert. Never delete other tokens until the new one is committed.
  const saveTokenToDatabase = useCallback(async (deviceToken: string, userId: string) => {
    try {
      const platform = Capacitor.getPlatform();
      const platformValue = platform === 'ios' ? 'ios' : 'android';
      const deviceName = `${platform} - ${navigator.userAgent.substring(0, 50)}`;

      console.log('[DeviceToken] Upserting token:', {
        userId,
        platform: platformValue,
        tokenSuffix: '...' + deviceToken.slice(-12),
      });

      // 1) Safe upsert on (user_id, token) — never destroys an existing live token.
      const { error: upsertError } = await supabase
        .from('device_tokens')
        .upsert(
          {
            user_id: userId,
            token: deviceToken,
            platform: platformValue,
            device_name: deviceName,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,token' }
        );

      if (upsertError) {
        console.error('[DeviceToken] Upsert error:', upsertError);
        return false;
      }

      // 2) Only AFTER success, clean up any STALE tokens for this user on this platform
      //    (different token strings — not the one we just saved).
      const { error: cleanupError } = await supabase
        .from('device_tokens')
        .delete()
        .eq('user_id', userId)
        .eq('platform', platformValue)
        .neq('token', deviceToken);

      if (cleanupError) {
        // Non-fatal — the new token is already saved.
        console.warn('[DeviceToken] Stale-token cleanup warning:', cleanupError);
      }

      console.log('[DeviceToken] Token saved successfully');
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
    console.log('[DeviceToken] Starting registration. Platform:', platform, 'User:', user.id);

    try {
      const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');

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

      console.log('[DeviceToken] Getting FCM token...');
      const tokenResult = await FirebaseMessaging.getToken();
      const deviceToken = tokenResult.token;

      if (!deviceToken) {
        console.error('[DeviceToken] No token returned from FirebaseMessaging.getToken()');
        setError('FCM token alına bilmədi');
        setLoading(false);
        return null;
      }

      console.log('[DeviceToken] FCM token received: ...' + deviceToken.slice(-12));
      setToken(deviceToken);

      const saved = await saveTokenToDatabase(deviceToken, user.id);
      if (!saved) {
        setError('Token alındı amma saxlanmadı');
      }

      // Token refresh listener
      FirebaseMessaging.addListener('tokenReceived', async (newTokenData) => {
        const newToken = newTokenData.token;
        console.log('[DeviceToken] Token refreshed: ...' + newToken.slice(-12));
        setToken(newToken);
        await saveTokenToDatabase(newToken, user.id);
      });

      FirebaseMessaging.addListener('notificationReceived', (notification) => {
        console.log('[DeviceToken] Push received in foreground:', notification);
      });

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
            console.log('[DeviceToken] Fallback token received: ...' + fallbackToken.slice(-12));
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
