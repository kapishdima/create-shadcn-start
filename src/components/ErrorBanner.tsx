import React from "react";
import { Box, Text } from "ink";
import { theme } from "../theme.js";

type Props = { message: string };

export function ErrorBanner({ message }: Props) {
  return (
    <Box marginTop={1}>
      <Text color={theme.error}>Error: {message}</Text>
    </Box>
  );
}
