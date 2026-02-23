import ActivityKit
import Foundation

struct AnacanTimerAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var elapsedSeconds: Int
        var isActive: Bool
    }
    
    var timerType: String    // "sleep", "feeding", "diaper", "white-noise"
    var label: String
    var feedType: String?    // "left" or "right" (for feeding)
    var startTime: Date
    
    var timerEmoji: String {
        switch timerType {
        case "sleep": return "😴"
        case "feeding": return "🍼"
        case "diaper": return "🧷"
        case "white-noise": return "🔊"
        default: return "⏱"
        }
    }
    
    var timerColor: String {
        switch timerType {
        case "sleep": return "indigo"
        case "feeding": return "rose"
        case "diaper": return "amber"
        case "white-noise": return "emerald"
        default: return "blue"
        }
    }
}
