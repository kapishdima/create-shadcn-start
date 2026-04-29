import { buildInstallCmds } from "./build-install-cmds.js";
import { runCmd } from "./spawn.js";
import type { WizardContext } from "../machine.js";

export type InstallResult =
  | { ok: true }
  | { ok: false; exitCode: number; failedCmdLabel: string };

export function deriveCmdLabel(argv: string[]): string {
  if (argv.includes("init")) return "shadcn init";
  const addIdx = argv.indexOf("add");
  if (addIdx >= 0) {
    const positionals = argv
      .slice(addIdx + 1)
      .filter((a) => !a.startsWith("-"));
    if (positionals.length > 0) {
      const first = positionals[0];
      if (first.startsWith("@") || first.includes("://")) {
        return `shadcn add ${first}`;
      }
      return `shadcn add ${positionals.join(", ")}`;
    }
    return "shadcn add";
  }
  if (argv[0] === "npx" && argv.includes("skills")) {
    return "skills add shadcn-ui/ui";
  }
  return argv.slice(0, 3).join(" ");
}

export async function runInstall(ctx: WizardContext): Promise<InstallResult> {
  const cmds = buildInstallCmds(ctx, ctx.pm, ctx.cwd);
  for (let i = 0; i < cmds.length; i++) {
    const cmd = cmds[i];
    const label = deriveCmdLabel(cmd.argv);
    process.stdout.write(`\n[${i + 1}/${cmds.length}] ${label}\n`);
    const r = await runCmd(cmd);
    if (r.exitCode !== 0) {
      return { ok: false, exitCode: r.exitCode, failedCmdLabel: label };
    }
  }
  return { ok: true };
}
