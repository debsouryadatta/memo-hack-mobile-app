import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// 12:01 AM IST is 6:31 PM UTC on the previous UTC day.
crons.daily(
  "generate daily quiz",
  { hourUTC: 18, minuteUTC: 31 },
  internal.dailyQuiz.generateDailyQuiz,
);

export default crons;
