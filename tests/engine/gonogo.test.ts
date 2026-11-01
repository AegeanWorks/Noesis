import { describe, expect, it } from "vitest";
import {
  applyGoNoGoAction,
  createGoNoGo,
  gonogoConfig,
  gonogoResult,
  gonogoView,
} from "../../src/engine/mechanics/gonogo";
import { policyFor, replayMechanic, runMechanic } from "../../src/engine/simulate";
import { stableHash } from "../../src/engine/hash";

function drive(seed: number, strategy: string) {
  return runMechanic("gonogo", seed, 1, 30, policyFor(strategy, seed));
}

describe("go / no-go", () => {
  it("generates a deterministic trial mix", () => {
    const state = createGoNoGo(8, gonogoConfig(1, 30));
    const goCount = state.trials.filter((trial) => trial.go).length;
    expect(state.trials).toHaveLength(30);
    expect(goCount).toBe(Math.round(30 * 0.76));
    const second = createGoNoGo(8, gonogoConfig(1, 30));
    expect(stableHash(state)).toBe(stableHash(second));
  });

  it("scores a perfect run", () => {
    const run = drive(31, "optimal");
    const result = gonogoResult(run.state);
    expect(run.completed).toBe(true);
    expect(result.metrics.accuracy).toBe(1);
    expect(result.metrics.commissions).toBe(0);
    expect(result.metrics.misses).toBe(0);
    expect(result.metrics.mean_go_reaction_ms).toBeGreaterThan(0);
    expect(result.metrics.max_streak).toBe(30);
    expect(result.metrics.current_streak).toBe(30);
  });

  it("scores a no-response run", () => {
    const run = drive(32, "never");
    const result = gonogoResult(run.state);
    expect(result.metrics.hits).toBe(0);
    expect(result.metrics.misses).toBe(result.metrics.go_trials);
    expect(result.metrics.correct_rejections).toBe(result.metrics.no_go_trials);
    expect(result.metrics.accuracy).toBeCloseTo(
      (result.metrics.no_go_trials ?? 0) / 30,
      2,
    );
  });

  it("scores an always-respond run", () => {
    const run = drive(33, "always");
    const result = gonogoResult(run.state);
    expect(result.metrics.hits).toBe(result.metrics.go_trials);
    expect(result.metrics.commissions).toBe(result.metrics.no_go_trials);
    expect(result.metrics.accuracy).toBeCloseTo(
      (result.metrics.go_trials ?? 0) / 30,
      2,
    );
  });

  it("shows a circle for go and a square for no-go", () => {
    const state = createGoNoGo(9, gonogoConfig(1, 30));
    const view = gonogoView(state);
    expect(["circle", "square"]).toContain(view.stimulus);
    expect(view.canRespond).toBe(true);
    const responded = applyGoNoGoAction(state, { type: "respond" });
    expect(responded.phase).toBe("feedback");
    expect(gonogoView(responded).canRespond).toBe(false);
  });

  it("replays exactly from its action stream", () => {
    const run = drive(41, "random");
    const replay = replayMechanic("gonogo", 41, 1, 30, run.actions);
    expect(stableHash(replay)).toBe(gonogoResult(run.state).stateHash);
  });

  it("ignores responses during feedback", () => {
    const state = createGoNoGo(2, gonogoConfig(1, 30));
    const feedback = applyGoNoGoAction(state, { type: "respond" });
    const ignored = applyGoNoGoAction(feedback, { type: "respond" });
    expect(ignored.responses).toHaveLength(1);
  });
});
