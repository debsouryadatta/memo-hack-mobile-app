import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdminAuth } from "./_lib/auth";
import { throwAppError } from "./_lib/errors";

export const getChapterById = query({
  args: {
    chapterId: v.id("chapters"),
  },
  handler: async (ctx, args) => {
    const chapter = await ctx.db.get(args.chapterId);
    return chapter;
  },
});

export const getAllChaptersBySubject = query({
  args: {
    subject: v.string(),
  },
  handler: async (ctx, args) => {
    const chapters = await ctx.db
      .query("chapters")
      .filter((q) => q.eq(q.field("subject"), args.subject))
      .collect();

    // Group chapters by class
    const chaptersByClass = chapters.reduce(
      (acc, chapter) => {
        if (!acc[chapter.class]) {
          acc[chapter.class] = [];
        }
        acc[chapter.class].push(chapter);
        return acc;
      },
      {} as Record<string, typeof chapters>,
    );

    return chaptersByClass;
  },
});

export const getAllChapters = query({
  args: {},
  handler: async (ctx) => {
    const chapters = await ctx.db.query("chapters").collect();

    // Group chapters by subject and class
    const groupedChapters = chapters.reduce(
      (acc, chapter) => {
        if (!acc[chapter.subject]) {
          acc[chapter.subject] = {};
        }
        if (!acc[chapter.subject][chapter.class]) {
          acc[chapter.subject][chapter.class] = [];
        }
        acc[chapter.subject][chapter.class].push(chapter);
        return acc;
      },
      {} as Record<string, Record<string, typeof chapters>>,
    );

    return groupedChapters;
  },
});

export const createChapter = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    difficulty: v.string(),
    class: v.string(),
    subject: v.string(),
    videos: v.optional(
      v.array(
        v.object({
          title: v.string(),
          description: v.optional(v.string()),
          youtubeUrl: v.string(),
        }),
      ),
    ),
    notes: v.optional(
      v.array(
        v.object({
          name: v.string(),
          url: v.string(),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    await requireAdminAuth(ctx);

    const now = Date.now();
    const chapterId = await ctx.db.insert("chapters", {
      title: args.title,
      description: args.description,
      difficulty: args.difficulty,
      class: args.class,
      subject: args.subject,
      videos: args.videos,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(chapterId);
  },
});

export const updateChapter = mutation({
  args: {
    chapterId: v.id("chapters"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    difficulty: v.optional(v.string()),
    videos: v.optional(
      v.array(
        v.object({
          title: v.string(),
          description: v.optional(v.string()),
          youtubeUrl: v.string(),
        }),
      ),
    ),
    notes: v.optional(
      v.array(
        v.object({
          name: v.string(),
          url: v.string(),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    await requireAdminAuth(ctx);

    const chapter = await ctx.db.get(args.chapterId);

    if (!chapter) {
      throwAppError("NOT_FOUND", "Chapter not found");
    }

    const updates = Object.fromEntries(
      Object.entries(args).filter(
        ([key, value]) => key !== "chapterId" && value !== undefined,
      ),
    );

    await ctx.db.patch(args.chapterId, { ...updates, updatedAt: Date.now() });

    return await ctx.db.get(args.chapterId);
  },
});

export const deleteChapter = mutation({
  args: {
    chapterId: v.id("chapters"),
  },
  handler: async (ctx, args) => {
    await requireAdminAuth(ctx);

    const chapter = await ctx.db.get(args.chapterId);

    if (!chapter) {
      throwAppError("NOT_FOUND", "Chapter not found");
    }

    await ctx.db.delete(args.chapterId);

    return { success: true, deletedChapterId: args.chapterId };
  },
});
