import { Capacitor } from '@capacitor/core';
import { Health, type HealthPermission } from 'capacitor-health';

/**
 * Apple Health (iOS) / Google Health Connect (Android) vahid wrapper-i.
 * Yalnız OXUMA: addım, kalori, məşqlər. Web-də qəzasız no-op.
 *
 * Native tərəf:
 *  - iOS: HealthKit entitlement + NSHealth*UsageDescription (Info.plist) ✓
 *  - Android: AndroidManifest icazələri + PermissionsRationaleActivity ✓
 */

export const HEALTH_CONNECTED_KEY = 'anacan_health_connected';

const PERMISSIONS: HealthPermission[] = [
'READ_STEPS',
'READ_ACTIVE_CALORIES',
'READ_DISTANCE',
'READ_WORKOUTS',
'READ_HEART_RATE',
// Rahatlama/nəfəs məşqləri (MentalHealthTracker) ilə əlaqəli — Apple Health/Health
// Connect-dəki mindfulness dəqiqələrini oxumaq üçün (əvvəllər soruşulmurdu belə).
'READ_MINDFULNESS'];


export const isNativeHealthPlatform = (): boolean => Capacitor.isNativePlatform();

/** Health API mövcuddur? (Android-da false = Health Connect quraşdırılmayıb) */
export async function isHealthAvailable(): Promise<boolean> {
  if (!isNativeHealthPlatform()) return false;
  try {
    const { available } = await Health.isHealthAvailable();
    return available;
  } catch {
    return false;
  }
}

/** İcazələri istə. iOS-da nəticə həmişə "granted" fərz olunur (HealthKit gizlilik modeli). */
export async function requestHealthPermissions(): Promise<boolean> {
  if (!isNativeHealthPlatform()) return false;
  try {
    await Health.requestHealthPermissions({ permissions: PERMISSIONS });
    localStorage.setItem(HEALTH_CONNECTED_KEY, String(Date.now()));
    return true;
  } catch (e) {
    console.error('Health permission request failed:', e);
    return false;
  }
}

/** İstifadəçi bu cihazda health-i qoşub? (lokal bayraq) */
export function isHealthConnected(): boolean {
  try {
    return !!localStorage.getItem(HEALTH_CONNECTED_KEY);
  } catch {
    return false;
  }
}

export function disconnectHealth(): void {
  try {
    localStorage.removeItem(HEALTH_CONNECTED_KEY);
  } catch {/* boş */}
}

export interface DailyHealthSample {
  /** yyyy-MM-dd */
  date: string;
  value: number;
}

/** Günlük bucket-lərlə aqreqasiya (addım, aktiv kalori və ya mindfulness dəqiqəsi). */
async function queryDaily(dataType: 'steps' | 'active-calories' | 'mindfulness', days: number): Promise<DailyHealthSample[]> {
  if (!isNativeHealthPlatform()) return [];
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  try {
    const { aggregatedData } = await Health.queryAggregated({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      dataType,
      bucket: 'day'
    });
    return (aggregatedData || []).map((s) => ({
      date: s.startDate.split('T')[0],
      value: Math.round(s.value || 0)
    }));
  } catch (e) {
    console.error(`Health ${dataType} query failed:`, e);
    return [];
  }
}

export const getDailySteps = (days = 7) => queryDaily('steps', days);
export const getDailyCalories = (days = 7) => queryDaily('active-calories', days);
/** Mindfulness (rahatlama/meditasiya) dəqiqələri — Apple-ın öz Mindfulness app-ı,
 *  Health Connect-ə yazan digər tətbiqlər və s. mənbələrdən. Yalnız OXUMA —
 *  bu paket mindfulness YAZMAĞI dəstəkləmir (native tərəfdən API yoxdur). */
export const getDailyMindfulness = (days = 7) => queryDaily('mindfulness', days);

export async function getTodaySteps(): Promise<number> {
  const samples = await getDailySteps(1);
  return samples.reduce((sum, s) => sum + s.value, 0);
}

export async function getTodayCalories(): Promise<number> {
  const samples = await getDailyCalories(1);
  return samples.reduce((sum, s) => sum + s.value, 0);
}

export async function getWeekMindfulnessMinutes(): Promise<number> {
  const samples = await getDailyMindfulness(7);
  // Native tərəf saniyə/dəqiqə vahidini bucket-in özündə "value" kimi qaytarır —
  // steps/calories ilə eyni struktur, vahid mindful "sessiyaların cəm müddəti (dəq)".
  return samples.reduce((sum, s) => sum + s.value, 0);
}

export interface HealthWorkout {
  startDate: string;
  endDate: string;
  workoutType: string;
  duration: number;
  calories: number;
  sourceName: string;
  /** km — READ_DISTANCE icazəsi ilə (mövcud olduqda). Package.distance metrdə qaytarır. */
  distanceKm?: number;
  /** Ortalama nəbz (bpm) — READ_HEART_RATE icazəsi ilə (mövcud olduqda). */
  avgHeartRate?: number;
}

/** Son N günün məşqləri — indi məsafə (READ_DISTANCE) və ortalama nəbz (READ_HEART_RATE)
 *  də daxil edilir; əvvəllər bu iki icazə istifadəçidən soruşulurdu, amma heç vaxt
 *  faktiki oxunmurdu. */
export async function getRecentWorkouts(days = 7): Promise<HealthWorkout[]> {
  if (!isNativeHealthPlatform()) return [];
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);

  try {
    const { workouts } = await Health.queryWorkouts({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      includeHeartRate: true,
      includeRoute: false,
      includeSteps: false
    });
    return (workouts || []).map((w) => {
      const hrSamples = w.heartRate || [];
      const avgHeartRate = hrSamples.length > 0 ?
      Math.round(hrSamples.reduce((sum, s) => sum + (s.bpm || 0), 0) / hrSamples.length) :
      undefined;
      return {
        startDate: w.startDate,
        endDate: w.endDate,
        workoutType: w.workoutType || 'workout',
        duration: w.duration || 0,
        calories: Math.round(w.calories || 0),
        sourceName: w.sourceName || '',
        distanceKm: typeof w.distance === 'number' && w.distance > 0 ? Math.round(w.distance / 100) / 10 : undefined,
        avgHeartRate
      };
    });
  } catch (e) {
    console.error('Health workouts query failed:', e);
    return [];
  }
}

/** Platform ayarlarını aç (icazələri idarə etmək üçün). */
export async function openHealthSettings(): Promise<void> {
  if (!isNativeHealthPlatform()) return;
  try {
    if (Capacitor.getPlatform() === 'ios') {
      await Health.openAppleHealthSettings();
    } else {
      await Health.openHealthConnectSettings();
    }
  } catch (e) {
    console.error('Open health settings failed:', e);
  }
}

/** Android: Health Connect tətbiqini Play Store-da göstər. */
export async function installHealthConnect(): Promise<void> {
  try {
    await Health.showHealthConnectInPlayStore();
  } catch (e) {
    console.error('Show Health Connect in Play Store failed:', e);
  }
}
