import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import type { State } from "../state.js";
import type { PM } from "../utils/detect-pm.js";
import { buildInstallCmds, type Cmd } from "../utils/build-install-cmds.js";
import { runCmd } from "../utils/spawn.js";

const LINE_BUFFER_SIZE = 10;

export type InstallProps = {
  state: State;
  pm: PM;
  cwd?: string;
  onDone: (success: boolean) => void;
};

type Phase =
  | { kind: "running"; index: number; total: number }
  | { kind: "succeeded" }
  | { kind: "failed"; index: number; exitCode: number };

function describeCmd(cmd: Cmd): string {
  return cmd.argv.join(" ");
}

export function Install({ state, pm, cwd, onDone }: InstallProps) {
  const [cmds] = useState<Cmd[]>(() => buildInstallCmds(state, pm, cwd));
  const [phase, setPhase] = useState<Phase>({
    kind: "running",
    index: 0,
    total: cmds.length,
  });
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (let i = 0; i < cmds.length; i++) {
        if (cancelled) return;
        setPhase({ kind: "running", index: i, total: cmds.length });
        setLines([]);
        const result = await runCmd(cmds[i], (line) => {
          if (cancelled) return;
          setLines((prev) => {
            const next = [...prev, line];
            if (next.length > LINE_BUFFER_SIZE) {
              return next.slice(next.length - LINE_BUFFER_SIZE);
            }
            return next;
          });
        });
        if (result.exitCode !== 0) {
          if (cancelled) return;
          setPhase({ kind: "failed", index: i, exitCode: result.exitCode });
          onDone(false);
          return;
        }
      }
      if (cancelled) return;
      setPhase({ kind: "succeeded" });
      onDone(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold>Installing</Text>
      {phase.kind === "running" ? (
        <Box flexDirection="column" marginTop={1}>
          <Text>
            <Text color="cyan"><Spinner type="dots" /></Text>
            {"  "}
            Step {phase.index + 1} of {phase.total}: {describeCmd(cmds[phase.index])}
          </Text>
          <Box flexDirection="column" marginTop={1}>
            {lines.map((l, i) => (
              <Text key={i} color="gray">
                {l}
              </Text>
            ))}
          </Box>
        </Box>
      ) : null}
      {phase.kind === "succeeded" ? (
        <Box marginTop={1}>
          <Text color="green">All steps completed.</Text>
        </Box>
      ) : null}
      {phase.kind === "failed" ? (
        <Box flexDirection="column" marginTop={1}>
          <Text color="red">
            Error: step {phase.index + 1} exited with code {phase.exitCode}.
          </Text>
          <Text color="gray">Command: {describeCmd(cmds[phase.index])}</Text>
        </Box>
      ) : null}
    </Box>
  );
}
