import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const baseContext = (role: "user" | "admin" = "user"): TrpcContext => ({
  user: { id: 7, openId: "member-7", name: "Member", email: "member@example.com", loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: { clearCookie: () => undefined } as TrpcContext["res"],
});

describe("Cyberdog authorization boundaries", () => {
  it("rejects anonymous social publishing", async () => {
    const caller = appRouter.createCaller({ ...baseContext(), user: null });
    await expect(caller.social.createPost({ body: "A member-only dispatch", visibility: "public" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects ordinary members from publishing blog content", async () => {
    const caller = appRouter.createCaller(baseContext("user"));
    await expect(caller.content.createBlogPost({ slug: "test-post", title: "Test post", excerpt: "A valid enough summary for this post.", body: "A sufficiently long body to satisfy the editor contract and ensure the role boundary is evaluated first.", status: "draft" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("validates encrypted message envelopes before storage", async () => {
    const caller = appRouter.createCaller(baseContext());
    await expect(caller.messenger.send({ conversationId: "short", ciphertext: "", initializationVector: "tiny" })).rejects.toBeTruthy();
  });
});
