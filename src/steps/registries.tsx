import React, { useState } from "react";
import { Box, Text } from "ink";
import MultiSelectImport, { type MultiSelectProps } from "ink-multi-select";
import TextInput from "ink-text-input";
import registriesData from "../data/registries.json" with { type: "json" };

// See note in components.tsx - cast around the old-style class declaration.
const MultiSelect = MultiSelectImport as unknown as React.FC<MultiSelectProps>;

export type RegistryEntry = {
  id: string;
  name: string;
  description: string;
  url: string;
};

export type RegistriesProps = {
  onSubmit: (selectedUrls: string[], customRegistries: string[]) => void;
};

const ALL: RegistryEntry[] = registriesData as RegistryEntry[];
const PASTE_VALUE = "__paste__";

type Mode = "select" | "paste";

export function Registries({ onSubmit }: RegistriesProps) {
  const [mode, setMode] = useState<Mode>("select");
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [customRegistries, setCustomRegistries] = useState<string[]>([]);
  const [pasteValue, setPasteValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const items = [
    ...ALL.map((r) => ({ label: `${r.name} - ${r.description}`, value: r.url, key: r.id })),
    { label: "Paste registry URL", value: PASTE_VALUE, key: PASTE_VALUE },
  ];

  const handleSubmit = (selected: { value: React.Key }[]) => {
    const values = selected.map((s) => String(s.value));
    const wantsPaste = values.includes(PASTE_VALUE);
    const urls = values.filter((v) => v !== PASTE_VALUE);
    setSelectedUrls(urls);
    if (wantsPaste) {
      setMode("paste");
    } else {
      onSubmit(urls, customRegistries);
    }
  };

  const handlePasteSubmit = (v: string) => {
    const trimmed = v.trim();
    if (!trimmed) {
      // Empty: skip and finalize.
      onSubmit(selectedUrls, customRegistries);
      return;
    }
    // Minimal validation: must contain ':' or '/' so it looks like a spec.
    if (!/[:/]/.test(trimmed)) {
      setError("Enter a URL or registry spec, or press Enter to skip.");
      return;
    }
    const updated = [...customRegistries, trimmed];
    setCustomRegistries(updated);
    onSubmit(selectedUrls, updated);
  };

  if (mode === "paste") {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Text bold>Custom registry URL</Text>
        <Text color="gray">
          Paste a registry spec (URL or shadcn-style namespace). Press Enter
          with an empty value to skip.
        </Text>
        <Box marginTop={1}>
          <Text>{"> "}</Text>
          <TextInput
            value={pasteValue}
            onChange={(v) => {
              setPasteValue(v);
              if (error) setError(null);
            }}
            onSubmit={handlePasteSubmit}
            placeholder="https://example.com/r/my-registry.json"
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

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold>Registries</Text>
      <Text color="gray">
        Space to toggle, Enter to confirm. Pick "Paste registry URL" to add
        your own.
      </Text>
      <Box marginTop={1}>
        <MultiSelect items={items} limit={10} onSubmit={handleSubmit} />
      </Box>
    </Box>
  );
}
