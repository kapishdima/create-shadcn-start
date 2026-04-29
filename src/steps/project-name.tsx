import React, { useState } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import { StepShell } from "../components/StepShell.js";
import { ErrorBanner } from "../components/ErrorBanner.js";
import { validateProjectName } from "../utils/validate-project-name.js";

export type ProjectNameProps = {
  initialValue?: string;
  cwd?: string;
  onSubmit: (name: string) => void;
};

export function ProjectName({ initialValue, cwd, onSubmit }: ProjectNameProps) {
  const workingCwd = cwd ?? process.cwd();
  const [value, setValue] = useState(initialValue ?? "");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (v: string) => {
    const err = validateProjectName(v, workingCwd);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    onSubmit(v);
  };

  return (
    <StepShell
      title="Project name"
      subtitle="Used as the directory name. Lowercase kebab-case."
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
          placeholder="my-shadcn-app"
        />
      </Box>
      {error ? <ErrorBanner message={error} /> : null}
    </StepShell>
  );
}
