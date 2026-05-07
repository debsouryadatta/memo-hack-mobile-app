import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
  generateText,
  NoObjectGeneratedError,
  NoOutputGeneratedError,
  Output,
} from "ai";
import { v } from "convex/values";
import { z } from "zod";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import {
  type ActionCtx,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { requireAuth } from "./_lib/auth";
import { throwAppError } from "./_lib/errors";
import {
  getNcertChapterByKey,
  NCERT_CHAPTERS,
  type NcertChapter,
} from "./_lib/ncertChapters";

const SUBJECTS = ["physics", "chemistry", "biology"] as const;
type QuizSubject = (typeof SUBJECTS)[number];
const DAILY_QUIZ_MODEL = "deepseek/deepseek-v4-flash";
const DAILY_QUIZ_MAX_GENERATION_ATTEMPTS = 2;
const DAILY_QUIZ_GENERATION_TIMEOUT_MS = 180000;
const DAILY_QUIZ_MAX_OUTPUT_TOKENS = 8000;
const DAILY_QUIZ_BACKFILL_RETRY_DELAY_MS = 60 * 1000;
const DAILY_QUIZ_MAX_BACKFILL_RETRIES = 3;
const OPENROUTER_HEADERS = {
  "HTTP-Referer": "https://memohack.app",
  "X-Title": "MemoHack",
} as const;
const OPENROUTER_REASONING_OPTIONS = {
  max_tokens: 512,
  exclude: true,
} as const;
const DAILY_SUBJECT_FALLBACK_CHAPTER_KEYS: Record<QuizSubject, string[]> = {
  physics: [
    "physics-11-units-and-measurements",
    "physics-11-motion-in-a-straight-line",
  ],
  chemistry: [
    "chemistry-11-some-basic-concepts-of-chemistry",
    "chemistry-11-structure-of-atom",
  ],
  biology: [
    "biology-11-the-living-world",
    "biology-11-biological-classification",
  ],
};

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

function dailyGeneratedQuestionSchema(subject: QuizSubject) {
  return z
    .object({
      subject: z
        .literal(subject)
        .describe("The requested subject for this daily quiz slot."),
      question: z
        .string()
        .trim()
        .min(10)
        .max(1000)
        .describe("A clear NCERT-rooted JEE/NEET style MCQ stem."),
      options: z
        .array(z.string().trim().min(1).max(300))
        .length(4)
        .describe("Exactly four answer options."),
      correctOptionIndex: z
        .number()
        .int()
        .min(0)
        .max(3)
        .describe("Zero-based index of the correct option."),
      explanation: z
        .string()
        .trim()
        .min(10)
        .max(1200)
        .describe("Concise explanation proving the correct option."),
    })
    .strict();
}

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

function assertNoDuplicateSubjects(questions: GeneratedQuestion[]) {
  const subjects = new Set<QuizSubject>();
  for (const question of questions) {
    if (subjects.has(question.subject)) {
      throw new Error(
        `Daily quiz included duplicate ${question.subject} questions`,
      );
    }
    subjects.add(question.subject);
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function errorName(error: unknown): string {
  return error instanceof Error ? error.name : typeof error;
}

function errorCauseMessage(error: unknown): string | null {
  if (!(error instanceof Error)) return null;
  const cause = (error as Error & { cause?: unknown }).cause;
  return cause instanceof Error ? cause.message : cause ? String(cause) : null;
}

function generationErrorMessage(error: unknown): string {
  const message = errorMessage(error);
  if (message === "Failed to process successful response") {
    return "The AI provider returned a response that could not be read. Retrying.";
  }
  return message;
}

function getStructuredOutputPreview(error: unknown): string | null {
  if (!NoObjectGeneratedError.isInstance(error) || !error.text) return null;
  return error.text.trim().replace(/\s+/g, " ").slice(0, 240);
}

function compactWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function stripOptionPrefix(value: string): string {
  return compactWhitespace(
    value.replace(/^(?:option\s*)?[A-D]\s*[\).:\]-]\s*/i, ""),
  );
}

function optionIndexFromLabel(value: string): number | null {
  const match = compactWhitespace(value).match(/^([A-D])(?:\b|[\).:\]-])/i);
  if (!match) return null;
  return match[1].toUpperCase().charCodeAt(0) - 65;
}

