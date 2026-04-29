import React from "react";
import { Box, Text, useStdout } from "ink";
import Spinner from "ink-spinner";
import { StepShell } from "../components/StepShell.js";

export type InstallProps = {
  current?: number;
  total?: number;
  label?: string;
  lastLine?: string;
};

export function Install({ current, total, label, lastLine }: InstallProps) {
  const { stdout } = useStdout();
  const columns = stdout?.columns ?? 80;

  const truncated =
    lastLine && lastLine.length > columns - 2
      ? lastLine.slice(0, columns - 5) + "..."
      : lastLine;

  return (
    <StepShell title="Installing">
      <Box>
        <Text color="cyan">
          <Spinner type="dots" />
        </Text>
        <Text>
          {" "}
          [{current ?? "?"}/{total ?? "?"}] {label ?? ""}
        </Text>
      </Box>
      {truncated ? <Text dimColor>{truncated}</Text> : null}
    </StepShell>
  );
}
