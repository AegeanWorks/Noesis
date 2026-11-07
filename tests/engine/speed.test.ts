import { describe, expect, it } from "vitest";
import { stableHash } from "../../src/engine/hash";
import {
  applySpeedAction,
  createSpeed,
  speedConfig,
  speedResult,
  speedView,
} from "../../src/engine/mechanics/speed";
import { policyFor, replayMechanic, runMechanic } from "../../src/engine/simulate";

function drive(seed: number, strategy: string) {
  return runMechanic("speed", seed, 1, 20, policyFor(strategy, seed));
}

describe("Speed Tap", () => {
  it("generates deterministic foreperiods inside the configured window", () => {
    const config = speedConfig(1, 20);
    const state = createSpeed(11, config);
    expect(state.foreperiods).toHaveLength(20);
    for (const value of state.foreperiods) {
      expect(value).toBeGreaterThanOrEqual(config.foreperiodMinMs);
      expect(value).toBeLessThanOrEqual(config.foreperiodMaxMs);
    }
    expect(stableHash(state)).toBe(stableHash(createSpeed(11, config)));
  });

  it("scores a perfect run with a human-like reaction delay", () => {
    const run = drive(12, "optimal");
    const result = speedResult(run.state);
    expect(run.completed).toBe(true);
    expect(result.metrics.accuracy).toBe(1);
    expect(result.metrics.hits).toBe(20);
    expect(result.metrics.median_reaction_ms).toBeGreaterThanOrEqual(250);
    expect(result.metrics.lapses).toBe(0);
    expect(result.metrics.max_streak).toBe(20);
  });

  it("scores a no-response run as misses", () => {
    const run = drive(13, "never");
    const result = speedResult(run.state);
    expect(result.metrics.hits).toBe(0);
    expect(result.metrics.misses).toBe(20);
    expect(result.metrics.accuracy).toBe(0);
  });

  it("scores an immediate response run", () => {
    const run = drive(14, "always");
    const result = speedResult(run.state);
    expect(result.metrics.accuracy).toBe(1);
    expect(result.metrics.median_reaction_ms).toBe(0);
  });

  it("shows a circle only during the stimulus phase", () => {
    const state = createSpeed(15, speedConfig(1, 20));
    expect(speedView(state).stimulus).toBeNull();
    expect(speedView(state).canRespond).toBe(false);
    const advanced = applySpeedAction(state, {
      type: "advance",
      ms: state.phaseDuration,
    });
    expect(advanced.phase).toBe("stimulus");
    expect(speedView(advanced).stimulus).toBe("circle");
    expect(speedView(advanced).canRespond).toBe(true);
  });

  it("moves to feedback after a response", () => {
    const waiting = createSpeed(16, speedConfig(1, 20));
    const stimulus = applySpeedAction(waiting, {
      type: "advance",
      ms: waiting.phaseDuration,
    });
    const responded = applySpeedAction(stimulus, { type: "respond" });
    expect(responded.phase).toBe("feedback");
    expect(responded.responses).toHaveLength(1);
    expect(responded.responses[0]?.reactionMs).toBe(0);
    expect(speedView(responded).stimulus).toBe("circle");
  });

  it("replays exactly from its action stream", () => {
    const run = drive(17, "random");
    const replay = replayMechanic("speed", 17, 1, 20, run.actions);
    expect(stableHash(replay)).toBe(speedResult(run.state).stateHash);
  });
});
