import { assign, setup } from "xstate";
import type { PM } from "./utils/detect-pm.js";

export type Step =
  | "project-name"
  | "framework"
  | "preset-choice"
  | "preset-curated"
  | "preset-random"
  | "preset-paste"
  | "components"
  | "registries"
  | "skills"
  | "init-options"
  | "review"
  | "install";

export type PresetSource = "curated" | "random" | "paste" | "skip";

export type FrameworkTemplate =
  | "next"
  | "vite"
  | "tanstack-start"
  | "astro"
  | "react-router";

export type InitOptions = {
  monorepo: boolean;
  pointer: boolean;
  rtl: boolean;
  srcDir: boolean;
  cssVariables: boolean;
  baseStyle: boolean;
};

export const DEFAULT_INIT_OPTIONS: InitOptions = {
  monorepo: false,
  pointer: false,
  rtl: false,
  srcDir: false,
  cssVariables: true,
  baseStyle: true,
};

export type BackDisabled = { kind: "back-disabled"; from: Step };

export type SceneMeta = {
  title: string;
  description?: string;
  backAllowed: boolean;
  phase: number | null;
  isSubScene?: boolean;
};

export type WizardContext = {
  pm: PM;
  cwd: string;
  history: Step[];
  projectName?: string;
  frameworkTemplate?: FrameworkTemplate;
  presetSource?: PresetSource;
  presetCode?: string;
  components: string[];
  registries: string[];
  customRegistries: string[];
  installShadcnSkill: boolean;
  initOptions: InitOptions;
  lastRejected?: BackDisabled;
  autoSkipName: boolean;
};

export type WizardInput = { pm: PM; cwd: string; projectName?: string };

export type WizardEvent =
  | { type: "SUBMIT_PROJECT_NAME"; projectName: string }
  | { type: "SUBMIT_FRAMEWORK"; framework: FrameworkTemplate }
  | { type: "SUBMIT_PRESET_SOURCE"; presetSource: PresetSource }
  | { type: "SUBMIT_PRESET_CODE"; presetCode: string }
  | { type: "SUBMIT_COMPONENTS"; components: string[] }
  | {
    type: "SUBMIT_REGISTRIES";
    registries: string[];
    customRegistries: string[];
  }
  | { type: "SUBMIT_SKILLS"; installShadcnSkill: boolean }
  | { type: "SUBMIT_INIT_OPTIONS"; initOptions: InitOptions }
  | { type: "SUBMIT_REVIEW" }
  | { type: "BACK" };

export const WIZARD_PHASE_TOTAL = 8;

