import { describe, expect, it } from "vitest";
import {
  applyPairedAction,
  createPaired,
  pairedConfig,
  pairedResult,
} from "../../src/engine/mechanics/paired";
import type { PairedState } from "../../src/engine/types";

function answerCorrect(state: PairedState): PairedState {
  const trial = state.trials[state.index];
  if (!trial) return state;
  return applyPairedAction(state, {
    type: "answer",
    option: trial.correctIndex,
  });
}

describe("Paired Associates mechanic", () => {
  it("generates deterministic pairs with four distinct options", () => {
    const first = createPaired(42, pairedConfig(2, 4));
    const second = createPaired(42, pairedConfig(2, 4));
    expect(first.trials).toEqual(second.trials);
    expect(first.trials).toHaveLength(4);
    const trial = first.trials[0]!;
    expect(trial.options).toHaveLength(4);
    expect(new Set(trial.options).size).toBe(4);
    expect(trial.options[trial.correctIndex]).toBe(trial.second);
  });

  it("shows the study pair then moves to the test phase", () => {
    let state = createPaired(7, pairedConfig(2, 2));
    expect(state.phase).toBe("study");
    state = applyPairedAction(state, { type: "advance", ms: 1_900 });
    expect(state.phase).toBe("test");
    expect(state.trials[0]?.first).toBeTruthy();
  });

  it("records a correct answer and advances through feedback", () => {
    let state = createPaired(7, pairedConfig(2, 2));
    state = applyPairedAction(state, { type: "advance", ms: 1_900 });
    state = answerCorrect(state);
    expect(state.phase).toBe("feedback");
    expect(state.responses[0]?.correct).toBe(true);
    state = applyPairedAction(state, { type: "advance", ms: 850 });
    expect(state.index).toBe(1);
    expect(state.phase).toBe("study");
  });

  it("records a timeout and carries a coarse advance into the next trial", () => {
    let state = createPaired(7, pairedConfig(1, 2));
    state = applyPairedAction(state, { type: "advance", ms: 2_200 });
    const advanced = applyPairedAction(state, { type: "advance", ms: 9_050 });
    expect(advanced.index).toBe(1);
    expect(advanced.phase).toBe("study");
    expect(advanced.responses).toHaveLength(1);
    expect(advanced.responses[0]?.timedOut).toBe(true);
  });

  it("completes a block and reports finite metrics", () => {
    let state = createPaired(11, pairedConfig(2, 6));
    let guard = 0;
    while (!state.completed && guard < 500) {
      if (state.phase === "study") {
        state = applyPairedAction(state, { type: "advance", ms: 1_900 });
      } else if (state.phase === "test") {
        state = answerCorrect(state);
      } else {
        state = applyPairedAction(state, { type: "advance", ms: 900 });
      }
      guard += 1;
    }
    expect(state.completed).toBe(true);
    const result = pairedResult(state);
    expect(result.mechanic).toBe("paired");
    expect(result.domain).toBe("episodic_memory");
    expect(result.metrics.accuracy).toBe(1);
    expect(Number.isFinite(result.metrics.mean_response_ms)).toBe(true);
    expect(result.summary).toContain("Paired Associates");
    expect(result.stateHash).toHaveLength(16);
  });
});
