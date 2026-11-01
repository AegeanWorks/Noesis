import { describe, expect, it } from "vitest";
import {
  applyNBackAction,
  createNBack,
  nbackConfig,
  nbackResult,
  nbackView,
  nearMissLag,
} from "../../src/engine/mechanics/nback";
import { optimalPolicy, policyFor, replayMechanic, runMechanic } from "../../src/engine/simulate";
import { stableHash } from "../../src/engine/hash";
import type { NBackState } from "../../src/engine/types";

function drive(seed: number, strategy: string) {
  return runMechanic("nback", seed, 2, 20, policyFor(strategy, seed));
}

describe("n-back", () => {
  it("generates a deterministic sequence with the requested target count", () => {
    const state = createNBack(7, nbackConfig(2, 20));
    expect(state.trials).toHaveLength(20);
    expect(state.trials.filter((trial) => trial.target)).toHaveLength(6);
    for (let index = state.config.n; index < state.trials.length; index += 1) {
      const current = state.trials[index];
      const previous = state.trials[index - state.config.n];
      if (!current || !previous) continue;
      if (!current.target) expect(current.letter).not.toBe(previous.letter);
    }
    const second = createNBack(7, nbackConfig(2, 20));
    expect(stableHash(state)).toBe(stableHash(second));
  });

  it("scores a perfect run", () => {
    const run = drive(11, "optimal");
    expect(run.completed).toBe(true);
    const result = nbackResult(run.state);
    expect(result.metrics.accuracy).toBe(1);
    expect(result.metrics.hits).toBe(6);
    expect(result.metrics.false_alarms).toBe(0);
    expect(result.metrics.d_prime).toBeGreaterThan(1);
    expect(result.metrics.max_streak).toBe(20);
    expect(result.metrics.current_streak).toBe(20);
    expect(result.metrics.near_misses).toBe(0);
    expect(result.summary).toContain("2-back");
  });

  it("scores a no-response run", () => {
    const run = drive(12, "never");
    const result = nbackResult(run.state);
    expect(result.metrics.hits).toBe(0);
    expect(result.metrics.misses).toBe(6);
    expect(result.metrics.false_alarms).toBe(0);
    expect(result.metrics.correct_rejections).toBe(14);
    expect(result.metrics.accuracy).toBe(0.7);
  });

  it("scores an always-match run", () => {
    const run = drive(13, "always");
    const result = nbackResult(run.state);
    expect(result.metrics.hits).toBe(6);
    expect(result.metrics.false_alarms).toBe(14);
    expect(result.metrics.accuracy).toBe(0.3);
  });

  it("moves to feedback after a response and exposes the letter", () => {
    const initial = createNBack(5, nbackConfig(2, 20));
    const trial = initial.trials[0];
    expect(trial).toBeDefined();
    const view = nbackView(initial);
    expect(view.stimulus).toBe(trial?.letter);
    expect(view.canRespond).toBe(true);
    const responded = applyNBackAction(initial, { type: "respond" });
    expect(responded.phase).toBe("feedback");
    expect(responded.responses).toHaveLength(1);
    expect(nbackView(responded).canRespond).toBe(false);
  });

  it("replays exactly from its action stream", () => {
    const run = drive(21, "random");
    const replay = replayMechanic("nback", 21, 2, 20, run.actions);
    expect(stableHash(replay)).toBe(nbackResult(run.state).stateHash);
  });

  it("ignores responses outside the trial phase", () => {
    const state = createNBack(3, nbackConfig(2, 20));
    const feedback = applyNBackAction(state, { type: "respond" });
    const ignored = applyNBackAction(feedback, { type: "respond" });
    expect(ignored.responses).toHaveLength(1);
  });

  it("advances through time deterministically", () => {
    const state: NBackState = createNBack(3, nbackConfig(1, 10));
    const once = applyNBackAction(state, { type: "advance", ms: 100 });
    const twice = applyNBackAction(once, { type: "advance", ms: 100 });
    expect(once.tick).toBe(100);
    expect(twice.tick).toBe(200);
  });

  it("detects an off-by-one lag as a near miss", () => {
    const trials = [
      { letter: "A", target: false },
      { letter: "A", target: false },
      { letter: "A", target: false },
    ];
    expect(nearMissLag(trials, 2, 2)).toBe(1);
    expect(
      nearMissLag(
        [
          { letter: "A", target: false },
          { letter: "B", target: false },
          { letter: "C", target: false },
        ],
        2,
        2,
      ),
    ).toBeNull();
  });

  it("shows corrective near-miss feedback without awarding a hit", () => {
    const base = createNBack(1, nbackConfig(2, 20));
    const state = {
      ...base,
      trials: [
        { letter: "A", target: false },
        { letter: "A", target: false },
        { letter: "A", target: false },
      ],
      index: 2,
      phase: "trial" as const,
      phaseElapsed: 100,
      respondedThisTrial: false,
    };
    const responded = applyNBackAction(state, { type: "respond" });
    expect(responded.responses[0]?.kind).toBe("false_alarm");
    expect(responded.responses[0]?.nearMissLag).toBe(1);
    expect(nbackView(responded).feedback).toContain("matched 1 back");
  });

  it("optimal policy only responds to targets", () => {
    const run = runMechanic("nback", 4, 2, 20, optimalPolicy);
    for (const response of (run.state as NBackState).responses) {
      if (response.responded) expect(response.kind).toBe("hit");
    }
  });
});
