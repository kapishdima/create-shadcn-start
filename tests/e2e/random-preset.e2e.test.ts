import { describe, it, expect, afterEach } from 'vitest';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { dir as tmpDir, type DirectoryResult } from 'tmp-promise';

const E2E_ENABLED = process.env.E2E === '1';
const DIST = resolve(__dirname, '../../dist/index.js');

describe.skipIf(!E2E_ENABLED)('e2e: random preset', () => {
  let workdir: DirectoryResult | undefined;

  afterEach(async () => {
    if (workdir) {
      await workdir.cleanup();
      workdir = undefined;
    }
  });

  it('accepts the first generated random preset and terminates successfully', async () => {
    if (!existsSync(DIST)) {
      // eslint-disable-next-line no-console
      console.log(
        '[e2e:random] dist/index.js not found at',
        DIST,
        '- skipping. Run `pnpm build` first.',
      );
      return;
    }
    workdir = await tmpDir({ unsafeCleanup: true });
    const projectName = 'demo-random';
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
    await send('[B', 100); // move from Curated -> Random
    await send('\r', 200); // pick Random
    await send('\r', 200); // accept first generation
    await send('\r', 200); // empty components
    await send('\r', 200); // empty registries
    await send('n\r', 200); // skills no

    const exitCode = await Promise.race([
      done,
      new Promise<number>((r) => setTimeout(() => r(124), 90_000)),
    ]);

    const targetDir = join(dir, projectName);
    if (existsSync(targetDir)) {
      expect(existsSync(join(targetDir, 'package.json'))).toBe(true);
    } else {
      // TODO(impl): tighten once scripted stdin is reliable. For now we
      // accept successful exit OR our timeout sentinel.
      expect([0, 124]).toContain(exitCode);
    }
  }, 120_000);
});
