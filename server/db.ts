import { and, desc, eq, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { nanoid } from "nanoid";
import {
  accountPreferences,
  blogPosts,
  conversations,
  docsPages,
  encryptedMessages,
  follows,
  friendships,
  InsertUser,
  portfolioItems,
  socialComments,
  socialPosts,
  socialReactions,
  supportTickets,
  userProfiles,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  updateSet.role = values.role;
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(users).where(eq(users.openId, openId)).limit(1))[0];
}

export async function getBootstrapData() {
  const db = await getDb();
  if (!db) return { portfolio: [], posts: [], feed: [], docs: [], tickets: [] };
  const [portfolio, posts, feed, docs] = await Promise.all([
    db.select().from(portfolioItems).where(eq(portfolioItems.featured, true)).orderBy(portfolioItems.sortOrder).limit(8),
    db.select().from(blogPosts).where(eq(blogPosts.status, "published")).orderBy(desc(blogPosts.publishedAt)).limit(16),
    db.select({ post: socialPosts, authorName: users.name, avatarUrl: userProfiles.avatarUrl })
      .from(socialPosts).leftJoin(users, eq(users.id, socialPosts.authorId)).leftJoin(userProfiles, eq(userProfiles.userId, socialPosts.authorId))
      .where(eq(socialPosts.hidden, false)).orderBy(desc(socialPosts.createdAt)).limit(24),
    db.select().from(docsPages).where(eq(docsPages.published, true)).orderBy(docsPages.category, docsPages.sortOrder).limit(48),
  ]);
  return { portfolio, posts, feed, docs, tickets: [] };
}

export async function getPublishedBlog(slug?: string) {
  const db = await getDb();
  if (!db) return [];
  const condition = slug ? and(eq(blogPosts.slug, slug), eq(blogPosts.status, "published")) : eq(blogPosts.status, "published");
  return db.select({ post: blogPosts, authorName: users.name, avatarUrl: userProfiles.avatarUrl })
    .from(blogPosts).leftJoin(users, eq(users.id, blogPosts.authorId)).leftJoin(userProfiles, eq(userProfiles.userId, blogPosts.authorId))
    .where(condition).orderBy(desc(blogPosts.publishedAt));
}

export async function createBlogPost(authorId: number, values: { slug: string; title: string; excerpt: string; body: string; status: "draft" | "published"; coverImageUrl?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const publishedAt = values.status === "published" ? new Date() : null;
  await db.insert(blogPosts).values({ ...values, authorId, publishedAt });
}

export async function updateBlogPost(id: number, values: Partial<{ title: string; excerpt: string; body: string; slug: string; status: "draft" | "published"; coverImageUrl: string }>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(blogPosts).set({ ...values, ...(values.status === "published" ? { publishedAt: new Date() } : {}) }).where(eq(blogPosts.id, id));
}

export async function deleteBlogPost(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(blogPosts).where(eq(blogPosts.id, id));
}

export async function createSocialPost(authorId: number, body: string, visibility: "public" | "followers") {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(socialPosts).values({ authorId, body, visibility });
}

export async function createSocialComment(authorId: number, postId: number, body: string, parentId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(socialComments).values({ authorId, postId, body, parentId: parentId ?? null });
}

export async function toggleReaction(userId: number, postId: number, reaction: "appreciate" | "insightful" | "signal") {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await db.select().from(socialReactions).where(and(eq(socialReactions.userId, userId), eq(socialReactions.postId, postId))).limit(1);
  if (existing[0]) await db.delete(socialReactions).where(eq(socialReactions.id, existing[0].id));
  else await db.insert(socialReactions).values({ userId, postId, reaction });
}

export async function followMember(followerId: number, followingId: number) {
  if (followerId === followingId) throw new Error("You cannot follow your own profile");
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(follows).values({ followerId, followingId }).onDuplicateKeyUpdate({ set: { createdAt: new Date() } });
}

export async function unfollowMember(followerId: number, followingId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(follows).where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
}

export async function requestFriend(requesterId: number, recipientId: number) {
  if (requesterId === recipientId) throw new Error("You cannot friend your own profile");
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(friendships).values({ requesterId, recipientId }).onDuplicateKeyUpdate({ set: { status: "pending", updatedAt: new Date() } });
}

export async function respondFriendship(recipientId: number, id: number, status: "accepted" | "declined") {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(friendships).set({ status }).where(and(eq(friendships.id, id), eq(friendships.recipientId, recipientId)));
}

export async function upsertProfile(userId: number, values: { displayName?: string; avatarUrl?: string; headline?: string; bio?: string; websiteUrl?: string; publicEncryptionKey?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(userProfiles).values({ userId, ...values }).onDuplicateKeyUpdate({ set: { ...values, updatedAt: new Date() } });
}

export async function upsertPreferences(userId: number, values: { showEmail: boolean; allowDirectMessages: boolean; digestOptIn: boolean; aiAssistOptIn: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(accountPreferences).values({ userId, ...values }).onDuplicateKeyUpdate({ set: { ...values, updatedAt: new Date() } });
}

export async function getProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select({ user: users, profile: userProfiles, preferences: accountPreferences })
    .from(users).leftJoin(userProfiles, eq(userProfiles.userId, users.id)).leftJoin(accountPreferences, eq(accountPreferences.userId, users.id))
    .where(eq(users.id, userId)).limit(1);
  return result[0];
}

export async function getMemberKey(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select({ publicEncryptionKey: userProfiles.publicEncryptionKey, displayName: userProfiles.displayName, name: users.name })
    .from(users).leftJoin(userProfiles, eq(userProfiles.userId, users.id)).where(eq(users.id, userId)).limit(1))[0];
}

export async function getOrCreateConversation(memberA: number, memberB: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [first, second] = memberA < memberB ? [memberA, memberB] : [memberB, memberA];
  const existing = await db.select().from(conversations).where(and(eq(conversations.memberAId, first), eq(conversations.memberBId, second))).limit(1);
  if (existing[0]) return existing[0];
  const id = nanoid(22);
  await db.insert(conversations).values({ id, memberAId: first, memberBId: second });
  return (await db.select().from(conversations).where(eq(conversations.id, id)).limit(1))[0];
}

export async function assertParticipant(conversationId: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const conversation = await db.select().from(conversations).where(and(eq(conversations.id, conversationId), or(eq(conversations.memberAId, userId), eq(conversations.memberBId, userId)))).limit(1);
  if (!conversation[0]) throw new Error("Conversation not found or access denied");
  return conversation[0];
}

export async function storeEncryptedMessage(senderId: number, values: { conversationId: string; ciphertext: string; initializationVector: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertParticipant(values.conversationId, senderId);
  await db.insert(encryptedMessages).values({ ...values, senderId });
  await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, values.conversationId));
}

export async function getEncryptedMessages(userId: number, conversationId: string) {
  const db = await getDb();
  if (!db) return [];
  await assertParticipant(conversationId, userId);
  return db.select().from(encryptedMessages).where(eq(encryptedMessages.conversationId, conversationId)).orderBy(encryptedMessages.createdAt).limit(150);
}

export async function listDocs(slug?: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(docsPages).where(slug ? and(eq(docsPages.slug, slug), eq(docsPages.published, true)) : eq(docsPages.published, true)).orderBy(docsPages.category, docsPages.sortOrder);
}

export async function createDoc(values: { slug: string; title: string; summary: string; body: string; category: string; sortOrder?: number; published?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(docsPages).values(values);
}

export async function setPostVisibility(postId: number, hidden: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(socialPosts).set({ hidden }).where(eq(socialPosts.id, postId));
}
