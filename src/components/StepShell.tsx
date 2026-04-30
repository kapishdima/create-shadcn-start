import React from "react";
import { Box } from "ink";

type Props = {
  children: React.ReactNode;
};

export function StepShell({ children }: Props) {
  return (
    <Box flexDirection="column">
      {children}
    </Box>
  );
}
