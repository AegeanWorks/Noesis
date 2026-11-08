import { describe, expect, it } from "vitest";
import {
  applyChangeAction,
  changeConfig,
  changeCorrectCell,
  changeResult,
  createChange,
} from "../../src/engine/mechanics/change";
import type { ChangeState } from "../../src/engine/types";

function answerCorrect(state: ChangeState): ChangeState {
  const trial = state.trials[state.index];
  if (!trial) return state;
  return applyChangeAction(state, {
    type: "answer",
    option: changeCorrectCell(trial),
  });
}

describe("Change Detection mechanic", () => {
  it("generates deterministic arrays with one changed colour", () => {
    const first = createChange(42, changeConfig(2, 6));
    const second = createChange(42, changeConfig(2, 6));
    expect(first.trials).toEqual(second.trials);
    expect(first.trials).toHaveLength(6);
    for (const trial of first.trials) {
      expect(trial.positions).toHaveLength(5);
      expect(new Set(trial.positions).size).toBe(5);
      expect(trial.studyColours[trial.changedIndex]).not.toBe(
        trial.testColours[trial.changedIndex],
      );
    }
  });

  it("moves from study through delay into the test phase", () => {
    let state = createChange(7, changeConfig(2, 2));
    expect(state.phase).toBe("study");
    state = applyChangeAction(state, { type: "advance", ms: 900 });
    expect(state.phase).toBe("delay");
    state = applyChangeAction(state, { type: "advance", ms: 600 });
    expect(state.phase).toBe("test");
  });

  it("records a correct change and advances through feedback", () => {
    let state = createChange(7, changeConfig(2, 3));
    state = applyChangeAction(state, { type: "advance", ms: 1_500 });
    state = answerCorrect(state);
    expect(state.phase).toBe("feedback");
    expect(state.responses[0]?.correct).toBe(true);
    state = applyChangeAction(state, { type: "advance", ms: 700 });
    expect(state.index).toBe(1);
    expect(state.phase).toBe("study");
  });

  it("records a timeout and carries a coarse advance into the next trial", () => {
    let state = createChange(7, changeConfig(1, 2));
    state = applyChangeAction(state, { type: "advance", ms: 1_600 });
    const advanced = applyChangeAction(state, { type: "advance", ms: 8_700 });
    expect(advanced.index).toBe(1);
    expect(advanced.phase).toBe("study");
    expect(advanced.responses).toHaveLength(1);
    expect(advanced.responses[0]?.timedOut).toBe(true);
  });

  it("completes a block and reports finite metrics", () => {
    let state = createChange(11, changeConfig(2, 5));
    let guard = 0;
    while (!state.completed && guard < 500) {
      if (state.phase === "test") {
        state = answerCorrect(state);
      } else {
        state = applyChangeAction(state, { type: "advance", ms: 900 });
      }
      guard += 1;
    }
    expect(state.completed).toBe(true);
    const result = changeResult(state);
    expect(result.mechanic).toBe("change");
    expect(result.domain).toBe("working_memory");
    expect(result.metrics.accuracy).toBe(1);
    expect(result.metrics.set_size).toBe(5);
    expect(Number.isFinite(result.metrics.mean_response_ms)).toBe(true);
    expect(result.summary).toContain("set size 5");
    expect(result.stateHash).toHaveLength(16);
  });
});

