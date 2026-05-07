import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { requireAuth } from "./_lib/auth";
import { throwAppError } from "./_lib/errors";
import { AI_LIMITS } from "./_lib/usageLimits";

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
        `A student studying for JEE/NEET sent this message to Memo AI:\n"${args.firstMessage}"\n\n` +
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
      if (msg.imageStorageId) {
        await ctx.storage.delete(msg.imageStorageId);
      }
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
    const rows = await ctx.db
      .query("aiChatMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();
    return Promise.all(
      rows.map(async (m) => ({
        ...m,
        imageUrl: m.imageStorageId
          ? await ctx.storage.getUrl(m.imageStorageId)
          : null,
      })),
    );
  },
});

export const generateChatImageUploadUrl = mutation({
  args: { sessionId: v.id("aiChatSessions") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const session = await ctx.db.get(args.sessionId);
    if (!session) throwAppError("NOT_FOUND", "Session not found");
    if (session.userId !== userId)
      throwAppError("FORBIDDEN", "Not your session");
    const uploadUrl = await ctx.storage.generateUploadUrl();
    return { uploadUrl };
  },
});

/** Used by HTTP chat: reject streaming before model call if session is wrong. */
export const assertSessionOwnerForHttp = internalQuery({
  args: {
    sessionId: v.id("aiChatSessions"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return { ok: false as const, reason: "not_found" as const };
    if (session.userId !== args.userId) {
      return { ok: false as const, reason: "forbidden" as const };
    }
    return { ok: true as const };
  },
});

/**
 * Only the HTTP chat action may append assistant text (model output).
 * Clients cannot forge assistant messages via public mutations.
 */
export const persistAssistantMessageFromHttp = internalMutation({
  args: {
    sessionId: v.id("aiChatSessions"),
    userId: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return;
    if (session.userId !== args.userId) return;

    const trimmed = args.content.trim();
    if (!trimmed) return;

    const sessionMessages = await ctx.db
      .query("aiChatMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    if (sessionMessages.length >= AI_LIMITS.perChatMessageCap) {
      return;
    }

    const now = Date.now();
    await ctx.db.insert("aiChatMessages", {
      sessionId: args.sessionId,
      role: "assistant",
      content: trimmed,
      imageStorageId: undefined,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(args.sessionId, { updatedAt: now });

    if (AI_LIMITS.tokenTrackingEnabled) {
      await ctx.scheduler.runAfter(0, internal.aiChat.recordAssistantUsage, {
        userId: session.userId,
        dayKey: getDayKey(now),
        tokens: estimateTokens(trimmed),
        now,
      });
    }
  },
});

/** Client-visible: user messages only. Assistant rows come from persistAssistantMessageFromHttp. */
export const saveMessage = mutation({
  args: {
    sessionId: v.id("aiChatSessions"),
    content: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const session = await ctx.db.get(args.sessionId);
    if (!session) throwAppError("NOT_FOUND", "Session not found");
    if (session.userId !== userId)
      throwAppError("FORBIDDEN", "Not your session");

    const now = Date.now();

    const hasText = args.content.trim().length > 0;
    const hasImage = args.imageStorageId != null;
    if (!hasText && !hasImage) {
      throwAppError(
        "INVALID_INPUT",
        "Message must include text and/or an image",
      );
    }

    const sessionMessages = await ctx.db
      .query("aiChatMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    if (sessionMessages.length >= AI_LIMITS.perChatMessageCap) {
      throwAppError(
        "LIMIT_REACHED",
        `This Memo AI chat has reached its ${AI_LIMITS.perChatMessageCap}-message limit. Start a new Memo AI chat to continue.`,
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
          `Daily Memo AI limit reached (${AI_LIMITS.dailyRequestCap} requests). Try again tomorrow.`,
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

    const msgId = await ctx.db.insert("aiChatMessages", {
      sessionId: args.sessionId,
      role: "user",
      content: args.content,
      imageStorageId: args.imageStorageId,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(args.sessionId, { updatedAt: now });

    const inserted = await ctx.db.get(msgId);
    if (!inserted) throwAppError("NOT_FOUND", "Message not found");
    const imageUrl = inserted.imageStorageId
      ? await ctx.storage.getUrl(inserted.imageStorageId)
      : null;
    return { ...inserted, imageUrl };
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
