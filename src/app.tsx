import React, { useReducer } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { INITIAL_STATE, isBackDisabled, reducer, type Step } from "./state.js";
import { detectPm } from "./utils/detect-pm.js";
import { Welcome } from "./steps/welcome.js";
import { ProjectName } from "./steps/project-name.js";
import { PresetChoice } from "./steps/preset-choice.js";
import { PresetCurated } from "./steps/preset-curated.js";
import { PresetRandom } from "./steps/preset-random.js";
import { PresetPaste } from "./steps/preset-paste.js";
import { Components } from "./steps/components.js";
import { Registries } from "./steps/registries.js";
import { Skills } from "./steps/skills.js";
import { Install } from "./steps/install.js";
import { Done } from "./steps/done.js";

type FooterMode = "default" | "first" | "install" | "terminal";

function footerHint(mode: FooterMode): string {
  switch (mode) {
    case "first":
      return "enter confirm   ctrl+c quit";
    case "install":
      return "ctrl+c cancel install";
    case "terminal":
      return "enter exit";
    case "default":
    default:
      return "up/down navigate   space toggle   enter confirm   esc back   ctrl+c quit";
  }
}

function footerModeFor(step: Step): FooterMode {
  if (step === "welcome" || step === "project-name") return "first";
  if (step === "install") return "install";
  if (step === "done") return "terminal";
  return "default";
}

export function App() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const { exit } = useApp();
  const pm = detectPm(process.env, process.cwd());

  useInput((_input, key) => {
    if (key.escape) {
      if (!isBackDisabled(state.step)) {
        dispatch({ type: "back" });
      }
      return;
    }
  });

  const renderStep = () => {
    switch (state.step) {
      case "welcome":
        return (
          <Welcome onAdvance={() => dispatch({ type: "next" })} />
        );
      case "project-name":
        return (
          <ProjectName
            initialValue={state.projectName}
            onSubmit={(projectName) =>
              dispatch({ type: "next", projectName })
            }
          />
        );
      case "preset-choice":
        return (
          <PresetChoice
            initial={state.presetSource}
            onSubmit={(presetSource) =>
              dispatch({ type: "next", presetSource })
            }
          />
        );
      case "preset-curated":
        return (
          <PresetCurated
            onSubmit={(presetCode) =>
              dispatch({ type: "next", presetCode })
            }
          />
        );
      case "preset-random":
        return (
          <PresetRandom
            onSubmit={(presetCode) =>
              dispatch({ type: "next", presetCode })
            }
          />
        );
      case "preset-paste":
        return (
          <PresetPaste
            onSubmit={(presetCode) =>
              dispatch({ type: "next", presetCode })
            }
          />
        );
      case "components":
        return (
          <Components
            initial={state.components.length > 0 ? state.components : undefined}
            onSubmit={(components) =>
              dispatch({ type: "next", components })
            }
          />
        );
      case "registries":
        return (
          <Registries
            onSubmit={(urls, customRegistries) =>
              dispatch({
                type: "next",
                registries: urls,
                customRegistries,
              })
            }
          />
        );
      case "skills":
        return (
          <Skills
            initial={state.installShadcnSkill}
            onSubmit={(installShadcnSkill) =>
              dispatch({ type: "next", installShadcnSkill })
            }
          />
        );
      case "install":
        return (
          <Install
            state={state}
            pm={pm}
            onDone={(success) => {
              if (success) {
                dispatch({ type: "next" });
              }
              // On failure we leave the user on the install screen with the
              // error visible; they can ctrl+c to quit.
            }}
          />
        );
      case "done":
        return (
          <Done
            projectName={state.projectName ?? "your-app"}
            pm={pm}
            onExit={() => exit()}
          />
        );
    }
  };

  const mode = footerModeFor(state.step);

  return (
    <Box flexDirection="column">
      {renderStep()}
      <Box marginTop={1} paddingX={1}>
        <Text color="gray">{footerHint(mode)}</Text>
      </Box>
      {state.lastRejected && state.step !== "install" ? (
        <Box paddingX={1}>
          <Text color="yellow">Back is not available on this step.</Text>
        </Box>
      ) : null}
    </Box>
  );
}
