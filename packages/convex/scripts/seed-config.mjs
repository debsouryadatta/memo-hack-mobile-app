import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rows = [
  ["mobile_latest_version", "1.0.0"],
  [
    "mobile_android_update_url",
    "https://play.google.com/store/apps/details?id=com.debsouryadatta.memohack",
  ],
  ["mobile_ios_update_url", "https://apps.apple.com/app/memo-hack"],
];

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(scriptDir, "..");

for (const [key, value] of rows) {
  const result = spawnSync(
    "pnpm",
    [
      "exec",
      "convex",
      "run",
      "settings:upsertConfig",
      JSON.stringify({ key, value }),
    ],
    {
      cwd: packageDir,
      stdio: "inherit",
    },
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
