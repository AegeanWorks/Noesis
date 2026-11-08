// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { MechanicResult } from "../../src/engine/types";
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

describe("Task Switch result explanation", () => {
  it("explains switch cost and the negative-value case", () => {
    render(
      <ResultsScreen
        results={[RESULT]}
        motivation={null}
        sessionId="session-1"
        newBests={[]}
        onAdverseLogged={vi.fn()}
        onRestart={vi.fn()}
        onEvidence={vi.fn()}
        onHome={vi.fn()}
      />,
    );
    const note = screen.getByTestId("switch-cost-note").textContent ?? "";
    expect(note).toMatch(/switch trials minus repeat trials/i);
    expect(note).toMatch(/negative value/i);
    expect(note).toMatch(/not a diagnosis/i);
  });
});
