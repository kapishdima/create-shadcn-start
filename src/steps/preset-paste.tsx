import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { isPresetCode } from "../vendored/shadcn-preset.js";
import { openUrl } from "../utils/open-url.js";

const DESIGNER_URL = "https://ui.shadcn.com/create";

export type PresetPasteProps = {
  onSubmit: (code: string) => void;
};

export function PresetPaste({ onSubmit }: PresetPasteProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);

  useInput((input) => {
    if (input === "o" || input === "O") {
      openUrl(DESIGNER_URL).catch((e) => {
        setOpenError(e instanceof Error ? e.message : String(e));
      });
    }
  });

  const handleSubmit = (v: string) => {
    const trimmed = v.trim();
    if (!isPresetCode(trimmed)) {
      setError("That does not look like a valid preset code.");
      return;
    }
    setError(null);
    onSubmit(trimmed);
  };

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold>Paste a preset code</Text>
      <Text color="gray">
        Open {DESIGNER_URL}, design, copy the preset code, paste below.
      </Text>
      <Text color="gray">Press 'o' to open the designer in your browser.</Text>
      <Box marginTop={1}>
        <Text>{"> "}</Text>
        <TextInput
          value={value}
          onChange={(v) => {
            setValue(v);
            if (error) setError(null);
          }}
          onSubmit={handleSubmit}
          placeholder="bxyz123"
        />
      </Box>
      {error ? (
        <Box marginTop={1}>
          <Text color="red">Error: {error}</Text>
        </Box>
      ) : null}
      {openError ? (
        <Box marginTop={1}>
          <Text color="red">Could not open browser: {openError}</Text>
        </Box>
      ) : null}
    </Box>
  );
}
