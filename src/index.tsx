import React from "react";
import { render } from "ink";
import { App } from "./app.js";
import { validateProjectName } from "./utils/validate-project-name.js";

const positional = process.argv.slice(2).find((a) => !a.startsWith("-"));

let initialProjectName: string | undefined;
if (positional) {
  const err = validateProjectName(positional, process.cwd());
  if (err) {
    process.stderr.write(`create-shadcn-app: ${err}\n`);
    process.exit(1);
  }
  initialProjectName = positional;
}

render(<App initialProjectName={initialProjectName} />);
