import { describe, expect, it } from "vitest";
import { REASONING_ITEMS } from "../../src/content/reasoningItems";
import {
  applyReasoningAction,
  createReasoning,
  reasoningConfig,
  reasoningResult,
  reasoningView,
} from "../../src/engine/mechanics/reasoning";
import { policyFor, replayMechanic, runMechanic } from "../../src/engine/simulate";
import { stableHash } from "../../src/engine/hash";

function drive(seed: number, strategy: string) {
  return runMechanic("reasoning", seed, 2, 8, policyFor(strategy, seed));
}

describe("reasoning", () => {
  it("selects deterministic items for the requested difficulty", () => {
    const state = createReasoning(15, reasoningConfig(2, 8));
    expect(state.order).toHaveLength(8);
    expect(new Set(state.order).size).toBe(8);
    const second = createReasoning(15, reasoningConfig(2, 8));
    expect(stableHash(state)).toBe(stableHash(second));
    for (const id of state.order) {
      const item = REASONING_ITEMS.find((candidate) => candidate.id === id);
      expect(item?.difficulty).toBe(2);
    }
  });

  it("scores a perfect run", () => {
    const run = drive(51, "optimal");
    const result = reasoningResult(run.state);
    expect(run.completed).toBe(true);
    expect(result.metrics.correct).toBe(8);
    expect(result.metrics.accuracy).toBe(1);
    expect(result.metrics.timed_out).toBe(0);
    expect(result.metrics.max_streak).toBe(8);
    expect(result.metrics.current_streak).toBe(8);
  });

  it("scores a timeout run", () => {
    const run = drive(52, "never");
    const result = reasoningResult(run.state);
    expect(result.metrics.correct).toBe(0);
    expect(result.metrics.timed_out).toBe(8);
    expect(result.metrics.accuracy).toBe(0);
  });

  it("shows options only while answering", () => {
    const state = createReasoning(16, reasoningConfig(1, 8));
    const view = reasoningView(state);
    expect(view.options).toHaveLength(4);
    expect(view.canRespond).toBe(true);
    const answered = applyReasoningAction(state, { type: "answer", option: 0 });
    expect(answered.phase).toBe("feedback");
    expect(reasoningView(answered).options).toBeNull();
  });

  it("records a correct answer and reaction time", () => {
    const state = createReasoning(17, reasoningConfig(3, 8));
    const id = state.order[0];
    const item = REASONING_ITEMS.find((candidate) => candidate.id === id);
    expect(item).toBeDefined();
    const answered = applyReasoningAction(state, {
      type: "answer",
      option: item!.correctIndex,
    });
    expect(answered.answers[0]?.correct).toBe(true);
    expect(answered.answers[0]?.responseMs).toBe(0);
  });

  it("replays exactly from its action stream", () => {
    const run = drive(61, "random");
    const replay = replayMechanic("reasoning", 61, 2, 8, run.actions);
    expect(stableHash(replay)).toBe(reasoningResult(run.state).stateHash);
  });

  it("ignores out-of-range options", () => {
    const state = createReasoning(18, reasoningConfig(2, 8));
    const ignored = applyReasoningAction(state, { type: "answer", option: 9 });
    expect(ignored.answers).toHaveLength(0);
  });
});
