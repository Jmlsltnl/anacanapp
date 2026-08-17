import { registerPlugin, Capacitor } from '@capacitor/core';

/**
 * HealthVitals — çəki / qan təzyiqi / qan şəkəri ölçmələrinin Apple Health /
 * Health Connect-ə YAZILMASI. (capacitor-health paketi bu tipləri dəstəkləmir —
 * HealthCycle plugini ilə eyni məntiq, ayrı, müstəqil native plugin.)
 * Native tərəf: ios/App/App/HealthVitalsPlugin.swift + android .../HealthVitalsPlugin.kt
 * Plugin yoxdursa (köhnə build / web) — qəzasız false qaytarır.
 *
 * Yalnız YAZMA (əvvəllər Weight/BloodPressure/BloodSugar Tracker-lərdə qeyd
 * olunan ölçmələr YALNIZ bizim Supabase-ə düşürdü — indi istifadəçi istəyərsə
 * eyni ölçmə Apple Health / Health Connect-ə də köçürülür ki, digər qoşulu
 * cihazlarla (Bluetooth BP monitoru və s.) vahid mənzərə olsun).
 */

interface HealthVitalsPlugin {
  isAvailable(): Promise<{available: boolean;}>;
  requestWritePermission(): Promise<{granted: boolean;}>;
  writeWeight(options: {kg: number;date?: string;}): Promise<{written: boolean;}>;
  writeBloodPressure(options: {systolic: number;diastolic: number;date?: string;}): Promise<{written: boolean;}>;
  writeBloodGlucose(options: {mgdl: number;date?: string;}): Promise<{written: boolean;}>;
}

const HealthVitals = registerPlugin<HealthVitalsPlugin>('HealthVitals');

export const VITALS_WRITE_KEY = 'anacan_health_vitals_write';

export const isVitalsWriteEnabled = (): boolean => {
  try {return localStorage.getItem(VITALS_WRITE_KEY) === '1';} catch {return false;}
};

export const setVitalsWriteEnabled = (on: boolean): void => {
  try {
    if (on) localStorage.setItem(VITALS_WRITE_KEY, '1');else
    localStorage.removeItem(VITALS_WRITE_KEY);
  } catch {/* boş */}
};

export async function isVitalsWriteAvailable(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const { available } = await HealthVitals.isAvailable();
    return available;
  } catch {
    return false; // plugin qeydiyyatda yoxdur (köhnə native build)
  }
}

export async function requestVitalsWritePermission(): Promise<boolean> {
  try {
    const { granted } = await HealthVitals.requestWritePermission();
    return granted;
  } catch (e) {
    console.warn('HealthVitals permission failed:', e);
    return false;
  }
}

/** Çəkini Health-ə yaz (kq) — toggle deaktivdirsə/plugin yoxdursa səssizcə heç nə etmir. */
export async function writeWeightToHealth(kg: number, date?: Date): Promise<boolean> {
  if (!isVitalsWriteEnabled()) return false;
  if (!(await isVitalsWriteAvailable())) return false;
  try {
    await HealthVitals.writeWeight({ kg, date: (date || new Date()).toISOString() });
    return true;
  } catch (e) {
    console.warn('HealthVitals weight write failed:', e);
    return false;
  }
}

/** Qan təzyiqini Health-ə yaz (sistolik/diastolik, mmHg). */
export async function writeBloodPressureToHealth(systolic: number, diastolic: number, date?: Date): Promise<boolean> {
  if (!isVitalsWriteEnabled()) return false;
  if (!(await isVitalsWriteAvailable())) return false;
  try {
    await HealthVitals.writeBloodPressure({ systolic, diastolic, date: (date || new Date()).toISOString() });
    return true;
  } catch (e) {
    console.warn('HealthVitals blood pressure write failed:', e);
    return false;
  }
}

/** Qan şəkərini Health-ə yaz (mg/dL). */
export async function writeBloodGlucoseToHealth(mgdl: number, date?: Date): Promise<boolean> {
  if (!isVitalsWriteEnabled()) return false;
  if (!(await isVitalsWriteAvailable())) return false;
  try {
    await HealthVitals.writeBloodGlucose({ mgdl, date: (date || new Date()).toISOString() });
    return true;
  } catch (e) {
    console.warn('HealthVitals blood glucose write failed:', e);
    return false;
  }
}
