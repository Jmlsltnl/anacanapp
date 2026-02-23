package com.atlasoon.anacan

import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "LiveActivity")
class TimerWidgetPlugin : Plugin() {
    
    @PluginMethod
    fun startActivity(call: PluginCall) {
        val type = call.getString("type") ?: run {
            call.reject("Missing type parameter")
            return
        }
        val label = call.getString("label") ?: run {
            call.reject("Missing label parameter")
            return
        }
        val startTime = call.getDouble("startTime")?.toLong() ?: System.currentTimeMillis()
        val feedType = call.getString("feedType")
        
        TimerWidgetProvider.startTimer(context, type, label, startTime, feedType)
        call.resolve()
    }
    
    @PluginMethod
    fun stopActivity(call: PluginCall) {
        TimerWidgetProvider.stopTimer(context)
        call.resolve()
    }
}
