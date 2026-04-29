import chalk from "chalk";

const HEX_RE = /^#?[0-9a-fA-F]{6}$/;

// Render a small color chip as two background-colored spaces. Pure ASCII -
// no Unicode block glyphs anywhere.
export function swatch(hex: string, width: number = 2): string {
  if (!HEX_RE.test(hex)) {
    throw new Error(`swatch: invalid hex color ${JSON.stringify(hex)}`);
  }
  const normalized = hex.startsWith("#") ? hex : `#${hex}`;
  return chalk.bgHex(normalized)(" ".repeat(width));
}
