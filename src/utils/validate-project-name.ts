import { existsSync } from "node:fs";
import { join } from "node:path";

export function validateProjectName(value: string, cwd: string): string | null {
  if (!value) return "Project name is required.";

  if (existsSync(join(cwd, value))) {
    return `Directory ${value} already exists in ${cwd}.`;
  }
  return null;
}
