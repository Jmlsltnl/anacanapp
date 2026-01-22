import { isNative, localNotifications } from "@/lib/native";

/**
 * Best-effort phone notification for incoming chat messages.
 * Note: This is NOT true remote push (works when the app is running and receives realtime updates).
 */
export const notifyIncomingChatMessage = async (params: {
  title: string;
  body: string;
  idSeed?: number;
}) => {
  if (!isNative) return;

  // Avoid showing system notifications while user is actively viewing the app.
  if (typeof document !== "undefined" && document.visibilityState === "visible") return;

  const id = Math.abs(Math.floor((params.idSeed ?? Date.now()) % 1_000_000_000));

  await localNotifications.schedule([
    {
      id,
      title: params.title,
      body: params.body,
      schedule: { at: new Date(Date.now() + 250) },
    },
  ]);
};
