// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { MechanicResult } from "../../src/engine/types";
import type { SessionRecord } from "../../src/storage/history";
import { ResultsScreen } from "../../src/ui/screens/ResultsScreen";

afterEach(cleanup);

const RESULT: MechanicResult = {
  mechanic: "switching",
  domain: "cognitive_flexibility",
  trials: 24,
  durationMs: 70_000,
  metrics: { accuracy: 1, switch_cost_ms: 20 },
  summary: "Task Switch: 100% accuracy, 24/24 correct, 20 ms switch cost.",
  seed: 42,
  stateHash: "0123456789abcdef",
  difficulty: 3,
};

const PRIOR: SessionRecord = {
  id: "prior",
  finishedAt: "2026-11-07T10:00:00.000Z",
  seed: 41,
  results: [
    {
      ...RESULT,
      metrics: { accuracy: 1, switch_cost_ms: 40 },
      summary: "Task Switch: 100% accuracy, 24/24 correct, 40 ms switch cost.",
      stateHash: "fedcba9876543210",
    },
  ],
};

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

describe("Task Switch result explanation", () => {
  it("explains switch cost and the negative-value case", () => {
    renderResults([]);
    const note = screen.getByTestId("switch-cost-note").textContent ?? "";
    expect(note).toMatch(/switch trials minus repeat trials/i);
    expect(note).toMatch(/negative value/i);
    expect(note).toMatch(/not a diagnosis/i);
  });

  it("shows a same-level delta against the previous result", () => {
    renderResults([PRIOR]);
    expect(screen.getByTestId("switch-cost-vs-previous-0").textContent).toBe(
      "Improved 20 ms vs previous Level 3 block (40 → 20 ms).",
    );
  });

  it("marks the first block at a level", () => {
    renderResults([]);
    expect(screen.getByTestId("switch-cost-vs-previous-0").textContent).toBe(
      "First block at this level; no earlier switch-cost comparison.",
    );
  });
});
