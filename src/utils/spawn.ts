import { execa } from "execa";
import { createInterface } from "node:readline";
import type { Cmd } from "./build-install-cmds.js";

const TAIL_SIZE = 20;

export type RunCmdResult = { exitCode: number; tail: string[] };

export async function runCmd(
  cmd: Cmd,
  onLine?: (line: string, stream: "stdout" | "stderr") => void
): Promise<RunCmdResult> {
  if (cmd.argv.length === 0) {
    throw new Error("runCmd: empty argv");
  }
  const [bin, ...args] = cmd.argv;

  const sub = execa(bin, args, {
    cwd: cmd.cwd,
    stdio: ["ignore", "pipe", "pipe"],
    reject: false,
  });

  const tail: string[] = [];

  function pushLine(line: string) {
    tail.push(line);
    if (tail.length > TAIL_SIZE) tail.shift();
  }

  const rlOut = createInterface({ input: sub.stdout!, crlfDelay: Infinity });
  rlOut.on("line", (line) => {
    pushLine(line);
    onLine?.(line, "stdout");
  });

  const rlErr = createInterface({ input: sub.stderr!, crlfDelay: Infinity });
  rlErr.on("line", (line) => {
    pushLine(line);
    onLine?.(line, "stderr");
  });

  const result = await sub;
  return { exitCode: result.exitCode ?? 0, tail };
}