export const wizardMachine = setup({
  types: {
    context: {} as WizardContext,
    events: {} as WizardEvent,
    input: {} as WizardInput,
  },
  actions: {
    clearLastRejected: assign({ lastRejected: undefined }),
    rejectBack: assign({
      lastRejected: (_, params: { from: Step }) =>
        ({ kind: "back-disabled", from: params.from } as BackDisabled),
    }),
    pushHistory: assign({
      history: ({ context }, params: { step: Step }) => [
        ...context.history,
        params.step,
      ],
    }),
    popHistory: assign({
      history: ({ context }) => context.history.slice(0, -1),
    }),
  },
  guards: {
    isPresetSkip: ({ event }) =>
      event.type === "SUBMIT_PRESET_SOURCE" && event.presetSource === "skip",
    isPresetCurated: ({ event }) =>
      event.type === "SUBMIT_PRESET_SOURCE" &&
      event.presetSource === "curated",
    isPresetRandom: ({ event }) =>
      event.type === "SUBMIT_PRESET_SOURCE" && event.presetSource === "random",
    isPresetPaste: ({ event }) =>
      event.type === "SUBMIT_PRESET_SOURCE" && event.presetSource === "paste",
    backFromCurated: ({ context }) =>
      context.history.at(-2) === "preset-curated",
    backFromRandom: ({ context }) =>
      context.history.at(-2) === "preset-random",
    backFromPaste: ({ context }) =>
      context.history.at(-2) === "preset-paste",
    backFromChoice: ({ context }) =>
      context.history.at(-2) === "preset-choice",
  },
}).createMachine({
  id: "wizard",
  initial: "project-name",
  context: ({ input }) => ({
    pm: input.pm,
    cwd: input.cwd,
    history: ["project-name"] as Step[],
    projectName: input.projectName,
    components: [],
    registries: [],
    customRegistries: [],
    installShadcnSkill: true,
    initOptions: DEFAULT_INIT_OPTIONS,
    autoSkipName: input.projectName !== undefined,
  }),
  states: {
    "project-name": {
      entry: "clearLastRejected",
      always: {
        guard: ({ context }) =>
          context.autoSkipName && !!context.projectName,
        target: "framework",
        actions: [
          assign({ autoSkipName: false }),
          { type: "pushHistory", params: { step: "framework" } },
        ],
      },
      meta: {
        backAllowed: false,
        phase: 1,
        title: "Project name",
        description: "Used as the directory name. Lowercase kebab-case.",
      } satisfies SceneMeta,
      on: {
        SUBMIT_PROJECT_NAME: {
          target: "framework",
          actions: [
            assign({ projectName: ({ event }) => event.projectName }),
            { type: "pushHistory", params: { step: "framework" } },
          ],
        },
        BACK: {
          actions: { type: "rejectBack", params: { from: "project-name" } },
        },
      },
    },
    framework: {
      entry: "clearLastRejected",
      meta: {
        backAllowed: true,
        phase: 2,
        title: "Framework",
        description:
          "Pick the scaffold for shadcn init. Skip uses Next.js.",
      } satisfies SceneMeta,
      on: {
        SUBMIT_FRAMEWORK: {
          target: "preset-choice",
          actions: [
            assign({ frameworkTemplate: ({ event }) => event.framework }),
            { type: "pushHistory", params: { step: "preset-choice" } },
          ],
        },
        BACK: { target: "project-name", actions: "popHistory" },
      },
    },
    "preset-choice": {
      entry: "clearLastRejected",
      meta: {
        backAllowed: true,
        phase: 3,
        title: "Preset selection",
        description:
          "Choose a preset to quickly select components, or start with a blank slate.",
      } satisfies SceneMeta,
      on: {
        SUBMIT_PRESET_SOURCE: [
          {
            guard: "isPresetSkip",
            target: "components",
            actions: [
              assign({
                presetSource: ({ event }) => event.presetSource,
                presetCode: undefined,
              }),
              { type: "pushHistory", params: { step: "components" } },
            ],
          },
          {
            guard: "isPresetCurated",
            target: "preset-curated",
            actions: [
              assign({ presetSource: ({ event }) => event.presetSource }),
              { type: "pushHistory", params: { step: "preset-curated" } },
            ],
          },
          {
            guard: "isPresetRandom",
            target: "preset-random",
            actions: [
              assign({ presetSource: ({ event }) => event.presetSource }),
              { type: "pushHistory", params: { step: "preset-random" } },
            ],
          },
          {
            guard: "isPresetPaste",
            target: "preset-paste",
            actions: [
              assign({ presetSource: ({ event }) => event.presetSource }),
              { type: "pushHistory", params: { step: "preset-paste" } },
            ],
          },
        ],
        BACK: { target: "framework", actions: "popHistory" },
      },
    },
    "preset-curated": {
      entry: "clearLastRejected",
      meta: {
        backAllowed: true,
        phase: 3,
        title: "Curated preset",
        description: "Up/Down to browse, Enter to confirm. Swatches are bg / surface / accent / ink.",
        isSubScene: true,
      } satisfies SceneMeta,
      on: {
        SUBMIT_PRESET_CODE: {
          target: "components",
          actions: [
            assign({ presetCode: ({ event }) => event.presetCode }),
            { type: "pushHistory", params: { step: "components" } },
          ],
        },
        BACK: { target: "preset-choice", actions: "popHistory" },
      },
    },
    "preset-random": {
      entry: "clearLastRejected",
      meta: {
        backAllowed: true,
        phase: 3,
        title: "Random preset",
        description: "Accept, re-roll, or open the preview in your browser.",
        isSubScene: true,
      } satisfies SceneMeta,
      on: {
        SUBMIT_PRESET_CODE: {
          target: "components",
          actions: [
            assign({ presetCode: ({ event }) => event.presetCode }),
            { type: "pushHistory", params: { step: "components" } },
          ],
        },
        BACK: { target: "preset-choice", actions: "popHistory" },
      },
    },
    "preset-paste": {
      entry: "clearLastRejected",
      meta: {
        backAllowed: true,
        phase: 3,
        title: "Paste a preset code",
        description:
          "Open https://ui.shadcn.com/create, design, copy the code, paste below. Press 'o' to open the designer.",
        isSubScene: true,
      } satisfies SceneMeta,
      on: {
        SUBMIT_PRESET_CODE: {
          target: "components",
          actions: [
            assign({ presetCode: ({ event }) => event.presetCode }),
            { type: "pushHistory", params: { step: "components" } },
          ],
        },
        BACK: { target: "preset-choice", actions: "popHistory" },
      },
    },
    components: {
      entry: "clearLastRejected",
      meta: {
        backAllowed: true,
        phase: 4,
        title: "Components",
        description:
          "Space to toggle, A to toggle all, Enter to confirm. Defaults pre-checked.",
      } satisfies SceneMeta,
      on: {
        SUBMIT_COMPONENTS: {
          target: "registries",
          actions: [
            assign({ components: ({ event }) => event.components }),
            { type: "pushHistory", params: { step: "registries" } },
          ],
        },
        BACK: [
          {
            guard: "backFromCurated",
            target: "preset-curated",
            actions: "popHistory",
          },
          {
            guard: "backFromRandom",
            target: "preset-random",
            actions: "popHistory",
          },
          {
            guard: "backFromPaste",
            target: "preset-paste",
            actions: "popHistory",
          },
          {
            guard: "backFromChoice",
            target: "preset-choice",
            actions: "popHistory",
          },
        ],
      },
    },
    registries: {
      entry: "clearLastRejected",
      meta: {
        backAllowed: true,
        phase: 5,
        title: "Registries",
        description:
          "Tab to switch between search and list. Space to toggle, Enter to confirm.",
      } satisfies SceneMeta,
      on: {
        SUBMIT_REGISTRIES: {
          target: "skills",
          actions: [
            assign({
              registries: ({ event }) => event.registries,
              customRegistries: ({ event }) => event.customRegistries,
            }),
            { type: "pushHistory", params: { step: "skills" } },
          ],
        },
        BACK: { target: "components", actions: "popHistory" },
      },
    },
    skills: {
      entry: "clearLastRejected",
      meta: {
        backAllowed: true,
        phase: 6,
        title: "Agent skills",
        description:
          "Toggle to include installation of the shadcn/ui skill, which provides AI-assisted component generation.",
      } satisfies SceneMeta,
      on: {
        SUBMIT_SKILLS: {
          target: "init-options",
          actions: [
            assign({
              installShadcnSkill: ({ event }) => event.installShadcnSkill,
            }),
            { type: "pushHistory", params: { step: "init-options" } },
          ],
        },
        BACK: { target: "registries", actions: "popHistory" },
      },
    },
    "init-options": {
      entry: "clearLastRejected",
      meta: {
        backAllowed: true,
        phase: 7,
        title: "Init options",
        description:
          "Space to toggle, Enter to confirm. Defaults match shadcn CLI.",
      } satisfies SceneMeta,
      on: {
        SUBMIT_INIT_OPTIONS: {
          target: "review",
          actions: [
            assign({ initOptions: ({ event }) => event.initOptions }),
            { type: "pushHistory", params: { step: "review" } },
          ],
        },
        BACK: { target: "skills", actions: "popHistory" },
      },
    },
    review: {
      entry: "clearLastRejected",
      meta: {
        backAllowed: true,
        phase: 8,
        title: "Review",
        description: "Confirm your choices before installing.",
      } satisfies SceneMeta,
      on: {
        SUBMIT_REVIEW: {
          target: "install",
          actions: { type: "pushHistory", params: { step: "install" } },
        },
        BACK: { target: "init-options", actions: "popHistory" },
      },
    },
    install: {
      meta: {
        backAllowed: false,
        phase: null,
        title: "Installing",
      } satisfies SceneMeta,
      type: "final",
    },
  },
});

