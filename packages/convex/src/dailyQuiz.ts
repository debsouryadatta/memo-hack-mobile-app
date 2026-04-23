import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { requireAuth } from "./_lib/auth";
import { throwAppError } from "./_lib/errors";

const SUBJECTS = ["physics", "chemistry", "biology"] as const;
type QuizSubject = (typeof SUBJECTS)[number];

const subjectValidator = v.union(
  v.literal("physics"),
  v.literal("chemistry"),
  v.literal("biology"),
);

type GeneratedQuestion = {
  subject: QuizSubject;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
};

function getIstDayKey(timestamp = Date.now()): string {
  const istDate = new Date(timestamp + 5.5 * 60 * 60 * 1000);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(istDate.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getRecentIstDayKeys(days: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  const istNow = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const utcMidnightForIstDate = Date.UTC(
    istNow.getUTCFullYear(),
    istNow.getUTCMonth(),
    istNow.getUTCDate(),
  );

  for (let i = 0; i < days; i += 1) {
    keys.push(getIstDayKey(utcMidnightForIstDate - i * 24 * 60 * 60 * 1000));
  }

  return keys;
}

function subjectRank(subject: QuizSubject): number {
  return SUBJECTS.indexOf(subject);
}

function sortQuestions(
  questions: Doc<"dailyQuizQuestions">[],
): Doc<"dailyQuizQuestions">[] {
  return [...questions].sort(
    (a, b) =>
      subjectRank(a.subject as QuizSubject) -
      subjectRank(b.subject as QuizSubject),
  );
}

function sortGeneratedQuestions(
  questions: GeneratedQuestion[],
): GeneratedQuestion[] {
  return [...questions].sort(
    (a, b) => subjectRank(a.subject) - subjectRank(b.subject),
  );
}

function stripJsonFence(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parseGeneratedQuestions(text: string): GeneratedQuestion[] {
  const clean = stripJsonFence(text);
  const start = clean.indexOf("[");
  const end = clean.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI response did not include a JSON array");
  }

  const parsed = JSON.parse(clean.slice(start, end + 1)) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("AI response was not an array");
  }

  return parsed.map((item) => {
    const row = item as Partial<GeneratedQuestion>;
    if (!SUBJECTS.includes(row.subject as QuizSubject)) {
      throw new Error("AI response included an invalid subject");
    }
    if (typeof row.question !== "string" || row.question.trim().length < 10) {
      throw new Error("AI response included an invalid question");
    }
    if (
      !Array.isArray(row.options) ||
      row.options.length !== 4 ||
      row.options.some((option) => typeof option !== "string" || !option.trim())
    ) {
      throw new Error("AI response included invalid options");
    }
    if (
      typeof row.correctOptionIndex !== "number" ||
      !Number.isInteger(row.correctOptionIndex) ||
      row.correctOptionIndex < 0 ||
      row.correctOptionIndex > 3
    ) {
      throw new Error("AI response included an invalid answer index");
    }
    if (
      typeof row.explanation !== "string" ||
      row.explanation.trim().length < 10
    ) {
      throw new Error("AI response included an invalid explanation");
    }

    return {
      subject: row.subject as QuizSubject,
      question: row.question.trim(),
      options: row.options.map((option) => option.trim()),
      correctOptionIndex: row.correctOptionIndex,
      explanation: row.explanation.trim(),
    };
  });
}

function assertUniqueSubjects(questions: GeneratedQuestion[]) {
  const subjects = new Set(questions.map((q) => q.subject));
  if (subjects.size !== SUBJECTS.length || questions.length !== SUBJECTS.length) {
    throw new Error("Daily quiz must contain one question per subject");
  }
}

export const getExistingSubjectsForDay = internalQuery({
  args: { dayKey: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("dailyQuizQuestions")
      .withIndex("by_day", (q) => q.eq("dayKey", args.dayKey))
      .collect();
    return rows.map((row) => row.subject);
  },
});

export const storeGeneratedQuestions = internalMutation({
  args: {
    dayKey: v.string(),
    questions: v.array(
      v.object({
        subject: subjectValidator,
        question: v.string(),
        options: v.array(v.string()),
        correctOptionIndex: v.number(),
        explanation: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const questions = args.questions.map((question) => ({
      ...question,
      subject: question.subject as QuizSubject,
      question: question.question.trim(),
      options: question.options.map((option) => option.trim()),
      explanation: question.explanation.trim(),
    }));

    assertUniqueSubjects(questions);

    const inserted: Id<"dailyQuizQuestions">[] = [];
    const skipped: QuizSubject[] = [];

    for (const question of sortGeneratedQuestions(questions)) {
      if (
        question.options.length !== 4 ||
        !Number.isInteger(question.correctOptionIndex) ||
        question.correctOptionIndex < 0 ||
        question.correctOptionIndex > 3
      ) {
        throw new Error(`Invalid generated ${question.subject} question`);
      }

      const existing = await ctx.db
        .query("dailyQuizQuestions")
        .withIndex("by_day_subject", (q) =>
          q.eq("dayKey", args.dayKey).eq("subject", question.subject),
        )
        .first();

      if (existing) {
        skipped.push(question.subject);
        continue;
      }

      const id = await ctx.db.insert("dailyQuizQuestions", {
        dayKey: args.dayKey,
        subject: question.subject,
        question: question.question,
        options: question.options,
        correctOptionIndex: question.correctOptionIndex,
        explanation: question.explanation,
        createdAt: now,
        updatedAt: now,
      });
      inserted.push(id);
    }

    return { inserted, skipped };
  },
});

export const generateDailyQuiz = internalAction({
  args: {},
  handler: async (ctx): Promise<unknown> => {
    const dayKey = getIstDayKey();
    const existingSubjects = await ctx.runQuery(
      internal.dailyQuiz.getExistingSubjectsForDay,
      { dayKey },
    );

    if (existingSubjects.length >= SUBJECTS.length) {
      return { dayKey, skipped: true };
    }

    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY!,
    });

    const { text } = await generateText({
      model: openrouter.chat("openai/gpt-4.1-mini"),
      maxOutputTokens: 1600,
      prompt:
        `Generate today's MemoHack daily quiz for ${dayKey} (IST).\n` +
        "Create exactly three independent MCQ questions: one physics, one chemistry, and one biology.\n" +
        "Questions should be relevant for JEE/NEET preparation, clear, and exam-style.\n" +
        "Return strict JSON only, no markdown, no commentary. Shape:\n" +
        '[{"subject":"physics","question":"...","options":["...","...","...","..."],"correctOptionIndex":0,"explanation":"..."}]\n' +
        "Use lowercase subjects exactly: physics, chemistry, biology. Each options array must have exactly 4 options.",
    });

    const generated = parseGeneratedQuestions(text);
    assertUniqueSubjects(generated);

    return await ctx.runMutation(internal.dailyQuiz.storeGeneratedQuestions, {
      dayKey,
      questions: generated,
    });
  },
});

export const getTodayQuiz = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    const dayKey = getIstDayKey();
    const questions = sortQuestions(
      await ctx.db
        .query("dailyQuizQuestions")
        .withIndex("by_day", (q) => q.eq("dayKey", dayKey))
        .collect(),
    );

    const rows = [];
    for (const question of questions) {
      const attempt = await ctx.db
        .query("dailyQuizAttempts")
        .withIndex("by_user_question", (q) =>
          q.eq("userId", userId as Id<"users">).eq("questionId", question._id),
        )
        .first();

      rows.push({
        _id: question._id,
        dayKey: question.dayKey,
        subject: question.subject,
        question: question.question,
        options: question.options,
        explanation: attempt ? question.explanation : null,
        correctOptionIndex: attempt ? question.correctOptionIndex : null,
        attempt: attempt
          ? {
              selectedOptionIndex: attempt.selectedOptionIndex,
              isCorrect: attempt.isCorrect,
              score: attempt.score,
              submittedAt: attempt.submittedAt,
            }
          : null,
      });
    }

    return {
      dayKey,
      isReady: rows.length === SUBJECTS.length,
      questions: rows,
    };
  },
});

