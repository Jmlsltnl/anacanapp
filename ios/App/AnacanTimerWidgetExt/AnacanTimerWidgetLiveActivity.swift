import ActivityKit
import AppIntents
import WidgetKit
import SwiftUI

@available(iOS 16.1, *)
struct AnacanTimerWidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: AnacanTimerAttributes.self) { context in
            // ── Lock Screen / Notification Center ──
            HStack(spacing: 12) {
                Text(context.attributes.timerEmoji)
                    .font(.title2)

                VStack(alignment: .leading, spacing: 2) {
                    Text(context.attributes.label)
                        .font(.subheadline.bold())
                        .foregroundColor(.primary)

                    if let feedType = context.attributes.feedType {
                        Text(feedType == "left" ? "◀︎" : "▶︎")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                Spacer()

                // startTime-dan avtomatik sayan canlı sayğac
                Text(context.attributes.startTime, style: .timer)
                    .font(.title2.monospacedDigit().bold())
                    .foregroundColor(.primary)
                    .frame(maxWidth: 80, alignment: .trailing)

                // Dayandır (iOS 17+; 16.x-də toxunuş tətbiqi açır)
                if #available(iOS 17.0, *) {
                    Button(intent: AnacanTimerStopIntent(timerId: context.attributes.id)) {
                        Image(systemName: "stop.fill")
                            .font(.body.bold())
                            .foregroundColor(.white)
                            .frame(width: 36, height: 36)
                            .background(Circle().fill(Color.red.opacity(0.85)))
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding()
            .activityBackgroundTint(.init(white: 0.98))

        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Text(context.attributes.timerEmoji)
                        .font(.title2)
                }
                DynamicIslandExpandedRegion(.center) {
                    Text(context.attributes.label)
                        .font(.subheadline.bold())
                        .lineLimit(1)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text(context.attributes.startTime, style: .timer)
                        .font(.title3.monospacedDigit().bold())
                        .frame(maxWidth: 64, alignment: .trailing)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    if #available(iOS 17.0, *) {
                        Button(intent: AnacanTimerStopIntent(timerId: context.attributes.id)) {
                            Label("Stop", systemImage: "stop.fill")
                                .font(.caption.bold())
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 6)
                                .background(Capsule().fill(Color.red.opacity(0.85)))
                                .foregroundColor(.white)
                        }
                        .buttonStyle(.plain)
                    }
                }
            } compactLeading: {
                Text(context.attributes.timerEmoji)
            } compactTrailing: {
                Text(context.attributes.startTime, style: .timer)
                    .font(.caption.monospacedDigit())
                    .frame(maxWidth: 44)
            } minimal: {
                Text(context.attributes.timerEmoji)
            }
        }
    }
}
