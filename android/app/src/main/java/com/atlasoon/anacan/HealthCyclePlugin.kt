package com.atlasoon.anacan

import androidx.activity.result.ActivityResult
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.MenstruationFlowRecord
import androidx.health.connect.client.records.metadata.Metadata
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.ZoneOffset

/**
 * HealthCycle — menstruasiya məlumatının Google Health Connect-ə YAZILMASI.
 * (capacitor-health plugini yalnız oxuyur; yazma üçün bu lokal plugin.)
 *
 * JS tərəfi: src/lib/healthCycle.ts
 */
@CapacitorPlugin(name = "HealthCycle")
class HealthCyclePlugin : Plugin() {

    private val writePermission = HealthPermission.getWritePermission(MenstruationFlowRecord::class)
    private val permissionContract = PermissionController.createRequestPermissionResultContract()
    private val scope = CoroutineScope(Dispatchers.IO)

    private fun client(): HealthConnectClient? {
        return try {
            if (HealthConnectClient.getSdkStatus(context) == HealthConnectClient.SDK_AVAILABLE) {
                HealthConnectClient.getOrCreate(context)
            } else null
        } catch (e: Exception) {
            null
        }
    }

    @PluginMethod
    fun isAvailable(call: PluginCall) {
        val ret = JSObject()
        ret.put("available", client() != null)
        call.resolve(ret)
    }

    @PluginMethod
    fun requestWritePermission(call: PluginCall) {
        val hc = client()
        if (hc == null) {
            val ret = JSObject()
            ret.put("granted", false)
            call.resolve(ret)
            return
        }
        scope.launch {
            try {
                val granted = hc.permissionController.getGrantedPermissions()
                if (granted.contains(writePermission)) {
                    val ret = JSObject()
                    ret.put("granted", true)
                    call.resolve(ret)
                    return@launch
                }
                // İcazə dialoqu — activity nəticəsi permResult-a gəlir
                activity.runOnUiThread {
                    val intent = permissionContract.createIntent(context, setOf(writePermission))
                    startActivityForResult(call, intent, "permResult")
                }
            } catch (e: Exception) {
                call.reject("permission_check_failed", e)
            }
        }
    }

    @ActivityCallback
    private fun permResult(call: PluginCall?, result: ActivityResult) {
        if (call == null) return
        val grantedSet = permissionContract.parseResult(result.resultCode, result.data)
        val ret = JSObject()
        ret.put("granted", grantedSet.contains(writePermission))
        call.resolve(ret)
    }

    /**
     * writeMenstruation({ startDate: 'yyyy-MM-dd', endDate: 'yyyy-MM-dd', flow: 'light'|'medium'|'heavy' })
     * Hər gün üçün ayrıca MenstruationFlowRecord yazır.
     */
    @PluginMethod
    fun writeMenstruation(call: PluginCall) {
        val hc = client()
        if (hc == null) {
            call.reject("health_connect_unavailable")
            return
        }
        val startStr = call.getString("startDate") ?: run { call.reject("startDate_required"); return }
        val endStr = call.getString("endDate") ?: startStr
        val flowStr = call.getString("flow") ?: "medium"

        val flowValue = when (flowStr) {
            "light" -> MenstruationFlowRecord.FLOW_LIGHT
            "heavy" -> MenstruationFlowRecord.FLOW_HEAVY
            else -> MenstruationFlowRecord.FLOW_MEDIUM
        }

        scope.launch {
            try {
                val granted = hc.permissionController.getGrantedPermissions()
                if (!granted.contains(writePermission)) {
                    call.reject("write_permission_missing")
                    return@launch
                }

                val start = java.time.LocalDate.parse(startStr)
                val end = java.time.LocalDate.parse(endStr)
                val records = mutableListOf<MenstruationFlowRecord>()
                var d = start
                while (!d.isAfter(end)) {
                    // Günorta vaxtı — timezone kənarlarından qaçmaq üçün
                    val time: Instant = d.atTime(12, 0).toInstant(ZoneOffset.UTC)
                    records.add(
                        MenstruationFlowRecord(
                            time = time,
                            zoneOffset = ZoneOffset.UTC,
                            flow = flowValue,
                            metadata = Metadata.manualEntry()
                        )
                    )
                    d = d.plusDays(1)
                }

                hc.insertRecords(records)
                val ret = JSObject()
                ret.put("written", records.size)
                call.resolve(ret)
            } catch (e: Exception) {
                call.reject("write_failed: ${e.message}", e)
            }
        }
    }
}