function parsePipeEncodedQuestion(
  question: string,
): Partial<GeneratedQuestion> | null {
  const parts = question.split("|").map(compactWhitespace).filter(Boolean);
  if (parts.length < 9) return null;

  const subjectIndex = parts.findIndex((part) =>
    SUBJECTS.includes(part.toLowerCase() as QuizSubject),
  );
  if (subjectIndex < 0) return null;

  const stemIndex = subjectIndex + 2;
  const optionsStartIndex = stemIndex + 1;
  const optionParts = parts.slice(optionsStartIndex, optionsStartIndex + 4);
  if (optionParts.length !== 4) return null;
  if (optionParts.some((option) => optionIndexFromLabel(option) === null)) {
    return null;
  }

  const correctOptionIndex =
    optionIndexFromLabel(parts[optionsStartIndex + 4] ?? "") ?? undefined;
  const explanation = compactWhitespace(
    parts.slice(optionsStartIndex + 5).join(" "),
  );

  return {
    question: compactWhitespace(parts[stemIndex]),
    options: optionParts.map(stripOptionPrefix),
    correctOptionIndex,
    ...(explanation ? { explanation } : {}),
  };
}

function stripQuestionPrefix(value: string): string {
  return compactWhitespace(
    value
      .replace(/^question\s+\d+\s*[\).:\]-]\s*/i, "")
      .replace(/^\d+\s*[\).:\]-]\s*/, ""),
  );
}

function removeEmbeddedOptions(value: string): string {
  const compacted = compactWhitespace(value);
  const optionStart = compacted.search(/\s*A\s*[\).:]\s*\S/i);
  if (optionStart <= 20) return compacted;

  const trailing = compacted.slice(optionStart);
  if (
    /B\s*[\).:]\s*\S/i.test(trailing) &&
    /C\s*[\).:]\s*\S/i.test(trailing) &&
    /D\s*[\).:]\s*\S/i.test(trailing)
  ) {
    return compactWhitespace(compacted.slice(0, optionStart));
  }

  return compacted;
}

function normalizeGeneratedQuestion(
  question: GeneratedQuestion,
): GeneratedQuestion {
  const pipeEncoded = parsePipeEncodedQuestion(question.question);
  const options = (pipeEncoded?.options ?? question.options).map(
    stripOptionPrefix,
  );
  const normalizedQuestion = removeEmbeddedOptions(
    stripQuestionPrefix(pipeEncoded?.question ?? question.question),
  );
  const explanation = compactWhitespace(
    pipeEncoded?.explanation ?? question.explanation,
  );

  return {
    ...question,
    question: normalizedQuestion,
    options,
    correctOptionIndex:
      pipeEncoded?.correctOptionIndex ?? question.correctOptionIndex,
    explanation,
  };
}

function validateGeneratedQuestion(question: GeneratedQuestion): void {
  const uniqueOptions = new Set(
    question.options.map((option) => option.toLowerCase()),
  );
  if (question.question.length < 10) {
    throw new Error("Generated question stem is too short");
  }
  if (question.question.includes("|")) {
    throw new Error("Generated question used a pipe-delimited row format");
  }
  if (question.options.length !== 4) {
    throw new Error("Generated question must include exactly four options");
  }
  if (question.options.some((option) => option.length === 0)) {
    throw new Error("Generated question includes an empty option");
  }
  if (uniqueOptions.size !== 4) {
    throw new Error("Generated question options must be unique");
  }
  if (
    !Number.isInteger(question.correctOptionIndex) ||
    question.correctOptionIndex < 0 ||
    question.correctOptionIndex >= question.options.length
  ) {
    throw new Error("Generated question has an invalid correct option index");
  }
  if (question.explanation.length < 10) {
    throw new Error("Generated question explanation is too short");
  }
}

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function getDailySubjectChapters(
  dayKey: string,
  subject: QuizSubject,
): NcertChapter[] {
  const chapters = NCERT_CHAPTERS.filter(
    (chapter) => chapter.subject === subject,
  );
  if (chapters.length <= 2) return chapters;

  const seed = hashString(`${dayKey}:${subject}`);
  const firstIndex = seed % chapters.length;
  const secondIndex =
    (firstIndex + 1 + (seed % (chapters.length - 1))) % chapters.length;
  return [chapters[firstIndex], chapters[secondIndex]];
}

