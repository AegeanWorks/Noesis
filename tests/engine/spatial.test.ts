import { describe, expect, it } from "vitest";
import {
  applySpatialAction,
  createSpatial,
  spatialConfig,
  spatialResult,
} from "../../src/engine/mechanics/spatial";
import type { SpatialState } from "../../src/engine/types";

function reachRecall(state: SpatialState): SpatialState {
  const trial = state.trials[state.index];
  if (!trial) return state;
  const needed = trial.span * state.config.showMs + state.config.gapMs;
  return applySpatialAction(state, { type: "advance", ms: needed });
}

function answerCurrentCorrect(state: SpatialState): SpatialState {
  const trial = state.trials[state.index];
  if (!trial || state.phase !== "recall") return state;
  const cell = trial.sequence[state.selected.length];
  return cell === undefined
    ? state
    : applySpatialAction(state, { type: "answer", option: cell });
}

describe("Spatial Span mechanic", () => {
  it("generates a deterministic first sequence", () => {
    const first = createSpatial(42, spatialConfig(2, 8));
    const second = createSpatial(42, spatialConfig(2, 8));
    expect(first.trials[0]).toEqual(second.trials[0]);
    expect(first.trials[0]?.sequence).toHaveLength(4);
    expect(new Set(first.trials[0]?.sequence).size).toBe(4);
  });

  it("shows the sequence, waits, then accepts the same order", () => {
    let state = createSpatial(7, spatialConfig(1, 4));
    expect(state.phase).toBe("show");
    state = reachRecall(state);
    expect(state.phase).toBe("recall");
    const sequence = state.trials[0]?.sequence ?? [];
    for (const cell of sequence) {
      state = applySpatialAction(state, { type: "answer", option: cell });
    }
    expect(state.phase).toBe("feedback");
    expect(state.responses[0]?.correct).toBe(true);
    expect(state.responses[0]?.span).toBe(3);
  });

  it("ends the trial on a wrong tap and shrinks the next span", () => {
    let state = reachRecall(createSpatial(11, spatialConfig(2, 4)));
    const sequence = state.trials[0]?.sequence ?? [];
    const wrong = ((sequence[0] ?? 0) + 1) % 9;
    state = applySpatialAction(state, { type: "answer", option: wrong });
    expect(state.phase).toBe("feedback");
    expect(state.responses[0]?.correct).toBe(false);
    state = applySpatialAction(state, { type: "advance", ms: 800 });
    expect(state.index).toBe(1);
    expect(state.span).toBe(3);
    expect(state.trials[1]?.sequence).toHaveLength(3);
  });

  it("carries a coarse advance through show and gap into recall", () => {
    const state = createSpatial(7, spatialConfig(1, 2));
    const advanced = applySpatialAction(state, { type: "advance", ms: 3_000 });
    expect(advanced.phase).toBe("recall");
    expect(advanced.tick).toBe(3_000);
    expect(advanced.showIndex).toBe(2);
  });

  it("completes a block and reports span metrics", () => {
    let state = createSpatial(13, spatialConfig(2, 6));
    let guard = 0;
    while (!state.completed && guard < 2_000) {
      if (state.phase === "recall") {
        state = answerCurrentCorrect(state);
      } else {
        state = applySpatialAction(state, { type: "advance", ms: 500 });
      }
      guard += 1;
    }
    expect(state.completed).toBe(true);
    const result = spatialResult(state);
    expect(result.mechanic).toBe("spatial");
    expect(result.domain).toBe("working_memory");
    expect(result.metrics.accuracy).toBe(1);
    expect(result.metrics.max_span).toBeGreaterThanOrEqual(4);
    expect(result.metrics.mean_span).toBeGreaterThan(0);
    expect(result.summary).toContain("longest span");
    expect(result.stateHash).toHaveLength(16);
  });
});
