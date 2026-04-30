import React from "react";
import { Box, Text } from "ink";
import { useTheme } from "./theme-provider.js";

export function Welcome() {
  const theme = useTheme();
  return (
    <Box marginBottom={1} paddingLeft={2}>
      <Text color={theme.colors.primary}>{"╱╱ "}</Text>
      <Text bold>shadcn/ui</Text>
      <Text color={theme.colors.mutedForeground} dimColor>
        {"  ·  create-shadcn-start"}
      </Text>
    </Box>
  );
}
