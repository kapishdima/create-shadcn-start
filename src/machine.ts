import { assign, fromCallback, setup } from "xstate";
import { buildInstallCmds } from "./utils/build-install-cmds.js";
import type { PM } from "./utils/detect-pm.js";
import { runCmd } from "./utils/spawn.js";

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
  | "install"
  | "failed"
  | "done"
  | "exited";

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
  installExitCode?: number;
  installCurrent?: number;
  installTotal?: number;
  installLabel?: string;
  installLastLine?: string;
  installFailedCmdLabel?: string;
  installTail?: string[];
};

export type WizardInput = { pm: PM; cwd: string; projectName?: string };

export type WizardEvent =
  | { type: "ADVANCE" }
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
  | { type: "BACK" }
  | { type: "EXIT" }
  | { type: "INSTALL_DONE" }
  | {
      type: "INSTALL_PROGRESS";
      current: number;
      total: number;
      label: string;
      lastLine?: string;
    }
  | {
      type: "INSTALL_FAILED";
      exitCode: number;
      failedCmdLabel?: string;
      tail?: string[];
    };

function deriveCmdLabel(argv: string[]): string {
  const hasInit = argv.includes("init");
  if (hasInit) return "shadcn init";

  const hasAdd = argv.includes("add");
  if (hasAdd) {
    const addIdx = argv.indexOf("add");
    const positionals = argv
      .slice(addIdx + 1)
      .filter((a) => !a.startsWith("-"));
    if (positionals.length > 0) {
      const spec = positionals[0];
      if (spec.startsWith("@") || spec.includes("://")) {
        return `shadcn add ${spec}`;
      }
      return `shadcn add ${positionals.join(", ")}`;
    }
    return "shadcn add";
  }

  if (argv[0] === "npx" && argv.includes("skills")) {
    return "skills add shadcn-ui/ui";
  }

  return argv.slice(0, 3).join(" ");
}

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
  actors: {
    runInstallCmds: fromCallback<
      WizardEvent,
      { state: WizardContext; pm: PM; cwd: string }
    >(({ input, sendBack }) => {
      let cancelled = false;
      (async () => {
        const cmds = buildInstallCmds(input.state, input.pm, input.cwd);
        const total = cmds.length;
        for (let i = 0; i < cmds.length; i++) {
          if (cancelled) return;
          const cmd = cmds[i];
          const label = deriveCmdLabel(cmd.argv);
          sendBack({
            type: "INSTALL_PROGRESS",
            current: i + 1,
            total,
            label,
          });
          const r = await runCmd(cmd, (line, stream) => {
            if (stream === "stderr") return;
            if (cancelled) return;
            sendBack({
              type: "INSTALL_PROGRESS",
              current: i + 1,
              total,
              label,
              lastLine: line,
            });
          });
          if (cancelled) return;
          if (r.exitCode !== 0) {
            sendBack({
              type: "INSTALL_FAILED",
              exitCode: r.exitCode,
              failedCmdLabel: label,
              tail: r.tail,
            });
            return;
          }
        }
        if (!cancelled) sendBack({ type: "INSTALL_DONE" });
      })();
      return () => {
        cancelled = true;
      };
    }),
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
      entry: "clearLastRejected",
      meta: {
        footerMode: "terminal",
        backAllowed: false,
        phase: null,
      } satisfies SceneMeta,
      invoke: {
        src: "runInstallCmds",
        input: ({ context }) => ({
          state: context,
          pm: context.pm,
          cwd: context.cwd,
        }),
      },
      on: {
        INSTALL_DONE: { target: "done" },
        INSTALL_PROGRESS: {
          actions: assign({
            installCurrent: ({ event }) => event.current,
            installTotal: ({ event }) => event.total,
            installLabel: ({ event }) => event.label,
            installLastLine: ({ event }) => event.lastLine,
          }),
        },
        INSTALL_FAILED: {
          target: "failed",
          actions: assign({
            installExitCode: ({ event }) => event.exitCode,
            installFailedCmdLabel: ({ event }) => event.failedCmdLabel,
            installTail: ({ event }) => event.tail,
          }),
        },
        BACK: {
          actions: { type: "rejectBack", params: { from: "install" } },
        },
      },
    },
    failed: {
      entry: "clearLastRejected",
      meta: {
        footerMode: "terminal",
        backAllowed: false,
        phase: null,
      } satisfies SceneMeta,
      on: {
        EXIT: { target: "exited" },
      },
    },
    done: {
      entry: "clearLastRejected",
      meta: {
        footerMode: "terminal",
        backAllowed: false,
        phase: null,
      } satisfies SceneMeta,
      on: {
        BACK: {
          actions: { type: "rejectBack", params: { from: "done" } },
        },
        EXIT: { target: "exited" },
      },
    },
    exited: { type: "final" },
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
