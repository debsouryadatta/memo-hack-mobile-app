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
  ActionCtx,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  MutationCtx,
  query,
  QueryCtx,
} from "./_generated/server";
import { requireAuth } from "./_lib/auth";
import { throwAppError } from "./_lib/errors";
import {
  getNcertChapterByKey,
  getNcertChapterGroups,
  type NcertChapter,
} from "./_lib/ncertChapters";

const SUBJECTS = ["physics", "chemistry", "biology"] as const;
type LiveQuizSubject = (typeof SUBJECTS)[number];
type LiveQuizRoomSubject = LiveQuizSubject | "mixed";

const QUESTION_COUNTS = [5, 10, 15] as const;
const QUESTION_SECONDS = [15, 30, 45] as const;
const ANSWER_REVEAL_MS = 5000;
const LEADERBOARD_MS = 5000;
const LIVE_QUIZ_MODEL = "deepseek/deepseek-v4-flash";
const GENERATION_MAX_ATTEMPTS = 1;
const GENERATION_TIMEOUT_MS = 120000;
const GENERATION_WATCHDOG_MS = 180000;
const GENERATION_BATCH_SIZE = 5;
const GENERATION_MAX_RETRIES = 2;
const BACKGROUND_GENERATION_RETRY_MS = 3000;
const GENERATION_MAX_OUTPUT_TOKENS_BUFFER = 800;
const GENERATION_MAX_OUTPUT_TOKENS_PER_QUESTION = 900;
const GENERATION_MAX_OUTPUT_TOKENS = 6000;
const OPENROUTER_HEADERS = {
  "HTTP-Referer": "https://memohack.app",
  "X-Title": "MemoHack",
} as const;
const subjectValidator = v.union(
  v.literal("physics"),
  v.literal("chemistry"),
  v.literal("biology"),
);

const generatedQuestionValidator = v.object({
  chapterKey: v.string(),
  question: v.string(),
  options: v.array(v.string()),
  correctOptionIndex: v.number(),
  explanation: v.string(),
});

type GeneratedQuestion = {
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
};

