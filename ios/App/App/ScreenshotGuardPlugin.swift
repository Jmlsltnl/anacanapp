import Foundation
import Capacitor
import UIKit

/**
 * Screenshot aşkarlama (sensitiv məlumatların yayılmaması üçün).
 *
 * iOS-da screenshot-u sistem səviyyəsində tam bloklamaq üçün rəsmi API yoxdur —
 * Apple yalnız FAKTDAN SONRA aşkarlamaya icazə verir
 * (UIApplication.userDidTakeScreenshotNotification). Screenshot çəkiləndə
 * JS-ə "screenshotTaken" hadisəsi göndərilir və tətbiq lokallaşdırılmış
 * xəbərdarlıq göstərir. (Android tərəfdə FLAG_SECURE ilə tam blok var.)
 *
 * Qeydiyyat: MainViewController.capacitorDidLoad() →
 *   bridge?.registerPluginInstance(ScreenshotGuardPlugin())
 * (Yerli plugin-lər packageClassList-ə düşmür — bax MainViewController şərhi.)
 */
@objc(ScreenshotGuardPlugin)
public class ScreenshotGuardPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ScreenshotGuardPlugin"
    public let jsName = "ScreenshotGuard"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "setEnabled", returnType: CAPPluginReturnPromise)
    ]

    private var observer: NSObjectProtocol?

    override public func load() {
        observer = NotificationCenter.default.addObserver(
            forName: UIApplication.userDidTakeScreenshotNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.notifyListeners("screenshotTaken", data: [:])
        }
    }

    /// Android ilə API paritetliyi üçün (iOS-da sistem bloku yoxdur — no-op)
    @objc func setEnabled(_ call: CAPPluginCall) {
        call.resolve()
    }

    deinit {
        if let observer = observer {
            NotificationCenter.default.removeObserver(observer)
        }
    }
}
