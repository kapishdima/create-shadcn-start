import React from "react";
import { render } from "ink";
import { App, type AppOutcome } from "./app.js";
import { Done } from "./steps/done.js";
import { runInstall } from "./utils/run-install.js";
import { validateProjectName } from "./utils/validate-project-name.js";

const positional = process.argv.slice(2).find((a) => !a.startsWith("-"));

let initialProjectName: string | undefined;
if (positional) {
  const err = validateProjectName(positional, process.cwd());
  if (err) {
    process.stderr.write(`create-shadcn-start: ${err}\n`);
    process.exit(1);
  }
  initialProjectName = positional;
}

const outcomeRef: { current: AppOutcome } = { current: { kind: "cancelled" } };

const wizard = render(
  <App
    initialProjectName={initialProjectName}
    onComplete={(o) => {
      outcomeRef.current = o;
    }}
  />
);

await wizard.waitUntilExit();

if (outcomeRef.current.kind !== "install") {
  process.exit(0);
}

const ctx = outcomeRef.current.ctx;
const result = await runInstall(ctx);

if (!result.ok) {
  process.stderr.write(
    `\ncreate-shadcn-start: install failed at ${result.failedCmdLabel} (exit ${result.exitCode})\n`
  );
  process.exit(result.exitCode);
}

const projectName = ctx.projectName ?? "your-app";
const projectDir = `${ctx.cwd}/${projectName}`;

const done = render(
  <Done
    projectName={projectName}
    pm={ctx.pm}
    projectDir={projectDir}
    onExit={() => done.unmount()}
  />
);

await done.waitUntilExit();
