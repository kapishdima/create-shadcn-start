import { describe, it, expect } from "vitest";
import { createActor } from "xstate";
import {
  wizardMachine,
  isBackDisabled,
  phaseFor,
  stepStatusFor,
  WIZARD_PHASE_TOTAL,
  DEFAULT_INIT_OPTIONS,
} from "../../src/machine.js";

function start() {
  return createActor(wizardMachine, {
    input: { pm: "pnpm", cwd: "/tmp/test" },
  }).start();
}

describe("wizard machine", () => {
  it("linear forward path: project-name -> ... -> install", () => {
    const a = start();
    expect(a.getSnapshot().value).toBe("project-name");

    a.send({ type: "SUBMIT_PROJECT_NAME", projectName: "demo" });
    expect(a.getSnapshot().value).toBe("framework");

    a.send({ type: "SUBMIT_FRAMEWORK", framework: "next" });
    expect(a.getSnapshot().value).toBe("preset-choice");

    a.send({ type: "SUBMIT_PRESET_SOURCE", presetSource: "curated" });
    expect(a.getSnapshot().value).toBe("preset-curated");

    a.send({ type: "SUBMIT_PRESET_CODE", presetCode: "aIkeymG" });
    expect(a.getSnapshot().value).toBe("components");

    a.send({ type: "SUBMIT_COMPONENTS", components: [] });
    expect(a.getSnapshot().value).toBe("registries");

    a.send({
      type: "SUBMIT_REGISTRIES",
      registries: [],
      customRegistries: [],
    });
    expect(a.getSnapshot().value).toBe("skills");

    a.send({ type: "SUBMIT_SKILLS", installShadcnSkill: false });
    expect(a.getSnapshot().value).toBe("init-options");

    a.send({
      type: "SUBMIT_INIT_OPTIONS",
      initOptions: DEFAULT_INIT_OPTIONS,
    });
    expect(a.getSnapshot().value).toBe("review");

    a.send({ type: "SUBMIT_REVIEW" });
    expect(a.getSnapshot().value).toBe("install");
  });

  it("back stack: full forward then back returns to project-name with fields preserved", () => {
    const a = start();
    a.send({ type: "SUBMIT_PROJECT_NAME", projectName: "demo" });
    a.send({ type: "SUBMIT_FRAMEWORK", framework: "vite" });
    a.send({ type: "SUBMIT_PRESET_SOURCE", presetSource: "curated" });
    a.send({ type: "SUBMIT_PRESET_CODE", presetCode: "aIkeymG" });
    a.send({ type: "SUBMIT_COMPONENTS", components: ["button"] });

    for (let i = 0; i < 5; i++) {
      a.send({ type: "BACK" });
    }
    const s = a.getSnapshot();
    expect(s.value).toBe("project-name");
    expect(s.context.projectName).toBe("demo");
    expect(s.context.frameworkTemplate).toBe("vite");
    expect(s.context.presetCode).toBe("aIkeymG");
    expect(s.context.components).toEqual(["button"]);
  });

  it("skip path clears presetCode and jumps from preset-choice to components", () => {
    const a = start();
    a.send({ type: "SUBMIT_PROJECT_NAME", projectName: "demo" });
    a.send({ type: "SUBMIT_FRAMEWORK", framework: "next" });
    expect(a.getSnapshot().value).toBe("preset-choice");

    a.send({ type: "SUBMIT_PRESET_SOURCE", presetSource: "curated" });
    a.send({ type: "SUBMIT_PRESET_CODE", presetCode: "old" });
    expect(a.getSnapshot().context.presetCode).toBe("old");

    // back to preset-choice
    a.send({ type: "BACK" });
    a.send({ type: "BACK" });
    expect(a.getSnapshot().value).toBe("preset-choice");

    a.send({ type: "SUBMIT_PRESET_SOURCE", presetSource: "skip" });
    expect(a.getSnapshot().value).toBe("components");
    expect(a.getSnapshot().context.presetCode).toBeUndefined();
  });

  it("branch swap: curated -> A, back, random -> B, final code is B", () => {
    const a = start();
    a.send({ type: "SUBMIT_PROJECT_NAME", projectName: "demo" });
    a.send({ type: "SUBMIT_FRAMEWORK", framework: "next" });

    a.send({ type: "SUBMIT_PRESET_SOURCE", presetSource: "curated" });
    a.send({ type: "SUBMIT_PRESET_CODE", presetCode: "A" });
    expect(a.getSnapshot().context.presetCode).toBe("A");

    a.send({ type: "BACK" });
    a.send({ type: "BACK" });
    expect(a.getSnapshot().value).toBe("preset-choice");

    a.send({ type: "SUBMIT_PRESET_SOURCE", presetSource: "random" });
    a.send({ type: "SUBMIT_PRESET_CODE", presetCode: "B" });
    expect(a.getSnapshot().context.presetCode).toBe("B");
  });

  it("back from project-name is rejected with lastRejected set", () => {
    const a = start();
    a.send({ type: "BACK" });
    const s = a.getSnapshot();
    expect(s.value).toBe("project-name");
    expect(s.context.lastRejected).toEqual({
      kind: "back-disabled",
      from: "project-name",
    });
  });

  it("seeded projectName auto-advances past project-name into framework", () => {
    const a = createActor(wizardMachine, {
      input: { pm: "pnpm", cwd: "/tmp/test", projectName: "demo" },
    }).start();
    expect(a.getSnapshot().value).toBe("framework");
    expect(a.getSnapshot().context.projectName).toBe("demo");
    expect(a.getSnapshot().context.autoSkipName).toBe(false);

    a.send({ type: "BACK" });
    expect(a.getSnapshot().value).toBe("project-name");
    a.send({ type: "BACK" });
    expect(a.getSnapshot().value).toBe("project-name");
  });

  it("components BACK after skip path returns to preset-choice (not preset-curated)", () => {
    const a = start();
    a.send({ type: "SUBMIT_PROJECT_NAME", projectName: "demo" });
    a.send({ type: "SUBMIT_FRAMEWORK", framework: "next" });
    a.send({ type: "SUBMIT_PRESET_SOURCE", presetSource: "skip" });
    expect(a.getSnapshot().value).toBe("components");

    a.send({ type: "BACK" });
    expect(a.getSnapshot().value).toBe("preset-choice");
  });

  it("components BACK after curated path returns to preset-curated", () => {
    const a = start();
    a.send({ type: "SUBMIT_PROJECT_NAME", projectName: "demo" });
    a.send({ type: "SUBMIT_FRAMEWORK", framework: "next" });
    a.send({ type: "SUBMIT_PRESET_SOURCE", presetSource: "curated" });
    a.send({ type: "SUBMIT_PRESET_CODE", presetCode: "X" });
    expect(a.getSnapshot().value).toBe("components");

    a.send({ type: "BACK" });
    expect(a.getSnapshot().value).toBe("preset-curated");
  });

  it("framework BACK returns to project-name preserving the name", () => {
    const a = start();
    a.send({ type: "SUBMIT_PROJECT_NAME", projectName: "demo" });
    expect(a.getSnapshot().value).toBe("framework");
    a.send({ type: "BACK" });
    const s = a.getSnapshot();
    expect(s.value).toBe("project-name");
    expect(s.context.projectName).toBe("demo");
  });

  it("preset-choice BACK returns to framework preserving the template", () => {
    const a = start();
    a.send({ type: "SUBMIT_PROJECT_NAME", projectName: "demo" });
    a.send({ type: "SUBMIT_FRAMEWORK", framework: "vite" });
    expect(a.getSnapshot().value).toBe("preset-choice");
    a.send({ type: "BACK" });
    const s = a.getSnapshot();
    expect(s.value).toBe("framework");
    expect(s.context.frameworkTemplate).toBe("vite");
  });

  it("scene meta exposes back-allowed for each step", () => {
    expect(isBackDisabled("project-name")).toBe(true);
    expect(isBackDisabled("install")).toBe(true);
    expect(isBackDisabled("framework")).toBe(false);
    expect(isBackDisabled("preset-choice")).toBe(false);
    expect(isBackDisabled("components")).toBe(false);
    expect(isBackDisabled("init-options")).toBe(false);
  });

  it("stepStatusFor reports done/active/pending relative to current phase", () => {
    expect(stepStatusFor(1, "project-name")).toBe("active");
    expect(stepStatusFor(2, "project-name")).toBe("pending");
    expect(stepStatusFor(1, "components")).toBe("done");
    expect(stepStatusFor(4, "components")).toBe("active");
    expect(stepStatusFor(5, "components")).toBe("pending");
    expect(stepStatusFor(3, "preset-curated")).toBe("active");
    expect(stepStatusFor(8, "install")).toBe("done");
    expect(stepStatusFor(1, "install")).toBe("done");
  });

  it("clearLastRejected fires on entering a new state", () => {
    const a = start();
    a.send({ type: "BACK" });
    expect(a.getSnapshot().context.lastRejected).toBeDefined();
    a.send({ type: "SUBMIT_PROJECT_NAME", projectName: "demo" });
    expect(a.getSnapshot().value).toBe("framework");
    expect(a.getSnapshot().context.lastRejected).toBeUndefined();
  });

  it("init-options arrives after skills; SUBMIT_INIT_OPTIONS reaches review; BACK chain works", () => {
    const a = start();
    a.send({ type: "SUBMIT_PROJECT_NAME", projectName: "demo" });
    a.send({ type: "SUBMIT_FRAMEWORK", framework: "next" });
    a.send({ type: "SUBMIT_PRESET_SOURCE", presetSource: "skip" });
    a.send({ type: "SUBMIT_COMPONENTS", components: [] });
    a.send({ type: "SUBMIT_REGISTRIES", registries: [], customRegistries: [] });

    a.send({ type: "SUBMIT_SKILLS", installShadcnSkill: false });
    expect(a.getSnapshot().value).toBe("init-options");

    a.send({
      type: "SUBMIT_INIT_OPTIONS",
      initOptions: { ...DEFAULT_INIT_OPTIONS, srcDir: true },
    });
    expect(a.getSnapshot().value).toBe("review");
    expect(a.getSnapshot().context.initOptions.srcDir).toBe(true);

    a.send({ type: "BACK" });
    expect(a.getSnapshot().value).toBe("init-options");
    a.send({ type: "BACK" });
    expect(a.getSnapshot().value).toBe("skills");

    a.send({ type: "SUBMIT_SKILLS", installShadcnSkill: true });
    expect(a.getSnapshot().value).toBe("init-options");

    a.send({
      type: "SUBMIT_INIT_OPTIONS",
      initOptions: DEFAULT_INIT_OPTIONS,
    });
    expect(a.getSnapshot().value).toBe("review");

    a.send({ type: "SUBMIT_REVIEW" });
    expect(a.getSnapshot().value).toBe("install");
  });
});

describe("wizard machine - phase metadata", () => {
  it("WIZARD_PHASE_TOTAL is 8", () => {
    expect(WIZARD_PHASE_TOTAL).toBe(8);
  });

  it("phaseFor returns null for install", () => {
    expect(phaseFor("install")).toBeNull();
  });

  it("phaseFor returns correct phase for each input step", () => {
    expect(phaseFor("project-name")).toBe(1);
    expect(phaseFor("framework")).toBe(2);
    expect(phaseFor("preset-choice")).toBe(3);
    expect(phaseFor("preset-curated")).toBe(3);
    expect(phaseFor("preset-random")).toBe(3);
    expect(phaseFor("preset-paste")).toBe(3);
    expect(phaseFor("components")).toBe(4);
    expect(phaseFor("registries")).toBe(5);
    expect(phaseFor("skills")).toBe(6);
    expect(phaseFor("init-options")).toBe(7);
    expect(phaseFor("review")).toBe(8);
  });
});
