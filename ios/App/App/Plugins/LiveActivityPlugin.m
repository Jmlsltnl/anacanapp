#import <Capacitor/Capacitor.h>

CAP_PLUGIN(LiveActivityPlugin, "LiveActivity",
    CAP_PLUGIN_METHOD(startActivity, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(stopActivity, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(getPendingStops, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(clearPendingStops, CAPPluginReturnPromise);
)