const liveGeneratedQuestionSchema = z
  .object({
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

type StoredQuestion = {
  chapterKey: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
};

type ReviewParticipant = {
  userId: Id<"users">;
  name: string;
  image: string;
  class: string;
  score: number;
  correctCount: number;
  joinedAt: number;
  isMe: boolean;
  answers: Doc<"liveQuizParticipants">["answers"];
};

type ReadWriteCtx = QueryCtx | MutationCtx;

function assertAllowedNumber(
  value: number,
  allowed: readonly number[],
  label: string,
) {
  if (!Number.isInteger(value) || !allowed.includes(value)) {
    throwAppError("INVALID_INPUT", `Choose a valid ${label}`);
  }
}

function normalizeJoinCode(joinCode: string): string {
  return joinCode.trim().toUpperCase();
}

function generateJoinCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function errorName(error: unknown): string | null {
  return error instanceof Error ? error.name : null;
}

function errorCauseMessage(error: unknown): string | null {
  if (!(error instanceof Error) || !("cause" in error)) return null;
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
    SUBJECTS.includes(part.toLowerCase() as LiveQuizSubject),
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

function normalizeLiveQuizQuestion(
  question: GeneratedQuestion | StoredQuestion,
): GeneratedQuestion | StoredQuestion {
  const pipeEncoded = parsePipeEncodedQuestion(question.question);
  const options = (pipeEncoded?.options ?? question.options).map(
    stripOptionPrefix,
  );
  const normalizedQuestion = removeEmbeddedOptions(
    stripQuestionPrefix(pipeEncoded?.question ?? question.question),
  );
  const correctOptionIndex =
    pipeEncoded?.correctOptionIndex ?? question.correctOptionIndex;
  const explanation = compactWhitespace(
    pipeEncoded?.explanation ?? question.explanation,
  );

  return {
    ...question,
    question: normalizedQuestion,
    options,
    correctOptionIndex,
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

function getLiveQuizMaxOutputTokens(batchCount: number): number {
  return Math.min(
    GENERATION_MAX_OUTPUT_TOKENS,
    GENERATION_MAX_OUTPUT_TOKENS_BUFFER +
      batchCount * GENERATION_MAX_OUTPUT_TOKENS_PER_QUESTION,
  );
}

function prepareGeneratedQuestionForStorage({
  generatedQuestion,
  chapterKey,
}: {
  generatedQuestion: GeneratedQuestion;
  chapterKey: string;
}): StoredQuestion {
  const normalized = normalizeLiveQuizQuestion(
    generatedQuestion,
  ) as GeneratedQuestion;
  validateGeneratedQuestion(normalized);

  return {
    ...normalized,
    chapterKey,
  };
}

function normalizeStoredQuestionForDisplay(
  question: StoredQuestion,
): StoredQuestion {
  return normalizeLiveQuizQuestion(question) as StoredQuestion;
}

function buildLiveQuizPrompt({
  startQuestionNumber,
  batchCount,
  totalQuestions,
  subjectList,
  chapters,
  previousQuestions,
  previousIssue,
}: {
  startQuestionNumber: number;
  batchCount: number;
  totalQuestions: number;
  subjectList: string;
  chapters: NcertChapter[];
  previousQuestions: string[];
  previousIssue: string | null;
}) {
  const retryInstruction = previousIssue
    ? `\nPrevious output was rejected because: ${previousIssue}. Fix that now.\n`
    : "\n";
  const previousQuestionInstruction =
    previousQuestions.length > 0
      ? `Avoid repeating these already generated questions: ${previousQuestions.join(" | ")}.\n`
      : "";
  const endQuestionNumber = startQuestionNumber + batchCount - 1;
  const questionRange =
    batchCount === 1
      ? `question ${startQuestionNumber}`
      : `questions ${startQuestionNumber}-${endQuestionNumber}`;
  const chapterPlan = chapters
    .map(
      (chapter, index) =>
        `Question ${startQuestionNumber + index}: ${chapter.subject}: ${chapter.title} (Class ${chapter.class})`,
    )
    .join("; ");

  return (
    "Generate MemoHack live quiz questions using the provided structured output schema.\n" +
    `Create exactly ${batchCount} MCQ${batchCount === 1 ? "" : "s"} for ${questionRange} of ${totalQuestions} in this live room.\n` +
    `Subjects in this room: ${subjectList}.\n` +
    `Use this NCERT chapter plan: ${chapterPlan}.\n` +
    "Match current JEE/NEET question style: NCERT-rooted, high-yield, concept-first, and phrased like a modern exam item.\n" +
    "For Biology, keep it NEET-focused. For Physics and Chemistry, prefer reasoning or light calculation over direct recall when the chapter supports it.\n" +
    "Each question must be based only on its assigned chapter, with exactly four options and one unambiguous correct answer.\n" +
    "Put only the question stem in the question field. Do not include question numbers, subjects, chapters, answer options, answer keys, explanations, or pipe-separated row text inside the question field.\n" +
    "Put only clean option text in each option. Do not prefix options with A), B), C), D), or similar labels.\n" +
    "Keep each question and explanation concise, but include enough reasoning to prove the answer.\n" +
    previousQuestionInstruction +
    retryInstruction
  );
}

function formatSubjectLabel(subjects: LiveQuizSubject[]): string {
  if (subjects.length === 0) return "Mixed";
  return subjects
    .map((subject) => subject[0].toUpperCase() + subject.slice(1))
    .join(", ");
}

function getRoomSubjects(room: Doc<"liveQuizRooms">): LiveQuizSubject[] {
  if (room.subjects) return room.subjects;
  return room.subject === "mixed" ? [] : [room.subject as LiveQuizSubject];
}

async function requireParticipant(
  ctx: ReadWriteCtx,
  roomId: Id<"liveQuizRooms">,
  userId: Id<"users">,
): Promise<Doc<"liveQuizParticipants">> {
  const participant = await ctx.db
    .query("liveQuizParticipants")
    .withIndex("by_room_user", (q) =>
      q.eq("roomId", roomId).eq("userId", userId),
    )
    .first();

  if (!participant) {
    throwAppError("FORBIDDEN", "Join this live quiz first");
  }
  return participant;
}

async function getRoomParticipants(
  ctx: ReadWriteCtx,
  roomId: Id<"liveQuizRooms">,
): Promise<Doc<"liveQuizParticipants">[]> {
  return await ctx.db
    .query("liveQuizParticipants")
    .withIndex("by_room_user", (q) => q.eq("roomId", roomId))
    .collect();
}

export const getNcertChapters = query({
  args: {},
  handler: async () => {
    return getNcertChapterGroups();
  },
});

export const createLiveQuizRoom = mutation({
  args: {
    subject: v.optional(subjectValidator),
    chapterKeys: v.array(v.string()),
    questionCount: v.number(),
    secondsPerQuestion: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = (await requireAuth(ctx)) as Id<"users">;
    assertAllowedNumber(args.questionCount, QUESTION_COUNTS, "question count");
    assertAllowedNumber(
      args.secondsPerQuestion,
      QUESTION_SECONDS,
      "question timer",
    );

    if (args.chapterKeys.length === 0) {
      throwAppError("INVALID_INPUT", "Choose at least one chapter");
    }
    if (args.chapterKeys.length > 24) {
      throwAppError("INVALID_INPUT", "Choose 24 or fewer chapters");
    }

    const seenChapters = new Set<string>();
    const selectedSubjects = new Set<LiveQuizSubject>();
    for (const chapterKey of args.chapterKeys) {
      if (seenChapters.has(chapterKey)) {
        throwAppError("INVALID_INPUT", "Choose each chapter only once");
      }
      seenChapters.add(chapterKey);

      const chapter = getNcertChapterByKey(chapterKey);
      if (!chapter) throwAppError("NOT_FOUND", "Chapter not found");
      selectedSubjects.add(chapter.subject);
    }

    if (args.subject && selectedSubjects.size === 1) {
      const [onlySubject] = Array.from(selectedSubjects);
      if (onlySubject !== args.subject) {
        throwAppError("INVALID_INPUT", "Chapters must match the subject");
      }
    }

    let joinCode: string | null = null;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = generateJoinCode();
      const existing = await ctx.db
        .query("liveQuizRooms")
        .withIndex("by_join_code", (q) => q.eq("joinCode", candidate))
        .first();
      if (!existing) {
        joinCode = candidate;
        break;
      }
    }
    if (!joinCode) {
      throwAppError("LIMIT_REACHED", "Could not create a room code");
    }

    const now = Date.now();
    const subjects = Array.from(selectedSubjects).sort() as LiveQuizSubject[];
    const roomSubject: LiveQuizRoomSubject =
      subjects.length === 1 ? subjects[0] : "mixed";
    const roomId = await ctx.db.insert("liveQuizRooms", {
      hostId: userId,
      joinCode,
      status: "lobby",
      subject: roomSubject,
      subjects,
      chapterKeys: args.chapterKeys,
      questionCount: args.questionCount,
      secondsPerQuestion: args.secondsPerQuestion,
      currentQuestionIndex: 0,
      phaseStartedAt: now,
      generationRetryCount: 0,
      questions: [],
      error: null,
      createdAt: now,
      updatedAt: now,
      startedAt: null,
      endedAt: null,
    });

    await ctx.db.insert("liveQuizParticipants", {
      roomId,
      userId,
      score: 0,
      correctCount: 0,
      answers: [],
      joinedAt: now,
      updatedAt: now,
    });

    return { roomId, joinCode };
  },
});

export const joinLiveQuizRoom = mutation({
  args: {
    joinCode: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = (await requireAuth(ctx)) as Id<"users">;
    const joinCode = normalizeJoinCode(args.joinCode);
    if (joinCode.length < 4) {
      throwAppError("INVALID_INPUT", "Enter a valid room code");
    }

    const room = await ctx.db
      .query("liveQuizRooms")
      .withIndex("by_join_code", (q) => q.eq("joinCode", joinCode))
      .first();
    if (!room) throwAppError("NOT_FOUND", "Live quiz room not found");
    if (room.status !== "lobby") {
      throwAppError("FORBIDDEN", "This live quiz has already started");
    }

    const existing = await ctx.db
      .query("liveQuizParticipants")
      .withIndex("by_room_user", (q) =>
        q.eq("roomId", room._id).eq("userId", userId),
      )
      .first();
    if (existing) return { roomId: room._id };

    const now = Date.now();
    await ctx.db.insert("liveQuizParticipants", {
      roomId: room._id,
      userId,
      score: 0,
      correctCount: 0,
      answers: [],
      joinedAt: now,
      updatedAt: now,
    });

    return { roomId: room._id };
  },
});

export const startLiveQuizRoom = mutation({
  args: {
    roomId: v.id("liveQuizRooms"),
  },
  handler: async (ctx, args) => {
    const userId = (await requireAuth(ctx)) as Id<"users">;
    const room = await ctx.db.get(args.roomId);
    if (!room) throwAppError("NOT_FOUND", "Live quiz room not found");
    if (room.hostId !== userId) {
      throwAppError("FORBIDDEN", "Only the host can start this quiz");
    }
    if (room.status !== "lobby") {
      throwAppError("INVALID_INPUT", "This quiz cannot be started now");
    }

    const now = Date.now();
    await ctx.db.patch(args.roomId, {
      status: "generating",
      error: null,
      generationRetryCount: 0,
      updatedAt: now,
      phaseStartedAt: now,
    });
    await ctx.scheduler.runAfter(
      0,
      internal.liveQuiz.generateLiveQuizQuestions,
      {
        roomId: args.roomId,
      },
    );
    await ctx.scheduler.runAfter(
      GENERATION_WATCHDOG_MS,
      internal.liveQuiz.markGenerationTimedOut,
      { roomId: args.roomId, questionIndex: 0 },
    );

    return { roomId: args.roomId };
  },
});

export const submitLiveQuizAnswer = mutation({
  args: {
    roomId: v.id("liveQuizRooms"),
    selectedOptionIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = (await requireAuth(ctx)) as Id<"users">;
    const room = await ctx.db.get(args.roomId);
    if (!room) throwAppError("NOT_FOUND", "Live quiz room not found");
    if (room.status !== "question") {
      throwAppError("INVALID_INPUT", "Answers are locked for this question");
    }

    const storedQuestion = room.questions[room.currentQuestionIndex];
    if (!storedQuestion)
      throwAppError("NOT_FOUND", "Current question not found");
    const question = normalizeStoredQuestionForDisplay(storedQuestion);
    if (
      !Number.isInteger(args.selectedOptionIndex) ||
      args.selectedOptionIndex < 0 ||
      args.selectedOptionIndex >= question.options.length
    ) {
      throwAppError("INVALID_INPUT", "Choose a valid option");
    }

    const participant = await requireParticipant(ctx, args.roomId, userId);
    const alreadyAnswered = participant.answers.some(
      (answer) => answer.questionIndex === room.currentQuestionIndex,
    );
    if (alreadyAnswered) {
      throwAppError("DUPLICATE", "You already answered this question");
    }

    const now = Date.now();
    const responseMs = Math.max(0, now - room.phaseStartedAt);
    const totalMs = room.secondsPerQuestion * 1000;
    if (responseMs > totalMs) {
      throwAppError("INVALID_INPUT", "Time is up for this question");
    }

    const isCorrect = args.selectedOptionIndex === question.correctOptionIndex;
    const speedRatio = Math.max(0, 1 - responseMs / totalMs);
    const speedBonus = isCorrect ? Math.round(500 * speedRatio) : 0;
    const scoreDelta = isCorrect ? 500 + speedBonus : 0;

    await ctx.db.patch(participant._id, {
      score: participant.score + scoreDelta,
      correctCount: participant.correctCount + (isCorrect ? 1 : 0),
      answers: [
        ...participant.answers,
        {
          questionIndex: room.currentQuestionIndex,
          selectedOptionIndex: args.selectedOptionIndex,
          isCorrect,
          responseMs,
          scoreDelta,
          answeredAt: now,
        },
      ],
      updatedAt: now,
    });

    return { isCorrect, scoreDelta };
  },
});

export const getLiveQuizRoom = query({
  args: {
    roomId: v.id("liveQuizRooms"),
  },
  handler: async (ctx, args) => {
    const userId = (await requireAuth(ctx)) as Id<"users">;
    const room = await ctx.db.get(args.roomId);
    if (!room) throwAppError("NOT_FOUND", "Live quiz room not found");
    const participant = await requireParticipant(ctx, args.roomId, userId);
    const participants = await getRoomParticipants(ctx, args.roomId);

    return {
      _id: room._id,
      hostId: room.hostId,
      joinCode: room.joinCode,
      status: room.status,
      subject: room.subject,
      subjects:
        room.subjects ??
        (room.subject === "mixed" ? [] : [room.subject as LiveQuizSubject]),
      chapterKeys: room.chapterKeys,
      questionCount: room.questionCount,
      secondsPerQuestion: room.secondsPerQuestion,
      currentQuestionIndex: room.currentQuestionIndex,
      generatedQuestionCount: room.questions.length,
      phaseStartedAt: room.phaseStartedAt,
      participantCount: participants.length,
      startedAt: room.startedAt,
      endedAt: room.endedAt,
      error: room.error,
      isHost: room.hostId === userId,
      myScore: participant.score,
      myCorrectCount: participant.correctCount,
      serverNow: Date.now(),
    };
  },
});

export const getCurrentLiveQuestion = query({
  args: {
    roomId: v.id("liveQuizRooms"),
  },
  handler: async (ctx, args) => {
    const userId = (await requireAuth(ctx)) as Id<"users">;
    const room = await ctx.db.get(args.roomId);
    if (!room) throwAppError("NOT_FOUND", "Live quiz room not found");
    const participant = await requireParticipant(ctx, args.roomId, userId);
    const storedQuestion = room.questions[room.currentQuestionIndex];
    if (!storedQuestion) return null;
    const question = normalizeStoredQuestionForDisplay(storedQuestion);

    const myAnswer =
      participant.answers.find(
        (answer) => answer.questionIndex === room.currentQuestionIndex,
      ) ?? null;
    const revealAnswer =
      room.status === "answer_reveal" ||
      room.status === "leaderboard" ||
      room.status === "finished";

    return {
      questionIndex: room.currentQuestionIndex,
      totalQuestions: room.questionCount,
      question: question.question,
      options: question.options,
      myAnswer,
      canAnswer: room.status === "question" && !myAnswer,
      correctOptionIndex: revealAnswer ? question.correctOptionIndex : null,
      explanation: revealAnswer ? question.explanation : null,
    };
  },
});

export const getLiveQuizLeaderboard = query({
  args: {
    roomId: v.id("liveQuizRooms"),
  },
  handler: async (ctx, args) => {
    const userId = (await requireAuth(ctx)) as Id<"users">;
    const room = await ctx.db.get(args.roomId);
    if (!room) throwAppError("NOT_FOUND", "Live quiz room not found");
    await requireParticipant(ctx, args.roomId, userId);

    const participants = await getRoomParticipants(ctx, args.roomId);
    const rankedParticipants = participants
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.correctCount !== a.correctCount) {
          return b.correctCount - a.correctCount;
        }
        return a.joinedAt - b.joinedAt;
      })
      .slice(0, 100);

    const leaderboard = [];
    for (const [index, participant] of rankedParticipants.entries()) {
      const user = await ctx.db.get(participant.userId);
      if (!user) continue;
      const lastAnswer =
        participant.answers.find(
          (answer) => answer.questionIndex === room.currentQuestionIndex,
        ) ?? null;
      leaderboard.push({
        rank: index + 1,
        userId: participant.userId,
        name: user.name,
        image: user.image,
        class: user.class,
        score: participant.score,
        correctCount: participant.correctCount,
        lastScoreDelta: lastAnswer?.scoreDelta ?? 0,
        isMe: participant.userId === userId,
      });
    }

    return { leaderboard };
  },
});

export const getMyLiveQuizAnswer = query({
  args: {
    roomId: v.id("liveQuizRooms"),
  },
  handler: async (ctx, args) => {
    const userId = (await requireAuth(ctx)) as Id<"users">;
    const room = await ctx.db.get(args.roomId);
    if (!room) throwAppError("NOT_FOUND", "Live quiz room not found");
    const participant = await requireParticipant(ctx, args.roomId, userId);
    return (
      participant.answers.find(
        (answer) => answer.questionIndex === room.currentQuestionIndex,
      ) ?? null
    );
  },
});

export const listLiveQuizHistory = query({
  args: {},
  handler: async (ctx) => {
    const userId = (await requireAuth(ctx)) as Id<"users">;
    const rooms = await ctx.db
      .query("liveQuizRooms")
      .withIndex("by_status_ended", (q) => q.eq("status", "finished"))
      .order("desc")
      .take(30);

    const history = [];
    for (const room of rooms) {
      const participant = await ctx.db
        .query("liveQuizParticipants")
        .withIndex("by_room_user", (q) =>
          q.eq("roomId", room._id).eq("userId", userId),
        )
        .first();
      const participants = await getRoomParticipants(ctx, room._id);
      const subjects = getRoomSubjects(room);

      history.push({
        roomId: room._id,
        joinCode: room.joinCode,
        subject: room.subject,
        subjects,
        subjectLabel: formatSubjectLabel(subjects),
        questionCount: room.questionCount,
        participantCount: participants.length,
        myScore: participant?.score ?? null,
        myCorrectCount: participant?.correctCount ?? null,
        participated: participant != null,
        endedAt: room.endedAt,
        createdAt: room.createdAt,
      });
    }

    return { history };
  },
});

export const getLiveQuizReview = query({
  args: {
    roomId: v.id("liveQuizRooms"),
  },
  handler: async (ctx, args) => {
    const userId = (await requireAuth(ctx)) as Id<"users">;
    const room = await ctx.db.get(args.roomId);
    if (!room) throwAppError("NOT_FOUND", "Live quiz room not found");
    if (room.status !== "finished") {
      throwAppError("INVALID_INPUT", "Review is available after the quiz ends");
    }

    const participants = await getRoomParticipants(ctx, args.roomId);
    const enrichedParticipants: ReviewParticipant[] = [];
    for (const participant of participants) {
      const user = await ctx.db.get(participant.userId);
      if (!user) continue;
      enrichedParticipants.push({
        userId: participant.userId,
        name: user.name,
        image: user.image,
        class: user.class,
        score: participant.score,
        correctCount: participant.correctCount,
        joinedAt: participant.joinedAt,
        isMe: participant.userId === userId,
        answers: participant.answers,
      });
    }

    const leaderboard = [...enrichedParticipants]
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.correctCount !== a.correctCount) {
          return b.correctCount - a.correctCount;
        }
        return a.joinedAt - b.joinedAt;
      })
      .map((participant, index) => ({
        rank: index + 1,
        userId: participant.userId,
        name: participant.name,
        image: participant.image,
        class: participant.class,
        score: participant.score,
        correctCount: participant.correctCount,
        isMe: participant.isMe,
      }));

    const myParticipant =
      enrichedParticipants.find((participant) => participant.isMe) ?? null;
    const questions = room.questions.map((storedQuestion, questionIndex) => {
      const question = normalizeStoredQuestionForDisplay(storedQuestion);
      const answers = enrichedParticipants
        .map((participant) => {
          const answer =
            participant.answers.find(
              (row) => row.questionIndex === questionIndex,
            ) ?? null;
          return {
            userId: participant.userId,
            name: participant.name,
            image: participant.image,
            selectedOptionIndex: answer?.selectedOptionIndex ?? null,
            isCorrect: answer?.isCorrect ?? false,
            responseMs: answer?.responseMs ?? null,
            scoreDelta: answer?.scoreDelta ?? 0,
            answeredAt: answer?.answeredAt ?? null,
            isMe: participant.isMe,
          };
        })
        .sort((a, b) => {
          if (
            a.selectedOptionIndex === null &&
            b.selectedOptionIndex !== null
          ) {
            return 1;
          }
          if (
            a.selectedOptionIndex !== null &&
            b.selectedOptionIndex === null
          ) {
            return -1;
          }
          return (
            (a.answeredAt ?? Number.MAX_SAFE_INTEGER) -
            (b.answeredAt ?? Number.MAX_SAFE_INTEGER)
          );
        });

      const optionStats = question.options.map((_, optionIndex) => ({
        optionIndex,
        count: answers.filter(
          (answer) => answer.selectedOptionIndex === optionIndex,
        ).length,
      }));

      return {
        questionIndex,
        chapterKey: question.chapterKey,
        question: question.question,
        options: question.options,
        correctOptionIndex: question.correctOptionIndex,
        explanation: question.explanation,
        myAnswer:
          myParticipant?.answers.find(
            (row) => row.questionIndex === questionIndex,
          ) ?? null,
        optionStats,
        answers,
      };
    });

    const subjects = getRoomSubjects(room);
    return {
      room: {
        _id: room._id,
        joinCode: room.joinCode,
        subject: room.subject,
        subjects,
        subjectLabel: formatSubjectLabel(subjects),
        questionCount: room.questionCount,
        secondsPerQuestion: room.secondsPerQuestion,
        participantCount: enrichedParticipants.length,
        startedAt: room.startedAt,
        endedAt: room.endedAt,
        createdAt: room.createdAt,
      },
      participated: myParticipant != null,
      myScore: myParticipant?.score ?? null,
      myCorrectCount: myParticipant?.correctCount ?? null,
      leaderboard,
      questions,
    };
  },
});

