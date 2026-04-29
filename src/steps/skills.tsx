import React from "react";
import SelectInput from "ink-select-input";
import { StepShell } from "../components/StepShell.js";

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
    <StepShell
      title="Agent skill"
      subtitle="Install the shadcn agent skill for Claude Code / Cursor / etc.?"
    >
      <SelectInput
        items={ITEMS}
        initialIndex={initialIndex}
        onSelect={(item) => onSubmit(item.value === "yes")}
      />
    </StepShell>
  );
}
