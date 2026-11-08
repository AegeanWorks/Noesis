import { describe, expect, it } from "vitest";
import {
  applyProspectiveAction,
  createProspective,
  prospectiveConfig,
  prospectiveCorrectIndex,
  prospectiveResult,
} from "../../src/engine/mechanics/prospective";
import type { ProspectiveState } from "../../src/engine/types";

function answerCorrect(state: ProspectiveState): ProspectiveState {
  const trial = state.trials[state.index];
  if (!trial) return state;
  return applyProspectiveAction(state, {
    type: "answer",
    option: prospectiveCorrectIndex(trial),
  });
}

describe("Prospective Memory mechanic", () => {
  it("generates deterministic cue trials and an ongoing letter stream", () => {
    const first = createProspective(42, prospectiveConfig(2, 24));
    const second = createProspective(42, prospectiveConfig(2, 24));
    expect(first.trials).toEqual(second.trials);
    expect(first.trials).toHaveLength(24);
    expect(first.trials.filter((trial) => trial.cue)).toHaveLength(4);
    expect(first.trials.filter((trial) => trial.cue).every((trial) => trial.letter === "Q")).toBe(
      true,
    );
    expect(first.trials.some((trial) => !trial.cue)).toBe(true);
  });

  it("uses Remember for the cue and vowel/consonant for ongoing letters", () => {
    expect(prospectiveCorrectIndex({ letter: "Q", cue: true })).toBe(2);
    expect(prospectiveCorrectIndex({ letter: "A", cue: false })).toBe(0);
    expect(prospectiveCorrectIndex({ letter: "B", cue: false })).toBe(1);
  });

  it("records a cue hit and advances through feedback", () => {
    let state = createProspective(7, prospectiveConfig(2, 12));
    const cueIndex = state.trials.findIndex((trial) => trial.cue);
    for (let index = 0; index < cueIndex; index += 1) {
      state = answerCorrect(state);
      state = applyProspectiveAction(state, { type: "advance", ms: 600 });
    }
    state = answerCorrect(state);
    expect(state.phase).toBe("feedback");
    expect(state.responses[cueIndex]?.correct).toBe(true);
    expect(state.responses[cueIndex]?.cue).toBe(true);
  });

  it("records a timeout and carries a coarse advance into the next trial", () => {
    const state = createProspective(7, prospectiveConfig(1, 4));
    const advanced = applyProspectiveAction(state, { type: "advance", ms: 5_200 });
    expect(advanced.index).toBe(1);
    expect(advanced.phase).toBe("question");
    expect(advanced.responses).toHaveLength(1);
    expect(advanced.responses[0]?.timedOut).toBe(true);
    expect(advanced.phaseElapsed).toBe(100);
  });

  it("completes a block and reports cue metrics", () => {
    let state = createProspective(11, prospectiveConfig(2, 12));
    let guard = 0;
    while (!state.completed && guard < 500) {
      if (state.phase === "question") state = answerCorrect(state);
      else state = applyProspectiveAction(state, { type: "advance", ms: 700 });
      guard += 1;
    }
    expect(state.completed).toBe(true);
    const result = prospectiveResult(state);
    expect(result.mechanic).toBe("prospective");
    expect(result.domain).toBe("episodic_memory");
    expect(result.metrics.accuracy).toBe(1);
    expect(result.metrics.cue_hits).toBe(result.metrics.cue_trials);
    expect(result.metrics.false_alarms).toBe(0);
    expect(result.summary).toContain("cues remembered");
    expect(result.stateHash).toHaveLength(16);
  });
});
