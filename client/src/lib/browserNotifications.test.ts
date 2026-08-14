import { afterEach, describe, expect, it, vi } from "vitest";
import { getBrowserNotificationState, requestBrowserNotificationPermission } from "./browserNotifications";

const originalNotification = (globalThis as { Notification?: unknown }).Notification;

afterEach(() => {
  if (originalNotification === undefined) delete (globalThis as { Notification?: unknown }).Notification;
  else (globalThis as { Notification?: unknown }).Notification = originalNotification;
});

describe("browser notification preferences", () => {
  it("reports unsupported when the browser API is unavailable", async () => {
    delete (globalThis as { Notification?: unknown }).Notification;
    expect(getBrowserNotificationState()).toBe("unsupported");
    await expect(requestBrowserNotificationPermission()).resolves.toBe("unsupported");
  });

  it("reads and requests the native browser permission state", async () => {
    const requestPermission = vi.fn().mockResolvedValue("granted");
    (globalThis as { Notification?: unknown }).Notification = { permission: "default", requestPermission };
    expect(getBrowserNotificationState()).toBe("default");
    await expect(requestBrowserNotificationPermission()).resolves.toBe("granted");
    expect(requestPermission).toHaveBeenCalledOnce();
  });
});
