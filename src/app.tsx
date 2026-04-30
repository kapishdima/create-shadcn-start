import React, { useEffect, useRef } from "react";
import { Box, useApp, useInput } from "ink";
import { useMachine } from "@xstate/react";
import {
  getSceneMeta,
  getStepSummary,
  wizardMachine,
  type WizardContext,
} from "./machine.js";

import { detectPm } from "./utils/detect-pm.js";
import { SetupFlow } from "./components/ui/setup-flow.js";
import { Welcome } from "./components/ui/welcome.js";
import { ProjectName } from "./steps/project-name.js";
import { Framework } from "./steps/framework.js";
import { PresetChoice } from "./steps/preset-choice.js";
import { PresetCurated } from "./steps/preset-curated.js";
import { PresetRandom } from "./steps/preset-random.js";
import { PresetPaste } from "./steps/preset-paste.js";
import { Components } from "./steps/components.js";
import { Registries } from "./steps/registries.js";
import { Skills } from "./steps/skills.js";
import { InitOptionsStep } from "./steps/init-options.js";
import { Review } from "./steps/review.js";

export type AppOutcome =
  | { kind: "install"; ctx: WizardContext }
  | { kind: "cancelled" };

export type AppProps = {
  initialProjectName?: string;
  onComplete?: (outcome: AppOutcome) => void;
};

export function App({ initialProjectName, onComplete }: AppProps = {}) {
  const pm = detectPm(process.env, process.cwd());
  const cwd = process.cwd();
  const [state, send] = useMachine(wizardMachine, {
    input: { pm, cwd, projectName: initialProjectName },
  });
  const { exit } = useApp();
  const completedRef = useRef(false);
   
  const step = state.value
  const ctx = state.context;

  useInput((_input, key) => {
    if (key.escape) {
      send({ type: "BACK" });
      return;
    }
  });

  useEffect(() => {
    if (step === "install" && !completedRef.current) {
      completedRef.current = true;
      onComplete?.({ kind: "install", ctx });
      exit();
    }
  }, [step, ctx, onComplete, exit]);

  const renderActive = () => {
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
      case "framework":
        return (
          <Framework
            initial={ctx.frameworkTemplate}
            onSubmit={(framework) =>
              send({ type: "SUBMIT_FRAMEWORK", framework })
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
      case "init-options":
        return (
          <InitOptionsStep
            initial={ctx.initOptions}
            onSubmit={(initOptions) =>
              send({ type: "SUBMIT_INIT_OPTIONS", initOptions })
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
      default:
        return null;
    }
  };

  return (
    <Box flexDirection="column" paddingTop={1}>
  
      <SetupFlow>
        {ctx.history.filter((step) => !getSceneMeta(step)?.isSubScene).map((step, stepIndex) => {
          const isActive = stepIndex === ctx.history.length - 1;
          const summary = isActive ? null : getStepSummary(step, ctx);
          const meta = getSceneMeta(step);

          return (
            <SetupFlow.Step
              key={stepIndex}
              status={isActive ? "active" : "done"}
              title={`${meta?.title}${summary ? `: ${summary}` : ""}`}
              description={meta?.description}
            />
          );
        })}
        {renderActive()}
      </SetupFlow>
    </Box>
  );
}

