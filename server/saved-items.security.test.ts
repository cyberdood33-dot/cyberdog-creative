import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function context(user: TrpcContext["user"]): TrpcContext {
  return { user, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("saved items authorization", () => {
  it("rejects unauthenticated saved-item access", async () => {
    const caller = appRouter.createCaller(context(null));
    await expect(caller.saved.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("passes the authenticated owner and validated item into saved-item toggling", async () => {
    const helper = await import("./db");
    const spy = vi.spyOn(helper, "toggleSavedItem").mockResolvedValue({ saved: true });
    const caller = appRouter.createCaller(context({ id: 7, openId: "member", name: "Member", email: null, loginMethod: null, role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }));
    await expect(caller.saved.toggle({ itemType: "docs", itemId: 14 })).resolves.toEqual({ saved: true });
    expect(spy).toHaveBeenCalledWith(7, "docs", 14);
    spy.mockRestore();
  });
});
