import React, { useMemo, useState } from "react";
import { useStdout } from "ink";
import registriesData from "../data/registries.json" with { type: "json" };
import { StepShell } from "../components/StepShell.js";
import { MultiSelectStep } from "../components/MultiSelectStep.js";
import { TextInput } from "../components/ui/text-input.js";
import { Alert } from "../components/ui/alert.js";

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
const ROW_CHROME = 8;
const NAME_DESC_SEP = "  ";

type Mode = "select" | "paste";

function truncate(text: string, max: number): string {
  if (max <= 1) return "";
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + "…";
}

export function Registries({ onSubmit }: RegistriesProps) {
  const { stdout } = useStdout();
  const columns = stdout?.columns ?? 80;

  const [mode, setMode] = useState<Mode>("select");
  const [pasteValue, setPasteValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingUrls, setPendingUrls] = useState<string[]>([]);

  const options = useMemo(() => {
    const maxName = ALL.reduce((m, r) => Math.max(m, r.name.length), 0);
    const descBudget = Math.max(
      10,
      columns - ROW_CHROME - maxName - NAME_DESC_SEP.length,
    );
    return [
      ...ALL.map((r) => ({
        value: r.url,
        label: `${r.name.padEnd(maxName, " ")}${NAME_DESC_SEP}${truncate(
          r.description,
          descBudget,
        )}`,
      })),
      { value: PASTE_VALUE, label: "Paste registry URL" },
    ];
  }, [columns]);

  const handleSubmit = (values: string[]) => {
    const wantsPaste = values.includes(PASTE_VALUE);
    const urls = values.filter((v) => v !== PASTE_VALUE);
    setPendingUrls(urls);
    if (wantsPaste) {
      setMode("paste");
    } else {
      onSubmit(urls, []);
    }
  };

  const handlePasteSubmit = (v: string) => {
    const trimmed = v.trim();
    if (!trimmed) {
      onSubmit(pendingUrls, []);
      return;
    }
    if (!/[:/]/.test(trimmed)) {
      setError("Enter a URL or registry spec, or press Enter to skip.");
      return;
    }
    onSubmit(pendingUrls, [trimmed]);
  };

  if (mode === "paste") {
    return (
      <StepShell>
        <TextInput
          autoFocus
          id="registries-paste"
          value={pasteValue}
          onChange={(v) => {
            setPasteValue(v);
            if (error) setError(null);
          }}
          onSubmit={handlePasteSubmit}
          placeholder="https://example.com/r/my-registry.json"
        />
        {error ? <Alert variant="error">{error}</Alert> : null}
      </StepShell>
    );
  }

  return (
    <StepShell>
      <MultiSelectStep
        options={options}
        searchable
        searchPlaceholder="Search by name or description..."
        visibleCount={VISIBLE_OPTION_COUNT}
        onSubmit={handleSubmit}
      />
    </StepShell>
  );
}
