import React from "react";
import { Box, Text } from "ink";
import type { FooterMode } from "../machine.js";
import { theme } from "../theme.js";

type Intent =
  | "destructive"
  | "confirm"
  | "back"
  | "navigate"
  | "toggle"
  | "neutral";

type FooterAction = { keys: string; label: string; intent: Intent };

const INTENT_COLOR: Record<Intent, string> = {
  destructive: theme.error,
  confirm: theme.success,
  back: theme.warn,
  navigate: theme.active,
  toggle: theme.hint,
  neutral: theme.subtle,
};

const MODE_ACTIONS: Record<FooterMode, FooterAction[]> = {
  first: [
    { keys: "enter", label: "confirm", intent: "confirm" },
    { keys: "ctrl+c", label: "quit", intent: "destructive" },
  ],
  default: [
    { keys: "up/down", label: "navigate", intent: "navigate" },
    { keys: "space", label: "toggle", intent: "toggle" },
    { keys: "enter", label: "confirm", intent: "confirm" },
    { keys: "esc", label: "back", intent: "back" },
    { keys: "ctrl+c", label: "quit", intent: "destructive" },
  ],
  terminal: [{ keys: "enter", label: "exit", intent: "confirm" }],
};

export function Footer({
  mode,
  backAllowed = true,
}: {
  mode: FooterMode;
  backAllowed?: boolean;
}) {
  const actions = MODE_ACTIONS[mode] ?? MODE_ACTIONS.default;

  if(mode === "terminal") {
    return null;
  }

  return (
    <Box marginTop={1} paddingX={1}>
      <Text>
        {actions.map((action, i) => {
          const isBack = action.intent === "back";
          const dim = isBack && !backAllowed;
          const label = isBack && !backAllowed ? "back (unavailable here)" : action.label;
          return (
            <React.Fragment key={action.keys}>
              {i > 0 ? "  " : ""}
              <Text color={dim ? undefined : INTENT_COLOR[action.intent]} dimColor={dim} bold={!dim}>
                [{action.keys}]
              </Text>
              <Text dimColor> {label}</Text>
            </React.Fragment>
          );
        })}
      </Text>
    </Box>
  );
}
