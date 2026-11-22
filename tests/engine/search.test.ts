import { describe, expect, it } from "vitest";
import { applySearchAction, createSearch, searchConfig } from "../../src/engine/mechanics/search";
import { mechanicComplete, mechanicResult, mechanicView } from "../../src/engine/mechanics";

function answerAll(state: ReturnType<typeof createSearch>) {
  let next = state;
  for (let i = 0; i < state.trials.length; i += 1) {
    const trial = next.trials[next.index]!;
    next = applySearchAction(next, { type: "answer", option: trial.targetIndex });
    next = applySearchAction(next, { type: "advance", ms: 500 });
  }
  return next;
}

describe("visual search mechanic", () => {
  it("clamps configuration to a safe static-grid range", () => {
    expect(searchConfig(0, 1).trials).toBe(10);
    expect(searchConfig(9, 999).trials).toBe(40);
    const level3 = searchConfig(3, 16);
    expect(level3.largeSetSize).toBe(25);
    expect(level3.smallSetSize).toBe(9);
    expect(level3.timeLimitMs).toBeLessThan(searchConfig(1, 16).timeLimitMs);
  });

  it("generates deterministic conjunction trials with one target and alternating set size", () => {
    const a = createSearch(1234, searchConfig(2, 12));
    const b = createSearch(1234, searchConfig(2, 12));
    expect(a.trials).toEqual(b.trials);
    expect(a.trials).toHaveLength(12);
    a.trials.forEach((trial, index) => {
      expect(trial.setSize).toBe(index % 2 === 0 ? 9 : 25);
      expect(trial.cells).toHaveLength(trial.setSize);
      expect(trial.cells.filter((cell) => cell === "circle-red")).toHaveLength(1);
      expect(trial.cells[trial.targetIndex]).toBe("circle-red");
      expect(trial.cells.some((cell) => cell === "circle-blue")).toBe(true);
      expect(trial.cells.some((cell) => cell === "square-red")).toBe(true);
    });
  });

  it("records correct answers and computes a set-size cost from response times", () => {
    let state = createSearch(42, searchConfig(2, 8));
    state = answerAll(state);
    expect(mechanicComplete(state)).toBe(true);
    const result = mechanicResult(state);
    expect(result.mechanic).toBe("search");
    expect(result.domain).toBe("executive_function");
    expect(result.metrics.correct).toBe(10);
    expect(result.metrics.accuracy).toBe(1);
    expect(result.metrics.small_set_trials).toBe(5);
    expect(result.metrics.large_set_trials).toBe(5);
    expect(result.metrics.set_size_cost_ms).toBeGreaterThanOrEqual(0);
    expect(result.summary).toMatch(/set-size cost/);
  });

  it("marks a wrong tap and a timeout as incorrect without ending the block early", () => {
    let state = createSearch(7, searchConfig(1, 4));
    const first = state.trials[0]!;
    state = applySearchAction(state, { type: "answer", option: (first.targetIndex + 1) % first.cells.length });
    expect(state.responses[0]!.correct).toBe(false);
    state = applySearchAction(state, { type: "advance", ms: 500 });
    state = applySearchAction(state, { type: "advance", ms: 4000 });
    expect(state.responses[1]!.timedOut).toBe(true);
    expect(state.completed).toBe(false);
  });

  it("exposes a static grid view with an explanation after feedback", () => {
    let state = createSearch(99, searchConfig(1, 2));
    state = applySearchAction(state, { type: "answer", option: state.trials[0]!.targetIndex });
    const view = mechanicView(state);
    expect(view.mechanic).toBe("search");
    expect(view.options).toEqual(state.trials[0]!.cells);
    expect(view.feedback).toBe("Correct");
    expect(view.explanation).toMatch(/red circle/);
    expect(view.canRespond).toBe(false);
  });

  it("ignores taps outside the displayed grid", () => {
    const state = createSearch(5, searchConfig(1, 2));
    expect(applySearchAction(state, { type: "answer", option: 999 })).toBe(state);
    expect(applySearchAction(state, { type: "answer", option: -1 })).toBe(state);
  });
});
