import React, { useMemo, useState } from "react";
import { Box, Text, useInput, useStdout } from "ink";
import { MultiSelect } from "@inkjs/ui";
import TextInput from "ink-text-input";
import registriesData from "../data/registries.json" with { type: "json" };
import { StepShell } from "../components/StepShell.js";
import { ErrorBanner } from "../components/ErrorBanner.js";
import { theme } from "../theme.js";

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
const VISIBLE_OPTION_COUNT = 18;

type Mode = "select" | "paste";
type Focus = "search" | "list";

function truncateDesc(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 3) + "...";
}

export function Registries({ onSubmit }: RegistriesProps) {
  const { stdout } = useStdout();
  const columns = stdout?.columns ?? 80;

  const [mode, setMode] = useState<Mode>("select");
  const [focus, setFocus] = useState<Focus>("search");
  const [query, setQuery] = useState("");
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [customRegistries, setCustomRegistries] = useState<string[]>([]);
  const [pasteValue, setPasteValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL;
    return ALL.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q),
    );
  }, [query]);

  const options = useMemo(
    () => [
      ...filtered.map((r) => {
        const available = Math.max(20, columns - 2 - 4 - r.name.length - 3 - 2);
        const desc = truncateDesc(r.description, available);
        return {
          label: `${r.name} - ${desc}`,
          value: r.url,
        };
      }),
      { label: "Paste registry URL", value: PASTE_VALUE },
    ],
    [filtered, columns],
  );

  useInput(
    (_input, key) => {
      if (key.tab) {
        setFocus((f) => (f === "search" ? "list" : "search"));
        return;
      }
      if (focus === "search" && key.downArrow) {
        setFocus("list");
      }
    },
    { isActive: mode === "select" },
  );

  const handleChange = (values: string[]) => {
    const urls = values.filter((v) => v !== PASTE_VALUE);
    setSelectedUrls(urls);
  };

  const handleSubmit = (values: string[]) => {
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
      onSubmit(selectedUrls, customRegistries);
      return;
    }
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
      <StepShell
        title="Custom registry URL"
        subtitle="Paste a registry spec (URL or shadcn-style namespace). Press Enter with an empty value to skip."
      >
        <Box>
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
        {error ? <ErrorBanner message={error} /> : null}
      </StepShell>
    );
  }

  const matchCount = filtered.length;
  const total = ALL.length;

  return (
    <StepShell
      title="Registries"
      subtitle="Tab to switch between search and list. Space to toggle, Enter to confirm."
    >
      <Box>
        <Text color={focus === "search" ? theme.active : theme.subtle}>
          {focus === "search" ? "> " : "  "}
        </Text>
        <TextInput
          value={query}
          focus={focus === "search"}
          onChange={setQuery}
          onSubmit={() => setFocus("list")}
          placeholder="Search by name or description..."
        />
      </Box>
      <Box>
        <Text color={theme.subtle}>
          {query.trim()
            ? `${matchCount} of ${total} match`
            : `${total} registries`}
        </Text>
      </Box>
      <Box marginTop={1}>
        <MultiSelect
          key={query}
          options={options}
          defaultValue={selectedUrls}
          visibleOptionCount={VISIBLE_OPTION_COUNT}
          highlightText={query.trim() || undefined}
          isDisabled={focus !== "list"}
          onChange={handleChange}
          onSubmit={handleSubmit}
        />
      </Box>
    </StepShell>
  );
}
