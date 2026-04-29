import { assign, setup } from "xstate";
import type { PM } from "./utils/detect-pm.js";

export type Step =
  | "project-name"
  | "preset-choice"
  | "preset-curated"
  | "preset-random"
  | "preset-paste"
  | "components"
  | "registries"
  | "skills"
  | "review"
  | "install";

export type PresetSource = "curated" | "random" | "paste" | "skip";

export type BackDisabled = { kind: "back-disabled"; from: Step };

export type FooterMode = "default" | "first" | "terminal";

export type SceneMeta = {
  footerMode: FooterMode;
  backAllowed: boolean;
  phase: number | null;
};

export type WizardContext = {
  pm: PM;
  cwd: string;
  history: Step[];
  projectName?: string;
  presetSource?: PresetSource;
  presetCode?: string;
  components: string[];
  registries: string[];
  customRegistries: string[];
  installShadcnSkill: boolean;
  lastRejected?: BackDisabled;
  autoSkipName: boolean;
};

export type WizardInput = { pm: PM; cwd: string; projectName?: string };

export type WizardEvent =
  | { type: "SUBMIT_PROJECT_NAME"; projectName: string }
  | { type: "SUBMIT_PRESET_SOURCE"; presetSource: PresetSource }
  | { type: "SUBMIT_PRESET_CODE"; presetCode: string }
  | { type: "SUBMIT_COMPONENTS"; components: string[] }
  | {
      type: "SUBMIT_REGISTRIES";
      registries: string[];
      customRegistries: string[];
    }
  | { type: "SUBMIT_SKILLS"; installShadcnSkill: boolean }
  | { type: "SUBMIT_REVIEW" }
  | { type: "BACK" };

