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
    class: v.string(),
    memohackStudent: v.optional(v.boolean()),
    admin: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_email", ["email"]),
  chapters: defineTable({
    _id: v.id("chapters"),
    title: v.string(),
    description: v.string(),
    difficulty: v.string(),
    class: v.string(),
    subject: v.string(),
    notes: v.optional(v.array(v.object({
      name: v.string(),
      url: v.string(),
    }))),
    videos: v.optional(v.array(v.object({
      title: v.string(),
      description: v.optional(v.string()),
      youtubeUrl: v.string(),
    }))),
  }),
});