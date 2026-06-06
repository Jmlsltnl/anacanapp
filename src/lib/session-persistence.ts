/**
 * Native session persistence.
 *
 * Problem: On Android/iOS, WebView localStorage can be wiped between app
 * updates (especially when WebView storage location changes, the app is
 * rebuilt with a different signature, or the OS purges WebView data).
 * That logs users out every time they update from the store.
 *
 * Solution: On native platforms, mirror the Supabase auth session into
 * Capacitor Preferences (which is stored in native UserDefaults / SharedPrefs
 * and survives app updates). On app boot, if WebView localStorage has no
 * session but Preferences does, restore it via supabase.auth.setSession.
 */
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'anacan.auth.session.v1';

interface PersistedSession {
  access_token: string;
  refresh_token: string;
}

const isNative = () => Capacitor.isNativePlatform();

async function saveSession(session: PersistedSession | null) {
  try {
    if (!session) {
      await Preferences.remove({ key: STORAGE_KEY });
      return;
    }
    await Preferences.set({
      key: STORAGE_KEY,
      value: JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      }),
    });
  } catch (e) {
    console.warn('[session-persistence] save failed', e);
  }
}

async function loadSession(): Promise<PersistedSession | null> {
  try {
    const { value } = await Preferences.get({ key: STORAGE_KEY });
    if (!value) return null;
    const parsed = JSON.parse(value);
    if (!parsed?.access_token || !parsed?.refresh_token) return null;
    return parsed;
  } catch (e) {
    console.warn('[session-persistence] load failed', e);
    return null;
  }
}

/**
 * Must be called BEFORE rendering the React tree so the user is logged in
 * on the very first frame.
 */
export async function restoreNativeSession(): Promise<void> {
  if (!isNative()) return;

  try {
    // If localStorage already has a valid session, nothing to do.
    const { data: existing } = await supabase.auth.getSession();
    if (existing?.session?.access_token) {
      // Make sure Preferences is in sync with the current session.
      await saveSession({
        access_token: existing.session.access_token,
        refresh_token: existing.session.refresh_token,
      });
      return;
    }

    // WebView storage was cleared — try to restore from Preferences.
    const persisted = await loadSession();
    if (!persisted) return;

    const { error } = await supabase.auth.setSession({
      access_token: persisted.access_token,
      refresh_token: persisted.refresh_token,
    });

    if (error) {
      console.warn('[session-persistence] restore failed', error.message);
      // Refresh token was invalid/expired — clear it so we don't retry forever.
      if (
        error.message?.toLowerCase().includes('refresh') ||
        error.message?.toLowerCase().includes('invalid')
      ) {
        await Preferences.remove({ key: STORAGE_KEY });
      }
    }
  } catch (e) {
    console.warn('[session-persistence] restoreNativeSession error', e);
  }
}

/**
 * Subscribe to auth state changes and keep Preferences in sync.
 * Safe to call once at app startup.
 */
export function startNativeSessionSync(): void {
  if (!isNative()) return;

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || !session) {
      void saveSession(null);
      return;
    }
    if (
      event === 'SIGNED_IN' ||
      event === 'TOKEN_REFRESHED' ||
      event === 'USER_UPDATED' ||
      event === 'INITIAL_SESSION'
    ) {
      void saveSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
    }
  });
}