export const getRoomForGeneration = internalQuery({
  args: {
    roomId: v.id("liveQuizRooms"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Live quiz room not found");

    const chapters: NcertChapter[] = [];
    for (const chapterKey of room.chapterKeys) {
      const chapter = getNcertChapterByKey(chapterKey);
      if (chapter) chapters.push(chapter);
    }

    return { room, chapters };
  },
});

export const generateLiveQuizQuestions = internalAction({
  args: {
    roomId: v.id("liveQuizRooms"),
  },
  handler: async (ctx: ActionCtx, args): Promise<unknown> => {
    const { room, chapters } = await ctx.runQuery(
      internal.liveQuiz.getRoomForGeneration,
      { roomId: args.roomId },
    );
    if (
      !["generating", "question", "answer_reveal", "leaderboard"].includes(
        room.status,
      )
    ) {
      return { skipped: true };
    }
    if (chapters.length === 0) {
      await ctx.runMutation(internal.liveQuiz.markGenerationFailed, {
        roomId: args.roomId,
        questionIndex: room.questions.length,
        error: "Selected chapters were not found",
      });
      return { failed: true };
    }
    if (room.questions.length >= room.questionCount) {
      return { complete: true };
    }

    try {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error("Question generation is not configured");
      }
      const openrouter = createOpenRouter({
        apiKey,
        headers: OPENROUTER_HEADERS,
        compatibility: "strict",
      });
      const generationStartedAt = Date.now();
      const startIndex = room.questions.length;
      const remainingCount = room.questionCount - startIndex;
      const batchCount = Math.min(GENERATION_BATCH_SIZE, remainingCount);
      const targetChapters = Array.from(
        { length: batchCount },
        (_, offset) => chapters[(startIndex + offset) % chapters.length],
      );
      console.log("Live quiz generation started", {
        roomId: args.roomId,
        model: LIVE_QUIZ_MODEL,
        attempts: GENERATION_MAX_ATTEMPTS,
        timeoutMs: GENERATION_TIMEOUT_MS,
        maxOutputTokens: getLiveQuizMaxOutputTokens(batchCount),
        startIndex,
        batchCount,
        questionCount: room.questionCount,
        chapterCount: chapters.length,
      });
      const subjectList = Array.from(
        new Set(chapters.map((chapter: NcertChapter) => chapter.subject)),
      ).join(", ");

      let generated: GeneratedQuestion[] | null = null;
      let lastIssue: string | null = null;
      for (let attempt = 1; attempt <= GENERATION_MAX_ATTEMPTS; attempt += 1) {
        try {
          const output = Output.array({
            element: liveGeneratedQuestionSchema,
            name: "live_quiz_questions",
            description: "Validated JEE/NEET live quiz MCQs for MemoHack.",
          });
          const result = await generateText({
            model: openrouter.chat(LIVE_QUIZ_MODEL, {
              plugins: [{ id: "response-healing" }],
            }),
            output,
            prompt: buildLiveQuizPrompt({
              startQuestionNumber: startIndex + 1,
              batchCount,
              totalQuestions: room.questionCount,
              subjectList,
              chapters: targetChapters,
              previousQuestions: room.questions.map(
                (question) => question.question,
              ),
              previousIssue: lastIssue,
            }),
            temperature: 0.2,
            maxOutputTokens: getLiveQuizMaxOutputTokens(batchCount),
            maxRetries: 0,
            timeout: { totalMs: GENERATION_TIMEOUT_MS },
          });
          let parsed: GeneratedQuestion[];
          try {
            parsed = result.output;
          } catch (error) {
            if (
              !NoOutputGeneratedError.isInstance(error) ||
              !result.text.trim()
            ) {
              throw new Error(
                `AI response finished with ${result.finishReason} and no structured output`,
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
            console.warn("Live quiz parsed structured output from text", {
              roomId: args.roomId,
              startIndex,
              batchCount,
              finishReason: result.finishReason,
            });
          }

          if (parsed.length !== batchCount) {
            throw new Error(
              `AI response returned ${parsed.length} questions instead of ${batchCount}`,
            );
          }
          generated = parsed;
          break;
        } catch (error) {
          lastIssue = errorMessage(error);
          console.error("Live quiz AI generation attempt failed", {
            roomId: args.roomId,
            model: LIVE_QUIZ_MODEL,
            startIndex,
            batchCount,
            attempt,
            error: lastIssue,
            errorName: errorName(error),
            errorCause: errorCauseMessage(error),
            responsePreview: getStructuredOutputPreview(error),
          });
        }
      }

      if (!generated) {
        throw new Error(lastIssue ?? "Could not generate live quiz questions");
      }

      console.log("Live quiz generation finished", {
        roomId: args.roomId,
        startIndex,
        batchCount,
        durationMs: Date.now() - generationStartedAt,
      });

      let appendedCount = 0;
      const appendResults = [];
      for (const [offset, generatedQuestion] of generated.entries()) {
        const questionIndex = startIndex + offset;
        const question = prepareGeneratedQuestionForStorage({
          generatedQuestion,
          chapterKey: targetChapters[offset].key,
        });

        const appendResult = await ctx.runMutation(
          internal.liveQuiz.appendGeneratedQuestion,
          {
            roomId: args.roomId,
            questionIndex,
            question,
          },
        );
        appendResults.push(appendResult);
        if (appendResult.appended) appendedCount += 1;
      }

      if (
        appendedCount > 0 &&
        startIndex + appendedCount < room.questionCount
      ) {
        await ctx.scheduler.runAfter(
          0,
          internal.liveQuiz.generateLiveQuizQuestions,
          {
            roomId: args.roomId,
          },
        );
      }

      return { appendedCount, appendResults };
    } catch (error) {
      const latest = await ctx.runQuery(
        internal.liveQuiz.getRoomForGeneration,
        {
          roomId: args.roomId,
        },
      );
      console.error("Live quiz generation failed", {
        roomId: args.roomId,
        questionIndex: latest.room.questions.length,
        error: errorMessage(error),
        errorName: errorName(error),
        errorCause: errorCauseMessage(error),
      });
      await ctx.runMutation(internal.liveQuiz.markGenerationFailed, {
        roomId: args.roomId,
        questionIndex: latest.room.questions.length,
        error: generationErrorMessage(error),
      });
      return { failed: true };
    }
  },
});

export const appendGeneratedQuestion = internalMutation({
  args: {
    roomId: v.id("liveQuizRooms"),
    questionIndex: v.number(),
    question: generatedQuestionValidator,
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room || room.status === "finished" || room.status === "lobby") {
      return { skipped: true };
    }
    if (args.questionIndex !== room.questions.length) {
      return { skipped: true, reason: "stale_generation" };
    }
    if (room.questions.length >= room.questionCount) {
      return { skipped: true, reason: "complete" };
    }

    const now = Date.now();
    const questions = [...room.questions, args.question];
    const startsWaitingQuestion =
      room.status === "generating" &&
      room.currentQuestionIndex === args.questionIndex;
    await ctx.db.patch(args.roomId, {
      questions,
      generationRetryCount: 0,
      ...(startsWaitingQuestion
        ? {
            status: "question" as const,
            phaseStartedAt: now,
            startedAt: room.startedAt ?? now,
          }
        : {}),
      error: null,
      updatedAt: now,
    });

    if (startsWaitingQuestion) {
      await ctx.scheduler.runAfter(
        room.secondsPerQuestion * 1000,
        internal.liveQuiz.showAnswerReveal,
        { roomId: args.roomId },
      );
    }

    return {
      appended: true,
      questionIndex: args.questionIndex,
      startedQuestion: startsWaitingQuestion,
    };
  },
});

export const markGenerationFailed = internalMutation({
  args: {
    roomId: v.id("liveQuizRooms"),
    questionIndex: v.optional(v.number()),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room || room.status === "finished") return { skipped: true };
    const questionIndex = args.questionIndex ?? room.questions.length;
    if (questionIndex < room.questions.length) return { skipped: true };

    const now = Date.now();
    if (room.questions.length === 0 && room.status === "generating") {
      const retryCount = room.generationRetryCount ?? 0;
      if (retryCount < GENERATION_MAX_RETRIES) {
        await ctx.db.patch(args.roomId, {
          error: args.error,
          generationRetryCount: retryCount + 1,
          updatedAt: now,
          phaseStartedAt: now,
        });
        await ctx.scheduler.runAfter(
          BACKGROUND_GENERATION_RETRY_MS,
          internal.liveQuiz.generateLiveQuizQuestions,
          { roomId: args.roomId },
        );
        await ctx.scheduler.runAfter(
          GENERATION_WATCHDOG_MS,
          internal.liveQuiz.markGenerationTimedOut,
          { roomId: args.roomId, questionIndex },
        );
        return { retrying: true, retryCount: retryCount + 1 };
      }

      await ctx.db.patch(args.roomId, {
        status: "lobby",
        error: args.error,
        generationRetryCount: 0,
        updatedAt: now,
        phaseStartedAt: now,
      });
      return { failed: true };
    }

    if (room.questions.length < room.questionCount) {
      const isWaitingForNextQuestion =
        room.status === "generating" &&
        room.currentQuestionIndex >= room.questions.length;
      const retryCount = room.generationRetryCount ?? 0;

      await ctx.db.patch(args.roomId, {
        ...(isWaitingForNextQuestion ? { error: args.error } : {}),
        generationRetryCount: isWaitingForNextQuestion
          ? Math.min(retryCount + 1, GENERATION_MAX_RETRIES)
          : retryCount,
        updatedAt: now,
      });
      if (retryCount < GENERATION_MAX_RETRIES) {
        await ctx.scheduler.runAfter(
          BACKGROUND_GENERATION_RETRY_MS,
          internal.liveQuiz.generateLiveQuizQuestions,
          { roomId: args.roomId },
        );
        await ctx.scheduler.runAfter(
          GENERATION_WATCHDOG_MS,
          internal.liveQuiz.markGenerationTimedOut,
          { roomId: args.roomId, questionIndex },
        );
        return { retrying: true, retryCount: retryCount + 1 };
      }
      if (isWaitingForNextQuestion) {
        await ctx.db.patch(args.roomId, {
          status: "finished",
          error: args.error,
          generationRetryCount: 0,
          endedAt: now,
          updatedAt: now,
          phaseStartedAt: now,
        });
        return { finishedEarly: true };
      }
      return { failed: true };
    }

    await ctx.db.patch(args.roomId, {
      error: args.error,
      updatedAt: now,
    });
    return { failed: true };
  },
});

