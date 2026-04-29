// Wizard state machine for create-shadcn-app.
//
// Single useReducer at the top of <App />. Steps are pure components that read
// state and dispatch actions. Choices persist across navigation: going back
// then forward never clears prior selections.

export type Step =
  | "welcome"
  | "project-name"
  | "preset-choice"
  | "preset-curated"
  | "preset-random"
  | "preset-paste"
  | "components"
  | "registries"
  | "skills"
  | "install"
  | "done";

export type PresetSource = "curated" | "random" | "paste" | "skip";

export type State = {
  step: Step;
  // Stack of previously visited steps. The current `step` is NOT pushed onto
  // history until the next forward transition.
  history: Step[];
  projectName?: string;
  presetSource?: PresetSource;
  presetCode?: string; // unset when presetSource === 'skip'
  components: string[];
  registries: string[];
  // Free-form registry URLs typed via the "Paste registry URL" entry.
  customRegistries?: string[];
  installShadcnSkill: boolean;
  // Last attempted action that was rejected (e.g. back from install). Cleared
  // on the next successful state mutation. Used by tests and by the UI to
  // surface a transient "back is disabled" hint.
  lastRejected?: BackDisabled;
};

export type BackDisabled = { kind: "back-disabled"; from: Step };

// Actions accepted by the reducer. The `next` action carries an optional
// flat payload - depending on the current step, different fields are read.
// This mirrors the test agent's expectation that you can dispatch
//   { type: 'next', projectName: 'demo' }
//   { type: 'next', presetSource: 'skip' }
// etc., directly.
export type Action =
  | ({
      type: "next";
      projectName?: string;
      presetSource?: PresetSource;
      presetCode?: string;
      components?: string[];
      registries?: string[];
      customRegistries?: string[];
      installShadcnSkill?: boolean;
    } & Record<string, unknown>)
  | { type: "back" }
  | { type: "update"; patch: Partial<State> }
  | { type: "reset" };

// Initial wizard state. Exported under both names so tests can import either.
export const INITIAL_STATE: State = {
  step: "welcome",
  history: [],
  components: [],
  registries: [],
  customRegistries: [],
  installShadcnSkill: true,
};

export const initialState = INITIAL_STATE;

// Steps from which `back` is a no-op or rejected. project-name is NOT in
// this set: `back` from project-name returns to the welcome banner. welcome
// is the true terminal-of-back state (history is empty there).
const BACK_DISABLED: Set<Step> = new Set(["welcome", "install", "done"]);

// Map current step + action -> next step.
function advance(current: Step, action: Extract<Action, { type: "next" }>): Step {
  switch (current) {
    case "welcome":
      return "project-name";
    case "project-name":
      return "preset-choice";
    case "preset-choice": {
      switch (action.presetSource) {
        case "curated":
          return "preset-curated";
        case "random":
          return "preset-random";
        case "paste":
          return "preset-paste";
        case "skip":
          return "components";
        default:
          return current;
      }
    }
    case "preset-curated":
    case "preset-random":
    case "preset-paste":
      return "components";
    case "components":
      return "registries";
    case "registries":
      return "skills";
    case "skills":
      return "install";
    case "install":
      return "done";
    case "done":
      return "done";
  }
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "next": {
      const nextStep = advance(state.step, action);

      // Apply payload-side-effects to state (these are the "confirm-time"
      // writes). Branch swap: presetCode is only overwritten on confirm of a
      // preset sub-step, never on entry. Skip clears presetCode explicitly.
      const patch: Partial<State> = {};
      switch (state.step) {
        case "project-name":
          if (action.projectName !== undefined) patch.projectName = action.projectName;
          break;
        case "preset-choice":
          if (action.presetSource !== undefined) {
            patch.presetSource = action.presetSource;
            if (action.presetSource === "skip") {
              patch.presetCode = undefined;
            }
          }
          break;
        case "preset-curated":
        case "preset-random":
        case "preset-paste":
          if (action.presetCode !== undefined) patch.presetCode = action.presetCode;
          break;
        case "components":
          if (action.components !== undefined) patch.components = action.components;
          break;
        case "registries":
          if (action.registries !== undefined) patch.registries = action.registries;
          if (action.customRegistries !== undefined) {
            patch.customRegistries = action.customRegistries;
          }
          break;
        case "skills":
          if (action.installShadcnSkill !== undefined) {
            patch.installShadcnSkill = action.installShadcnSkill;
          }
          break;
        default:
          break;
      }

      // No-op if we didn't actually advance (defensive).
      if (nextStep === state.step) {
        return { ...state, ...patch, lastRejected: undefined };
      }

      return {
        ...state,
        ...patch,
        step: nextStep,
        history: [...state.history, state.step],
        lastRejected: undefined,
      };
    }

    case "back": {
      if (BACK_DISABLED.has(state.step)) {
        // Back from welcome / project-name: silent no-op (returns same state
        // but tagged so the UI/tests can detect a rejection).
        // Back from install / done is hard-rejected (same shape).
        return {
          ...state,
          lastRejected: { kind: "back-disabled", from: state.step },
        };
      }
      const prev = state.history[state.history.length - 1];
      if (!prev) {
        return {
          ...state,
          lastRejected: { kind: "back-disabled", from: state.step },
        };
      }
      return {
        ...state,
        step: prev,
        history: state.history.slice(0, -1),
        lastRejected: undefined,
      };
    }

    case "update":
      return { ...state, ...action.patch, lastRejected: undefined };

    case "reset":
      return INITIAL_STATE;
  }
}

// Convenience helpers for tests and step components.
export function isBackDisabled(step: Step): boolean {
  return BACK_DISABLED.has(step);
}
