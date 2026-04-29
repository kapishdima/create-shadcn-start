import { existsSync } from "node:fs";
import { join } from "node:path";

export type PM = "npm" | "pnpm" | "yarn" | "bun";

// Detect the active package manager.
//
// Order:
//   1. Parse `npm_config_user_agent` (the canonical signal - set by npm /
//      pnpm / yarn / bun whenever they spawn a child process).
//   2. Fall back to a lockfile inspection in cwd.
//   3. Final fallback: 'npm'.
//
// env and cwd are passed in so the function is pure and testable.
export function detectPm(env: NodeJS.ProcessEnv, cwd: string): PM {
  const ua = env.npm_config_user_agent ?? "";
  if (ua) {
    // user agent looks like e.g. "pnpm/9.0.0 npm/? node/v20.0.0 darwin x64"
    const head = ua.split(" ")[0] ?? "";
    const name = head.split("/")[0] ?? "";
    switch (name) {
      case "pnpm":
        return "pnpm";
      case "yarn":
        return "yarn";
      case "bun":
        return "bun";
      case "npm":
        return "npm";
    }
  }

  if (existsSync(join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(cwd, "yarn.lock"))) return "yarn";
  if (existsSync(join(cwd, "bun.lockb"))) return "bun";
  if (existsSync(join(cwd, "package-lock.json"))) return "npm";

  return "npm";
}
