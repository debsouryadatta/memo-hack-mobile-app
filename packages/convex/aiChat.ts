import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { throwAppError } from "./errors";

// ── Sessions ──────────────────────────────────────────────────────────────

export const createSession = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throwAppError("AUTH_REQUIRED", "User not found");
    const now = Date.now();
    const sessionId = await ctx.db.insert("aiChatSessions", {
      userId: args.userId,
      title: args.title,
      createdAt: now,
      updatedAt: now,
    });
    return await ctx.db.get(sessionId);
  },
});

export const listSessions = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("aiChatSessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const deleteSession = mutation({
  args: { sessionId: v.id("aiChatSessions"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throwAppError("NOT_FOUND", "Session not found");
    if (session.userId !== args.userId) throwAppError("FORBIDDEN", "Not your session");

    // Delete all messages in the session first
    const messages = await ctx.db
      .query("aiChatMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }

    await ctx.db.delete(args.sessionId);
    return { success: true };
  },
});

// ── Messages ──────────────────────────────────────────────────────────────

export const listMessages = query({
  args: { sessionId: v.id("aiChatSessions"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== args.userId) return [];
    return await ctx.db
      .query("aiChatMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();
  },
});

export const saveMessage = mutation({
  args: {
    sessionId: v.id("aiChatSessions"),
    userId: v.id("users"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throwAppError("NOT_FOUND", "Session not found");
    if (session.userId !== args.userId) throwAppError("FORBIDDEN", "Not your session");

    const now = Date.now();
    const msgId = await ctx.db.insert("aiChatMessages", {
      sessionId: args.sessionId,
      role: args.role,
      content: args.content,
      createdAt: now,
      updatedAt: now,
    });

    // Update session's updatedAt
    await ctx.db.patch(args.sessionId, { updatedAt: now });

    return await ctx.db.get(msgId);
  },
});

export const updateSessionTitle = mutation({
  args: {
    sessionId: v.id("aiChatSessions"),
    userId: v.id("users"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throwAppError("NOT_FOUND", "Session not found");
    if (session.userId !== args.userId) throwAppError("FORBIDDEN", "Not your session");
    await ctx.db.patch(args.sessionId, { title: args.title, updatedAt: Date.now() });
    return await ctx.db.get(args.sessionId);
  },
});
