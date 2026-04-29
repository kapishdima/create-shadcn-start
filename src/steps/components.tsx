import React from "react";
import { Box, Text } from "ink";
import MultiSelectImport, { type MultiSelectProps } from "ink-multi-select";
import componentsData from "../data/components.json" with { type: "json" };

// ink-multi-select ships an old-style class declaration that TS (with React
// 19 types) can't construct via JSX. Cast to a function component shape.
const MultiSelect = MultiSelectImport as unknown as React.FC<MultiSelectProps>;

export type ComponentEntry = {
  name: string;
  description: string;
  default: boolean;
};

export type ComponentsProps = {
  initial?: string[];
  onSubmit: (selected: string[]) => void;
};

const ALL: ComponentEntry[] = componentsData as ComponentEntry[];

export function Components({ initial, onSubmit }: ComponentsProps) {
  const items = ALL.map((c) => ({
    label: c.name,
    value: c.name,
    key: c.name,
  }));

  const defaultsSource =
    initial && initial.length > 0
      ? initial
      : ALL.filter((c) => c.default).map((c) => c.name);

  const defaultSelected = defaultsSource.map((n) => ({
    label: n,
    value: n,
    key: n,
  }));

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold>Components</Text>
      <Text color="gray">
        Space to toggle, Enter to confirm. Defaults pre-checked.
      </Text>
      <Box marginTop={1}>
        <MultiSelect
          items={items}
          defaultSelected={defaultSelected}
          limit={12}
          onSubmit={(selected: { value: React.Key }[]) =>
            onSubmit(selected.map((s) => String(s.value)))
          }
        />
      </Box>
    </Box>
  );
}
