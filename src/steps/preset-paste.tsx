import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { isPresetCode } from "shadcn/preset";
import { openUrl } from "../utils/open-url.js";
import { StepShell } from "../components/StepShell.js";
import { ErrorBanner } from "../components/ErrorBanner.js";

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
    <StepShell
      title="Paste a preset code"
      subtitle={`Open ${DESIGNER_URL}, design, copy the preset code, paste below. Press 'o' to open the designer.`}
    >
      <Box>
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
      {error ? <ErrorBanner message={error} /> : null}
      {openError ? (
        <ErrorBanner message={`Could not open browser: ${openError}`} />
      ) : null}
    </StepShell>
  );
}
