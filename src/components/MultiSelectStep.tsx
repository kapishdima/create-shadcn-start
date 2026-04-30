import React, { useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import {
  MultiSelect,
  type MultiSelectOption,
} from "./ui/multi-select.js";
import { SearchInput } from "./ui/search-input.js";
import { useTheme } from "./ui/theme-provider.js";

export type MultiSelectStepOption<T extends string = string> =
  MultiSelectOption<T>;

export type MultiSelectStepProps<T extends string = string> = {
  title?: string;
  hint?: string;
  options: MultiSelectStepOption<T>[];
  defaultSelected?: T[];
  searchable?: boolean;
  searchPlaceholder?: string;
  visibleCount?: number;
  enableToggleAll?: boolean;
  filterOption?: (option: MultiSelectStepOption<T>, query: string) => boolean;
  onChange?: (values: T[]) => void;
  onSubmit: (values: T[]) => void;
};

type Focus = "search" | "list";

const defaultFilter = <T extends string>(
  option: MultiSelectStepOption<T>,
  query: string,
): boolean => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (option.label.toLowerCase().includes(q)) return true;
  if (option.hint && option.hint.toLowerCase().includes(q)) return true;
  return false;
};

export function MultiSelectStep<T extends string = string>({
  title,
  hint,
  options,
  defaultSelected,
  searchable = false,
  searchPlaceholder = "Search...",
  visibleCount,
  enableToggleAll = false,
  filterOption = defaultFilter,
  onChange,
  onSubmit,
}: MultiSelectStepProps<T>) {
  const theme = useTheme();
  const [query, setQuery] = useState("");
  const [focus, setFocus] = useState<Focus>(searchable ? "search" : "list");
  const [selected, setSelected] = useState<T[]>(defaultSelected ?? []);

  const filtered = useMemo(() => {
    if (!searchable) return options;
    return options.filter((o) => filterOption(o, query));
  }, [options, query, searchable, filterOption]);

  useInput(
    (_input, key) => {
      if (!searchable) return;
      if (key.tab) {
        setFocus((f) => (f === "search" ? "list" : "search"));
        return;
      }
      if (focus === "search" && key.downArrow) {
        setFocus("list");
      }
    },
    { isActive: searchable },
  );

  const handleChange = (values: T[]) => {
    setSelected(values);
    onChange?.(values);
  };

  const handleSubmit = (values: T[]) => {
    setSelected(values);
    onSubmit(values);
  };

  return (
    <Box flexDirection="column">
      {title ? <Text bold>{title}</Text> : null}
      {hint ? <Text color={theme.colors.mutedForeground}>{hint}</Text> : null}
      {searchable ? (
        <Box marginTop={title || hint ? 1 : 0} width="100%">
          <SearchInput
            id="multi-select-step-search"
            autoFocus
            isActive={focus === "search"}
            value={query}
            onChange={setQuery}
            placeholder={searchPlaceholder}
            width="100%"
          />
        </Box>
      ) : null}
      <Box >
        <MultiSelect
          key={query}
          options={filtered}
          value={selected}
          height={visibleCount}
          isActive={focus === "list"}
          enableToggleAll={enableToggleAll}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCursorUpAtTop={
            searchable ? () => setFocus("search") : undefined
          }
        />
      </Box>
    </Box>
  );
}
