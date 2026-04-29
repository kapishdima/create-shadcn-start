import React from "react";
import { MultiSelect } from "@inkjs/ui";
import componentsData from "../data/components.json" with { type: "json" };
import { StepShell } from "../components/StepShell.js";

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
  const options = ALL.map((c) => ({ label: c.name, value: c.name }));

  const defaultValue =
    initial && initial.length > 0
      ? initial
      : ALL.filter((c) => c.default).map((c) => c.name);

  return (
    <StepShell
      title="Components"
      subtitle="Space to toggle, Enter to confirm. Defaults pre-checked."
    >
      <MultiSelect
        options={options}
        defaultValue={defaultValue}
        visibleOptionCount={12}
        onSubmit={onSubmit}
      />
    </StepShell>
  );
}