export const submitAnswer = mutation({
  args: {
    questionId: v.id("dailyQuizQuestions"),
    selectedOptionIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const question = await ctx.db.get(args.questionId);
    if (!question) throwAppError("NOT_FOUND", "Question not found");

    if (
      !Number.isInteger(args.selectedOptionIndex) ||
      args.selectedOptionIndex < 0 ||
      args.selectedOptionIndex >= question.options.length
    ) {
      throwAppError("INVALID_INPUT", "Please choose a valid option");
    }

    const existing = await ctx.db
      .query("dailyQuizAttempts")
      .withIndex("by_user_question", (q) =>
        q.eq("userId", userId as Id<"users">).eq("questionId", args.questionId),
      )
      .first();

    if (existing) {
      return {
        alreadySubmitted: true,
        selectedOptionIndex: existing.selectedOptionIndex,
        isCorrect: existing.isCorrect,
        score: existing.score,
        correctOptionIndex: question.correctOptionIndex,
        explanation: question.explanation,
        submittedAt: existing.submittedAt,
      };
    }

    const now = Date.now();
    const isCorrect = args.selectedOptionIndex === question.correctOptionIndex;
    const attemptId = await ctx.db.insert("dailyQuizAttempts", {
      questionId: args.questionId,
      userId: userId as Id<"users">,
      selectedOptionIndex: args.selectedOptionIndex,
      isCorrect,
      score: isCorrect ? 1 : 0,
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    const attempt = await ctx.db.get(attemptId);
    if (!attempt) throwAppError("NOT_FOUND", "Attempt not found");

    return {
      alreadySubmitted: false,
      selectedOptionIndex: attempt.selectedOptionIndex,
      isCorrect: attempt.isCorrect,
      score: attempt.score,
      correctOptionIndex: question.correctOptionIndex,
      explanation: question.explanation,
      submittedAt: attempt.submittedAt,
    };
  },
});

export const getOverallLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);

    const questions = await ctx.db.query("dailyQuizQuestions").collect();
    const byUser = new Map<
      string,
      {
        userId: Id<"users">;
        score: number;
        attemptedCount: number;
        correctCount: number;
        lastSubmittedAt: number;
      }
    >();

    for (const question of questions) {
      const attempts = await ctx.db
        .query("dailyQuizAttempts")
        .withIndex("by_question", (q) => q.eq("questionId", question._id))
        .collect();

      for (const attempt of attempts) {
        const existing = byUser.get(attempt.userId);
        if (!existing) {
          byUser.set(attempt.userId, {
            userId: attempt.userId,
            score: attempt.score,
            attemptedCount: 1,
            correctCount: attempt.isCorrect ? 1 : 0,
            lastSubmittedAt: attempt.submittedAt,
          });
          continue;
        }

        existing.score += attempt.score;
        existing.attemptedCount += 1;
        existing.correctCount += attempt.isCorrect ? 1 : 0;
        existing.lastSubmittedAt = Math.max(
          existing.lastSubmittedAt,
          attempt.submittedAt,
        );
      }
    }

    const ranked = [...byUser.values()].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.attemptedCount !== a.attemptedCount) {
        return b.attemptedCount - a.attemptedCount;
      }
      return a.lastSubmittedAt - b.lastSubmittedAt;
    }).slice(0, 100);

    const leaderboard = [];
    for (const [index, row] of ranked.entries()) {
      const user = await ctx.db.get(row.userId);
      if (!user) continue;
      leaderboard.push({
        rank: index + 1,
        userId: row.userId,
        name: user.name,
        image: user.image,
        class: user.class,
        score: row.score,
        attemptedCount: row.attemptedCount,
        correctCount: row.correctCount,
        lastSubmittedAt: row.lastSubmittedAt,
      });
    }

    return {
      scope: "overall" as const,
      leaderboard,
    };
  },
});

