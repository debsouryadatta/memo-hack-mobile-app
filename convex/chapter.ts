import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key");

async function verifyToken(token: string): Promise<{ email: string }> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { email: payload.email as string };
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}

async function requireAdminAuth(token: string) {
  const decoded = await verifyToken(token);
  const email = decoded.email;
  if (email !== "deb@gmail.com") {
    throw new Error("Admin access required");
  }
  return email;
}

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

export const getAllChapters = query({
  args: {},
  handler: async (ctx) => {
    const chapters = await ctx.db
      .query("chapters")
      .collect();
    
    // Group chapters by subject and class
    const groupedChapters = chapters.reduce((acc, chapter) => {
      if (!acc[chapter.subject]) {
        acc[chapter.subject] = {};
      }
      if (!acc[chapter.subject][chapter.class]) {
        acc[chapter.subject][chapter.class] = [];
      }
      acc[chapter.subject][chapter.class].push(chapter);
      return acc;
    }, {} as Record<string, Record<string, typeof chapters>>);
    
    return groupedChapters;
  },
});

export const createChapter = mutation({
  args: {
    token: v.string(),
    chapterId: v.string(),
    title: v.string(),
    description: v.string(),
    estimatedTime: v.string(),
    difficulty: v.string(),
    class: v.string(),
    subject: v.string(),
    videos: v.optional(v.array(v.object({
      id: v.string(),
      title: v.string(),
      duration: v.string(),
      description: v.string(),
      notes: v.optional(v.string()),
    }))),
  },
  handler: async (ctx, args) => {
    await requireAdminAuth(args.token);
    
    // Check if chapter with same ID already exists
    const existingChapter = await ctx.db
      .query("chapters")
      .filter((q) => q.eq(q.field("chapterId"), args.chapterId))
      .first();
    
    if (existingChapter) {
      throw new Error("Chapter with this ID already exists");
    }
    
    const chapterId = await ctx.db.insert("chapters", {
      chapterId: args.chapterId,
      title: args.title,
      description: args.description,
      estimatedTime: args.estimatedTime,
      difficulty: args.difficulty,
      class: args.class,
      subject: args.subject,
      videos: args.videos || [],
    });
    
    return await ctx.db.get(chapterId);
  },
});

export const updateChapter = mutation({
  args: {
    token: v.string(),
    chapterId: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    estimatedTime: v.optional(v.string()),
    difficulty: v.optional(v.string()),
    videos: v.optional(v.array(v.object({
      id: v.string(),
      title: v.string(),
      duration: v.string(),
      description: v.string(),
      notes: v.optional(v.string()),
    }))),
  },
  handler: async (ctx, args) => {
    await requireAdminAuth(args.token);
    
    const chapter = await ctx.db
      .query("chapters")
      .filter((q) => q.eq(q.field("chapterId"), args.chapterId))
      .first();
    
    if (!chapter) {
      throw new Error("Chapter not found");
    }
    
    const updates = Object.fromEntries(
      Object.entries(args).filter(([key, value]) => 
        key !== 'token' && key !== 'chapterId' && value !== undefined
      )
    );
    
    await ctx.db.patch(chapter._id, updates);
    
    return await ctx.db.get(chapter._id);
  },
});

export const deleteChapter = mutation({
  args: {
    token: v.string(),
    chapterId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdminAuth(args.token);
    
    const chapter = await ctx.db
      .query("chapters")
      .filter((q) => q.eq(q.field("chapterId"), args.chapterId))
      .first();
    
    if (!chapter) {
      throw new Error("Chapter not found");
    }
    
    await ctx.db.delete(chapter._id);
    
    return { success: true, deletedChapterId: args.chapterId };
  },
});
