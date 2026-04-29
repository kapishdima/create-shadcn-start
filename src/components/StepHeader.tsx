import React from "react";
import { Box, Text } from "ink";
import { theme } from "../theme.js";
import { WIZARD_PHASE_TOTAL } from "../machine.js";
import type { Step } from "../machine.js";

type Props = {
  step: Step;
  phase: number | null;
};

const STEP_TITLE: Partial<Record<Step, string>> = {
  "project-name": "project name",
  "preset-choice": "theme preset",
  "preset-curated": "curated presets",
  "preset-random": "random preset",
  "preset-paste": "paste preset",
  components: "components",
  registries: "registries",
  skills: "agent skill",
  review: "review",
};

export function StepHeader({ step, phase }: Props) {
  const title = STEP_TITLE[step];
  return (
    <Box paddingX={1} marginBottom={1}>
      <Text dimColor>create-shadcn-app</Text>
      {phase !== null ? (
        <>
          <Text dimColor>  </Text>
          <Text bold>[step {phase}/{WIZARD_PHASE_TOTAL}]</Text>
        </>
      ) : null}
      {title ? (
        <>
          <Text dimColor>  </Text>
          <Text color={theme.subtle}>{title}</Text>
        </>
      ) : null}
    </Box>
  );
}
