import React from "react";
import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import presets from "../data/presets.json" with { type: "json" };
import { swatch } from "../utils/swatch.js";

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
  // chalk-rendered label - ink renders strings with ANSI sequences as-is.
  const chips = p.swatch.map((c) => swatch(c, 2)).join("");
  // pad name for column alignment
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
    <Box flexDirection="column" paddingX={1}>
      <Text bold>Curated presets</Text>
      <Text color="gray">
        Up/Down to browse, Enter to confirm. Swatches are bg / surface / accent / ink.
      </Text>
      <Box marginTop={1}>
        <SelectInput
          items={items}
          limit={10}
          onSelect={(item) => onSubmit(item.value)}
        />
      </Box>
    </Box>
  );
}
