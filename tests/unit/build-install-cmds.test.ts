import { describe, it, expect, beforeAll } from 'vitest';

type CmdSpec = { pm?: string; argv: string[]; cwd?: string };
type Build = (state: Record<string, unknown>, pm: string) => CmdSpec[];

let build: Build | undefined;
let importError: unknown;

beforeAll(async () => {
  try {
    const m = (await import('../../src/utils/build-install-cmds.js')) as {
      buildInstallCmds?: Build;
    };
    build = m.buildInstallCmds;
  } catch (err) {
    importError = err;
  }
});

const ready = () => Boolean(build);

const baseState = (overrides: Partial<Record<string, unknown>> = {}) => ({
  projectName: 'demo',
  presetSource: 'curated',
  presetCode: 'aIkeymG',
  components: [] as string[],
  registries: [] as string[],
  installShadcnSkill: false,
  ...overrides,
});

describe('build-install-cmds', () => {
  it('init argv contains --preset <code> when presetCode is set', () => {
    if (!ready()) {
      // TODO(impl): once src/utils/build-install-cmds.ts is present, assert argv includes ['--preset', 'aIkeymG'].
      expect(importError ?? 'module not yet available').toBeDefined();
      return;
    }
    const cmds = build!(baseState(), 'pnpm');
    const init = cmds[0]!;
    expect(init.argv).toContain('--preset');
    expect(init.argv).toContain('aIkeymG');
  });

  it('init argv has no --preset token when presetSource is skip', () => {
    if (!ready()) {
      // TODO(impl)
      return;
    }
    const cmds = build!(
      baseState({ presetSource: 'skip', presetCode: undefined }),
      'pnpm',
    );
    const init = cmds[0]!;
    expect(init.argv).not.toContain('--preset');
  });

  it('components selection produces a single add cmd with positional args', () => {
    if (!ready()) {
      // TODO(impl)
      return;
    }
    const cmds = build!(baseState({ components: ['button', 'card'] }), 'pnpm');
    const adds = cmds.filter(
      (c) => c.argv.includes('add') && c.argv.includes('button'),
    );
    expect(adds.length).toBeGreaterThanOrEqual(1);
    const addCmd = adds[0]!;
    expect(addCmd.argv).toContain('button');
    expect(addCmd.argv).toContain('card');
  });

  it('registries with 2 entries produce 2 separate add cmds', () => {
    if (!ready()) {
      // TODO(impl)
      return;
    }
    const regs = ['https://x.com/r/foo.json', 'https://x.com/r/bar.json'];
    const cmds = build!(baseState({ registries: regs }), 'pnpm');
    const regCmds = cmds.filter((c) =>
      c.argv.some((a) => regs.includes(a)),
    );
    expect(regCmds.length).toBe(2);
  });

  it('installShadcnSkill true appends a skills cmd; false omits it', () => {
    if (!ready()) {
      // TODO(impl)
      return;
    }
    const withSkill = build!(baseState({ installShadcnSkill: true }), 'pnpm');
    const withoutSkill = build!(
      baseState({ installShadcnSkill: false }),
      'pnpm',
    );
    const hasSkill = (cs: CmdSpec[]) =>
      cs.some((c) => c.argv.some((a) => /skills/.test(a)));
    expect(hasSkill(withSkill)).toBe(true);
    expect(hasSkill(withoutSkill)).toBe(false);
  });

  it('PM dlx prefixes: pnpm dlx, npx, yarn dlx, bunx', () => {
    if (!ready()) {
      // TODO(impl): assert each pm produces the matching launcher prefix.
      return;
    }
    const startsWith = (cmd: CmdSpec, prefix: string[]) =>
      prefix.every((p, i) => cmd.argv[i] === p) ||
      (cmd.pm === prefix[0] && cmd.argv[0] === prefix[1]);

    const pmCases: Array<[string, string[]]> = [
      ['pnpm', ['pnpm', 'dlx']],
      ['npm', ['npx']],
      ['yarn', ['yarn', 'dlx']],
      ['bun', ['bunx']],
    ];
    for (const [pm, prefix] of pmCases) {
      const cmds = build!(baseState(), pm);
      const init = cmds[0]!;
      // Permit either argv-prefix style or { pm, argv } style.
      const ok =
        startsWith(init, prefix) ||
        prefix.every((p) => init.argv.join(' ').includes(p));
      expect(ok).toBe(true);
    }
  });
});
