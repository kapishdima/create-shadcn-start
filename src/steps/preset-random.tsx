import React, { useMemo, useState } from "react";
import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import {
  encodePreset,
  generateRandomConfig,
} from "../vendored/shadcn-preset.js";
import { openUrl } from "../utils/open-url.js";

export type PresetRandomProps = {
  onSubmit: (code: string) => void;
};

type Action = "accept" | "reroll" | "open";

const ACTIONS: { label: string; value: Action }[] = [
  { label: "Accept", value: "accept" },
  { label: "Re-roll", value: "reroll" },
  { label: "Open preview in browser", value: "open" },
];

function previewUrl(code: string): string {
  return `https://ui.shadcn.com/create?preset=${code}`;
}

export function PresetRandom({ onSubmit }: PresetRandomProps) {
  const initial = useMemo(() => encodePreset(generateRandomConfig()), []);
  const [code, setCode] = useState<string>(initial);
  const [openError, setOpenError] = useState<string | null>(null);

  const handleSelect = (item: { value: Action }) => {
    if (item.value === "accept") {
      onSubmit(code);
      return;
    }
    if (item.value === "reroll") {
      setCode(encodePreset(generateRandomConfig()));
      setOpenError(null);
      return;
    }
    if (item.value === "open") {
      openUrl(previewUrl(code)).catch((e) => {
        setOpenError(e instanceof Error ? e.message : String(e));
      });
    }
  };

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold>Random preset</Text>
      <Box marginTop={1} flexDirection="column">
        <Text>Code: <Text color="cyan">{code}</Text></Text>
        <Text>Preview: <Text color="gray">{previewUrl(code)}</Text></Text>
      </Box>
      <Box marginTop={1}>
        <SelectInput items={ACTIONS} onSelect={handleSelect} />
      </Box>
      {openError ? (
        <Box marginTop={1}>
          <Text color="red">Could not open browser: {openError}</Text>
        </Box>
      ) : null}
    </Box>
  );
}
