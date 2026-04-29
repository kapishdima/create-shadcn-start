import React from "react";
import { Box, Text, useInput } from "ink";
import type { PM } from "../utils/detect-pm.js";

export type DoneProps = {
  projectName: string;
  pm: PM;
  onExit: () => void;
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

export function Done({ projectName, pm, onExit }: DoneProps) {
  useInput((_input, key) => {
    if (key.return) onExit();
  });

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold color="green">Done.</Text>
      <Box marginTop={1} flexDirection="column">
        <Text>Next steps:</Text>
        <Text>  cd {projectName}</Text>
        <Text>  {devCommand(pm)}</Text>
      </Box>
      <Box marginTop={1}>
        <Text color="gray">Press Enter to exit.</Text>
      </Box>
    </Box>
  );
}
