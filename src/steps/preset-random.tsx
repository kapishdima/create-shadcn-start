import React, { useMemo, useState } from "react";
import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import {
  encodePreset,
  generateRandomConfig,
} from "shadcn/preset";
import { openUrl } from "../utils/open-url.js";
import { StepShell } from "../components/StepShell.js";
import { ErrorBanner } from "../components/ErrorBanner.js";
import { theme } from "../theme.js";

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
    <StepShell title="Random preset">
      <Box flexDirection="column">
        <Text>
          Code: <Text color={theme.active}>{code}</Text>
        </Text>
        <Text>
          Preview: <Text color={theme.subtle}>{previewUrl(code)}</Text>
        </Text>
      </Box>
      <Box marginTop={1}>
        <SelectInput items={ACTIONS} onSelect={handleSelect} />
      </Box>
      {openError ? (
        <ErrorBanner message={`Could not open browser: ${openError}`} />
      ) : null}
    </StepShell>
  );
}
