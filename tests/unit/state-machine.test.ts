import { describe, it, expect } from "vitest";
import { createActor } from "xstate";
import {
  wizardMachine,
  isBackDisabled,
  footerModeFor,
  phaseFor,
  WIZARD_PHASE_TOTAL,
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
    expect(a.getSnapshot().value).toBe("review");

    a.send({ type: "SUBMIT_REVIEW" });
    expect(a.getSnapshot().value).toBe("install");
  });

  it("back stack: forward 4 then back 4 returns to project-name with fields preserved", () => {
    const a = start();
    a.send({ type: "SUBMIT_PROJECT_NAME", projectName: "demo" });
    a.send({ type: "SUBMIT_PRESET_SOURCE", presetSource: "curated" });
    a.send({ type: "SUBMIT_PRESET_CODE", presetCode: "aIkeymG" });
    a.send({ type: "SUBMIT_COMPONENTS", components: ["button"] });

    for (let i = 0; i < 4; i++) {
      a.send({ type: "BACK" });
    }
    const s = a.getSnapshot();
    expect(s.value).toBe("project-name");
    expect(s.context.projectName).toBe("demo");
    expect(s.context.presetCode).toBe("aIkeymG");
    expect(s.context.components).toEqual(["button"]);
  });

  it("skip path clears presetCode and jumps from preset-choice to components", () => {
    const a = start();
    a.send({ type: "SUBMIT_PROJECT_NAME", projectName: "demo" });
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

  it("seeded projectName auto-advances past project-name into preset-choice", () => {
    const a = createActor(wizardMachine, {
      input: { pm: "pnpm", cwd: "/tmp/test", projectName: "demo" },
    }).start();
    expect(a.getSnapshot().value).toBe("preset-choice");
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
    a.send({ type: "SUBMIT_PRESET_SOURCE", presetSource: "skip" });
    expect(a.getSnapshot().value).toBe("components");

    a.send({ type: "BACK" });
    expect(a.getSnapshot().value).toBe("preset-choice");
  });

  it("components BACK after curated path returns to preset-curated", () => {
    const a = start();
    a.send({ type: "SUBMIT_PROJECT_NAME", projectName: "demo" });
    a.send({ type: "SUBMIT_PRESET_SOURCE", presetSource: "curated" });
    a.send({ type: "SUBMIT_PRESET_CODE", presetCode: "X" });
    expect(a.getSnapshot().value).toBe("components");

    a.send({ type: "BACK" });
    expect(a.getSnapshot().value).toBe("preset-curated");
  });

  it("scene meta exposes footer mode and back-allowed for each step", () => {
    expect(footerModeFor("project-name")).toBe("first");
    expect(footerModeFor("preset-choice")).toBe("default");
    expect(footerModeFor("install")).toBe("terminal");

    expect(isBackDisabled("project-name")).toBe(true);
    expect(isBackDisabled("install")).toBe(true);
    expect(isBackDisabled("preset-choice")).toBe(false);
    expect(isBackDisabled("components")).toBe(false);
  });

  it("clearLastRejected fires on entering a new state", () => {
    const a = start();
    a.send({ type: "BACK" });
    expect(a.getSnapshot().context.lastRejected).toBeDefined();
    a.send({ type: "SUBMIT_PROJECT_NAME", projectName: "demo" });
    expect(a.getSnapshot().value).toBe("preset-choice");
    expect(a.getSnapshot().context.lastRejected).toBeUndefined();
  });

  it("skills SUBMIT_SKILLS arrives in review; SUBMIT_REVIEW arrives in install; BACK from review returns to skills", () => {
    const a = start();
    a.send({ type: "SUBMIT_PROJECT_NAME", projectName: "demo" });
    a.send({ type: "SUBMIT_PRESET_SOURCE", presetSource: "skip" });
    a.send({ type: "SUBMIT_COMPONENTS", components: [] });
    a.send({ type: "SUBMIT_REGISTRIES", registries: [], customRegistries: [] });

    a.send({ type: "SUBMIT_SKILLS", installShadcnSkill: false });
    expect(a.getSnapshot().value).toBe("review");

    a.send({ type: "BACK" });
    expect(a.getSnapshot().value).toBe("skills");

    a.send({ type: "SUBMIT_SKILLS", installShadcnSkill: true });
    expect(a.getSnapshot().value).toBe("review");

    a.send({ type: "SUBMIT_REVIEW" });
    expect(a.getSnapshot().value).toBe("install");
  });
});

describe("wizard machine - phase metadata", () => {
  it("WIZARD_PHASE_TOTAL is 6", () => {
    expect(WIZARD_PHASE_TOTAL).toBe(6);
  });

  it("phaseFor returns null for install", () => {
    expect(phaseFor("install")).toBeNull();
  });

  it("phaseFor returns correct phase for each input step", () => {
    expect(phaseFor("project-name")).toBe(1);
    expect(phaseFor("preset-choice")).toBe(2);
    expect(phaseFor("preset-curated")).toBe(2);
    expect(phaseFor("preset-random")).toBe(2);
    expect(phaseFor("preset-paste")).toBe(2);
    expect(phaseFor("components")).toBe(3);
    expect(phaseFor("registries")).toBe(4);
    expect(phaseFor("skills")).toBe(5);
    expect(phaseFor("review")).toBe(6);
  });
});