export const markGenerationTimedOut = internalMutation({
  args: {
    roomId: v.id("liveQuizRooms"),
    questionIndex: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room || room.status !== "generating") return { skipped: true };
    const questionIndex = args.questionIndex ?? room.currentQuestionIndex;
    if (questionIndex < room.questions.length) return { skipped: true };

    const now = Date.now();
    const error = "Question generation took too long. Please try again.";
    if (room.questions.length === 0) {
      const retryCount = room.generationRetryCount ?? 0;
      if (retryCount < GENERATION_MAX_RETRIES) {
        await ctx.db.patch(args.roomId, {
          error,
          generationRetryCount: retryCount + 1,
          updatedAt: now,
          phaseStartedAt: now,
        });
        await ctx.scheduler.runAfter(
          BACKGROUND_GENERATION_RETRY_MS,
          internal.liveQuiz.generateLiveQuizQuestions,
          { roomId: args.roomId },
        );
        await ctx.scheduler.runAfter(
          GENERATION_WATCHDOG_MS,
          internal.liveQuiz.markGenerationTimedOut,
          { roomId: args.roomId, questionIndex },
        );
        return { retrying: true, retryCount: retryCount + 1 };
      }

      await ctx.db.patch(args.roomId, {
        status: "lobby",
        error,
        generationRetryCount: 0,
        updatedAt: now,
        phaseStartedAt: now,
      });
      return { timedOut: true };
    }

    const retryCount = room.generationRetryCount ?? 0;
    if (retryCount < GENERATION_MAX_RETRIES) {
      await ctx.db.patch(args.roomId, {
        error,
        generationRetryCount: retryCount + 1,
        updatedAt: now,
        phaseStartedAt: now,
      });
      await ctx.scheduler.runAfter(
        BACKGROUND_GENERATION_RETRY_MS,
        internal.liveQuiz.generateLiveQuizQuestions,
        { roomId: args.roomId },
      );
      await ctx.scheduler.runAfter(
        GENERATION_WATCHDOG_MS,
        internal.liveQuiz.markGenerationTimedOut,
        { roomId: args.roomId, questionIndex },
      );
      return { retrying: true, retryCount: retryCount + 1 };
    }

    await ctx.db.patch(args.roomId, {
      status: "finished",
      error,
      generationRetryCount: 0,
      endedAt: now,
      updatedAt: now,
      phaseStartedAt: now,
    });
    return { finishedEarly: true };
  },
});

