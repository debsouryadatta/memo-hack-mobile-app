import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

function getIstDayKey(timestamp = Date.now()) {
  const istDate = new Date(timestamp + 5.5 * 60 * 60 * 1000);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(istDate.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const dayKey = process.argv[2] ?? getIstDayKey();

const args = {
  dayKey,
  questions: [
    {
      subject: "physics",
      question:
        "A body of mass 2 kg is moving with a speed of 3 m/s. What is its kinetic energy?",
      options: ["3 J", "6 J", "9 J", "18 J"],
      correctOptionIndex: 2,
      explanation:
        "Kinetic energy is KE = 1/2 mv^2. Substituting m = 2 kg and v = 3 m/s gives KE = 1/2 x 2 x 9 = 9 J.",
    },
    {
      subject: "chemistry",
      question:
        "Which quantum number primarily determines the energy level or shell of an electron in an atom?",
      options: [
        "Principal quantum number",
        "Azimuthal quantum number",
        "Magnetic quantum number",
        "Spin quantum number",
      ],
      correctOptionIndex: 0,
      explanation:
        "The principal quantum number n specifies the main shell and is the primary factor deciding the electron's energy level.",
    },
    {
      subject: "biology",
      question:
        "In human blood, which cells are chiefly responsible for transporting oxygen?",
      options: ["Platelets", "Red blood cells", "White blood cells", "Plasma cells"],
      correctOptionIndex: 1,
      explanation:
        "Red blood cells contain haemoglobin, which binds oxygen in the lungs and transports it to body tissues.",
    },
  ],
};

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(scriptDir, "..");

const result = spawnSync(
  "pnpm",
  [
    "exec",
    "convex",
    "run",
    "--push",
    "dailyQuiz:storeGeneratedQuestions",
    JSON.stringify(args),
  ],
  {
    cwd: packageDir,
    stdio: "inherit",
  },
);

process.exit(result.status ?? 1);
