import { boolean, index, int, mysqlEnum, mysqlTable, primaryKey, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const userProfiles = mysqlTable("userProfiles", {
  userId: int("userId").primaryKey().notNull(),
  displayName: varchar("displayName", { length: 160 }),
  avatarUrl: varchar("avatarUrl", { length: 2048 }),
  headline: varchar("headline", { length: 220 }),
  bio: text("bio"),
  websiteUrl: varchar("websiteUrl", { length: 2048 }),
  publicEncryptionKey: text("publicEncryptionKey"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const accountPreferences = mysqlTable("accountPreferences", {
  userId: int("userId").primaryKey().notNull(),
  showEmail: boolean("showEmail").default(false).notNull(),
  allowDirectMessages: boolean("allowDirectMessages").default(true).notNull(),
  digestOptIn: boolean("digestOptIn").default(true).notNull(),
  aiAssistOptIn: boolean("aiAssistOptIn").default(false).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const portfolioItems = mysqlTable("portfolioItems", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 180 }).notNull(),
  summary: text("summary").notNull(),
  kind: varchar("kind", { length: 80 }).notNull(),
  linkUrl: varchar("linkUrl", { length: 2048 }),
  imageUrl: varchar("imageUrl", { length: 2048 }),
  featured: boolean("featured").default(false).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const blogPosts = mysqlTable("blogPosts", {
  id: int("id").autoincrement().primaryKey(),
  authorId: int("authorId").notNull(),
  slug: varchar("slug", { length: 180 }).notNull(),
  title: varchar("title", { length: 220 }).notNull(),
  excerpt: text("excerpt").notNull(),
  body: text("body").notNull(),
  coverImageUrl: varchar("coverImageUrl", { length: 2048 }),
  status: mysqlEnum("status", ["draft", "published"]).default("draft").notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("blogPosts_slug_unique").on(table.slug),
  index("blogPosts_status_published_idx").on(table.status, table.publishedAt),
]);

export const socialPosts = mysqlTable("socialPosts", {
  id: int("id").autoincrement().primaryKey(),
  authorId: int("authorId").notNull(),
  body: text("body").notNull(),
  visibility: mysqlEnum("visibility", ["public", "followers"]).default("public").notNull(),
  hidden: boolean("hidden").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("socialPosts_created_idx").on(table.createdAt)]);

export const socialComments = mysqlTable("socialComments", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  authorId: int("authorId").notNull(),
  parentId: int("parentId"),
  body: text("body").notNull(),
  hidden: boolean("hidden").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("socialComments_post_idx").on(table.postId, table.createdAt)]);

export const socialReactions = mysqlTable("socialReactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  postId: int("postId").notNull(),
  reaction: mysqlEnum("reaction", ["appreciate", "insightful", "signal"]).default("appreciate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [uniqueIndex("socialReactions_user_post_unique").on(table.userId, table.postId)]);

export const savedItems = mysqlTable("savedItems", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  itemType: mysqlEnum("itemType", ["portfolio", "blog", "docs", "social"]).notNull(),
  itemId: int("itemId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  uniqueIndex("savedItems_user_item_unique").on(table.userId, table.itemType, table.itemId),
  index("savedItems_user_created_idx").on(table.userId, table.createdAt),
]);

export const memberNotifications = mysqlTable("memberNotifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["system", "comment", "follow", "friend", "support", "release"]).default("system").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  body: text("body").notNull(),
  href: varchar("href", { length: 2048 }),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("memberNotifications_user_read_created_idx").on(table.userId, table.readAt, table.createdAt)]);

export const follows = mysqlTable("follows", {
  followerId: int("followerId").notNull(),
  followingId: int("followingId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [primaryKey({ columns: [table.followerId, table.followingId], name: "follows_pk" })]);

export const friendships = mysqlTable("friendships", {
  id: int("id").autoincrement().primaryKey(),
  requesterId: int("requesterId").notNull(),
  recipientId: int("recipientId").notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "declined"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("friendships_pair_unique").on(table.requesterId, table.recipientId)]);

export const conversations = mysqlTable("conversations", {
  id: varchar("id", { length: 64 }).primaryKey(),
  memberAId: int("memberAId").notNull(),
  memberBId: int("memberBId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("conversations_pair_unique").on(table.memberAId, table.memberBId)]);

export const encryptedMessages = mysqlTable("encryptedMessages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: varchar("conversationId", { length: 64 }).notNull(),
  senderId: int("senderId").notNull(),
  ciphertext: text("ciphertext").notNull(),
  initializationVector: varchar("initializationVector", { length: 128 }).notNull(),
  algorithm: varchar("algorithm", { length: 64 }).default("ECDH-P256/HKDF-SHA256/AES-256-GCM").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("encryptedMessages_conversation_idx").on(table.conversationId, table.createdAt)]);

export const supportTickets = mysqlTable("supportTickets", {
  id: int("id").autoincrement().primaryKey(),
  requesterId: int("requesterId"),
  externalSubmissionId: varchar("externalSubmissionId", { length: 128 }),
  subject: varchar("subject", { length: 220 }).notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "resolved"]).default("open").notNull(),
  priority: mysqlEnum("priority", ["low", "normal", "high"]).default("normal").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("supportTickets_status_idx").on(table.status, table.updatedAt)]);

export const docsPages = mysqlTable("docsPages", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 220 }).notNull(),
  title: varchar("title", { length: 220 }).notNull(),
  summary: text("summary").notNull(),
  body: text("body").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  published: boolean("published").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("docsPages_slug_unique").on(table.slug)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