export const showAnswerReveal = internalMutation({
  args: {
    roomId: v.id("liveQuizRooms"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room || room.status !== "question") return { skipped: true };

    const now = Date.now();
    await ctx.db.patch(args.roomId, {
      status: "answer_reveal",
      phaseStartedAt: now,
      updatedAt: now,
    });
    await ctx.scheduler.runAfter(
      ANSWER_REVEAL_MS,
      internal.liveQuiz.showLeaderboardBreak,
      { roomId: args.roomId },
    );
    return { status: "answer_reveal" };
  },
});

export const showLeaderboardBreak = internalMutation({
  args: {
    roomId: v.id("liveQuizRooms"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room || room.status !== "answer_reveal") return { skipped: true };

    const now = Date.now();
    await ctx.db.patch(args.roomId, {
      status: "leaderboard",
      phaseStartedAt: now,
      updatedAt: now,
    });
    await ctx.scheduler.runAfter(
      LEADERBOARD_MS,
      internal.liveQuiz.advanceLiveQuiz,
      { roomId: args.roomId },
    );
    return { status: "leaderboard" };
  },
});

export const advanceLiveQuiz = internalMutation({
  args: {
    roomId: v.id("liveQuizRooms"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room || room.status !== "leaderboard") return { skipped: true };

    const now = Date.now();
    const nextIndex = room.currentQuestionIndex + 1;
    if (nextIndex >= room.questionCount) {
      await ctx.db.patch(args.roomId, {
        status: "finished",
        endedAt: now,
        phaseStartedAt: now,
        updatedAt: now,
      });
      return { status: "finished" };
    }

    if (nextIndex >= room.questions.length) {
      await ctx.db.patch(args.roomId, {
        status: "generating",
        currentQuestionIndex: nextIndex,
        phaseStartedAt: now,
        error: null,
        generationRetryCount: 0,
        updatedAt: now,
      });
      await ctx.scheduler.runAfter(
        0,
        internal.liveQuiz.generateLiveQuizQuestions,
        { roomId: args.roomId },
      );
      await ctx.scheduler.runAfter(
        GENERATION_WATCHDOG_MS,
        internal.liveQuiz.markGenerationTimedOut,
        { roomId: args.roomId, questionIndex: nextIndex },
      );
      return { status: "generating", currentQuestionIndex: nextIndex };
    }

    await ctx.db.patch(args.roomId, {
      status: "question",
      currentQuestionIndex: nextIndex,
      phaseStartedAt: now,
      updatedAt: now,
    });
    await ctx.scheduler.runAfter(
      room.secondsPerQuestion * 1000,
      internal.liveQuiz.showAnswerReveal,
      { roomId: args.roomId },
    );
    return { status: "question", currentQuestionIndex: nextIndex };
  },
});

export const finishLiveQuizRoom = internalMutation({
  args: {
    roomId: v.id("liveQuizRooms"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.roomId, {
      status: "finished",
      endedAt: now,
      phaseStartedAt: now,
      updatedAt: now,
    });
    return { status: "finished" };
  },
});
