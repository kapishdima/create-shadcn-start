import React, { useState } from "react";
import { TextInput } from "../components/ui/text-input.js";
import { Alert } from "../components/ui/alert.js";
import { StepShell } from "../components/StepShell.js";
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
    <StepShell>
      <TextInput
        autoFocus
        id="project-name"
        value={value}
        onChange={(v) => {
          setValue(v);
          if (error) setError(null);
        }}
        onSubmit={handleSubmit}
        placeholder="my-shadcn-app"
        bordered={false}
      />
      {error ? <Alert variant="error">{error}</Alert> : null}
    </StepShell>
  );
}
