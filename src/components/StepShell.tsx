import React from "react";
import { Box, Text } from "ink";
import { theme } from "../theme.js";

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function StepShell({ title, subtitle, children }: Props) {
  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold>{title}</Text>
      {subtitle ? <Text color={theme.subtle}>{subtitle}</Text> : null}
      <Box marginTop={1} flexDirection="column">
        {children}
      </Box>
    </Box>
  );
}
