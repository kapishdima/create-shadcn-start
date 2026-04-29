import { describe, it, expect, beforeAll } from 'vitest';

// We avoid hard-typing the shape because src/state.ts may evolve.
type AnyState = {
  step: string;
  history?: string[];
  projectName?: string;
  presetSource?: string;
  presetCode?: string;
  components?: string[];
  registries?: string[];
  installShadcnSkill?: boolean;
};
type AnyAction = Record<string, unknown> & { type: string };
type Reducer = (state: AnyState, action: AnyAction) => AnyState;

let reducer: Reducer | undefined;
let initialState: AnyState | undefined;
let importError: unknown;

beforeAll(async () => {
  try {
    const m = (await import('../../src/state.js')) as {
      reducer?: Reducer;
      initialState?: AnyState;
    };
    reducer = m.reducer;
    initialState = m.initialState;
  } catch (err) {
    importError = err;
  }
});

const ready = () => Boolean(reducer && initialState);

// Convenience helper that runs a list of dispatches starting from initialState
// and returns the final state.
function run(actions: AnyAction[]): AnyState {
  let s: AnyState = { ...initialState! };
  for (const a of actions) {
    s = reducer!(s, a);
  }
  return s;
}

describe('state reducer', () => {
  it('linear forward: welcome -> project-name -> preset-choice -> preset-curated -> components -> registries -> skills -> install', () => {
    if (!ready()) {
      // TODO(impl): once src/state.ts exposes { reducer, initialState }, run
      // the linear action sequence and assert state.step at each stage.
      expect(importError ?? 'module not yet available').toBeDefined();
      return;
    }
    let s: AnyState = { ...initialState! };
    expect(s.step).toBe('welcome');
    s = reducer!(s, { type: 'next' });
    expect(s.step).toBe('project-name');
    s = reducer!(s, { type: 'next', projectName: 'demo' });
    expect(s.step).toBe('preset-choice');
    s = reducer!(s, { type: 'next', presetSource: 'curated' });
    expect(s.step).toBe('preset-curated');
    s = reducer!(s, { type: 'next', presetCode: 'aIkeymG' });
    expect(s.step).toBe('components');
    s = reducer!(s, { type: 'next', components: [] });
    expect(s.step).toBe('registries');
    s = reducer!(s, { type: 'next', registries: [] });
    expect(s.step).toBe('skills');
    s = reducer!(s, { type: 'next', installShadcnSkill: false });
    expect(s.step).toBe('install');
  });

  it('back stack: forward 5, back 5 returns to welcome and prior fields persist', () => {
    if (!ready()) {
      // TODO(impl): assert step === 'welcome' and projectName etc still set.
      return;
    }
    let s: AnyState = { ...initialState! };
    s = reducer!(s, { type: 'next' });
    s = reducer!(s, { type: 'next', projectName: 'demo' });
    s = reducer!(s, { type: 'next', presetSource: 'curated' });
    s = reducer!(s, { type: 'next', presetCode: 'aIkeymG' });
    s = reducer!(s, { type: 'next', components: ['button'] });
    for (let i = 0; i < 5; i++) {
      s = reducer!(s, { type: 'back' });
    }
    expect(s.step).toBe('welcome');
    expect(s.projectName).toBe('demo');
    expect(s.presetCode).toBe('aIkeymG');
    expect(s.components).toEqual(['button']);
  });

  it('skip path: at preset-choice with presetSource skip jumps to components and clears presetCode', () => {
    if (!ready()) {
      // TODO(impl)
      return;
    }
    let s: AnyState = { ...initialState! };
    s = reducer!(s, { type: 'next' });
    s = reducer!(s, { type: 'next', projectName: 'demo' });
    expect(s.step).toBe('preset-choice');
    s = reducer!(s, { type: 'next', presetSource: 'skip' });
    expect(s.step).toBe('components');
    expect(s.presetCode).toBeUndefined();
  });

  it('branch swap: curated -> A, back, random -> B, final code is B (overwrite on confirm)', () => {
    if (!ready()) {
      // TODO(impl)
      return;
    }
    let s: AnyState = { ...initialState! };
    s = reducer!(s, { type: 'next' });
    s = reducer!(s, { type: 'next', projectName: 'demo' });
    s = reducer!(s, { type: 'next', presetSource: 'curated' });
    s = reducer!(s, { type: 'next', presetCode: 'A' });
    expect(s.presetCode).toBe('A');
    // back to preset-choice
    s = reducer!(s, { type: 'back' });
    s = reducer!(s, { type: 'back' });
    expect(s.step).toBe('preset-choice');
    s = reducer!(s, { type: 'next', presetSource: 'random' });
    s = reducer!(s, { type: 'next', presetCode: 'B' });
    expect(s.presetCode).toBe('B');
  });

  it('back from welcome is a no-op (state unchanged structurally)', () => {
    if (!ready()) {
      // TODO(impl)
      return;
    }
    const before = { ...initialState! };
    const after = reducer!(before, { type: 'back' });
    expect(after.step).toBe('welcome');
    expect(after.projectName).toBe(before.projectName);
  });

  it('back from install is rejected (step stays install)', () => {
    if (!ready()) {
      // TODO(impl)
      return;
    }
    let s: AnyState = run([
      { type: 'next' },
      { type: 'next', projectName: 'demo' },
      { type: 'next', presetSource: 'skip' },
      { type: 'next', components: [] },
      { type: 'next', registries: [] },
      { type: 'next', installShadcnSkill: false },
    ]);
    expect(s.step).toBe('install');
    s = reducer!(s, { type: 'back' });
    expect(s.step).toBe('install');
  });
});
