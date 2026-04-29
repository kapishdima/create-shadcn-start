// Known-good preset codes for use in tests when the vendored
// shadcn-preset module is not yet available.
//
// TODO(impl): regenerate from real encodePreset(generateRandomConfig())
// once src/vendored/shadcn-preset.ts exists. For now these are plausible
// 7-character base62 strings that should pattern-match isPresetCode's
// length+alphabet contract once implemented.
export const KNOWN_GOOD_PRESET_CODES: ReadonlyArray<string> = [
  'aIkeymG',
  'bX3pQz1',
  'M9nLk0v',
  'tHr8sCy',
  '0jWpNeR',
  'Q4mZxA8',
  'pK1ufBd',
  'Yc7VnTo',
];

export const INVALID_PRESET_CODES: ReadonlyArray<string> = [
  '',
  '   ',
  '$$$invalid',
  'tooshort',
  // a code with one base62-looking position replaced by a non-base62 char:
  'aIke!mG',
];
