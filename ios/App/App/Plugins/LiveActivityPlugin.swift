import Capacitor
import ActivityKit
import Foundation

@available(iOS 16.1, *)
@objc(LiveActivityPlugin)
public class LiveActivityPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "LiveActivityPlugin"
    public let jsName = "LiveActivity"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "startActivity", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopActivity", returnType: CAPPluginReturnPromise)
    ]
    
    private var currentActivity: Activity<AnacanTimerAttributes>?
    
    @objc func startActivity(_ call: CAPPluginCall) {
        guard let type = call.getString("type"),
              let label = call.getString("label"),
              let startTimeMs = call.getDouble("startTime") else {
            call.reject("Missing required parameters")
            return
        }
        
        let feedType = call.getString("feedType")
        let startTime = Date(timeIntervalSince1970: startTimeMs / 1000)
        
        let attributes = AnacanTimerAttributes(
            timerType: type,
            label: label,
            feedType: feedType,
            startTime: startTime
        )
        
        let contentState = AnacanTimerAttributes.ContentState(
            elapsedSeconds: 0,
            isActive: true
        )
        
        do {
            let activity = try Activity.request(
                attributes: attributes,
                content: .init(state: contentState, staleDate: nil),
                pushType: nil
            )
            currentActivity = activity
            call.resolve()
        } catch {
            call.reject("Failed to start Live Activity: \(error.localizedDescription)")
        }
    }
    
    @objc func stopActivity(_ call: CAPPluginCall) {
        Task {
            let finalState = AnacanTimerAttributes.ContentState(
                elapsedSeconds: 0,
                isActive: false
            )
            
            await currentActivity?.end(
                .init(state: finalState, staleDate: nil),
                dismissalPolicy: .immediate
            )
            currentActivity = nil
            call.resolve()
        }
    }
}
