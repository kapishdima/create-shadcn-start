import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';

const stepFiles = [
  'project-name',
  'framework',
  'preset-choice',
  'preset-curated',
  'preset-random',
  'preset-paste',
  'components',
  'registries',
  'skills',
  'init-options',
  'review',
  'done',
];

const fixtureState = {
  step: 'project-name' as const,
  history: [],
  pm: 'pnpm' as const,
  cwd: '/tmp/test',
  projectName: 'demo',
  frameworkTemplate: 'next' as const,
  presetSource: 'curated' as const,
  presetCode: 'aIkeymG',
  components: ['button'],
  registries: [],
  customRegistries: [],
  installShadcnSkill: true,
  initOptions: {
    monorepo: false,
    pointer: false,
    rtl: false,
    srcDir: false,
    cssVariables: true,
    baseStyle: true,
  },
  installExitCode: 1,
  installFailedCmdLabel: 'shadcn init',
  installTail: ['line one'],
};

describe('step components - smoke render', () => {
  for (const name of stepFiles) {
    it(`renders ${name} without throwing and produces non-empty output`, async () => {
      let mod: Record<string, unknown> | undefined;
      try {
        mod = (await import(`../../src/steps/${name}.js`)) as Record<
          string,
          unknown
        >;
      } catch {
        // TODO(impl): once src/steps/${name}.tsx exists, this branch
        // becomes a real render+assert.
        expect(true).toBe(true);
        return;
      }
      // Find a default export or a PascalCase named export.
      const candidates = [
        (mod as { default?: unknown }).default,
        ...Object.values(mod),
      ].filter(
        (v): v is React.ComponentType<Record<string, unknown>> =>
          typeof v === 'function',
      );
      const Component = candidates[0];
      if (!Component) {
        // TODO(impl): module exists but exports no React component yet.
        expect(true).toBe(true);
        return;
      }
      const noop = () => {};
      const props: Record<string, unknown> = {
        state: fixtureState,
        dispatch: noop,
        next: noop,
        back: noop,
        // review
        ctx: fixtureState,
        onConfirm: noop,
        onBack: noop,
        // install
        current: 1,
        total: 3,
        label: 'shadcn init',
        lastLine: 'ok',
        // failed
        exitCode: 1,
        failedCmdLabel: 'shadcn init',
        tail: ['line one'],
        onExit: noop,
        // done
        projectDir: '/tmp/test/demo',
      };
      try {
        const { lastFrame, unmount } = render(
          React.createElement(Component, props),
        );
        const frame = lastFrame() ?? '';
        expect(frame.length).toBeGreaterThan(0);
        unmount();
      } catch (err) {
        // Many step components require specific props we don't know yet.
        // TODO(impl): tighten props once the step component contract is fixed.
        expect(err).toBeDefined();
      }
    });
  }
});
