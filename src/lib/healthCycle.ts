import { registerPlugin, Capacitor } from '@capacitor/core';

/**
 * HealthCycle — menstruasiya məlumatının Apple Health / Health Connect-ə yazılması.
 * Native tərəf: ios/App/App/HealthCyclePlugin.swift + android .../HealthCyclePlugin.kt
 * Plugin yoxdursa (köhnə build / web) — qəzasız false qaytarır.
 */

interface HealthCyclePlugin {
  isAvailable(): Promise<{available: boolean;}>;
  requestWritePermission(): Promise<{granted: boolean;}>;
  writeMenstruation(options: {startDate: string;endDate: string;flow?: 'light' | 'medium' | 'heavy';}): Promise<{written: number;}>;
}

const HealthCycle = registerPlugin<HealthCyclePlugin>('HealthCycle');

export const CYCLE_WRITE_KEY = 'anacan_health_cycle_write';

export const isCycleWriteEnabled = (): boolean => {
  try {return localStorage.getItem(CYCLE_WRITE_KEY) === '1';} catch {return false;}
};

export const setCycleWriteEnabled = (on: boolean): void => {
  try {
    if (on) localStorage.setItem(CYCLE_WRITE_KEY, '1');else
    localStorage.removeItem(CYCLE_WRITE_KEY);
  } catch {/* boş */}
};

export async function isCycleWriteAvailable(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const { available } = await HealthCycle.isAvailable();
    return available;
  } catch {
    return false; // plugin qeydiyyatda yoxdur (köhnə native build)
  }
}

export async function requestCycleWritePermission(): Promise<boolean> {
  try {
    const { granted } = await HealthCycle.requestWritePermission();
    return granted;
  } catch (e) {
    console.warn('HealthCycle permission failed:', e);
    return false;
  }
}

/**
 * Period başlanğıcını Health-ə yaz (period uzunluğu qədər gün).
 * FlowDashboard "Periodum başladı" axınından çağırılır.
 */
export async function writePeriodToHealth(startDate: Date, periodLengthDays: number): Promise<boolean> {
  if (!isCycleWriteEnabled()) return false;
  if (!(await isCycleWriteAvailable())) return false;

  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const end = new Date(startDate);
  end.setDate(end.getDate() + Math.max(1, Math.min(10, periodLengthDays)) - 1);

  try {
    await HealthCycle.writeMenstruation({
      startDate: fmt(startDate),
      endDate: fmt(end),
      flow: 'medium'
    });
    return true;
  } catch (e) {
    console.warn('HealthCycle write failed:', e);
    return false;
  }
}
