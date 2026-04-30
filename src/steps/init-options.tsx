import React from "react";
import { StepShell } from "../components/StepShell.js";
import {
  MultiSelectStep,
  type MultiSelectStepOption,
} from "../components/MultiSelectStep.js";
import {
  DEFAULT_INIT_OPTIONS,
  type InitOptions,
} from "../machine.js";

export type InitOptionsProps = {
  initial?: InitOptions;
  onSubmit: (initOptions: InitOptions) => void;
};

type OptionKey = keyof InitOptions;

const OPTIONS: MultiSelectStepOption<OptionKey>[] = [
  { value: "monorepo", label: "monorepo", hint: "default: no" },
  { value: "pointer", label: "pointer (button cursor)", hint: "default: no" },
  { value: "rtl", label: "rtl", hint: "default: no" },
  { value: "srcDir", label: "src directory", hint: "default: no" },
  { value: "cssVariables", label: "css variables", hint: "default: yes" },
  { value: "baseStyle", label: "base shadcn style", hint: "default: yes" },
];

function toSelected(opts: InitOptions): OptionKey[] {
  return (Object.keys(opts) as OptionKey[]).filter((k) => opts[k]);
}

function toInitOptions(selected: OptionKey[]): InitOptions {
  const set = new Set(selected);
  return {
    monorepo: set.has("monorepo"),
    pointer: set.has("pointer"),
    rtl: set.has("rtl"),
    srcDir: set.has("srcDir"),
    cssVariables: set.has("cssVariables"),
    baseStyle: set.has("baseStyle"),
  };
}

export function InitOptionsStep({
  initial = DEFAULT_INIT_OPTIONS,
  onSubmit,
}: InitOptionsProps) {
  return (
    <StepShell>
      <MultiSelectStep<OptionKey>
        options={OPTIONS}
        defaultSelected={toSelected(initial)}
        onSubmit={(values) => onSubmit(toInitOptions(values))}
      />
    </StepShell>
  );
}
