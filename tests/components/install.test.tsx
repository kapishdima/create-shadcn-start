import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { Install } from '../../src/steps/install.js';

describe('Install component', () => {
  it('renders progress indicator with current, total, label, and lastLine', () => {
    const { lastFrame, unmount } = render(
      <Install current={2} total={5} label="shadcn add button" lastLine="install ok" />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('[2/5]');
    expect(frame).toContain('shadcn add button');
    expect(frame).toContain('install ok');
    unmount();
  });

  it('renders without throwing when no props are provided and shows Installing title', () => {
    const { lastFrame, unmount } = render(<Install />);
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Installing');
    unmount();
  });
});
