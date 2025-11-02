import { v } from "convex/values";
import { jwtVerify } from "jose";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key");

async function verifyToken(token: string): Promise<{ userId: string }> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { userId: payload.userId as string };
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}

async function requireAuth(token: string) {
  if (!token) {
    throw new Error("Authentication required");
  }
  
  const decoded = await verifyToken(token);
  return decoded.userId;
}

async function requireAdminAuth(ctx: any, token: string) {
  const userId = await requireAuth(token);
  
  const user = await ctx.db.get(userId as Id<"users">);
  if (!user?.admin) {
    throw new Error("Admin access required");
  }
  return user;
}

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
    title: v.string(),
    description: v.string(),
    difficulty: v.string(),
    class: v.string(),
    subject: v.string(),
    videos: v.optional(v.array(v.object({
      title: v.string(),
      description: v.optional(v.string()),
      youtubeUrl: v.string(),
    }))),
    notes: v.optional(v.array(v.object({
      name: v.string(),
      url: v.string(),
    }))),
  },
  handler: async (ctx, args) => {
    await requireAdminAuth(ctx, args.token);
    
    const chapterId = await ctx.db.insert("chapters", {
      title: args.title,
      description: args.description,
      difficulty: args.difficulty,
      class: args.class,
      subject: args.subject,
      videos: args.videos,
      notes: args.notes,
    });
    
    return await ctx.db.get(chapterId);
  },
});

export const updateChapter = mutation({
  args: {
    token: v.string(),
    chapterId: v.id("chapters"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    difficulty: v.optional(v.string()),
    videos: v.optional(v.array(v.object({
      title: v.string(),
      description: v.optional(v.string()),
      youtubeUrl: v.string(),
    }))),
    notes: v.optional(v.array(v.object({
      name: v.string(),
      url: v.string(),
    }))),
  },
  handler: async (ctx, args) => {
    await requireAdminAuth(ctx, args.token);
    
    const chapter = await ctx.db.get(args.chapterId);
    
    if (!chapter) {
      throw new Error("Chapter not found");
    }
    
    const updates = Object.fromEntries(
      Object.entries(args).filter(([key, value]) => 
        key !== 'token' && key !== 'chapterId' && value !== undefined
      )
    );
    
    await ctx.db.patch(args.chapterId, updates);
    
    return await ctx.db.get(args.chapterId);
  },
});

export const deleteChapter = mutation({
  args: {
    token: v.string(),
    chapterId: v.id("chapters"),
  },
  handler: async (ctx, args) => {
    await requireAdminAuth(ctx, args.token);
    
    const chapter = await ctx.db.get(args.chapterId);
    
    if (!chapter) {
      throw new Error("Chapter not found");
    }
    
    await ctx.db.delete(args.chapterId);
    
    return { success: true, deletedChapterId: args.chapterId };
  },
});
