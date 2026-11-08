// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { MechanicResult } from "../../src/engine/types";
import type { SessionRecord } from "../../src/storage/history";
import { ResultsScreen } from "../../src/ui/screens/ResultsScreen";

afterEach(cleanup);

const RESULT: MechanicResult = {
  mechanic: "flanker",
  domain: "executive_function",
  trials: 20,
  durationMs: 60_000,
  metrics: { accuracy: 1, interference_cost_ms: 42 },
  summary: "Flanker: 100% accuracy, 20/20 correct, 42 ms interference cost.",
  seed: 42,
  stateHash: "0123456789abcdef",
  difficulty: 2,
};

function prior(cost: number, level = 2): SessionRecord {
  return {
    id: "prior",
    finishedAt: "2026-11-07T10:00:00.000Z",
    seed: 41,
    results: [
      {
        ...RESULT,
        metrics: { accuracy: 1, interference_cost_ms: cost },
        summary: `Flanker: 100% accuracy, 20/20 correct, ${cost} ms interference cost.`,
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

describe("Flanker result explanation", () => {
  it("explains interference cost and the negative-value case", () => {
    renderResults([]);
    const note = screen.getByTestId("flanker-interference-note").textContent ?? "";
    expect(note).toMatch(/incongruent trials minus congruent/i);
    expect(note).toMatch(/negative value/i);
    expect(note).toMatch(/not a diagnosis/i);
  });

  it("shows an improved delta against the previous same-level block", () => {
    renderResults([prior(60)]);
    expect(screen.getByTestId("flanker-cost-vs-previous-0").textContent).toBe(
      "Improved 18 ms vs previous Level 2 block (60 → 42 ms).",
    );
  });

  it("shows a worsened delta against the previous same-level block", () => {
    renderResults([prior(20)]);
    expect(screen.getByTestId("flanker-cost-vs-previous-0").textContent).toBe(
      "Worsened +22 ms vs previous Level 2 block (20 → 42 ms).",
    );
  });

  it("shows no change when the previous same-level block matches", () => {
    renderResults([prior(42)]);
    expect(screen.getByTestId("flanker-cost-vs-previous-0").textContent).toBe(
      "No change vs previous Level 2 block (42 ms).",
    );
    expect(screen.getByTestId("flanker-cost-vs-previous-0").getAttribute("data-direction")).toBe(
      "same",
    );
  });

  it("marks the first block at a level", () => {
    renderResults([]);
    expect(screen.getByTestId("flanker-cost-vs-previous-0").textContent).toBe(
      "First block at this level; no earlier interference-cost comparison.",
    );
  });

  it("does not compare against a different level", () => {
    renderResults([prior(10, 3)]);
    expect(screen.getByTestId("flanker-cost-vs-previous-0").textContent).toBe(
      "First block at this level; no earlier interference-cost comparison.",
    );
  });
});
