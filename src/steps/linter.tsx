import React from "react";
import SelectInput from "ink-select-input";
import { StepShell } from "../components/StepShell.js";
import type { Linter } from "../machine.js";

export type LinterProps = {
  initial?: Linter;
  onSubmit: (linter: Linter) => void;
};

const ITEMS: Array<{ label: string; value: Linter }> = [
  { label: "None - skip linter setup", value: "none" },
  { label: "Ultracite - opinionated Biome preset", value: "ultracite" },
  { label: "Biome - fast formatter + linter", value: "biome" },
  { label: "Oxlint - fast Rust-based linter", value: "oxlint" },
];

export function LinterStep({ initial = "none", onSubmit }: LinterProps) {
  const initialIndex = Math.max(
    0,
    ITEMS.findIndex((item) => item.value === initial),
  );

  return (
    <StepShell>
      <SelectInput
        items={ITEMS}
        initialIndex={initialIndex}
        onSelect={(item) => onSubmit(item.value)}
      />
    </StepShell>
  );
}
