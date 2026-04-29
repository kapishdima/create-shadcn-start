import React from "react";
import SelectInput from "ink-select-input";
import type { PresetSource } from "../machine.js";
import { StepShell } from "../components/StepShell.js";

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
    <StepShell
      title="Theme preset"
      subtitle="Choose a starting palette and typography."
    >
      <SelectInput
        items={ITEMS}
        initialIndex={initialIndex < 0 ? 0 : initialIndex}
        onSelect={(item) => onSubmit(item.value)}
      />
    </StepShell>
  );
}
