import { describe, expect, it } from "vitest";
import { stableHash } from "../../src/engine/hash";
import {
  applySessionAction,
  createSession,
  defaultSessionConfig,
  focusSessionBlocks,
  sessionBlocks,
  sessionView,
} from "../../src/engine/session";
import { optimalPolicy, runMechanic } from "../../src/engine/simulate";
import type { SessionAction, SessionConfig } from "../../src/engine/types";

function buildScenario(seed: number): { config: SessionConfig; actions: SessionAction[] } {
  const config = defaultSessionConfig(seed);
  const actions: SessionAction[] = [{ type: "begin" }];
  for (let index = 0; index < config.blocks.length; index += 1) {
    const block = config.blocks[index];
    if (!block) continue;
    const blockSeed = (config.seed + (index + 1) * 1009) >>> 0;
    const run = runMechanic(
      block.mechanic,
      blockSeed,
      block.difficulty,
      block.trials,
      optimalPolicy,
    );
    actions.push(...run.actions);
    actions.push({ type: "next" });
  }
  return { config, actions };
}

function applyAll(state: ReturnType<typeof createSession>, actions: SessionAction[]) {
  return actions.reduce((current, action) => applySessionAction(current, action), state);
}

describe("session", () => {
  it("builds a four-block starter session", () => {
    const config = defaultSessionConfig(123);
    expect(config.blocks).toHaveLength(4);
    expect(config.blocks.map((block) => block.mechanic)).toEqual([
      "nback",
      "gonogo",
      "reasoning",
      "speed",
    ]);
    const state = createSession(config);
    expect(state.phase).toBe("ready");
    expect(sessionView(state).blockLabel).toBe("N-back");
  });

  it("builds a quick two-block session with the chosen difficulty", () => {
    const config = defaultSessionConfig(7, 3, "quick");
    expect(config.blocks).toHaveLength(2);
    expect(config.label).toBe("Quick session");
    expect(config.blocks.every((block) => block.difficulty === 3)).toBe(true);
  });

  it("rotates the quick lineup so every mechanic appears across seeds", () => {
    const pairs = new Set<string>();
    const seen = new Set<string>();
    for (let seed = 1; seed <= 8; seed += 1) {
      const config = defaultSessionConfig(seed, 2, "quick");
      expect(config.blocks).toHaveLength(2);
      pairs.add(config.blocks.map((block) => block.mechanic).join(","));
      for (const block of config.blocks) seen.add(block.mechanic);
    }
    expect(pairs.size).toBeGreaterThan(1);
    expect([...seen].sort()).toEqual(["gonogo", "nback", "reasoning", "speed"]);
    expect(defaultSessionConfig(5, 2, "quick")).toEqual(defaultSessionConfig(5, 2, "quick"));
  });

  it("builds a standard four-block session with the chosen difficulty", () => {
    const config = defaultSessionConfig(7, 1, "standard");
    expect(config.blocks).toHaveLength(4);
    expect(config.blocks.every((block) => block.difficulty === 1)).toBe(true);
  });

  it("runs every block and completes", () => {
    const { config, actions } = buildScenario(123);
    const state = applyAll(createSession(config), actions);
    expect(state.phase).toBe("complete");
    expect(state.results).toHaveLength(4);
    expect(state.results.map((result) => result.mechanic)).toEqual([
      "nback",
      "gonogo",
      "reasoning",
      "speed",
    ]);
    expect(state.results.map((result) => result.difficulty)).toEqual(
      config.blocks.map((block) => block.difficulty),
    );
    for (const result of state.results) {
      expect(result.metrics.accuracy).toBeGreaterThan(0.7);
      expect(result.stateHash).toMatch(/^[0-9a-f]{16}$/);
    }
  });

  it("is deterministic from the same seed and action stream", () => {
    const first = buildScenario(456);
    const second = buildScenario(456);
    const stateA = applyAll(createSession(first.config), first.actions);
    const stateB = applyAll(createSession(second.config), second.actions);
    expect(stableHash(stateA)).toBe(stableHash(stateB));
    expect(first.actions).toEqual(second.actions);
  });

  it("rejects advancing before begin", () => {
    const state = createSession(defaultSessionConfig(1));
    const next = applySessionAction(state, { type: "advance", ms: 100 });
    expect(next.phase).toBe("ready");
    expect(next.error).toMatch(/not running/i);
  });

  it("rejects a second begin", () => {
    const state = applySessionAction(createSession(defaultSessionConfig(1)), { type: "begin" });
    const twice = applySessionAction(state, { type: "begin" });
    expect(twice.error).toMatch(/already begun/i);
  });

  it("rejects next before a block is complete", () => {
    const state = applySessionAction(createSession(defaultSessionConfig(1)), { type: "begin" });
    const next = applySessionAction(state, { type: "next" });
    expect(next.error).toMatch(/no completed block/i);
  });

  it("aborts cleanly", () => {
    const state = applySessionAction(createSession(defaultSessionConfig(1)), { type: "begin" });
    const aborted = applySessionAction(state, { type: "abort" });
    expect(aborted.phase).toBe("aborted");
    expect(aborted.current).toBeNull();
  });

  it("shows block progress in the view", () => {
    const state = applySessionAction(createSession(defaultSessionConfig(1)), { type: "begin" });
    const view = sessionView(state);
    expect(view.blockIndex).toBe(0);
    expect(view.blockCount).toBe(4);
    expect(view.blockDifficulty).toBe(2);
    expect(view.progressCurrent).toBe(1);
    expect(view.progressTotal).toBe(4);
    expect(view.mechanic?.mechanic).toBe("nback");
  });

  it("builds a three-block focus session for a single mechanic", () => {
    const blocks = focusSessionBlocks(2, "reasoning");
    expect(blocks).toHaveLength(3);
    expect(blocks.every((block) => block.mechanic === "reasoning")).toBe(true);
    const config = defaultSessionConfig(9, 2, "standard", undefined, "speed");
    expect(config.label).toBe("Focus session");
    expect(config.blocks.map((block) => block.mechanic)).toEqual(["speed", "speed", "speed"]);
  });

  it("filters the standard lineup by mechanic without changing defaults", () => {
    const blocks = sessionBlocks(2, "standard", undefined, ["gonogo"]);
    expect(blocks.map((block) => block.mechanic)).toEqual(["gonogo"]);
    expect(defaultSessionConfig(9).blocks).toHaveLength(4);
  });

  it("applies adaptive levels inside focus sessions", () => {
    const config = defaultSessionConfig(9, 2, "standard", { speed: 3 }, "speed");
    expect(config.blocks).toHaveLength(3);
    expect(config.blocks.every((block) => block.mechanic === "speed")).toBe(true);
    expect(config.blocks.every((block) => block.difficulty === 3)).toBe(true);
  });
});
