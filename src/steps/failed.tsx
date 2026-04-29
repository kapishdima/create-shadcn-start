import React from "react";
import { Box, Text, useInput } from "ink";
import { StepShell } from "../components/StepShell.js";
import { ErrorBanner } from "../components/ErrorBanner.js";

export type FailedProps = {
  exitCode: number;
  failedCmdLabel: string;
  tail: string[];
  onExit: () => void;
};

export function Failed({ exitCode, failedCmdLabel, tail, onExit }: FailedProps) {
  useInput((_input, key) => {
    if (key.return) onExit();
  });

  return (
    <StepShell title="Install failed">
      <ErrorBanner message={`${failedCmdLabel} (exit ${exitCode})`} />
      {tail.length > 0 ? (
        <Box
          borderStyle="round"
          paddingX={1}
          flexDirection="column"
          marginTop={1}
        >
          {tail.map((line, i) => (
            <Text key={i} dimColor>
              {line}
            </Text>
          ))}
        </Box>
      ) : null}
    </StepShell>
  );
}
