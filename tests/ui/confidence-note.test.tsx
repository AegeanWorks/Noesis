// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { MechanicResult } from "../../src/engine/types";
import { ResultsScreen } from "../../src/ui/screens/ResultsScreen";

afterEach(cleanup);

const RESULT: MechanicResult = {
  mechanic: "nback",
  domain: "working_memory",
  trials: 18,
  durationMs: 60_000,
  metrics: { accuracy: 0.9 },
  summary: "2-back: 90% accuracy.",
  seed: 42,
  stateHash: "0123456789abcdef",
  difficulty: 2,
};

function renderResults(confidences: readonly ("low" | "medium" | "high" | null)[]) {
  render(
    <ResultsScreen
      results={[RESULT]}
      history={[]}
      confidences={confidences}
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

describe("Results confidence note", () => {
  it("shows the selected confidence without presenting it as a score", () => {
    renderResults(["high"]);
    const note = screen.getByTestId("confidence-note-0").textContent ?? "";
    expect(note).toMatch(/Confidence: High/i);
    expect(note).toMatch(/not scored|not a diagnostic/i);
  });

  it("omits the note when no confidence was selected", () => {
    renderResults([]);
    expect(screen.queryByTestId("confidence-note-0")).toBeNull();
  });
});
