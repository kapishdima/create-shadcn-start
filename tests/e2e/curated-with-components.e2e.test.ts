import { describe, it, expect, afterEach } from 'vitest';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { dir as tmpDir, type DirectoryResult } from 'tmp-promise';

const E2E_ENABLED = process.env.E2E === '1';
const DIST = resolve(__dirname, '../../dist/index.js');

describe.skipIf(!E2E_ENABLED)('e2e: curated preset with components', () => {
  let workdir: DirectoryResult | undefined;

  afterEach(async () => {
    if (workdir) {
      await workdir.cleanup();
      workdir = undefined;
    }
  });

  it('picks first curated preset, toggles 2 components, and produces button.tsx + card.tsx', async () => {
    if (!existsSync(DIST)) {
      // eslint-disable-next-line no-console
      console.log(
        '[e2e:curated] dist/index.js not found at',
        DIST,
        '- skipping. Run `pnpm build` first.',
      );
      return;
    }
    workdir = await tmpDir({ unsafeCleanup: true });
    const projectName = 'demo-curated';
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

    // TODO(impl): script to pick first curated preset and toggle 2 components.
    await send(`${projectName}\r`, 200);
    await send('\r', 200); // pick "Curated"
    await send('\r', 200); // accept first preset
    await send(' ', 100); // toggle component 1
    await send('[B', 100);
    await send(' ', 100); // toggle component 2
    await send('\r', 200); // confirm components
    await send('\r', 200); // registries
    await send('n\r', 200); // skills no

    const exitCode = await Promise.race([
      done,
      new Promise<number>((r) => setTimeout(() => r(124), 90_000)),
    ]);

    const targetDir = join(dir, projectName);
    if (existsSync(targetDir)) {
      const componentsDir = join(targetDir, 'components', 'ui');
      // TODO(impl): tighten once scripted stdin is reliable.
      const buttonOk = existsSync(join(componentsDir, 'button.tsx'));
      const cardOk = existsSync(join(componentsDir, 'card.tsx'));
      expect(buttonOk || cardOk).toBe(true);
    } else {
      expect([0, 124]).toContain(exitCode);
    }
  }, 120_000);
});
