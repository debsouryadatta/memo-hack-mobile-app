import { query } from "./_generated/server";
import { v } from "convex/values";

export const getChapterById = query({
  args: {
    chapterId: v.string(),
  },
  handler: async (ctx, args) => {
    const chapter = await ctx.db
      .query("chapters")
      .filter((q) => q.eq(q.field("chapterId"), args.chapterId))
      .first();
    
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
    const chaptersByClass = chapters.reduce((acc, chapter) => {
      if (!acc[chapter.class]) {
        acc[chapter.class] = [];
      }
      acc[chapter.class].push(chapter);
      return acc;
    }, {} as Record<string, typeof chapters>);
    
    return chaptersByClass;
  },
});
