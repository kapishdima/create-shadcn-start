import React from "react";
import SelectInput from "ink-select-input";
import presets from "../data/presets.json" with { type: "json" };
import { swatch } from "../utils/swatch.js";
import { StepShell } from "../components/StepShell.js";

export type Preset = {
  name: string;
  description: string;
  code: string;
  swatch: string[];
};

export type PresetCuratedProps = {
  onSubmit: (code: string) => void;
};

const ALL: Preset[] = presets as Preset[];

function renderLabel(p: Preset): string {
  const chips = p.swatch.map((c) => swatch(c, 2)).join("");
  const namePad = p.name.padEnd(14, " ");
  return `${namePad} ${chips}  ${p.description}`;
}

export function PresetCurated({ onSubmit }: PresetCuratedProps) {
  const items = ALL.map((p) => ({
    label: renderLabel(p),
    value: p.code,
    key: p.code,
  }));

  return (
    <StepShell>
      <SelectInput
        items={items}
        limit={10}
        onSelect={(item) => onSubmit(item.value)}
      />
    </StepShell>
  );
}
