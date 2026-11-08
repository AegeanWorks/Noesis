// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { MechanicResult } from "../../src/engine/types";
import type { SessionRecord } from "../../src/storage/history";
import { ResultsScreen } from "../../src/ui/screens/ResultsScreen";

afterEach(cleanup);

const RESULT: MechanicResult = {
  mechanic: "rotation",
  domain: "reasoning",
  trials: 12,
  durationMs: 60_000,
  metrics: { accuracy: 0.9, mean_response_ms: 500, mirror_accuracy: 0.9 },
  summary: "Mental Rotation: 90% accuracy, 11/12 correct, 500 ms mean response.",
  seed: 42,
  stateHash: "0123456789abcdef",
  difficulty: 2,
};

function prior(accuracy: number, responseMs: number, level = 2): SessionRecord {
  return {
    id: "prior",
    finishedAt: "2026-11-07T10:00:00.000Z",
    seed: 41,
    results: [
      {
        ...RESULT,
        metrics: { accuracy, mean_response_ms: responseMs, mirror_accuracy: accuracy },
        stateHash: "fedcba9876543210",
        difficulty: level,
      },
    ],
  };
}

function renderResults(history: SessionRecord[]) {
  render(
    <ResultsScreen
      results={[RESULT]}
      history={history}
      motivation={null}
      sessionId="session-1"
      newBests={[]}
      onAdverseLogged={vi.fn()}
      onRestart={vi.fn()}
      onEvidence={vi.fn()}
      onHome={vi.fn()}
    />,
  );
}

describe("Mental Rotation result deltas", () => {
  it("shows improved accuracy and response time against the same level", () => {
    renderResults([prior(0.8, 600)]);
    expect(screen.getByTestId("rotation-accuracy-vs-previous-0").textContent).toBe(
      "Accuracy improved +10 pp vs previous Level 2 block (80% → 90%).",
    );
    expect(screen.getByTestId("rotation-rt-vs-previous-0").textContent).toBe(
      "Response time improved 100 ms faster vs previous Level 2 block (600 → 500 ms).",
    );
  });

  it("shows worsened accuracy and response time against the same level", () => {
    renderResults([prior(1, 400)]);
    expect(screen.getByTestId("rotation-accuracy-vs-previous-0").textContent).toBe(
      "Accuracy worsened -10 pp vs previous Level 2 block (100% → 90%).",
    );
    expect(screen.getByTestId("rotation-rt-vs-previous-0").textContent).toBe(
      "Response time worsened +100 ms slower vs previous Level 2 block (400 → 500 ms).",
    );
  });

  it("shows no change when both metrics match", () => {
    renderResults([prior(0.9, 500)]);
    expect(screen.getByTestId("rotation-accuracy-vs-previous-0").textContent).toBe(
      "Accuracy unchanged vs previous Level 2 block (90%).",
    );
    expect(screen.getByTestId("rotation-rt-vs-previous-0").textContent).toBe(
      "Response time unchanged vs previous Level 2 block (500 ms).",
    );
  });

  it("marks the first block at a level and does not compare across levels", () => {
    renderResults([]);
    expect(screen.getByTestId("rotation-accuracy-vs-previous-0").textContent).toBe(
      "First block at this level; no earlier accuracy comparison.",
    );
    expect(screen.getByTestId("rotation-rt-vs-previous-0").textContent).toBe(
      "First block at this level; no earlier response-time comparison.",
    );
    cleanup();
    renderResults([prior(1, 400, 3)]);
    expect(screen.getByTestId("rotation-accuracy-vs-previous-0").textContent).toBe(
      "First block at this level; no earlier accuracy comparison.",
    );
  });
});
