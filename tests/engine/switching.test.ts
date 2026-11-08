import { describe, expect, it } from "vitest";
import {
  applySwitchingAction,
  createSwitching,
  switchingChoices,
  switchingConfig,
  switchingResult,
} from "../../src/engine/mechanics/switching";
import type { SwitchingState } from "../../src/engine/types";

function answerCorrect(state: SwitchingState): SwitchingState {
  const trial = state.trials[state.index];
  if (!trial) return state;
  return applySwitchingAction(state, {
    type: "answer",
    option: switchingChoices(trial).correctIndex,
  });
}

describe("Task Switch mechanic", () => {
  it("generates a deterministic mix of switch and repeat trials", () => {
    const first = createSwitching(42, switchingConfig(2, 12));
    const second = createSwitching(42, switchingConfig(2, 12));
    expect(first.trials).toEqual(second.trials);
    expect(first.trials.length).toBe(12);
    expect(first.trials.some((trial) => trial.switched)).toBe(true);
    expect(first.trials.some((trial) => !trial.switched)).toBe(true);
  });

  it("uses the cue to choose the correct colour or shape answer", () => {
    const colourTrial = {
      cue: "colour" as const,
      colour: "red" as const,
      shape: "square" as const,
      switched: false,
    };
    expect(switchingChoices(colourTrial)).toEqual({
      options: ["Red", "Blue"],
      correctIndex: 0,
      correctChoice: "red",
    });
    const shapeTrial = {
      cue: "shape" as const,
      colour: "red" as const,
      shape: "square" as const,
      switched: true,
    };
    expect(switchingChoices(shapeTrial)).toEqual({
      options: ["Circle", "Square"],
      correctIndex: 1,
      correctChoice: "square",
    });
  });

  it("records correct answers and advances through feedback", () => {
    let state = createSwitching(7, switchingConfig(2, 3));
    state = answerCorrect(state);
    expect(state.phase).toBe("feedback");
    expect(state.responses[0]?.correct).toBe(true);
    state = applySwitchingAction(state, { type: "advance", ms: 700 });
    expect(state.index).toBe(1);
    expect(state.phase).toBe("question");
  });

  it("records a timeout when the time limit expires", () => {
    let state = createSwitching(7, switchingConfig(1, 2));
    state = applySwitchingAction(state, { type: "advance", ms: 5_000 });
    expect(state.phase).toBe("feedback");
    expect(state.responses[0]?.timedOut).toBe(true);
    expect(state.responses[0]?.reactionMs).toBeNull();
  });

  it("completes a block and reports finite switch metrics", () => {
    let state = createSwitching(11, switchingConfig(2, 8));
    let guard = 0;
    while (!state.completed && guard < 100) {
      if (state.phase === "question") state = answerCorrect(state);
      else state = applySwitchingAction(state, { type: "advance", ms: 700 });
      guard += 1;
    }
    expect(state.completed).toBe(true);
    const result = switchingResult(state);
    expect(result.mechanic).toBe("switching");
    expect(result.domain).toBe("cognitive_flexibility");
    expect(result.metrics.accuracy).toBe(1);
    expect(result.metrics.switch_trials).toBeGreaterThan(0);
    expect(Number.isFinite(result.metrics.switch_cost_ms)).toBe(true);
    expect(result.summary).toContain("Task Switch");
    expect(result.stateHash).toHaveLength(16);
  });
});
