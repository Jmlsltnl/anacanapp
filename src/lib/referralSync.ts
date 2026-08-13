import { supabase } from '@/integrations/supabase/client';

/**
 * Referral status sinxronu — dəvət OLUNAN istifadəçinin klientindən.
 *
 * RevenueCat entitlement periodType:
 *   'TRIAL' / 'INTRO' → status 'trial'
 *   'NORMAL'          → status 'converted' → dəvət edənə +7 gün (server 1 dəfə verir)
 *
 * İdempotentdir; 'converted' bir dəfə uğurla sinxronlaşandan sonra
 * localStorage bayrağı ilə təkrar RPC çağırışları dayandırılır.
 */

const SYNCED_KEY = 'anacan_referral_converted_synced';

export async function syncReferralStatusFromEntitlement(periodType: string | null | undefined, isPro: boolean): Promise<void> {
  if (!isPro || !periodType) return;

  try {
    if (localStorage.getItem(SYNCED_KEY) === '1') return; // artıq konversiya sinxronlanıb
  } catch {/* boş */}

  const state = periodType === 'NORMAL' ? 'converted' : 'trial';

  try {
    const { data, error } = await (supabase.rpc as any)('update_my_referral_status', { p_state: state });
    if (error) return; // migrasiya yoxdur / referral yoxdur — səssiz

    const res = data as any;
    if (state === 'converted' && res?.success) {
      try {localStorage.setItem(SYNCED_KEY, '1');} catch {/* boş */}
    }
  } catch {
    // şəbəkə xətası — növbəti açılışda yenidən cəhd olunacaq
  }
}
