import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  config: defineTable({
    key: v.string(),
    value: v.string(),
  }).index("by_key", ["key"]),
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
  dailyQuizQuestions: defineTable({
    _id: v.id("dailyQuizQuestions"),
    dayKey: v.string(),
    subject: v.union(
      v.literal("physics"),
      v.literal("chemistry"),
      v.literal("biology"),
    ),
    question: v.string(),
    options: v.array(v.string()),
    correctOptionIndex: v.number(),
    explanation: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_day", ["dayKey"])
    .index("by_day_subject", ["dayKey", "subject"]),
  dailyQuizAttempts: defineTable({
    _id: v.id("dailyQuizAttempts"),
    questionId: v.id("dailyQuizQuestions"),
    userId: v.id("users"),
    selectedOptionIndex: v.number(),
    isCorrect: v.boolean(),
    score: v.number(),
    submittedAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_question", ["questionId"])
    .index("by_user_question", ["userId", "questionId"]),
  liveQuizRooms: defineTable({
    hostId: v.id("users"),
    joinCode: v.string(),
    status: v.union(
      v.literal("lobby"),
      v.literal("generating"),
      v.literal("question"),
      v.literal("answer_reveal"),
      v.literal("leaderboard"),
      v.literal("finished"),
    ),
    subject: v.union(
      v.literal("physics"),
      v.literal("chemistry"),
      v.literal("biology"),
      v.literal("mixed"),
    ),
    subjects: v.optional(
      v.array(
        v.union(
          v.literal("physics"),
          v.literal("chemistry"),
          v.literal("biology"),
        ),
      ),
    ),
    chapterKeys: v.array(v.string()),
    questionCount: v.number(),
    secondsPerQuestion: v.number(),
    currentQuestionIndex: v.number(),
    phaseStartedAt: v.number(),
    generationRetryCount: v.optional(v.number()),
    questions: v.array(
      v.object({
        chapterKey: v.string(),
        question: v.string(),
        options: v.array(v.string()),
        correctOptionIndex: v.number(),
        explanation: v.string(),
      }),
    ),
    error: v.union(v.string(), v.null()),
    createdAt: v.number(),
    updatedAt: v.number(),
    startedAt: v.union(v.number(), v.null()),
    endedAt: v.union(v.number(), v.null()),
  })
    .index("by_join_code", ["joinCode"])
    .index("by_status_ended", ["status", "endedAt"]),
  liveQuizParticipants: defineTable({
    roomId: v.id("liveQuizRooms"),
    userId: v.id("users"),
    score: v.number(),
    correctCount: v.number(),
    answers: v.array(
      v.object({
        questionIndex: v.number(),
        selectedOptionIndex: v.number(),
        isCorrect: v.boolean(),
        responseMs: v.number(),
        scoreDelta: v.number(),
        answeredAt: v.number(),
      }),
    ),
    joinedAt: v.number(),
    updatedAt: v.number(),
  }).index("by_room_user", ["roomId", "userId"]),
});
