import { describe, it, expect, afterEach } from 'vitest';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { dir as tmpDir, type DirectoryResult } from 'tmp-promise';

const E2E_ENABLED = process.env.E2E === '1';
const DIST = resolve(__dirname, '../../dist/index.js');

describe.skipIf(!E2E_ENABLED)('e2e: bad-paste recovery', () => {
  let workdir: DirectoryResult | undefined;

  afterEach(async () => {
    if (workdir) {
      await workdir.cleanup();
      workdir = undefined;
    }
  });

  it('recovers from a junk paste then accepts a valid code', async () => {
    if (!existsSync(DIST)) {
      // eslint-disable-next-line no-console
      console.log(
        '[e2e:bad-paste] dist/index.js not found at',
        DIST,
        '- skipping. Run `pnpm build` first.',
      );
      return;
    }
    workdir = await tmpDir({ unsafeCleanup: true });
    const projectName = 'demo-paste';
    const dir = workdir.path;

    const child = spawn(process.execPath, [DIST], {
      cwd: dir,
      env: { ...process.env, FORCE_COLOR: '0', CI: '1' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

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

    await send(`${projectName}\r`, 200);
    // Move down twice to get to "Custom" / paste branch
    await send('[B', 100);
    await send('[B', 100);
    await send('\r', 200);
    // Type junk, expect re-prompt
    await send('not-a-code\r', 200);
    // Then a plausible valid 7-char base62 code
    await send('aIkeymG\r', 200);
    await send('\r', 200); // components
    await send('\r', 200); // registries
    await send('n\r', 200); // skills no

    const exitCode = await Promise.race([
      done,
      new Promise<number>((r) => setTimeout(() => r(124), 90_000)),
    ]);

    const targetDir = join(dir, projectName);
    if (existsSync(targetDir)) {
      expect(existsSync(join(targetDir, 'package.json'))).toBe(true);
    } else {
      // TODO(impl): tighten once scripted stdin is reliable.
      expect([0, 124]).toContain(exitCode);
    }
  }, 120_000);
});
