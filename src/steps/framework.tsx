import React from "react";
import SelectInput from "ink-select-input";
import type { FrameworkTemplate } from "../machine.js";
import { StepShell } from "../components/StepShell.js";

export type FrameworkProps = {
  initial?: FrameworkTemplate;
  onSubmit: (framework: FrameworkTemplate) => void;
};

const ITEMS: { key: string; label: string; value: FrameworkTemplate }[] = [
  { key: "next", label: "Next.js", value: "next" },
  { key: "vite", label: "Vite", value: "vite" },
  { key: "tanstack-start", label: "TanStack Start", value: "tanstack-start" },
  { key: "astro", label: "Astro", value: "astro" },
  { key: "react-router", label: "React Router", value: "react-router" },
  { key: "skip", label: "Skip - use Next.js (default)", value: "next" },
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