export const getMyDailyQuizStats = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const days = Math.max(7, Math.min(90, Math.floor(args.days ?? 35)));
    const dayKeys = getRecentIstDayKeys(days);
    const rows = [];

    for (const dayKey of dayKeys) {
      const questions = await ctx.db
        .query("dailyQuizQuestions")
        .withIndex("by_day", (q) => q.eq("dayKey", dayKey))
        .collect();

      let attemptedCount = 0;
      let score = 0;
      for (const question of questions) {
        const attempt = await ctx.db
          .query("dailyQuizAttempts")
          .withIndex("by_user_question", (q) =>
            q
              .eq("userId", userId as Id<"users">)
              .eq("questionId", question._id),
          )
          .first();

        if (attempt) {
          attemptedCount += 1;
          score += attempt.score;
        }
      }

      rows.push({
        dayKey,
        attemptedCount,
        score,
        totalQuestions: questions.length,
      });
    }

    const chronological = [...rows].reverse();
    const totalAttempted = rows.reduce((sum, row) => sum + row.attemptedCount, 0);
    const totalScore = rows.reduce((sum, row) => sum + row.score, 0);
    const activeDays = rows.filter((row) => row.attemptedCount > 0).length;

    let currentStreak = 0;
    for (const row of rows) {
      if (row.attemptedCount === 0) break;
      currentStreak += 1;
    }

    let bestStreak = 0;
    let runningStreak = 0;
    for (const row of chronological) {
      if (row.attemptedCount > 0) {
        runningStreak += 1;
        bestStreak = Math.max(bestStreak, runningStreak);
      } else {
        runningStreak = 0;
      }
    }

    return {
      days: chronological,
      totalAttempted,
      totalScore,
      activeDays,
      currentStreak,
      bestStreak,
    };
  },
});
