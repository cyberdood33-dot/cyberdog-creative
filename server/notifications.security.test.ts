import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import type { TrpcContext } from "./_core/context";

function context(role: "user" | "admin" | null): TrpcContext {
  return { user: role ? { id: 19, openId: "member", name: "Member", email: null, loginMethod: null, role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } : null, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("notifications authorization", () => {
  it("rejects an unauthenticated inbox request", async () => {
    await expect(appRouter.createCaller(context(null)).notifications.inbox()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("marks only the authenticated member's notification ids", async () => {
    const spy = vi.spyOn(db, "markNotificationsRead").mockResolvedValue();
    await appRouter.createCaller(context("user")).notifications.markRead({ ids: [3, 4] });
    expect(spy).toHaveBeenCalledWith(19, [3, 4]);
    spy.mockRestore();
  });

  it("limits creating notifications to the owner role", async () => {
    const input = { userId: 8, type: "release" as const, title: "New signal", body: "A fresh system update is ready.", href: "/docs" };
    await expect(appRouter.createCaller(context("user")).notifications.create(input)).rejects.toMatchObject({ code: "FORBIDDEN" });
    const spy = vi.spyOn(db, "createNotification").mockResolvedValue();
    await appRouter.createCaller(context("admin")).notifications.create(input);
    expect(spy).toHaveBeenCalledWith(input);
    spy.mockRestore();
  });
});
