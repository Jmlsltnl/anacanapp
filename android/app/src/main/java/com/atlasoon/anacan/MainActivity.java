package com.atlasoon.anacan;

import android.graphics.Color;
import android.os.Build;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
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
     * Android 15 (targetSDK 35+) enforces edge-to-edge, so on Samsung One UI
     * and other OEM skins the system navigation / gesture bar overlaps the
     * WebView contents. We:
     *   1) Make the navigation bar transparent (no visual stripe).
     *   2) Disable auto-fit, then install a window-insets listener that
     *      pads the WebView by the system bars + display cutout on every
     *      configuration change (rotation, gesture/3-button toggle, etc).
     */
    private void applySystemBarInsetsToWebView() {
        try {
            Window window = getWindow();
            WindowCompat.setDecorFitsSystemWindows(window, false);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);
                window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
                window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
                window.setNavigationBarColor(Color.TRANSPARENT);
                window.setStatusBarColor(Color.TRANSPARENT);
            }

            final WebView webView = this.bridge.getWebView();
            if (webView == null) {
                Log.w(TAG, "WebView is null; cannot apply insets");
                return;
            }

            // Pad both the WebView and its parent container so fixed-position
            // CSS elements (bottom nav) sit above the system bars.
            final View parent = (View) webView.getParent();

            ViewCompat.setOnApplyWindowInsetsListener(webView, (v, windowInsets) -> {
                Insets bars = windowInsets.getInsets(
                    WindowInsetsCompat.Type.systemBars()
                    | WindowInsetsCompat.Type.displayCutout()
                );
                v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                if (parent != null) {
                    parent.setPadding(0, 0, 0, 0);
                }
                return windowInsets;
            });
            webView.requestApplyInsets();
            if (parent != null) {
                parent.requestApplyInsets();
            }
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
