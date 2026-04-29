import React from "react";
import { Box, Text, useInput } from "ink";
import type { PM } from "../utils/detect-pm.js";
import { theme } from "../theme.js";

export type DoneProps = {
  projectName: string;
  pm: PM;
  onExit: () => void;
  projectDir?: string;
};

function devCommand(pm: PM): string {
  switch (pm) {
    case "npm":
      return "npm run dev";
    case "pnpm":
      return "pnpm dev";
    case "yarn":
      return "yarn dev";
    case "bun":
      return "bun dev";
  }
}

export function Done({ projectName, pm, onExit, projectDir }: DoneProps) {
  useInput((_input, key) => {
    if (key.return) onExit();
  });

  const dir = projectDir ?? projectName;

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text>
        Project ready at <Text color={theme.success}>{dir}</Text>
      </Text>
      <Box borderStyle="round" paddingX={1} flexDirection="column" marginTop={1}>
        <Text>cd {projectName}</Text>
        <Text>{devCommand(pm)}</Text>
      </Box>
    </Box>
  );
}
