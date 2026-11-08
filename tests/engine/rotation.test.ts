import { describe, expect, it } from "vitest";
import {
  applyRotationAction,
  createRotation,
  rotationConfig,
  rotationCorrectIndex,
  rotationResult,
} from "../../src/engine/mechanics/rotation";
import type { RotationState } from "../../src/engine/types";

function answerCorrect(state: RotationState): RotationState {
  const trial = state.trials[state.index];
  if (!trial) return state;
  return applyRotationAction(state, {
    type: "answer",
    option: rotationCorrectIndex(trial),
  });
}

describe("Mental Rotation mechanic", () => {
  it("generates deterministic mirror and rotation trials", () => {
    const first = createRotation(42, rotationConfig(2, 10));
    const second = createRotation(42, rotationConfig(2, 10));
    expect(first.trials).toEqual(second.trials);
    expect(first.trials).toHaveLength(10);
    expect(first.trials.filter((trial) => trial.mirrored)).toHaveLength(5);
    expect(first.trials.some((trial) => trial.rotation !== 0)).toBe(true);
  });

  it("uses the mirror flag as the correct answer", () => {
    const state = createRotation(7, rotationConfig(2, 2));
    const trial = state.trials[0]!;
    expect(rotationCorrectIndex(trial)).toBe(trial.mirrored ? 1 : 0);
  });

  it("records a correct answer and advances through feedback", () => {
    let state = createRotation(7, rotationConfig(2, 3));
    state = answerCorrect(state);
    expect(state.phase).toBe("feedback");
    expect(state.responses[0]?.correct).toBe(true);
    state = applyRotationAction(state, { type: "advance", ms: 650 });
    expect(state.index).toBe(1);
    expect(state.phase).toBe("question");
  });

  it("records a timeout and carries a coarse advance into the next trial", () => {
    const state = createRotation(7, rotationConfig(1, 2));
    const advanced = applyRotationAction(state, { type: "advance", ms: 6_700 });
    expect(advanced.index).toBe(1);
    expect(advanced.phase).toBe("question");
    expect(advanced.responses).toHaveLength(1);
    expect(advanced.responses[0]?.timedOut).toBe(true);
    expect(advanced.phaseElapsed).toBe(50);
  });

  it("completes a block and reports finite rotation metrics", () => {
    let state = createRotation(11, rotationConfig(2, 8));
    let guard = 0;
    while (!state.completed && guard < 500) {
      if (state.phase === "question") state = answerCorrect(state);
      else state = applyRotationAction(state, { type: "advance", ms: 700 });
      guard += 1;
    }
    expect(state.completed).toBe(true);
    const result = rotationResult(state);
    expect(result.mechanic).toBe("rotation");
    expect(result.domain).toBe("reasoning");
    expect(result.metrics.accuracy).toBe(1);
    expect(result.metrics.same_trials).toBeGreaterThan(0);
    expect(result.metrics.mirror_trials).toBeGreaterThan(0);
    expect(Number.isFinite(result.metrics.mean_response_ms)).toBe(true);
    expect(result.summary).toContain("Mental Rotation");
    expect(result.stateHash).toHaveLength(16);
  });
});
