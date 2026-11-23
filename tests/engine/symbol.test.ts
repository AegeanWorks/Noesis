import { describe, expect, it } from "vitest";
import { applySymbolAction, createSymbol, symbolConfig, SYMBOL_LEGEND } from "../../src/engine/mechanics/symbol";
import { mechanicComplete, mechanicResult, mechanicView } from "../../src/engine/mechanics";

function answerAll(state: ReturnType<typeof createSymbol>) {
  let next = state;
  for (let i = 0; i < state.trials.length; i += 1) {
    const trial = next.trials[next.index]!;
    next = applySymbolAction(next, { type: "answer", option: trial.correctDigit });
    next = applySymbolAction(next, { type: "advance", ms: 400 });
  }
  return next;
}

describe("digit symbol mechanic", () => {
  it("clamps configuration to a safe static range", () => {
    expect(symbolConfig(0, 1).trials).toBe(12);
    expect(symbolConfig(9, 999).trials).toBe(40);
    expect(symbolConfig(3, 20).timeLimitMs).toBeLessThan(symbolConfig(1, 20).timeLimitMs);
  });

  it("generates deterministic trials with a legend-mapped target", () => {
    const a = createSymbol(1234, symbolConfig(2, 14));
    const b = createSymbol(1234, symbolConfig(2, 14));
    expect(a.trials).toEqual(b.trials);
    a.trials.forEach((trial) => {
      expect(trial.correctDigit).toBeGreaterThanOrEqual(0);
      expect(trial.correctDigit).toBeLessThan(4);
      expect(trial.shape).toBe(SYMBOL_LEGEND[trial.correctDigit]);
    });
  });

  it("records correct answers and reports a within-block response-time change", () => {
    let state = createSymbol(42, symbolConfig(2, 14));
    state = answerAll(state);
    expect(mechanicComplete(state)).toBe(true);
    const result = mechanicResult(state);
    expect(result.mechanic).toBe("symbol");
    expect(result.domain).toBe("processing_speed");
    expect(result.metrics.correct).toBe(14);
    expect(result.metrics.accuracy).toBe(1);
    expect(typeof result.metrics.within_block_rt_change_ms).toBe("number");
    expect(result.summary).toMatch(/mean response/);
  });

  it("marks a wrong digit and a timeout without ending the block early", () => {
    let state = createSymbol(7, symbolConfig(1, 12));
    const first = state.trials[0]!;
    state = applySymbolAction(state, { type: "answer", option: (first.correctDigit + 1) % 4 });
    expect(state.responses[0]!.correct).toBe(false);
    state = applySymbolAction(state, { type: "advance", ms: 400 });
    state = applySymbolAction(state, { type: "advance", ms: 4000 });
    expect(state.responses[1]!.timedOut).toBe(true);
    expect(state.completed).toBe(false);
  });

  it("exposes the legend, target shape and digit options in the view", () => {
    let state = createSymbol(99, symbolConfig(1, 12));
    state = applySymbolAction(state, { type: "answer", option: state.trials[0]!.correctDigit });
    const view = mechanicView(state);
    expect(view.mechanic).toBe("symbol");
    expect(view.stimulus).toBe(state.trials[0]!.shape);
    expect(view.options).toEqual(["1", "2", "3", "4"]);
    expect(view.feedback).toBe("Correct");
    expect(view.explanation).toMatch(/maps to digit/);
  });

  it("ignores taps outside the four-digit range", () => {
    const state = createSymbol(5, symbolConfig(1, 12));
    expect(applySymbolAction(state, { type: "answer", option: 4 })).toBe(state);
    expect(applySymbolAction(state, { type: "answer", option: -1 })).toBe(state);
  });
});
