import React from "react";
import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import type { PresetSource } from "../state.js";

export type PresetChoiceProps = {
  initial?: PresetSource;
  onSubmit: (source: PresetSource) => void;
};

const ITEMS: { label: string; value: PresetSource }[] = [
  { label: "Pick from curated", value: "curated" },
  { label: "Surprise me (random)", value: "random" },
  { label: "Design my own", value: "paste" },
  { label: "Skip - use shadcn defaults", value: "skip" },
];

export function PresetChoice({ initial, onSubmit }: PresetChoiceProps) {
  const initialIndex = initial ? ITEMS.findIndex((i) => i.value === initial) : 0;

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold>Theme preset</Text>
      <Text color="gray">Choose a starting palette and typography.</Text>
      <Box marginTop={1}>
        <SelectInput
          items={ITEMS}
          initialIndex={initialIndex < 0 ? 0 : initialIndex}
          onSelect={(item) => onSubmit(item.value)}
        />
      </Box>
    </Box>
  );
}
