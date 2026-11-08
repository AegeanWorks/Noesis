// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { MechanicResult } from "../../src/engine/types";
import type { SessionRecord } from "../../src/storage/history";
import { ResultsScreen } from "../../src/ui/screens/ResultsScreen";

afterEach(cleanup);

const RESULT: MechanicResult = {
  mechanic: "spatial",
  domain: "working_memory",
  trials: 8,
  durationMs: 70_000,
  metrics: { accuracy: 1, mean_span: 6.8, max_span: 8 },
  summary: "Spatial Span: 100% accuracy, 8/8 correct, longest span 8.",
  seed: 42,
  stateHash: "0123456789abcdef",
  difficulty: 2,
};

function prior(meanSpan: number, level = 2): SessionRecord {
  return {
    id: "prior",
    finishedAt: "2026-11-07T10:00:00.000Z",
    seed: 41,
    results: [
      {
        ...RESULT,
        metrics: { accuracy: 1, mean_span: meanSpan, max_span: 8 },
        summary: `Spatial Span: 100% accuracy, 8/8 correct, longest span 8.`,
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

describe("Spatial Span result delta", () => {
  it("shows an improved delta against the previous same-level block", () => {
    renderResults([prior(5.0)]);
    expect(screen.getByTestId("spatial-span-vs-previous-0").textContent).toBe(
      "Improved +1.8 mean span vs previous Level 2 block (5.0 → 6.8).",
    );
  });

  it("shows a worsened delta against the previous same-level block", () => {
    const result = { ...RESULT, metrics: { ...RESULT.metrics, mean_span: 5.5 } };
    render(
      <ResultsScreen
        results={[result]}
        history={[prior(6.8)]}
        motivation={null}
        sessionId="session-1"
        newBests={[]}
        onAdverseLogged={vi.fn()}
        onRestart={vi.fn()}
        onEvidence={vi.fn()}
        onHome={vi.fn()}
      />,
    );
    expect(screen.getByTestId("spatial-span-vs-previous-0").textContent).toBe(
      "Worsened -1.3 mean span vs previous Level 2 block (6.8 → 5.5).",
    );
  });

  it("shows no change when the previous same-level block matches", () => {
    renderResults([prior(6.8)]);
    expect(screen.getByTestId("spatial-span-vs-previous-0").textContent).toBe(
      "No change vs previous Level 2 block (6.8 mean span).",
    );
  });

  it("marks the first block at a level and does not compare across levels", () => {
    renderResults([]);
    expect(screen.getByTestId("spatial-span-vs-previous-0").textContent).toBe(
      "First block at this level; no earlier mean-span comparison.",
    );
    cleanup();
    renderResults([prior(8.0, 3)]);
    expect(screen.getByTestId("spatial-span-vs-previous-0").textContent).toBe(
      "First block at this level; no earlier mean-span comparison.",
    );
  });
});
