# create-shadcn-app

Interactive scaffolder for shadcn-based projects.

## Quick start

```
npm create shadcn-app@latest
pnpm create shadcn-app
yarn create shadcn-app
bunx create-shadcn-app
```

Pick whichever matches your package manager. The CLI auto-detects which one invoked it and uses the same one for the rest of the install.

## What it does

Walks you through a short wizard, then hands off to `shadcn init` and `shadcn add` to create the project on disk:

- Project name (kebab-case, must not collide with an existing directory).
- Preset choice: curated, random, custom (paste a code), or skip.
- Components to install (multi-select from the shadcn UI catalog).
- Third-party registries to add (multi-select, plus paste-arbitrary-URL).
- Whether to install the shadcn agent skill (for Claude Code, Cursor, and similar agents).
- Install — runs `shadcn init` + `shadcn add` as subprocesses, streams output.
- Done — prints next steps.

## Requirements

- Node 20 or higher.
- One of: npm, pnpm, yarn, bun.

The CLI itself has no other system requirements. `shadcn init` will install framework dependencies (Next.js by default) into the new project directory.

## Wizard walkthrough

### Project name

Text input. Validates that the name is kebab-case and that no directory with that name already exists in the current working directory. Press Enter to confirm, Esc is a no-op (this is the first step).

### Preset choice

A four-option select: Curated, Random, Custom, Skip. Each option leads to its own sub-step, except Skip which jumps straight to Components.

### Curated

Scrollable list of presets bundled in the package. Each row shows the preset name, a small set of color swatches (rendered with `chalk.bgHex`), and a one-line description. Arrow keys move the highlight, Enter confirms.

### Random

Generates a preset code locally using the vendored shadcn algorithm. Shows the code and a preview URL of the form `https://ui.shadcn.com/create?preset=<code>`. Actions: Accept, Re-roll, Open preview (launches your browser).

### Custom (paste)

Prints the link `https://ui.shadcn.com/create` and optionally opens it in your browser. Design a preset on the web, copy the code, paste it into the text input. The CLI validates the pasted string with the vendored `isPresetCode` function and re-prompts on invalid input.

### Skip

Jumps past the preset sub-steps. The CLI omits the `--preset` flag from `shadcn init`, so shadcn applies its default theme.

### Components

Multi-select checkbox list backed by `src/data/components.json`. A small set of common components is pre-checked by default (button, input, card, dialog, etc.). Space toggles a row, Enter confirms.

### Registries

Multi-select checkbox list backed by `src/data/registries.json`. A final option lets you paste an arbitrary registry URL.

### Skills

Yes/no prompt: install the shadcn agent skill into the new project. Default is yes. When yes, the CLI runs `npx skills@latest add shadcn-ui/ui --skill shadcn` from inside the project directory after the rest of the install completes.

### Install

Runs the built command list as subprocesses via `execa`. Output streams into the Ink UI line-by-line. Back is hard-disabled here. Ctrl+C cancels and cleans up.

### Done

Terminal screen. Prints `cd <name>` and the package-manager-appropriate `dev` command.

## Screenshots

Screenshots TBD.

## Preset codes

Four ways to choose a theme:

- **Curated** presets ship in `src/data/presets.json`. Source of truth is the user's curated list at `dialectcn.xyz`.
- **Random** generates a base62 code locally using a vendored copy of shadcn's `generateRandomConfig` and `encodePreset`. The CLI prints a preview URL of the form `https://ui.shadcn.com/create?preset=<code>` so you can see the theme in the browser before accepting.
- **Custom** sends you to `https://ui.shadcn.com/create` to design a preset, then accepts the code via paste. The pasted code is validated locally before the wizard advances.
- **Skip** omits `--preset` from the `shadcn init` invocation; shadcn applies its built-in default theme.

The vendored preset code lives at `src/vendored/shadcn-preset.ts` (MIT, attributed in the file header).

## Configuration

Three JSON files are bundled at publish time and read at runtime:

- `src/data/presets.json` — curated preset catalog.
- `src/data/components.json` — shadcn UI component list with default-selected hints.
- `src/data/registries.json` — third-party registry catalog.

Refreshing any of these requires a new release of the CLI. There is no live fetch in v1.

## Contributing

This repo uses [Changesets](https://github.com/changesets/changesets) for versioning and changelog generation.

```
pnpm changeset
```

Answer the prompts to record a patch / minor / major bump and a short description. The release workflow opens a "Version Packages" PR; merging it publishes to npm with provenance.

Test commands:

```
pnpm test:unit
pnpm test:components
E2E=1 pnpm test:e2e
```

Unit and component tests run on every PR. E2E tests hit the real `shadcn` CLI and the network and run nightly on CI.

The repo is structured around four scope-specific subagents under `.claude/agents/`:

- `infra.md` — `package.json`, configs, workflows, lockfile.
- `impl.md` — everything under `src/`.
- `tests.md` — everything under `tests/`.
- `docs.md` — `README.md` and `CHANGELOG.md`.

Each agent has a tight scope and a "do not touch" boundary so they can run in parallel.

## License

MIT.

## Acknowledgements

- [shadcn-ui/ui](https://github.com/shadcn-ui/ui) — vendored preset encoding, decoding, and random-config code (MIT, attributed in `src/vendored/shadcn-preset.ts`).
- [dialectcn.xyz](https://dialectcn.xyz) — preset catalog inspiration.
- [Vercel Labs `skills`](https://github.com/vercel-labs/skills) — agent skill installer used for the optional shadcn skill step.
