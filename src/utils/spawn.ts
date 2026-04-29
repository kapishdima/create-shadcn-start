import { execa } from "execa";
import type { Cmd } from "./build-install-cmds.js";

export type StreamKind = "out" | "err";
export type LineHandler = (line: string, stream: StreamKind) => void;

// Run a single Cmd to completion, streaming stdout/stderr line-by-line into
// the provided handler. Resolves with the exit code; never throws on a
// non-zero exit (the caller decides whether to halt).
export async function runCmd(
  cmd: Cmd,
  onLine: LineHandler
): Promise<{ exitCode: number }> {
  if (cmd.argv.length === 0) {
    throw new Error("runCmd: empty argv");
  }
  const [bin, ...args] = cmd.argv;

  const sub = execa(bin, args, {
    cwd: cmd.cwd,
    stdio: ["ignore", "pipe", "pipe"],
    reject: false,
    env: { ...process.env, FORCE_COLOR: "0" },
  });

  const stream = (kind: StreamKind, data: NodeJS.ReadableStream | null) => {
    if (!data) return;
    let buf = "";
    data.setEncoding("utf8");
    data.on("data", (chunk: string) => {
      buf += chunk;
      let idx = buf.indexOf("\n");
      while (idx !== -1) {
        const line = buf.slice(0, idx).replace(/\r$/, "");
        if (line.length > 0) onLine(line, kind);
        buf = buf.slice(idx + 1);
        idx = buf.indexOf("\n");
      }
    });
    data.on("end", () => {
      const tail = buf.replace(/\r$/, "");
      if (tail.length > 0) onLine(tail, kind);
    });
  };

  stream("out", sub.stdout);
  stream("err", sub.stderr);

  const result = await sub;
  return { exitCode: result.exitCode ?? 0 };
}
