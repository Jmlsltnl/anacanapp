import Foundation
import Capacitor
import HealthKit

/**
 * HealthCycle — menstruasiya məlumatının Apple Health-ə YAZILMASI.
 * (capacitor-health plugini yalnız oxuyur; yazma üçün bu lokal plugin.)
 *
 * QEYD: Bu fayl Xcode-da App target-inə əlavə olunmalıdır
 * (PrivacyInfo.xcprivacy ilə eyni qaydada).
 *
 * JS tərəfi: src/lib/healthCycle.ts
 */
@objc(HealthCyclePlugin)
public class HealthCyclePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "HealthCyclePlugin"
    public let jsName = "HealthCycle"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestWritePermission", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "writeMenstruation", returnType: CAPPluginReturnPromise)
    ]

    private let store = HKHealthStore()

    private var menstrualType: HKCategoryType? {
        return HKObjectType.categoryType(forIdentifier: .menstrualFlow)
    }

    @objc func isAvailable(_ call: CAPPluginCall) {
        call.resolve(["available": HKHealthStore.isHealthDataAvailable()])
    }

    @objc func requestWritePermission(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable(), let type = menstrualType else {
            call.resolve(["granted": false])
            return
        }
        store.requestAuthorization(toShare: [type], read: []) { _, error in
            if let error = error {
                call.reject("permission_request_failed: \(error.localizedDescription)")
                return
            }
            // iOS yazma icazəsi status sorğusuna cavab verir
            let status = self.store.authorizationStatus(for: type)
            call.resolve(["granted": status == .sharingAuthorized])
        }
    }

    /// writeMenstruation({ startDate: 'yyyy-MM-dd', endDate: 'yyyy-MM-dd', flow: 'light'|'medium'|'heavy' })
    /// Hər gün üçün ayrıca nümunə; ilk gün cycleStart = true.
    @objc func writeMenstruation(_ call: CAPPluginCall) {
        guard let type = menstrualType else {
            call.reject("healthkit_unavailable")
            return
        }
        guard let startStr = call.getString("startDate") else {
            call.reject("startDate_required")
            return
        }
        let endStr = call.getString("endDate") ?? startStr
        let flowStr = call.getString("flow") ?? "medium"

        let flowValue: HKCategoryValueMenstrualFlow
        switch flowStr {
        case "light": flowValue = .light
        case "heavy": flowValue = .heavy
        default: flowValue = .medium
        }

        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = TimeZone(identifier: "UTC")
        guard let startDate = formatter.date(from: startStr),
              let endDate = formatter.date(from: endStr),
              startDate <= endDate else {
            call.reject("invalid_dates")
            return
        }

        var samples: [HKCategorySample] = []
        var day = startDate
        var isFirst = true
        let calendar = Calendar(identifier: .gregorian)

        while day <= endDate {
            // Günorta — timezone kənar hallarından qaçmaq üçün
            let sampleStart = calendar.date(byAdding: .hour, value: 12, to: day) ?? day
            let sampleEnd = calendar.date(byAdding: .minute, value: 1, to: sampleStart) ?? sampleStart
            let metadata: [String: Any] = [HKMetadataKeyMenstrualCycleStart: isFirst]
            samples.append(HKCategorySample(
                type: type,
                value: flowValue.rawValue,
                start: sampleStart,
                end: sampleEnd,
                metadata: metadata
            ))
            isFirst = false
            guard let next = calendar.date(byAdding: .day, value: 1, to: day) else { break }
            day = next
        }

        store.save(samples) { success, error in
            if let error = error {
                call.reject("write_failed: \(error.localizedDescription)")
                return
            }
            call.resolve(["written": samples.count, "success": success])
        }
    }
}
