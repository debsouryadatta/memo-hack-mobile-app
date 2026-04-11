import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { throwAppError } from "./errors";
import { AI_LIMITS } from "./usageLimits";
import { requireAuth } from "./user";

function getDayKey(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

// ── AI Title Generation ───────────────────────────────────────────────────

export const generateSessionTitle = action({
  args: {
    firstMessage: v.string(),
  },
  handler: async (ctx, args): Promise<string> => {
    await requireAuth(ctx);

    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY!,
    });

    const { text } = await generateText({
      model: openrouter.chat("openai/gpt-4o-mini"),
      prompt:
        `A student studying for JEE/NEET sent this message to an AI tutor:\n"${args.firstMessage}"\n\n` +
        "Write a short, clear title for this chat session (max 5 words, sentence case, no quotes, no punctuation at end).",
      maxOutputTokens: 20,
    });

    return text
      .trim()
      .replace(/^["']|["']$/g, "")
      .slice(0, 60);
  },
});

// ── Sessions ──────────────────────────────────────────────────────────────

export const createSession = mutation({
  args: {
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const now = Date.now();
    const sessionId = await ctx.db.insert("aiChatSessions", {
      userId: userId as Id<"users">,
      title: args.title,
      createdAt: now,
      updatedAt: now,
    });
    return await ctx.db.get(sessionId);
  },
});

export const listSessions = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const userId = identity.subject;
    return await ctx.db
      .query("aiChatSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId as Id<"users">))
      .order("desc")
      .collect();
  },
});

export const deleteSession = mutation({
  args: { sessionId: v.id("aiChatSessions") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const session = await ctx.db.get(args.sessionId);
    if (!session) throwAppError("NOT_FOUND", "Session not found");
    if (session.userId !== userId)
      throwAppError("FORBIDDEN", "Not your session");

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
  args: { sessionId: v.id("aiChatSessions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const userId = identity.subject;
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== userId) return [];
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
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const session = await ctx.db.get(args.sessionId);
    if (!session) throwAppError("NOT_FOUND", "Session not found");
    if (session.userId !== userId)
      throwAppError("FORBIDDEN", "Not your session");

    const now = Date.now();

    if (args.role === "user") {
      const sessionMessages = await ctx.db
        .query("aiChatMessages")
        .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
        .collect();

      if (sessionMessages.length >= AI_LIMITS.perChatMessageCap) {
        throwAppError(
          "LIMIT_REACHED",
          `This chat has reached its ${AI_LIMITS.perChatMessageCap}-message limit. Start a new chat to continue.`,
        );
      }

      const dayKey = getDayKey(now);
      const existingUsage = await ctx.db
        .query("aiUserUsageDaily")
        .withIndex("by_user_day", (q) =>
          q.eq("userId", userId as Id<"users">).eq("dayKey", dayKey),
        )
        .first();

      if (!existingUsage) {
        await ctx.db.insert("aiUserUsageDaily", {
          userId: userId as Id<"users">,
          dayKey,
          requestsUsed: 1,
          tokensUsed: 0,
          minuteWindowStart: now,
          minuteRequestsUsed: 1,
          createdAt: now,
          updatedAt: now,
        });
      } else {
        const minuteWindowExpired =
          now - existingUsage.minuteWindowStart >= 60_000;
        const minuteRequestsUsed = minuteWindowExpired
          ? 0
          : existingUsage.minuteRequestsUsed;

        if (existingUsage.requestsUsed >= AI_LIMITS.dailyRequestCap) {
          throwAppError(
            "LIMIT_REACHED",
            `Daily AI limit reached (${AI_LIMITS.dailyRequestCap} requests). Try again tomorrow.`,
          );
        }

        if (minuteRequestsUsed >= AI_LIMITS.perMinuteRequestCap) {
          throwAppError(
            "RATE_LIMITED",
            `Too many requests. Please wait a minute and try again.`,
          );
        }

        await ctx.db.patch(existingUsage._id, {
          requestsUsed: existingUsage.requestsUsed + 1,
          minuteWindowStart: minuteWindowExpired
            ? now
            : existingUsage.minuteWindowStart,
          minuteRequestsUsed: minuteRequestsUsed + 1,
          updatedAt: now,
        });
      }
    }

    const msgId = await ctx.db.insert("aiChatMessages", {
      sessionId: args.sessionId,
      role: args.role,
      content: args.content,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(args.sessionId, { updatedAt: now });

    if (args.role === "assistant") {
      if (AI_LIMITS.tokenTrackingEnabled) {
        await ctx.scheduler.runAfter(0, internal.aiChat.recordAssistantUsage, {
          userId: session.userId,
          dayKey: getDayKey(now),
          tokens: estimateTokens(args.content),
          now,
        });
      }
    }

    return await ctx.db.get(msgId);
  },
});

export const recordAssistantUsage = internalMutation({
  args: {
    userId: v.id("users"),
    dayKey: v.string(),
    tokens: v.number(),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    if (!AI_LIMITS.tokenTrackingEnabled) return;

    const usage = await ctx.db
      .query("aiUserUsageDaily")
      .withIndex("by_user_day", (q) =>
        q.eq("userId", args.userId).eq("dayKey", args.dayKey),
      )
      .first();

    if (!usage) {
      await ctx.db.insert("aiUserUsageDaily", {
        userId: args.userId,
        dayKey: args.dayKey,
        requestsUsed: 0,
        tokensUsed: args.tokens,
        minuteWindowStart: args.now,
        minuteRequestsUsed: 0,
        createdAt: args.now,
        updatedAt: args.now,
      });
      return;
    }

    await ctx.db.patch(usage._id, {
      tokensUsed: usage.tokensUsed + args.tokens,
      updatedAt: args.now,
    });
  },
});

export const updateSessionTitle = mutation({
  args: {
    sessionId: v.id("aiChatSessions"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const session = await ctx.db.get(args.sessionId);
    if (!session) throwAppError("NOT_FOUND", "Session not found");
    if (session.userId !== userId)
      throwAppError("FORBIDDEN", "Not your session");
    await ctx.db.patch(args.sessionId, {
      title: args.title,
      updatedAt: Date.now(),
    });
    return await ctx.db.get(args.sessionId);
  },
});