function getFallbackDailySubjectChapters(subject: QuizSubject): NcertChapter[] {
  return DAILY_SUBJECT_FALLBACK_CHAPTER_KEYS[subject]
    .map((chapterKey) => getNcertChapterByKey(chapterKey))
    .filter((chapter): chapter is NcertChapter => chapter !== null);
}

function getDailySubjectChapterPlans(
  dayKey: string,
  subject: QuizSubject,
): NcertChapter[][] {
  const dailyChapters = getDailySubjectChapters(dayKey, subject);
  const fallbackChapters = getFallbackDailySubjectChapters(subject);
  const dailyKeys = dailyChapters.map((chapter) => chapter.key).join("|");
  const fallbackKeys = fallbackChapters.map((chapter) => chapter.key).join("|");

  if (!fallbackKeys || dailyKeys === fallbackKeys) return [dailyChapters];
  return [dailyChapters, fallbackChapters];
}

function buildDailySubjectPrompt({
  dayKey,
  subject,
  chapters,
  previousIssue,
}: {
  dayKey: string;
  subject: QuizSubject;
  chapters: NcertChapter[];
  previousIssue: string | null;
}) {
  const retryInstruction = previousIssue
    ? `\nPrevious output was rejected because: ${previousIssue}. Fix that now.\n`
    : "\n";
  const chapterPlan = chapters
    .map(
      (chapter, index) =>
        `Chapter option ${index + 1}: ${chapter.title} (Class ${chapter.class})`,
    )
    .join("; ");

  return (
    "Generate a MemoHack daily quiz question using the provided structured output schema.\n" +
    `Create exactly 1 ${subject} MCQ for the ${dayKey} (IST) daily quiz.\n` +
    `Use this NCERT chapter plan: ${chapterPlan}.\n` +
    "Match current JEE/NEET question style: NCERT-rooted, high-yield, concept-first, and phrased like a modern exam item.\n" +
    "For Biology, keep it NEET-focused. For Physics and Chemistry, prefer reasoning or light calculation over direct recall when the chapter supports it.\n" +
    "The question must be based only on the assigned chapter plan, with exactly four options and one unambiguous correct answer.\n" +
    "The AI SDK will parse your response as structured output. Return only the requested structured object and make it complete on the first response.\n" +
    "Do not include markdown, code fences, XML, chain-of-thought, scratch work, headings, or prose outside the structured fields.\n" +
    "Put only the question stem in the question field. Do not include question numbers, subject names, chapter names, options, answer keys, explanations, or pipe-delimited rows in the stem.\n" +
    "Put only the option text in each option. Do not prefix options with A), B), C), D), letters, bullets, or numbering.\n" +
    "Keep the explanation under 90 words, but include enough reasoning to prove the answer.\n" +
    retryInstruction
  );
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
    const questions = args.questions.map((question) =>
      normalizeGeneratedQuestion({
        ...question,
        subject: question.subject as QuizSubject,
      }),
    );

    assertNoDuplicateSubjects(questions);

    const inserted: Id<"dailyQuizQuestions">[] = [];
    const skipped: QuizSubject[] = [];

    for (const question of sortGeneratedQuestions(questions)) {
      validateGeneratedQuestion(question);

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

type DailyQuizGenerationFailure = {
  subject: QuizSubject;
  reason: string;
};

type MemoHackOpenRouter = ReturnType<typeof createOpenRouter>;

async function scheduleDailyQuizBackfillRetry({
  ctx,
  dayKey,
  retryCount,
  failedSubjects,
  canRetry,
}: {
  ctx: ActionCtx;
  dayKey: string;
  retryCount: number;
  failedSubjects: DailyQuizGenerationFailure[];
  canRetry: boolean;
}): Promise<boolean> {
  if (
    failedSubjects.length === 0 ||
    !canRetry ||
    retryCount >= DAILY_QUIZ_MAX_BACKFILL_RETRIES
  ) {
    return false;
  }

  await ctx.scheduler.runAfter(
    DAILY_QUIZ_BACKFILL_RETRY_DELAY_MS,
    internal.dailyQuiz.retryMissingDailyQuizSubjects,
    {
      dayKey,
      retryCount: retryCount + 1,
    },
  );

  console.warn("Daily quiz scheduled missing-subject retry", {
    dayKey,
    retryCount: retryCount + 1,
    failedSubjects,
  });
  return true;
}

async function generateDailySubjectQuestion({
  openrouter,
  dayKey,
  subject,
  retryCount,
}: {
  openrouter: MemoHackOpenRouter;
  dayKey: string;
  subject: QuizSubject;
  retryCount: number;
}): Promise<GeneratedQuestion> {
  const chapterPlans = getDailySubjectChapterPlans(dayKey, subject);
  let lastIssue: string | null = null;

  for (
    let attempt = 1;
    attempt <= DAILY_QUIZ_MAX_GENERATION_ATTEMPTS;
    attempt += 1
  ) {
    const startedAt = Date.now();
    const chapters =
      chapterPlans[Math.min(attempt - 1, chapterPlans.length - 1)];
    const output = Output.object({
      schema: dailyGeneratedQuestionSchema(subject),
      name: "daily_quiz_question",
      description: "One validated JEE/NEET daily quiz MCQ for MemoHack.",
    });

    try {
      const result = await generateText({
        model: openrouter.chat(DAILY_QUIZ_MODEL, {
          plugins: [{ id: "response-healing" }],
        }),
        output,
        prompt: buildDailySubjectPrompt({
          dayKey,
          subject,
          chapters,
          previousIssue: lastIssue,
        }),
        temperature: 0.2,
        maxOutputTokens: DAILY_QUIZ_MAX_OUTPUT_TOKENS,
        maxRetries: 0,
        timeout: { totalMs: DAILY_QUIZ_GENERATION_TIMEOUT_MS },
        providerOptions: {
          openrouter: {
            reasoning: OPENROUTER_REASONING_OPTIONS,
          },
        },
      });

      let parsed: GeneratedQuestion;
      try {
        parsed = result.output;
      } catch (error) {
        if (!NoOutputGeneratedError.isInstance(error)) {
          throw error;
        }

        if (!result.text.trim()) {
          throw new Error(
            result.finishReason === "length"
              ? "AI response hit the output token limit before structured output was complete"
              : `AI response finished with ${result.finishReason} and no structured output`,
          );
        }

        parsed = await output.parseCompleteOutput(
          { text: result.text },
          {
            response: result.response,
            usage: result.usage,
            finishReason: result.finishReason,
          },
        );
        console.warn("Daily quiz parsed structured output from text", {
          dayKey,
          subject,
          finishReason: result.finishReason,
        });
      }

      const normalized = normalizeGeneratedQuestion(parsed);
      validateGeneratedQuestion(normalized);
      console.log("Daily quiz AI generation succeeded", {
        dayKey,
        subject,
        model: DAILY_QUIZ_MODEL,
        attempt,
        retryCount,
        durationMs: Date.now() - startedAt,
        finishReason: result.finishReason,
        maxOutputTokens: DAILY_QUIZ_MAX_OUTPUT_TOKENS,
      });
      return normalized;
    } catch (error) {
      lastIssue = generationErrorMessage(error);
      console.warn("Daily quiz AI generation attempt failed", {
        dayKey,
        subject,
        model: DAILY_QUIZ_MODEL,
        attempt,
        retryCount,
        durationMs: Date.now() - startedAt,
        timeoutMs: DAILY_QUIZ_GENERATION_TIMEOUT_MS,
        maxOutputTokens: DAILY_QUIZ_MAX_OUTPUT_TOKENS,
        error: lastIssue,
        errorName: errorName(error),
        errorCause: errorCauseMessage(error),
        responsePreview: getStructuredOutputPreview(error),
      });
    }
  }

  throw new Error(lastIssue ?? `Could not generate ${subject} daily question`);
}

async function generateDailyQuizForDay({
  ctx,
  dayKey,
  retryCount,
}: {
  ctx: ActionCtx;
  dayKey: string;
  retryCount: number;
}): Promise<unknown> {
  const existingSubjects = await ctx.runQuery(
    internal.dailyQuiz.getExistingSubjectsForDay,
    { dayKey },
  );

  const existingSubjectSet = new Set(existingSubjects);
  if (SUBJECTS.every((subject) => existingSubjectSet.has(subject))) {
    return { dayKey, retryCount, skipped: true };
  }

  const subjectsToGenerate = SUBJECTS.filter(
    (subject) => !existingSubjectSet.has(subject),
  );
  const apiKey = process.env.OPENROUTER_API_KEY;
  const generated: GeneratedQuestion[] = [];
  const failedSubjects: DailyQuizGenerationFailure[] = [];

  if (apiKey) {
    const openrouter = createOpenRouter({
      apiKey,
      headers: OPENROUTER_HEADERS,
      compatibility: "strict",
    });

    const subjectResults = await Promise.allSettled(
      subjectsToGenerate.map((subject) =>
        generateDailySubjectQuestion({
          openrouter,
          dayKey,
          subject,
          retryCount,
        }),
      ),
    );

    for (const [index, result] of subjectResults.entries()) {
      const subject = subjectsToGenerate[index];
      if (result.status === "fulfilled") {
        generated.push(result.value);
      } else {
        failedSubjects.push({
          subject,
          reason: errorMessage(result.reason),
        });
      }
    }
  } else {
    for (const subject of subjectsToGenerate) {
      failedSubjects.push({
        subject,
        reason: "OPENROUTER_API_KEY is not configured",
      });
    }
    console.error("Daily quiz AI generation is not configured", { dayKey });
  }

  if (generated.length === 0) {
    const retryScheduled = await scheduleDailyQuizBackfillRetry({
      ctx,
      dayKey,
      retryCount,
      failedSubjects,
      canRetry: Boolean(apiKey),
    });
    const logNoQuestions = retryScheduled ? console.warn : console.error;
    logNoQuestions("Daily quiz generation produced no questions", {
      dayKey,
      retryCount,
      failedSubjects,
      retryScheduled,
    });
    return {
      dayKey,
      retryCount,
      failed: true,
      failedSubjects,
      retryScheduled,
    };
  }

  const result = await ctx.runMutation(
    internal.dailyQuiz.storeGeneratedQuestions,
    {
      dayKey,
      questions: sortGeneratedQuestions(generated),
    },
  );

  const retryScheduled = await scheduleDailyQuizBackfillRetry({
    ctx,
    dayKey,
    retryCount,
    failedSubjects,
    canRetry: Boolean(apiKey),
  });

  if (failedSubjects.length > 0) {
    const logPartial = retryScheduled ? console.warn : console.error;
    logPartial("Daily quiz generation completed with missing subjects", {
      dayKey,
      retryCount,
      failedSubjects,
      retryScheduled,
    });
  }

  return {
    ...result,
    dayKey,
    retryCount,
    partial: failedSubjects.length > 0,
    failedSubjects,
    retryScheduled,
  };
}

export const generateDailyQuiz = internalAction({
  args: {},
  handler: async (ctx): Promise<unknown> => {
    return await generateDailyQuizForDay({
      ctx,
      dayKey: getIstDayKey(),
      retryCount: 0,
    });
  },
});

export const retryMissingDailyQuizSubjects = internalAction({
  args: {
    dayKey: v.string(),
    retryCount: v.number(),
  },
  handler: async (ctx, args): Promise<unknown> => {
    return await generateDailyQuizForDay({
      ctx,
      dayKey: args.dayKey,
      retryCount: args.retryCount,
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
      const normalizedQuestion = normalizeGeneratedQuestion({
        subject: question.subject as QuizSubject,
        question: question.question,
        options: question.options,
        correctOptionIndex: question.correctOptionIndex,
        explanation: question.explanation,
      });
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
        question: normalizedQuestion.question,
        options: normalizedQuestion.options,
        explanation: attempt ? normalizedQuestion.explanation : null,
        correctOptionIndex: attempt
          ? normalizedQuestion.correctOptionIndex
          : null,
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

    const ranked = [...byUser.values()]
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.attemptedCount !== a.attemptedCount) {
          return b.attemptedCount - a.attemptedCount;
        }
        return a.lastSubmittedAt - b.lastSubmittedAt;
      })
      .slice(0, 100);

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
    const totalAttempted = rows.reduce(
      (sum, row) => sum + row.attemptedCount,
      0,
    );
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
