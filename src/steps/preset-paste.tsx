import React, { useState } from "react";
import { useInput } from "ink";
import { isPresetCode } from "shadcn/preset";
import { openUrl } from "../utils/open-url.js";
import { TextInput } from "../components/ui/text-input.js";
import { Alert } from "../components/ui/alert.js";
import { StepShell } from "../components/StepShell.js";

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
    <StepShell>
      <TextInput
        autoFocus
        id="preset-paste"
        value={value}
        onChange={(v) => {
          setValue(v);
          if (error) setError(null);
        }}
        onSubmit={handleSubmit}
        placeholder="bxyz123"
      />
      {error ? <Alert variant="error">{error}</Alert> : null}
      {openError ? (
        <Alert variant="error">{`Could not open browser: ${openError}`}</Alert>
      ) : null}
    </StepShell>
  );
}
