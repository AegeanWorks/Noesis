// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ResultsScreen } from "../../src/ui/screens/ResultsScreen";
import type { MechanicResult } from "../../src/engine/types";

function nbackResult(): MechanicResult {
  return {
    mechanic: "nback",
    domain: "working_memory",
    trials: 10,
    durationMs: 60_000,
    metrics: { accuracy: 0.9 },
    summary: "n-back summary",
    seed: 7,
    stateHash: "0123456789abcdef",
  };
}

function renderResults(newBests: MechanicResult["mechanic"][]) {
  render(
    <ResultsScreen
      results={[nbackResult()]}
      motivation={null}
      sessionId="session-1"
      newBests={newBests}
      onAdverseLogged={() => {}}
      onRestart={() => {}}
      onEvidence={() => {}}
      onHome={() => {}}
    />,
  );
}

afterEach(cleanup);

describe("ResultsScreen personal bests", () => {
  it("highlights a beaten best", () => {
    renderResults(["nback"]);
    expect(screen.getByTestId("new-best-nback").textContent).toMatch(/new personal best/i);
  });

  it("stays quiet without a beaten best", () => {
    renderResults([]);
    expect(screen.queryByTestId("new-best-nback")).toBeNull();
  });
});
