# Vendored Code

This project bundles a small amount of upstream source code so the CLI can
encode, decode, validate, and generate preset codes without a network round
trip. Each vendored file lives under `src/vendored/` and carries an
attribution header pointing back to the original source and commit SHA.

## src/vendored/shadcn-preset.ts

- Upstream: shadcn-ui/ui (https://github.com/shadcn-ui/ui)
- Path: `packages/shadcn/src/preset/preset.ts`
- License: MIT
- Source URL:
  https://github.com/shadcn-ui/ui/blob/56161142f1b83f612462772d18883807b5f0d601/packages/shadcn/src/preset/preset.ts
- Pinned commit: `56161142f1b83f612462772d18883807b5f0d601`
- Vendored on: 2026-04-29

### Sync policy

Re-pull this file from upstream whenever shadcn changes preset constants or
the bit-packing layout. Bumps are typically triggered by:

- a new preset field being added to `PRESET_FIELDS_V2`
- a new entry being appended to one of the `PRESET_*` value arrays
- a new version prefix being introduced (currently only `"a"` and `"b"`)

Steps to refresh:

1. Run `curl -s https://raw.githubusercontent.com/shadcn-ui/ui/main/packages/shadcn/src/preset/preset.ts -o src/vendored/shadcn-preset.ts`.
2. Re-add the attribution header at the top of the file.
3. Update the commit SHA and date in this file.
4. Run `pnpm typecheck` and `pnpm test:unit`.
5. Add a changeset describing the bump.
