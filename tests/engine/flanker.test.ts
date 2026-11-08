import { describe, expect, it } from "vitest";
import {
  applyFlankerAction,
  createFlanker,
  flankerConfig,
  flankerCorrectIndex,
  flankerResult,
} from "../../src/engine/mechanics/flanker";
import type { FlankerState } from "../../src/engine/types";

function answerCorrect(state: FlankerState): FlankerState {
  const trial = state.trials[state.index];
  if (!trial) return state;
  return applyFlankerAction(state, {
    type: "answer",
    option: flankerCorrectIndex(trial),
  });
}

describe("Flanker mechanic", () => {
  it("generates a deterministic mix of congruent and incongruent trials", () => {
    const first = createFlanker(42, flankerConfig(2, 20));
    const second = createFlanker(42, flankerConfig(2, 20));
    expect(first.trials).toEqual(second.trials);
    expect(first.trials).toHaveLength(20);
    expect(first.trials.some((trial) => trial.congruent)).toBe(true);
    expect(first.trials.some((trial) => !trial.congruent)).toBe(true);
  });

  it("uses the centre arrow for the correct left/right answer", () => {
    const base = createFlanker(7, flankerConfig(2, 2));
    const left = { ...base.trials[0]!, centre: "left" as const, arrows: ">><>>" };
    const right = { ...base.trials[0]!, centre: "right" as const, arrows: "<<><<" };
    expect(flankerCorrectIndex(left)).toBe(0);
    expect(flankerCorrectIndex(right)).toBe(1);
  });

  it("records a correct answer and advances through feedback", () => {
    let state = createFlanker(7, flankerConfig(2, 3));
    state = answerCorrect(state);
    expect(state.phase).toBe("feedback");
    expect(state.responses[0]?.correct).toBe(true);
    state = applyFlankerAction(state, { type: "advance", ms: 500 });
    expect(state.index).toBe(1);
    expect(state.phase).toBe("question");
  });

  it("records a timeout and carries a coarse advance into the next trial", () => {
    const state = createFlanker(7, flankerConfig(1, 2));
    const advanced = applyFlankerAction(state, { type: "advance", ms: 3_000 });
    expect(advanced.index).toBe(1);
    expect(advanced.phase).toBe("question");
    expect(advanced.responses).toHaveLength(1);
    expect(advanced.responses[0]?.timedOut).toBe(true);
    expect(advanced.phaseElapsed).toBe(300);
    expect(advanced.tick).toBe(3_000);
  });

  it("completes a block and reports finite interference metrics", () => {
    let state = createFlanker(11, flankerConfig(2, 12));
    let guard = 0;
    while (!state.completed && guard < 100) {
      if (state.phase === "question") state = answerCorrect(state);
      else state = applyFlankerAction(state, { type: "advance", ms: 500 });
      guard += 1;
    }
    expect(state.completed).toBe(true);
    const result = flankerResult(state);
    expect(result.mechanic).toBe("flanker");
    expect(result.domain).toBe("executive_function");
    expect(result.metrics.accuracy).toBe(1);
    expect(result.metrics.congruent_trials).toBeGreaterThan(0);
    expect(result.metrics.incongruent_trials).toBeGreaterThan(0);
    expect(Number.isFinite(result.metrics.interference_cost_ms)).toBe(true);
    expect(result.summary).toContain("Flanker");
    expect(result.stateHash).toHaveLength(16);
  });
});
