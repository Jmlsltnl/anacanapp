import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeNativeFeatures } from "./lib/native";
import { initMixpanel } from "./lib/mixpanel";
import { initCrashReporter } from "./lib/crashReporter";

// Initialize crash reporter first (catches all errors from this point)
initCrashReporter();

// Initialize Mixpanel analytics
initMixpanel();

// Initialize native features when app starts
initializeNativeFeatures().catch(console.error);

createRoot(document.getElementById("root")!).render(<App />);
