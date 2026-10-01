import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const BRAND_SOURCE_ORIGIN = 'https://tntbjulojatnrqmylorp.supabase.co';
export const BRAND_AUTH_STORAGE_KEY = 'anacan-brand-portal-auth-v1:source';
export const BRAND_LANGUAGE_KEY = 'anacan-brand-portal-language-v1';
let client: SupabaseClient | undefined;

export function brandBackendConfig(env: Record<string, string | boolean | undefined>) {
  const key = env.VITE_SOURCE_SUPABASE_PUBLISHABLE_KEY ||
    (env.VITE_SUPABASE_URL === BRAND_SOURCE_ORIGIN ? env.VITE_SUPABASE_PUBLISHABLE_KEY : '');
  if (typeof key !== 'string' || !key.trim()) throw new Error('BRAND_PORTAL_SOURCE_CONFIGURATION_REQUIRED');
  if (!key.startsWith('sb_publishable_')) {
    try {
      const payload = JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.role !== 'anon' || payload.ref !== 'tntbjulojatnrqmylorp') throw new Error('invalid');
    } catch { throw new Error('BRAND_PORTAL_PUBLIC_SOURCE_KEY_REQUIRED'); }
  }
  return { url: BRAND_SOURCE_ORIGIN, key };
}

/** Independent browser auth realm: never import the application's SDK singleton. */
export function getBrandClient() {
  if (!client) {
    const config = brandBackendConfig(import.meta.env);
    client = createClient(config.url, config.key, { auth: {
      storageKey: BRAND_AUTH_STORAGE_KEY, persistSession: true, autoRefreshToken: true,
      detectSessionInUrl: false,
    } });
  }
  return client;
}
