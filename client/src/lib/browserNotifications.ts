export type BrowserNotificationState = NotificationPermission | "unsupported";

export function getBrowserNotificationState(): BrowserNotificationState {
  return "Notification" in globalThis ? Notification.permission : "unsupported";
}

export async function requestBrowserNotificationPermission(): Promise<BrowserNotificationState> {
  if (!("Notification" in globalThis)) return "unsupported";
  return Notification.requestPermission();
}
