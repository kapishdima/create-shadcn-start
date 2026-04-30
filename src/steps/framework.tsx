import React from "react";
import SelectInput from "ink-select-input";
import type { FrameworkTemplate } from "../machine.js";
import { StepShell } from "../components/StepShell.js";

export type FrameworkProps = {
  initial?: FrameworkTemplate;
  onSubmit: (framework: FrameworkTemplate) => void;
};

const ITEMS: { label: string; value: FrameworkTemplate }[] = [
  { label: "Next.js", value: "next" },
  { label: "Vite", value: "vite" },
  { label: "TanStack Start", value: "tanstack-start" },
  { label: "Astro", value: "astro" },
  { label: "React Router", value: "react-router" },
  { label: "Skip - use Next.js (default)", value: "next" },
];

export function Framework({ initial, onSubmit }: FrameworkProps) {
  const initialIndex = initial ? ITEMS.findIndex((i) => i.value === initial) : 0;

  return (
    <StepShell>
      <SelectInput
        items={ITEMS}
        initialIndex={initialIndex < 0 ? 0 : initialIndex}
        onSelect={(item) => onSubmit(item.value)}
      />
    </StepShell>
  );
}
