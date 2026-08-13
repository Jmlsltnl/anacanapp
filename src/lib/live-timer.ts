// Kilid ekranı taymer körpüsü — timerStore ilə native LiveActivity plugin-i arasında.
// iOS: ActivityKit Live Activity (Lock Screen + Dynamic Island)
// Android: Foreground Service xronometr bildirişi
// Native mövcud deyilsə (web / köhnə iOS / widget target quraşdırılmayıb) →
// köhnə davamlı lokal bildirişə fallback.
import { tr } from '@/lib/tr';
import { isNative } from '@/lib/native';
import LiveActivity, { type PendingTimerStop } from '@/plugins/LiveActivityPlugin';
import { showTimerNotification, clearTimerNotification } from '@/utils/timerNotifications';
import type { ActiveTimer, TimerType } from '@/store/timerStore';

const TYPE_LABELS = (): Record<TimerType, string> => ({
  sleep: tr('timernotifications_yuxu_eb2b53', '😴 Yuxu'),
  feeding: tr('timernotifications_emizdirme_af3cc9', '🍼 Əmizdirmə'),
  diaper: tr('timernotifications_bez_deyisdirme_cfec83', '🧷 Bez dəyişdirmə'),
  'white-noise': tr('timernotifications_kuy_sesi_1de6fc', '🔊 Küy Səsi'),
});

// Hansı taymerlər üçün native aktivlik alınıb (fallback qərarları üçün)
const nativeActive = new Set<string>();

export async function startNativeTimer(timer: ActiveTimer): Promise<void> {
  if (!isNative) return;
  const labels = TYPE_LABELS();
  const base = timer.label || labels[timer.type] || 'Timer';
  const feedSuffix = timer.feedType
    ? ` (${timer.feedType === 'left' ? tr('timernotifications_sol', 'Sol') : tr('timernotifications_sag_edbe12', 'Sağ')})`
    : '';
  try {
    await LiveActivity.startActivity({
      id: timer.id,
      type: timer.type,
      label: `${base}${feedSuffix}`,
      subLabel: tr('livetimer_davam_edir', 'Davam edir — dayandırmaq üçün düyməyə basın'),
      stopLabel: tr('livetimer_dayandir', 'Dayandır'),
      startTime: timer.startTime,
      feedType: timer.feedType,
      channelName: tr('livetimer_channel_name', 'Taymerlər'),
      channelDesc: tr('livetimer_channel_desc', 'Aktiv süd vermə / yuxu taymerləri'),
    });
    nativeActive.add(timer.id);
  } catch (e) {
    // Live Activity mümkün deyil → köhnə davamlı bildiriş
    console.warn('LiveActivity start fallback:', e);
    showTimerNotification(timer.id, timer.type, timer.label, timer.feedType);
  }
}

export async function stopNativeTimer(timerId: string): Promise<void> {
  if (!isNative) return;
  if (nativeActive.has(timerId)) {
    nativeActive.delete(timerId);
    try {
      await LiveActivity.stopActivity({ timerId });
      return;
    } catch (e) {
      console.warn('LiveActivity stop error:', e);
    }
  }
  // Fallback bildirişini təmizlə (hər iki halda zərərsizdir)
  clearTimerNotification(timerId);
  // Restart-dan sonra nativeActive boş ola bilər — native tərəfi yenə də yoxla
  try { await LiveActivity.stopActivity({ timerId }); } catch { /* plugin yoxdursa keç */ }
}

/**
 * Widget/bildirişdən dayandırılmış taymerləri emal et:
 * hər biri üçün `save` çağırılır (baby_logs-a yazmaq üçün), sonra siyahı təmizlənir.
 * Həm dərhal (listener), həm resume-da (poll) çağırılmalıdır.
 */
export async function processPendingStops(
  save: (stop: PendingTimerStop) => Promise<void> | void
): Promise<number> {
  if (!isNative) return 0;
  try {
    const { stops } = await LiveActivity.getPendingStops();
    if (!stops?.length) return 0;
    await LiveActivity.clearPendingStops();
    for (const s of stops) {
      nativeActive.delete(s.id);
      try { await save(s); } catch (e) { console.warn('pending stop save error:', e); }
    }
    return stops.length;
  } catch {
    return 0;
  }
}

/** Android canlı "timerStopped" hadisəsi üçün dinləyici (pending siyahısını işə salır) */
export function onNativeTimerStopped(cb: () => void): () => void {
  if (!isNative) return () => {};
  let handle: { remove: () => void } | null = null;
  LiveActivity.addListener('timerStopped', () => cb())
    .then((h) => { handle = h; })
    .catch(() => {});
  return () => { handle?.remove(); };
}
