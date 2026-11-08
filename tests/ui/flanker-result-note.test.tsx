// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { MechanicResult } from "../../src/engine/types";
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

describe("Flanker result explanation", () => {
  it("explains interference cost and the negative-value case", () => {
    render(
      <ResultsScreen
        results={[RESULT]}
        history={[]}
        motivation={null}
        sessionId="session-1"
        newBests={[]}
        onAdverseLogged={vi.fn()}
        onRestart={vi.fn()}
        onEvidence={vi.fn()}
        onHome={vi.fn()}
      />,
    );
    const note = screen.getByTestId("flanker-interference-note").textContent ?? "";
    expect(note).toMatch(/incongruent trials minus congruent/i);
    expect(note).toMatch(/negative value/i);
    expect(note).toMatch(/not a diagnosis/i);
  });
});
