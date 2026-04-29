import React, { useState } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import { existsSync } from "node:fs";
import { join } from "node:path";

const KEBAB_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export type ProjectNameProps = {
  initialValue?: string;
  cwd?: string;
  onSubmit: (name: string) => void;
};

function validate(value: string, cwd: string): string | null {
  if (!value) return "Project name is required.";
  if (!KEBAB_RE.test(value)) {
    return "Use lowercase kebab-case: letters, digits, single dashes.";
  }
  if (existsSync(join(cwd, value))) {
    return `Directory ${value} already exists in ${cwd}.`;
  }
  return null;
}

export function ProjectName({ initialValue, cwd, onSubmit }: ProjectNameProps) {
  const workingCwd = cwd ?? process.cwd();
  const [value, setValue] = useState(initialValue ?? "");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (v: string) => {
    const err = validate(v, workingCwd);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    onSubmit(v);
  };

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold>Project name</Text>
      <Text color="gray">Used as the directory name. Lowercase kebab-case.</Text>
      <Box marginTop={1}>
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
      {error ? (
        <Box marginTop={1}>
          <Text color="red">Error: {error}</Text>
        </Box>
      ) : null}
    </Box>
  );
}
