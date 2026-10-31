package com.connectmate.app;

import android.app.AppOpsManager;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Process;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "UsageStatsPlugin")
public class UsageStatsPlugin extends Plugin {

    /**
     * Check if app has PACKAGE_USAGE_STATS permission
     */
    private boolean hasUsageStatsPermission() {
        AppOpsManager appOps = (AppOpsManager) getContext().getSystemService(Context.APP_OPS_SERVICE);
        if (appOps == null) return false;
        int mode = appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                getContext().getPackageName()
        );
        return mode == AppOpsManager.MODE_ALLOWED;
    }

    /**
     * Request user to grant UsageStats in Android Settings
     */
    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (!hasUsageStatsPermission()) {
            Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve(new JSObject().put("granted", false).put("message", "Opened Settings for Usage Access"));
        } else {
            call.resolve(new JSObject().put("granted", true).put("message", "Permission already granted"));
        }
    }

    /**
     * Query currently active foreground application packageName
     */
    @PluginMethod
    public void getForegroundApp(PluginCall call) {
        if (!hasUsageStatsPermission()) {
            call.reject("PERMISSION_DENIED", "Cần cấp quyền 'Truy cập dữ liệu sử dụng' (Usage Access) trong Cài đặt Android.");
            return;
        }

        UsageStatsManager usm = (UsageStatsManager) getContext().getSystemService(Context.USAGE_STATS_SERVICE);
        if (usm == null) {
            call.reject("SERVICE_UNAVAILABLE", "UsageStatsManager không khả dụng trên thiết bị này.");
            return;
        }

        long now = System.currentTimeMillis();
        long start = now - 1000 * 10; // Last 10 seconds

        UsageEvents events = usm.queryEvents(start, now);
        UsageEvents.Event event = new UsageEvents.Event();
        String currentForegroundPackage = null;

        while (events.hasNextEvent()) {
            events.getNextEvent(event);
            if (event.getEventType() == UsageEvents.Event.ACTIVITY_RESUMED) {
                currentForegroundPackage = event.getPackageName();
            }
        }

        JSObject ret = new JSObject();
        if (currentForegroundPackage != null) {
            ret.put("packageName", currentForegroundPackage);
            ret.put("hasPermission", true);
            call.resolve(ret);
        } else {
            ret.put("packageName", getContext().getPackageName());
            ret.put("hasPermission", true);
            call.resolve(ret);
        }
    }
}
