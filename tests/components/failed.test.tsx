import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { Failed } from '../../src/steps/failed.js';

describe('Failed component', () => {
  it('renders install-failed title, failedCmdLabel, exit code, and tail lines', () => {
    const { lastFrame, unmount } = render(
      <Failed
        exitCode={1}
        failedCmdLabel="shadcn init"
        tail={['line one', 'line two']}
        onExit={() => {}}
      />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Install failed');
    expect(frame).toContain('shadcn init');
    expect(frame).toContain('exit 1');
    expect(frame).toContain('line one');
    expect(frame).toContain('line two');
    unmount();
  });
});
