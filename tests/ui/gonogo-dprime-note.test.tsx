// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { MechanicResult } from "../../src/engine/types";
import { ResultsScreen } from "../../src/ui/screens/ResultsScreen";

afterEach(cleanup);

const RESULT: MechanicResult = {
  mechanic: "gonogo",
  domain: "inhibition",
  trials: 30,
  durationMs: 60_000,
  metrics: {
    accuracy: 0.9,
    commissions: 1,
    d_prime: 2.4,
    mean_go_reaction_ms: 420,
  },
  summary: "Go/No-Go: 90% accuracy, 1 impulse error, 420 ms mean go reaction.",
  seed: 42,
  stateHash: "0123456789abcdef",
  difficulty: 2,
};

function renderResults(result: MechanicResult = RESULT) {
  render(
    <ResultsScreen
      results={[result]}
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
}

describe("Go / No-Go sensitivity note", () => {
  it("shows sensitivity as a primary metric and explains response bias", () => {
    renderResults();
    expect(
      screen.getAllByText(/Sensitivity/).some((element) => element.tagName === "DT"),
    ).toBe(true);
    const note = screen.getByTestId("gonogo-dprime-note").textContent ?? "";
    expect(note).toMatch(/response bias|tendency to respond/i);
    expect(note).toMatch(/higher is better/i);
    expect(note).toMatch(/not a diagnosis/i);
  });

  it("omits the note for a different mechanic", () => {
    renderResults({ ...RESULT, mechanic: "nback", domain: "working_memory" });
    expect(screen.queryByTestId("gonogo-dprime-note")).toBeNull();
  });
});
