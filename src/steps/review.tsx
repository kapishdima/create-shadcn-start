import React from "react";
import { Box, Text, useStdout } from "ink";
import SelectInput from "ink-select-input";
import { StepShell } from "../components/StepShell.js";
import { summarizeInitOptions, type WizardContext } from "../machine.js";

export type ReviewProps = {
  ctx: WizardContext;
  onConfirm: () => void;
  onBack: () => void;
};

type SelectItem = { label: string; value: "confirm" | "back" };

const ACTIONS: SelectItem[] = [
  { label: "Looks good - install", value: "confirm" },
  { label: "Go back and edit", value: "back" },
];

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 3) + "...";
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Text dimColor>{label.padEnd(18, " ")}</Text>
      <Text>{value}</Text>
    </Box>
  );
}

export function Review({ ctx, onConfirm, onBack }: ReviewProps) {
  const { stdout } = useStdout();
  const columns = stdout?.columns ?? 80;
  const maxValue = Math.max(20, columns - 22);

  const presetDisplay =
    ctx.presetSource === "skip"
      ? "skip (shadcn defaults)"
      : ctx.presetCode
        ? `${ctx.presetSource} / ${ctx.presetCode}`
        : ctx.presetSource ?? "none";

  const componentsDisplay =
    ctx.components.length === 0
      ? "none"
      : truncate(
          `${ctx.components.length} (${ctx.components.join(", ")})`,
          maxValue
        );

  const allRegistries = [...ctx.registries, ...ctx.customRegistries];
  const registriesDisplay =
    allRegistries.length === 0
      ? "none"
      : truncate(
          `${allRegistries.length} (${allRegistries.join(", ")})`,
          maxValue
        );

  const skillDisplay = ctx.installShadcnSkill ? "yes" : "no";
  const frameworkDisplay = ctx.frameworkTemplate ?? "next";
  const initOptionsDisplay = truncate(
    summarizeInitOptions(ctx.initOptions),
    maxValue,
  );

  return (
    <StepShell>
      <Box flexDirection="column" marginBottom={1}>
        <Row label="Project name" value={ctx.projectName ?? "(not set)"} />
        <Row label="Framework" value={frameworkDisplay} />
        <Row label="Preset" value={truncate(presetDisplay, maxValue)} />
        <Row label="Components" value={componentsDisplay} />
        <Row label="Registries" value={registriesDisplay} />
        <Row label="Shadcn skill" value={skillDisplay} />
        <Row label="Init options" value={initOptionsDisplay} />
      </Box>
      <SelectInput
        items={ACTIONS}
        onSelect={(item) => {
          if (item.value === "confirm") onConfirm();
          else onBack();
        }}
      />
    </StepShell>
  );
}
