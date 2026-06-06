package com.atlasoon.anacan;

import android.util.Log;
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
