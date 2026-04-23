import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// 5:00 AM IST is 11:30 PM UTC on the previous UTC day.
crons.daily(
  "generate daily quiz",
  { hourUTC: 23, minuteUTC: 30 },
  internal.dailyQuiz.generateDailyQuiz,
);

export default crons;
