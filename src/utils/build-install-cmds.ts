import { join } from "node:path";
import type { WizardContext as State } from "../machine.js";
import type { PM } from "./detect-pm.js";

export type Cmd = {
  pm: PM;
  // First entry is the dlx-style runner (e.g. "npx", "pnpm", "yarn", "bunx").
  // Remaining entries are the rest of argv.
  argv: string[];
  cwd: string;
};

// Map PM -> dlx prefix as a flat argv head. e.g. pnpm -> ['pnpm','dlx'].
function dlxPrefix(pm: PM): string[] {
  switch (pm) {
    case "npm":
      return ["npx"];
    case "pnpm":
      return ["pnpm", "dlx"];
    case "yarn":
      return ["yarn", "dlx"];
    case "bun":
      return ["bunx"];
  }
}

// Pure: state -> ordered list of subprocesses to run during the install step.
//
// Ordering:
//   1. shadcn init (with or without --preset, depending on presetSource)
//   2. shadcn add <components...> (single invocation, multiple positional args)
//   3. shadcn add <registry-spec>  (one invocation per selected registry)
//   4. (optional) skills add (npx skills@latest add shadcn-ui/ui --skill shadcn)
//
// `cwd` is the directory the user invoked us from. After init, subsequent
// commands target the freshly-created project dir (cwd/<projectName>).
//
// Accepts either a typed `State` or a structural superset (used by tests
// that load this module without importing `State`).
export function buildInstallCmds(
  stateLike: Partial<State> & {
    projectName?: string;
    presetSource?: string;
    presetCode?: string;
    components?: string[];
    registries?: string[];
    customRegistries?: string[];
    installShadcnSkill?: boolean;
  },
  pm: PM | string,
  cwd: string = process.cwd()
): Cmd[] {
  const resolvedPm: PM = pm as PM;
  if (!stateLike.projectName) {
    throw new Error("buildInstallCmds: state.projectName is required");
  }
  const projectName = stateLike.projectName;
  const components = stateLike.components ?? [];
  const registries = stateLike.registries ?? [];
  const customRegistries = stateLike.customRegistries ?? [];

  const projectDir = join(cwd, projectName);
  const dlx = dlxPrefix(resolvedPm);
  const cmds: Cmd[] = [];

  // 1. init
  const initArgs: string[] = [
    "shadcn@latest",
    "init",
    "--name",
    projectName,
    // "--template",
    // "next",
    // "--yes",
    // "--no-monorepo",
  ];
  if (stateLike.presetSource !== "skip" && stateLike.presetCode) {
    initArgs.push("--preset", stateLike.presetCode);
  } else {
    // No preset chosen: use --defaults so shadcn doesn't prompt for base/preset.
    initArgs.push("--defaults");
  }
  cmds.push({ pm: resolvedPm, argv: [...dlx, ...initArgs], cwd });

  // 2. components - one invocation, all components as positional args.
  if (components.length > 0) {
    cmds.push({
      pm: resolvedPm,
      argv: [...dlx, "shadcn@latest", "add", "--yes", ...components],
      cwd: projectDir,
    });
  }

  // 3. registries - one invocation per registry spec.
  const allRegistries = [...registries, ...customRegistries];
  for (const reg of allRegistries) {
    cmds.push({
      pm: resolvedPm,
      argv: [...dlx, "shadcn@latest", "registry", "add", "--yes", reg],
      cwd: projectDir,
    });
  }

  // 4. skills (if requested) - always uses npx, per plan.
  if (stateLike.installShadcnSkill) {
    cmds.push({
      pm: resolvedPm,
      argv: ["npx", "skills@latest", "add", "shadcn-ui/ui", "--skill", "shadcn"],
      cwd: projectDir,
    });
  }

  return cmds;
}

// Backwards-compatible alias for code paths that imported the old name.
export { buildInstallCmds as buildCmds };
