// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import {
  adaptLevel,
  adaptLevels,
  applySessionResults,
  clearAdaptive,
  loadAdaptive,
  setAdaptiveEnabled,
} from "../../src/storage/adaptive";
import type { MechanicResult } from "../../src/engine/types";

function result(mechanic: MechanicResult["mechanic"], accuracy: number): MechanicResult {
  return {
    mechanic,
    domain: "working_memory",
    trials: 10,
    durationMs: 1000,
    metrics: { accuracy },
    summary: `${mechanic} summary`,
    seed: 7,
    stateHash: "0123456789abcdef",
  };
}

afterEach(() => {
  clearAdaptive();
});

describe("adaptive difficulty store", () => {
  it("stays fixed by default", () => {
    expect(loadAdaptive().enabled).toBe(false);
    expect(loadAdaptive().levels).toEqual({ nback: 2, gonogo: 2, reasoning: 2, speed: 2 });
  });

  it("toggles the experiment without touching levels", () => {
    setAdaptiveEnabled(true);
    expect(loadAdaptive().enabled).toBe(true);
    setAdaptiveEnabled(false);
    expect(loadAdaptive().enabled).toBe(false);
    expect(loadAdaptive().levels.nback).toBe(2);
  });
});

describe("adaptation rule", () => {
  it("steps up at 80 percent and caps at level 3", () => {
    expect(adaptLevel(2, 0.8)).toBe(3);
    expect(adaptLevel(3, 1)).toBe(3);
  });

  it("steps down below 60 percent and floors at level 1", () => {
    expect(adaptLevel(2, 0.59)).toBe(1);
    expect(adaptLevel(1, 0)).toBe(1);
  });

  it("holds the level in the middle band", () => {
    expect(adaptLevel(2, 0.6)).toBe(2);
    expect(adaptLevel(2, 0.79)).toBe(2);
  });

  it("uses the latest result per mechanic", () => {
    const { levels, events } = adaptLevels(
      { nback: 2, gonogo: 2, reasoning: 2, speed: 2 },
      [result("nback", 0.2), result("nback", 1)],
    );
    expect(levels.nback).toBe(3);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ mechanic: "nback", from: 2, to: 3 });
  });

  it("adapts each mechanic separately", () => {
    const { levels } = adaptLevels(
      { nback: 2, gonogo: 2, reasoning: 2, speed: 2 },
      [result("nback", 1), result("speed", 0.1)],
    );
    expect(levels).toMatchObject({ nback: 3, speed: 1, gonogo: 2 });
  });
});

describe("session application", () => {
  it("does nothing while the experiment is off", () => {
    const before = loadAdaptive();
    const after = applySessionResults([result("nback", 1)]);
    expect(after).toEqual(before);
    expect(loadAdaptive().levels.nback).toBe(2);
  });

  it("adapts and logs while the experiment is on", () => {
    setAdaptiveEnabled(true);
    const after = applySessionResults([result("nback", 1)], "2026-11-02T20:00:00.000Z");
    expect(after.levels.nback).toBe(3);
    expect(after.log).toHaveLength(1);
    expect(after.log[0]).toMatchObject({
      at: "2026-11-02T20:00:00.000Z",
      mechanic: "nback",
      from: 2,
      to: 3,
      accuracy: 1,
    });
    expect(loadAdaptive().levels.nback).toBe(3);
  });
});
