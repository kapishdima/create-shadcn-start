import React from "react";
import { Box, Text, useInput } from "ink";

export const VERSION = "0.0.0";

const BANNER = [
  "  _____   _                 _              ",
  " / ____| | |               | |             ",
  "| (___   | |__    __ _   __| |  ___  _ __  ",
  " \\___ \\  | '_ \\  / _` | / _` | / __|| '_ \\ ",
  " ____) | | | | || (_| || (_| || (__ | | | |",
  "|_____/  |_| |_| \\__,_| \\__,_| \\___||_| |_|",
];

export type WelcomeProps = {
  onAdvance: () => void;
};

export function Welcome({ onAdvance }: WelcomeProps) {
  useInput((_input, key) => {
    if (key.return) onAdvance();
  });

  return (
    <Box flexDirection="column" paddingX={1}>
      {BANNER.map((line, i) => (
        <Text key={i} color="cyan">
          {line}
        </Text>
      ))}
      <Box marginTop={1} flexDirection="column">
        <Text>create-shadcn-app v{VERSION}</Text>
        <Text color="gray">Interactive scaffolder for shadcn-based projects.</Text>
      </Box>
      <Box marginTop={1}>
        <Text color="gray">Press Enter to begin.</Text>
      </Box>
    </Box>
  );
}
