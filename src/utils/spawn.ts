import { execa } from "execa";
import type { Cmd } from "./build-install-cmds.js";

export type RunCmdResult = { exitCode: number };

export async function runCmd(cmd: Cmd): Promise<RunCmdResult> {
  if (cmd.argv.length === 0) {
    throw new Error("runCmd: empty argv");
  }
  const [bin, ...args] = cmd.argv;

  const sub = execa(bin, args, {
    cwd: cmd.cwd,
    stdio: "inherit",
    reject: false,
  });

  const result = await sub;
  return { exitCode: result.exitCode ?? 0 };
}
