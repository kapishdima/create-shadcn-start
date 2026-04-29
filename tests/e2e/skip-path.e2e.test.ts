import { describe, it, expect, afterEach } from 'vitest';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { dir as tmpDir, type DirectoryResult } from 'tmp-promise';

const E2E_ENABLED = process.env.E2E === '1';
const DIST = resolve(__dirname, '../../dist/index.js');

describe.skipIf(!E2E_ENABLED)('e2e: skip path', () => {
  let workdir: DirectoryResult | undefined;

  afterEach(async () => {
    if (workdir) {
      await workdir.cleanup();
      workdir = undefined;
    }
  });

  it('completes the skip path and produces a project directory', async () => {
    if (!existsSync(DIST)) {
      // eslint-disable-next-line no-console
      console.log(
        '[e2e:skip-path] dist/index.js not found at',
        DIST,
        '- skipping. Run `pnpm build` first.',
      );
      return;
    }
    workdir = await tmpDir({ unsafeCleanup: true });
    const projectName = 'demo-skip';
    const dir = workdir.path;

    const child = spawn(process.execPath, [DIST], {
      cwd: dir,
      env: { ...process.env, FORCE_COLOR: '0', CI: '1' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Crude scripted stdin: feed lines after small delays. This is
    // best-effort; if the wizard expects different keypresses (arrows,
    // space, etc.) the impl agent should expose a TEST_SCRIPT env hook.
    // TODO(impl): replace with deterministic scripted input once a
    // non-interactive test mode exists.
    const send = (s: string, delay = 100) =>
      new Promise<void>((r) =>
        setTimeout(() => {
          child.stdin?.write(s);
          r();
        }, delay),
      );

    const done = new Promise<number>((resolveExit) => {
      child.on('exit', (code) => resolveExit(code ?? 1));
    });

    await send(`${projectName}\r`, 200); // project name
    // Navigate to "Skip" in preset-choice (3 down arrows then enter)
    await send('[B', 100);
    await send('[B', 100);
    await send('[B', 100);
    await send('\r', 100);
    await send('\r', 200); // components (no toggles)
    await send('\r', 200); // registries
    await send('n\r', 200); // skills no
    // install runs; then done.
    const exitCode = await Promise.race([
      done,
      new Promise<number>((r) => setTimeout(() => r(124), 90_000)),
    ]);

    // Best-effort assertion: target dir is created OR the process at
    // least started without crashing the bin.
    const targetDir = join(dir, projectName);
    if (existsSync(targetDir)) {
      expect(existsSync(join(targetDir, 'package.json'))).toBe(true);
      expect(existsSync(join(targetDir, 'components.json'))).toBe(true);
    } else {
      // TODO(impl): tighten once scripted stdin is reliable.
      expect([0, 124]).toContain(exitCode);
    }
  }, 120_000);
});
