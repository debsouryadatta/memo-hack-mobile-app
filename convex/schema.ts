import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    password: v.string(),
    name: v.string(),
    phone: v.string(),
    image: v.string(),
    class: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_email", ["email"]),
  chapters: defineTable({
    chapterId: v.string(),
    title: v.string(),
    description: v.string(),
    estimatedTime: v.string(),
    difficulty: v.string(),
    videos: v.array(v.object({
      id: v.string(),
      title: v.string(),
      duration: v.string(),
      description: v.string(),
      notes: v.string(),
    })),
    class: v.string(),
    subject: v.string(),
  }).index("by_chapterId", ["chapterId"]),
});