export function getSceneMeta(step: Step): SceneMeta | undefined {
  const node = wizardMachine.states[step as keyof typeof wizardMachine.states];
  if (!node) return undefined;
  const meta = node.meta as SceneMeta | undefined;
  return meta;
}

export function isBackDisabled(step: Step): boolean {
  const meta = getSceneMeta(step);
  if (!meta) return true;
  return !meta.backAllowed;
}

export function phaseFor(step: Step): number | null {
  return getSceneMeta(step)?.phase ?? null;
}

export type StepStatus = "done" | "active" | "pending";

export function stepStatusFor(targetPhase: number, current: Step): StepStatus {
  if (current === "install") return "done";
  const cur = phaseFor(current);
  if (cur === null) return "pending";
  if (targetPhase < cur) return "done";
  if (targetPhase === cur) return "active";
  return "pending";
}

export function summarizeInitOptions(opts: InitOptions): string {
  const diverged: string[] = [];
  if (opts.monorepo) diverged.push("monorepo");
  if (opts.pointer) diverged.push("pointer");
  if (opts.rtl) diverged.push("rtl");
  if (opts.srcDir) diverged.push("src-dir");
  if (!opts.cssVariables) diverged.push("no-css-variables");
  if (!opts.baseStyle) diverged.push("no-base-style");
  return diverged.length === 0 ? "defaults" : diverged.join(", ");
}

export function getStepSummary(step: Step, ctx: WizardContext): string | null {

  switch (step) {
    case "project-name":
      return ctx.projectName ?? null;
    case "framework":
      return ctx.frameworkTemplate ?? null;
    case "preset-choice": {
      if (!ctx.presetSource) return null;
      if (ctx.presetSource === "skip") return "skip";
      if (ctx.presetCode) return `${ctx.presetSource} (${ctx.presetCode})`;
      return ctx.presetSource;
    }
    case "components": {
      if (ctx.components.length === 0) return "none";
      return ctx.components.join(", ");
    }
    case "registries": {
      const all = [...ctx.registries, ...ctx.customRegistries];
      if (all.length === 0) return "none";
      return all.join(", ");
    }
    case "skills":
      return ctx.installShadcnSkill ? "yes" : "no";
    case "init-options":
      return summarizeInitOptions(ctx.initOptions);
    case "review":
      return "confirmed";
    default:
      return null;
  }
}
