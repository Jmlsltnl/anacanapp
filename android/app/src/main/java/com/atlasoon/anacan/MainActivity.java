package com.atlasoon.anacan;

import android.os.Build;
import android.util.Log;
import android.view.View;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";
    private static final String DISABLED_PLUGIN_CLASS = "com.dabchy.plugins.facebookevents.FacebookEventsPlugin";

    @Override
    protected void load() {
        disableProblematicAndroidPlugins();
        super.load();
        applySystemBarInsetsToWebView();
    }

    /**
     * Android 15 (targetSDK 35+) forces edge-to-edge, so the system navigation /
     * gesture bar overlaps the WebView. Pad the WebView by the bottom system
     * inset so our bottom nav is never covered. Also expose top inset as a
     * CSS variable so status-bar safe areas work.
     */
    private void applySystemBarInsetsToWebView() {
        try {
            WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
            final WebView webView = this.bridge.getWebView();
            if (webView == null) return;

            ViewCompat.setOnApplyWindowInsetsListener(webView, (v, windowInsets) -> {
                Insets bars = windowInsets.getInsets(
                    WindowInsetsCompat.Type.systemBars()
                    | WindowInsetsCompat.Type.displayCutout()
                );
                v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                return WindowInsetsCompat.CONSUMED;
            });
            webView.requestApplyInsets();
        } catch (Exception e) {
            Log.e(TAG, "Failed to apply window insets to WebView", e);
        }
    }

    @SuppressWarnings("unchecked")
    private void disableProblematicAndroidPlugins() {
        try {
            Field pluginsField = bridgeBuilder.getClass().getDeclaredField("plugins");
            pluginsField.setAccessible(true);

            List<Class<? extends Plugin>> plugins = (List<Class<? extends Plugin>>) pluginsField.get(bridgeBuilder);
            if (plugins == null || plugins.isEmpty()) {
                return;
            }

            List<Class<? extends Plugin>> filteredPlugins = new ArrayList<>();
            boolean removed = false;

            for (Class<? extends Plugin> pluginClass : plugins) {
                if (DISABLED_PLUGIN_CLASS.equals(pluginClass.getName())) {
                    removed = true;
                    continue;
                }
                filteredPlugins.add(pluginClass);
            }

            if (removed) {
                bridgeBuilder.setPlugins(filteredPlugins);
                Log.w(TAG, "Disabled Android FacebookEvents native plugin to prevent startup crashes.");
            }
        } catch (Exception error) {
            Log.e(TAG, "Failed to filter Capacitor plugins", error);
        }
    }
}
