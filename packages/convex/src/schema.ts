import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    _id: v.id("users"),
    email: v.string(),
    password: v.string(),
    name: v.string(),
    phone: v.string(),
    image: v.string(),
    profileImageStorageId: v.optional(v.id("_storage")),
    class: v.string(),
    memohackStudent: v.optional(v.boolean()),
    admin: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_email", ["email"]),
  emailOtps: defineTable({
    _id: v.id("emailOtps"),
    email: v.string(),
    userId: v.optional(v.id("users")),
    purpose: v.union(v.literal("signup"), v.literal("password_change")),
    generatedOtpHash: v.string(),
    attempts: v.number(),
    maxAttempts: v.number(),
    expiresAt: v.number(),
    consumedAt: v.optional(v.number()),
    lastSentAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_email_purpose", ["email", "purpose"]),
  chapters: defineTable({
    _id: v.id("chapters"),
    title: v.string(),
    description: v.string(),
    difficulty: v.string(),
    class: v.string(),
    subject: v.string(),
    notes: v.optional(
      v.array(
        v.object({
          name: v.string(),
          url: v.string(),
        }),
      ),
    ),
    videos: v.optional(
      v.array(
        v.object({
          title: v.string(),
          description: v.optional(v.string()),
          youtubeUrl: v.string(),
        }),
      ),
    ),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  }),
  aiChatSessions: defineTable({
    _id: v.id("aiChatSessions"),
    userId: v.id("users"),
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
  aiChatMessages: defineTable({
    _id: v.id("aiChatMessages"),
    sessionId: v.id("aiChatSessions"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_session", ["sessionId"]),
  aiUserUsageDaily: defineTable({
    _id: v.id("aiUserUsageDaily"),
    userId: v.id("users"),
    dayKey: v.string(),
    requestsUsed: v.number(),
    tokensUsed: v.number(),
    minuteWindowStart: v.number(),
    minuteRequestsUsed: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_day", ["userId", "dayKey"])
    .index("by_day", ["dayKey"]),
});
