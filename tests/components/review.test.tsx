import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { Review } from '../../src/steps/review.js';
import { DEFAULT_INIT_OPTIONS, type WizardContext } from '../../src/machine.js';

const fixtureCtx: WizardContext = {
  pm: 'pnpm',
  cwd: '/tmp/test',
  history: [],
  projectName: 'demo',
  frameworkTemplate: 'next',
  presetSource: 'curated',
  presetCode: 'abc123',
  components: ['button', 'card'],
  registries: ['https://example.com/r'],
  customRegistries: [],
  installShadcnSkill: true,
  initOptions: DEFAULT_INIT_OPTIONS,
  autoSkipName: false,
};

describe('Review component', () => {
  it('renders summary rows with all fixture values', () => {
    const { lastFrame, unmount } = render(
      <Review ctx={fixtureCtx} onConfirm={() => {}} onBack={() => {}} />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('demo');
    expect(frame).toContain('curated');
    expect(frame).toContain('abc123');
    expect(frame).toContain('button');
    expect(frame).toContain('card');
    unmount();
  });
});
