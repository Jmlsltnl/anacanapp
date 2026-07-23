// MUST be the very first import — polyfills for Android 11 WebView (Chrome 90)
// and old iOS Safari. Without this Object.hasOwn etc. crash the app at startup.
import "./lib/polyfills";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

// Catch dynamic import / chunk load errors (happens when a new version is deployed
// and the browser tries to fetch old, deleted chunk hashes). Automatically
// reload the page to fetch the latest index.html and assets.
window.addEventListener("error", (e) => {
  if (e.message && (e.message.includes("Failed to fetch dynamically imported module") || e.message.includes("ChunkLoadError"))) {
    console.warn("Dynamic import error detected. Reloading page...");
    window.location.reload();
  }
});
window.addEventListener("unhandledrejection", (e) => {
  if (e.reason && e.reason.message && (e.reason.message.includes("Failed to fetch dynamically imported module") || e.reason.message.includes("ChunkLoadError"))) {
    console.warn("Unhandled dynamic import error detected. Reloading page...");
    window.location.reload();
  }
});
import "./index.css";
import { initializeNativeFeatures } from "./lib/native";
import { initMixpanel } from "./lib/mixpanel";
import { initCrashReporter } from "./lib/crashReporter";
import { initFacebookEvents } from "./lib/facebook-events";
import { restoreNativeSession, startNativeSessionSync } from "./lib/session-persistence";
import { Preferences } from '@capacitor/preferences';
import { useUserStore } from '@/store/userStore';

// Initialize crash reporter first (catches all errors from this point)
initCrashReporter();

// Initialize Mixpanel analytics
initMixpanel();

// Initialize Facebook / Meta App Events (native-only, no-op on web)
initFacebookEvents();

// Initialize native features when app starts
initializeNativeFeatures().catch(console.error);

async function restorePreferences() {
  try {
    const { value: storedLang } = await Preferences.get({ key: 'anacan_app_language' });
    if (storedLang) {
      useUserStore.getState().setLanguage(storedLang);
    }
    const { value: storedSelected } = await Preferences.get({ key: 'anacan_has_selected_language' });
    if (storedSelected === 'true') {
      useUserStore.getState().setHasSelectedLanguage(true);
    }
    const { value: storedIntro } = await Preferences.get({ key: 'anacan_has_seen_intro' });
    if (storedIntro === 'true') {
      useUserStore.getState().setHasSeenIntro(true);
    }
  } catch (e) {
    console.warn("[bootstrap] restorePreferences failed", e);
  }
}

// Restore Supabase session from native storage (survives app updates that
// wipe WebView localStorage). Must happen BEFORE the React tree renders so
// users don't see a flash of the login screen. Then keep it in sync.
async function bootstrap() {
  try {
    await restoreNativeSession();
    await restorePreferences();
  } catch (e) {
    console.warn("[bootstrap] restore failed", e);
  }
  startNativeSessionSync();
  createRoot(document.getElementById("root")!).render(<App />);
}

void bootstrap();
