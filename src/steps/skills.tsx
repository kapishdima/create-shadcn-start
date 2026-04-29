import React from "react";
import { Box, Text } from "ink";
import SelectInput from "ink-select-input";

export type SkillsProps = {
  initial?: boolean;
  onSubmit: (installShadcnSkill: boolean) => void;
};

const ITEMS = [
  { label: "Yes - install the shadcn agent skill", value: "yes" as const },
  { label: "No - skip", value: "no" as const },
];

export function Skills({ initial = true, onSubmit }: SkillsProps) {
  const initialIndex = initial ? 0 : 1;

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold>Agent skill</Text>
      <Text color="gray">
        Install the shadcn agent skill for Claude Code / Cursor / etc.?
      </Text>
      <Box marginTop={1}>
        <SelectInput
          items={ITEMS}
          initialIndex={initialIndex}
          onSelect={(item) => onSubmit(item.value === "yes")}
        />
      </Box>
    </Box>
  );
}
