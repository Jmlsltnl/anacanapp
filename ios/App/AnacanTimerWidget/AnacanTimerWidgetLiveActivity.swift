import ActivityKit
import WidgetKit
import SwiftUI

@available(iOS 16.1, *)
struct AnacanTimerWidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: AnacanTimerAttributes.self) { context in
            // Lock Screen / Notification Center UI
            HStack(spacing: 12) {
                Text(context.attributes.timerEmoji)
                    .font(.title2)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(context.attributes.label)
                        .font(.subheadline.bold())
                        .foregroundColor(.primary)
                    
                    if let feedType = context.attributes.feedType {
                        Text(feedType == "left" ? "Sol" : "Sağ")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                Spacer()
                
                // Timer counting up from startTime
                Text(context.attributes.startTime, style: .timer)
                    .font(.title2.monospacedDigit().bold())
                    .foregroundColor(.primary)
            }
            .padding()
            .activityBackgroundTint(.init(white: 0.98))
            
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded
                DynamicIslandExpandedRegion(.leading) {
                    Text(context.attributes.timerEmoji)
                        .font(.title2)
                }
                DynamicIslandExpandedRegion(.center) {
                    Text(context.attributes.label)
                        .font(.subheadline.bold())
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text(context.attributes.startTime, style: .timer)
                        .font(.title3.monospacedDigit().bold())
                }
            } compactLeading: {
                Text(context.attributes.timerEmoji)
            } compactTrailing: {
                Text(context.attributes.startTime, style: .timer)
                    .font(.caption.monospacedDigit())
            } minimal: {
                Text(context.attributes.timerEmoji)
            }
        }
    }
}
