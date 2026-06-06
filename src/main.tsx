import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeNativeFeatures } from "./lib/native";
import { initMixpanel } from "./lib/mixpanel";
import { initCrashReporter } from "./lib/crashReporter";
import { initFacebookEvents } from "./lib/facebook-events";
import { restoreNativeSession, startNativeSessionSync } from "./lib/session-persistence";

// Initialize crash reporter first (catches all errors from this point)
initCrashReporter();

// Initialize Mixpanel analytics
initMixpanel();

// Initialize Facebook / Meta App Events (native-only, no-op on web)
initFacebookEvents();

// Initialize native features when app starts
initializeNativeFeatures().catch(console.error);

// Restore Supabase session from native storage (survives app updates that
// wipe WebView localStorage). Must happen BEFORE the React tree renders so
// users don't see a flash of the login screen. Then keep it in sync.
async function bootstrap() {
  try {
    await restoreNativeSession();
  } catch (e) {
    console.warn("[bootstrap] restoreNativeSession failed", e);
  }
  startNativeSessionSync();
  createRoot(document.getElementById("root")!).render(<App />);
}

void bootstrap();
