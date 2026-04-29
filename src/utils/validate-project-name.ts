import { existsSync } from "node:fs";
import { join } from "node:path";

const KEBAB_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function validateProjectName(value: string, cwd: string): string | null {
  if (!value) return "Project name is required.";
  if (!KEBAB_RE.test(value)) {
    return "Use lowercase kebab-case: letters, digits, single dashes.";
  }
  if (existsSync(join(cwd, value))) {
    return `Directory ${value} already exists in ${cwd}.`;
  }
  return null;
}
