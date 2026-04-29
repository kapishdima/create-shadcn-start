import React from "react";
import { Box, useApp, useInput } from "ink";
import { useMachine } from "@xstate/react";
import {
  footerModeFor,
  getSceneMeta,
  phaseFor,
  wizardMachine,
  type Step,
} from "./machine.js";
import { detectPm } from "./utils/detect-pm.js";
import { Footer } from "./components/Footer.js";
import { StepHeader } from "./components/StepHeader.js";
import { ProjectName } from "./steps/project-name.js";
import { PresetChoice } from "./steps/preset-choice.js";
import { PresetCurated } from "./steps/preset-curated.js";
import { PresetRandom } from "./steps/preset-random.js";
import { PresetPaste } from "./steps/preset-paste.js";
import { Components } from "./steps/components.js";
import { Registries } from "./steps/registries.js";
import { Skills } from "./steps/skills.js";
import { Review } from "./steps/review.js";
import { Install } from "./steps/install.js";
import { Failed } from "./steps/failed.js";
import { Done } from "./steps/done.js";

export type AppProps = {
  initialProjectName?: string;
};

export function App({ initialProjectName }: AppProps = {}) {
  const pm = detectPm(process.env, process.cwd());
  const cwd = process.cwd();
  const [state, send] = useMachine(wizardMachine, {
    input: { pm, cwd, projectName: initialProjectName },
  });
  const { exit } = useApp();

  useInput((_input, key) => {
    if (key.escape) {
      send({ type: "BACK" });
      return;
    }
  });

  const step = state.value as Step;
  const ctx = state.context;
  const meta = getSceneMeta(step);
  const mode = footerModeFor(step);
  const phase = phaseFor(step);

  const renderStep = () => {
    switch (step) {
      case "project-name":
        return (
          <ProjectName
            initialValue={ctx.projectName}
            onSubmit={(projectName) =>
              send({ type: "SUBMIT_PROJECT_NAME", projectName })
            }
          />
        );
      case "preset-choice":
        return (
          <PresetChoice
            initial={ctx.presetSource}
            onSubmit={(presetSource) =>
              send({ type: "SUBMIT_PRESET_SOURCE", presetSource })
            }
          />
        );
      case "preset-curated":
        return (
          <PresetCurated
            onSubmit={(presetCode) =>
              send({ type: "SUBMIT_PRESET_CODE", presetCode })
            }
          />
        );
      case "preset-random":
        return (
          <PresetRandom
            onSubmit={(presetCode) =>
              send({ type: "SUBMIT_PRESET_CODE", presetCode })
            }
          />
        );
      case "preset-paste":
        return (
          <PresetPaste
            onSubmit={(presetCode) =>
              send({ type: "SUBMIT_PRESET_CODE", presetCode })
            }
          />
        );
      case "components":
        return (
          <Components
            initial={ctx.components.length > 0 ? ctx.components : undefined}
            onSubmit={(components) =>
              send({ type: "SUBMIT_COMPONENTS", components })
            }
          />
        );
      case "registries":
        return (
          <Registries
            onSubmit={(urls, customRegistries) =>
              send({
                type: "SUBMIT_REGISTRIES",
                registries: urls,
                customRegistries,
              })
            }
          />
        );
      case "skills":
        return (
          <Skills
            initial={ctx.installShadcnSkill}
            onSubmit={(installShadcnSkill) =>
              send({ type: "SUBMIT_SKILLS", installShadcnSkill })
            }
          />
        );
      case "review":
        return (
          <Review
            ctx={ctx}
            onConfirm={() => send({ type: "SUBMIT_REVIEW" })}
            onBack={() => send({ type: "BACK" })}
          />
        );
      case "install":
        return (
          <Install
            current={ctx.installCurrent}
            total={ctx.installTotal}
            label={ctx.installLabel}
            lastLine={ctx.installLastLine}
          />
        );
      case "failed":
        return (
          <Failed
            exitCode={ctx.installExitCode ?? 1}
            failedCmdLabel={ctx.installFailedCmdLabel ?? "unknown"}
            tail={ctx.installTail ?? []}
            onExit={() => {
              process.exitCode = ctx.installExitCode ?? 1;
              send({ type: "EXIT" });
              exit();
            }}
          />
        );
      case "done":
        return (
          <Done
            projectName={ctx.projectName ?? "your-app"}
            pm={ctx.pm}
            projectDir={ctx.cwd ? `${ctx.cwd}/${ctx.projectName ?? "your-app"}` : undefined}
            onExit={() => {
              send({ type: "EXIT" });
              exit();
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box flexDirection="column">
      {/* <StepHeader step={step} phase={phase} /> */}
      {renderStep()}
      <Footer mode={mode} backAllowed={meta?.backAllowed ?? true} />
    </Box>
  );
}
