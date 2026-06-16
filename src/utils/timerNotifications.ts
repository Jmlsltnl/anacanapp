import { tr } from "@/lib/tr";import { LocalNotifications } from '@capacitor/local-notifications';
import { isNative } from '@/lib/native';
import type { TimerType } from '@/store/timerStore';

const timerLabels: Record<TimerType, string> = {
  sleep: '😴 Yuxu',
  feeding: tr("timernotifications_emizdirme_af3cc9", "\uD83C\uDF7C \u018Fmizdirm\u0259"),
  diaper: tr("timernotifications_bez_deyisdirme_cfec83", "\uD83E\uDDF7 Bez d\u0259yi\u015Fdirm\u0259"),
  'white-noise': tr("timernotifications_kuy_sesi_1de6fc", "\uD83D\uDD0A K\xFCy S\u0259si")
};

// Generate a stable numeric ID from timer string ID
function hashTimerId(timerId: string): number {
  let hash = 0;
  for (let i = 0; i < timerId.length; i++) {
    hash = (hash << 5) - hash + timerId.charCodeAt(i) | 0;
  }
  return Math.abs(hash) % 2147483647 || 1;
}

export async function showTimerNotification(
timerId: string,
type: TimerType,
label?: string,
feedType?: 'left' | 'right')
{
  if (!isNative) return;

  try {
    const perms = await LocalNotifications.checkPermissions();
    if (perms.display !== 'granted') {
      const req = await LocalNotifications.requestPermissions();
      if (req.display !== 'granted') return;
    }

    const title = label || timerLabels[type] || 'Timer';
    const feedSuffix = feedType ? ` (${feedType === 'left' ? 'Sol' : tr("timernotifications_sag_edbe12", "Sa\u011F")})` : '';

    await LocalNotifications.schedule({
      notifications: [
      {
        id: hashTimerId(timerId),
        title: `${title}${feedSuffix}`,
        body: tr("timernotifications_timer_aktiv_geri_donmek_ucun_t_f7638a", "Timer aktiv \u2014 geri d\xF6nm\u0259k \xFC\xE7\xFCn toxunun"),
        ongoing: true,
        autoCancel: false,
        smallIcon: 'ic_stat_icon'
      }]

    });
  } catch (e) {
    console.warn('Timer notification error:', e);
  }
}

export async function clearTimerNotification(timerId: string) {
  if (!isNative) return;

  try {
    await LocalNotifications.cancel({
      notifications: [{ id: hashTimerId(timerId) }]
    });
  } catch (e) {
    console.warn('Clear timer notification error:', e);
  }
}

export async function clearAllTimerNotifications() {
  if (!isNative) return;

  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }
  } catch (e) {
    console.warn('Clear all timer notifications error:', e);
  }
}