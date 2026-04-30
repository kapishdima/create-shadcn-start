import React from "react";
import componentsData from "../data/components.json" with { type: "json" };
import { StepShell } from "../components/StepShell.js";
import { MultiSelectStep } from "../components/MultiSelectStep.js";

export type ComponentEntry = {
  name: string;
  description: string;
  default: boolean;
};

export type ComponentsProps = {
  initial?: string[];
  onSubmit: (selected: string[]) => void;
};

const ALL: ComponentEntry[] = componentsData as ComponentEntry[];

export function Components({ initial, onSubmit }: ComponentsProps) {
  const options = ALL.map((c) => ({
    value: c.name,
    label: c.name,
    hint: c.description,
  }));

  const defaultSelected =
    initial && initial.length > 0
      ? initial
      : ALL.filter((c) => c.default).map((c) => c.name);

  return (
    <StepShell>
      <MultiSelectStep
        options={options}
        defaultSelected={defaultSelected}
        visibleCount={12}
        enableToggleAll
        onSubmit={onSubmit}
      />
    </StepShell>
  );
}
