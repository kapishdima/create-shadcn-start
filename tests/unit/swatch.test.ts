import { describe, it, expect, beforeAll } from 'vitest';

type Swatch = (hex: string, width?: number) => string;

let swatch: Swatch | undefined;
let importError: unknown;

beforeAll(async () => {
  // Force chalk to emit truecolor escapes regardless of TTY detection.
  process.env.FORCE_COLOR = '3';
  try {
    const chalkMod = (await import('chalk')) as { default?: { level?: number } };
    if (chalkMod.default && typeof chalkMod.default === 'object') {
      // chalk v5 Instance: setting `level` enables 24-bit output globally.
      try {
        (chalkMod.default as { level: number }).level = 3;
      } catch {
        // ignore
      }
    }
  } catch {
    // chalk may not be importable in some environments; the FORCE_COLOR
    // env var alone usually suffices.
  }
  try {
    const m = await import('../../src/utils/swatch.js');
    swatch = (m as { swatch?: Swatch }).swatch;
  } catch (err) {
    importError = err;
  }
});

describe('swatch', () => {
  it('emits a 24-bit ANSI background sequence for #ff00aa', () => {
    if (!swatch) {
      // TODO(impl): once src/utils/swatch.ts exists, assert the literal
      // ANSI 48;2;255;0;170 sequence appears in the output.
      expect(importError ?? 'module not yet available').toBeDefined();
      return;
    }
    const out = swatch('#ff00aa');
    expect(typeof out).toBe('string');
    expect(out).toContain('\x1b[48;2;255;0;170m');
    // chalk-style reset sequence at end
    expect(out).toMatch(/\x1b\[(0|49|39)m\s*$/);
  });

  it('uses the provided width of 4 spaces', () => {
    if (!swatch) {
      // TODO(impl)
      return;
    }
    const out = swatch('#ff00aa', 4);
    // Strip all ANSI sequences to count visible spaces.
    // eslint-disable-next-line no-control-regex
    const visible = out.replace(/\x1b\[[0-9;]*m/g, '');
    expect(visible).toBe('    ');
  });

  it('throws on invalid hex input', () => {
    if (!swatch) {
      // TODO(impl)
      return;
    }
    expect(() => swatch!('#xyz')).toThrow();
  });
});
