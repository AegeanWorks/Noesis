import { describe, expect, it } from "vitest";
import {
  applyDigitAction,
  createDigit,
  digitConfig,
  digitResult,
  digitView,
} from "../../src/engine/mechanics/digit";
import type { DigitState } from "../../src/engine/types";

function reachRecall(state: DigitState): DigitState {
  const trial = state.trials[state.index];
  if (!trial) return state;
  const needed = trial.span * state.config.showMs + state.config.gapMs;
  return applyDigitAction(state, { type: "advance", ms: needed });
}

function advanceUntil(state: DigitState, predicate: (s: DigitState) => boolean): DigitState {
  let next = state;
  let guard = 0;
  while (!predicate(next) && guard < 200) {
    next = applyDigitAction(next, { type: "advance", ms: 1_000 });
    guard += 1;
  }
  return next;
}

function answerCurrentCorrect(state: DigitState): DigitState {
  const trial = state.trials[state.index];
  if (!trial || state.phase !== "recall") return state;
  const sequence =
    trial.direction === "backward" ? [...trial.sequence].reverse() : trial.sequence;
  const digit = sequence[state.selected.length];
  return digit === undefined
    ? state
    : applyDigitAction(state, { type: "answer", option: digit });
}

describe("Digit Span mechanic", () => {
  it("generates a deterministic first sequence with repeats allowed", () => {
    const first = createDigit(42, digitConfig(2, 8));
    const second = createDigit(42, digitConfig(2, 8));
    expect(first.trials[0]).toEqual(second.trials[0]);
    expect(first.trials[0]?.sequence).toHaveLength(4);
    expect(first.trials[0]?.direction).toBe("forward");
    expect(first.trials[0]?.sequence.every((digit) => digit >= 0 && digit < 10)).toBe(true);
  });

  it("shows a digit at a time and accepts the same order", () => {
    let state = createDigit(7, digitConfig(1, 4));
    expect(state.phase).toBe("show");
    expect(digitView(state).stimulus).toBe(String(state.trials[0]?.sequence[0]));
    state = reachRecall(state);
    expect(state.phase).toBe("recall");
    expect(digitView(state).options).toHaveLength(10);
    const sequence = state.trials[0]?.sequence ?? [];
    for (const digit of sequence) {
      state = applyDigitAction(state, { type: "answer", option: digit });
    }
    expect(state.phase).toBe("feedback");
    expect(state.responses[0]?.correct).toBe(true);
    expect(state.responses[0]?.span).toBe(3);
  });

  it("alternates to backward recall on the second trial", () => {
    let state = createDigit(11, digitConfig(2, 4));
    state = advanceUntil(state, (candidate) => candidate.index === 1 && candidate.phase === "show");
    expect(state.index).toBe(1);
    expect(state.trials[1]?.direction).toBe("backward");
  });

  it("requires the reversed sequence on a backward trial", () => {
    let state = createDigit(11, digitConfig(2, 4));
    state = advanceUntil(state, (candidate) => candidate.index === 1 && candidate.phase === "show");
    // Show the second trial's digits, then answer in reverse order.
    const second = state.trials[1];
    if (!second) throw new Error("second trial missing");
    const needed = second.span * state.config.showMs + state.config.gapMs;
    state = applyDigitAction(state, { type: "advance", ms: needed });
    expect(state.phase).toBe("recall");
    for (const digit of [...second.sequence].reverse()) {
      state = applyDigitAction(state, { type: "answer", option: digit });
    }
    expect(state.responses[1]?.correct).toBe(true);
    expect(digitView(state).explanation).toBe([...second.sequence].reverse().join(" → "));
  });

  it("ends the trial on a wrong tap and shrinks the next span", () => {
    let state = reachRecall(createDigit(11, digitConfig(2, 4)));
    const sequence = state.trials[0]?.sequence ?? [];
    const wrong = ((sequence[0] ?? 0) + 1) % 10;
    state = applyDigitAction(state, { type: "answer", option: wrong });
    expect(state.phase).toBe("feedback");
    expect(state.responses[0]?.correct).toBe(false);
    state = applyDigitAction(state, { type: "advance", ms: 900 });
    expect(state.index).toBe(1);
    expect(state.span).toBe(3);
  });

  it("completes a block and reports forward/backward span metrics", () => {
    let state = createDigit(13, digitConfig(2, 8));
    let guard = 0;
    while (!state.completed && guard < 4_000) {
      if (state.phase === "recall") {
        state = answerCurrentCorrect(state);
      } else {
        state = applyDigitAction(state, { type: "advance", ms: 1_000 });
      }
      guard += 1;
    }
    expect(state.completed).toBe(true);
    const result = digitResult(state);
    expect(result.mechanic).toBe("digit");
    expect(result.domain).toBe("working_memory");
    expect(result.metrics.accuracy).toBe(1);
    expect(result.metrics.forward_accuracy).toBe(1);
    expect(result.metrics.backward_accuracy).toBe(1);
    expect(result.metrics.max_span).toBeGreaterThanOrEqual(4);
    expect(result.summary).toContain("longest span");
    expect(result.stateHash).toHaveLength(16);
  });
});