export const WIZARD_PHASE_TOTAL = 6;

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
      history: ({ context }, params: { from: Step }) => [
        ...context.history,
        params.from,
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
      context.history.at(-1) === "preset-curated",
    backFromRandom: ({ context }) =>
      context.history.at(-1) === "preset-random",
    backFromPaste: ({ context }) =>
      context.history.at(-1) === "preset-paste",
    backFromChoice: ({ context }) =>
      context.history.at(-1) === "preset-choice",
  },
}).createMachine({
  id: "wizard",
  initial: "project-name",
  context: ({ input }) => ({
    pm: input.pm,
    cwd: input.cwd,
    history: [],
    projectName: input.projectName,
    components: [],
    registries: [],
    customRegistries: [],
    installShadcnSkill: true,
    autoSkipName: input.projectName !== undefined,
  }),
  states: {
    "project-name": {
      entry: "clearLastRejected",
      always: {
        guard: ({ context }) =>
          context.autoSkipName && !!context.projectName,
        target: "preset-choice",
        actions: [
          assign({ autoSkipName: false }),
          { type: "pushHistory", params: { from: "project-name" } },
        ],
      },
      meta: {
        footerMode: "first",
        backAllowed: false,
        phase: 1,
      } satisfies SceneMeta,
      on: {
        SUBMIT_PROJECT_NAME: {
          target: "preset-choice",
          actions: [
            assign({ projectName: ({ event }) => event.projectName }),
            { type: "pushHistory", params: { from: "project-name" } },
          ],
        },
        BACK: {
          actions: { type: "rejectBack", params: { from: "project-name" } },
        },
      },
    },
    "preset-choice": {
      entry: "clearLastRejected",
      meta: {
        footerMode: "default",
        backAllowed: true,
        phase: 2,
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
              { type: "pushHistory", params: { from: "preset-choice" } },
            ],
          },
          {
            guard: "isPresetCurated",
            target: "preset-curated",
            actions: [
              assign({ presetSource: ({ event }) => event.presetSource }),
              { type: "pushHistory", params: { from: "preset-choice" } },
            ],
          },
          {
            guard: "isPresetRandom",
            target: "preset-random",
            actions: [
              assign({ presetSource: ({ event }) => event.presetSource }),
              { type: "pushHistory", params: { from: "preset-choice" } },
            ],
          },
          {
            guard: "isPresetPaste",
            target: "preset-paste",
            actions: [
              assign({ presetSource: ({ event }) => event.presetSource }),
              { type: "pushHistory", params: { from: "preset-choice" } },
            ],
          },
        ],
        BACK: { target: "project-name", actions: "popHistory" },
      },
    },
    "preset-curated": {
      entry: "clearLastRejected",
      meta: {
        footerMode: "default",
        backAllowed: true,
        phase: 2,
      } satisfies SceneMeta,
      on: {
        SUBMIT_PRESET_CODE: {
          target: "components",
          actions: [
            assign({ presetCode: ({ event }) => event.presetCode }),
            { type: "pushHistory", params: { from: "preset-curated" } },
          ],
        },
        BACK: { target: "preset-choice", actions: "popHistory" },
      },
    },
    "preset-random": {
      entry: "clearLastRejected",
      meta: {
        footerMode: "default",
        backAllowed: true,
        phase: 2,
      } satisfies SceneMeta,
      on: {
        SUBMIT_PRESET_CODE: {
          target: "components",
          actions: [
            assign({ presetCode: ({ event }) => event.presetCode }),
            { type: "pushHistory", params: { from: "preset-random" } },
          ],
        },
        BACK: { target: "preset-choice", actions: "popHistory" },
      },
    },
    "preset-paste": {
      entry: "clearLastRejected",
      meta: {
        footerMode: "default",
        backAllowed: true,
        phase: 2,
      } satisfies SceneMeta,
      on: {
        SUBMIT_PRESET_CODE: {
          target: "components",
          actions: [
            assign({ presetCode: ({ event }) => event.presetCode }),
            { type: "pushHistory", params: { from: "preset-paste" } },
          ],
        },
        BACK: { target: "preset-choice", actions: "popHistory" },
      },
    },
    components: {
      entry: "clearLastRejected",
      meta: {
        footerMode: "default",
        backAllowed: true,
        phase: 3,
      } satisfies SceneMeta,
      on: {
        SUBMIT_COMPONENTS: {
          target: "registries",
          actions: [
            assign({ components: ({ event }) => event.components }),
            { type: "pushHistory", params: { from: "components" } },
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
        footerMode: "default",
        backAllowed: true,
        phase: 4,
      } satisfies SceneMeta,
      on: {
        SUBMIT_REGISTRIES: {
          target: "skills",
          actions: [
            assign({
              registries: ({ event }) => event.registries,
              customRegistries: ({ event }) => event.customRegistries,
            }),
            { type: "pushHistory", params: { from: "registries" } },
          ],
        },
        BACK: { target: "components", actions: "popHistory" },
      },
    },
    skills: {
      entry: "clearLastRejected",
      meta: {
        footerMode: "default",
        backAllowed: true,
        phase: 5,
      } satisfies SceneMeta,
      on: {
        SUBMIT_SKILLS: {
          target: "review",
          actions: [
            assign({
              installShadcnSkill: ({ event }) => event.installShadcnSkill,
            }),
            { type: "pushHistory", params: { from: "skills" } },
          ],
        },
        BACK: { target: "registries", actions: "popHistory" },
      },
    },
    review: {
      entry: "clearLastRejected",
      meta: {
        footerMode: "default",
        backAllowed: true,
        phase: 6,
      } satisfies SceneMeta,
      on: {
        SUBMIT_REVIEW: {
          target: "install",
          actions: { type: "pushHistory", params: { from: "review" } },
        },
        BACK: { target: "skills", actions: "popHistory" },
      },
    },
    install: {
      meta: {
        footerMode: "terminal",
        backAllowed: false,
        phase: null,
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

export function footerModeFor(step: Step): FooterMode {
  return getSceneMeta(step)?.footerMode ?? "default";
}

export function phaseFor(step: Step): number | null {
  return getSceneMeta(step)?.phase ?? null;
}
