import { registerPlugin, type PluginListenerHandle } from '@capacitor/core';

/**
 * Screenshot qadağası plugin-i (yerli, npm paketi deyil).
 *
 * - Android: FLAG_SECURE ilə screenshot/ekran yazısı SİSTEM səviyyəsində
 *   bloklanır; Android 14+ cəhd aşkarlananda "screenshotTaken" hadisəsi gəlir.
 * - iOS: sistem bloku mümkün deyil (Apple API vermir) — screenshot çəkilən
 *   KİMİ "screenshotTaken" hadisəsi gəlir və xəbərdarlıq göstərilir.
 *
 * Native tərəflər:
 *   android/.../ScreenshotGuardPlugin.java (MainActivity-də qeydiyyatlı)
 *   ios/App/App/ScreenshotGuardPlugin.swift (MainViewController-də qeydiyyatlı)
 */
export interface ScreenshotGuardPlugin {
  /** Qadağanı işə sal/söndür (Android FLAG_SECURE; iOS-da no-op) */
  setEnabled(options: { enabled: boolean }): Promise<void>;
  addListener(
    eventName: 'screenshotTaken',
    listener: () => void
  ): Promise<PluginListenerHandle>;
}

const ScreenshotGuard = registerPlugin<ScreenshotGuardPlugin>('ScreenshotGuard');

export default ScreenshotGuard;
