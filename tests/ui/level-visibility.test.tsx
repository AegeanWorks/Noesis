// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { MechanicResult, SessionView } from "../../src/engine/types";
import { ResultsScreen } from "../../src/ui/screens/ResultsScreen";
import { SessionScreen } from "../../src/ui/screens/SessionScreen";

afterEach(cleanup);

const RESULT: MechanicResult = {
  mechanic: "nback",
  domain: "working_memory",
  trials: 20,
  durationMs: 50_000,
  metrics: { accuracy: 0.8 },
  summary: "2-back: 80% accuracy.",
  seed: 42,
  stateHash: "0123456789abcdef",
  difficulty: 3,
};

const VIEW: SessionView = {
  phase: "running",
  blockIndex: 1,
  blockCount: 4,
  blockLabel: "Reasoning",
  blockDifficulty: 3,
  mechanic: null,
  progressCurrent: 2,
  progressTotal: 4,
  results: [],
  error: null,
  canAdvance: false,
};

describe("difficulty visibility", () => {
  it("shows the current block level in the session header", () => {
    render(
      <SessionScreen
        view={VIEW}
        paused={false}
        motivation={null}
        targetMs={8 * 60_000}
        elapsedMs={0}
        showClock
        onPause={vi.fn()}
        onResume={vi.fn()}
        onEnd={vi.fn()}
        onNext={vi.fn()}
        onBankAndNext={vi.fn()}
        onRiskAndNext={vi.fn()}
        onRespond={vi.fn()}
        onAnswer={vi.fn()}
      />,
    );
    expect(screen.getByText(/Block 2 of 4 · Level 3/)).toBeTruthy();
  });

  it("shows the block level on its result card", () => {
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
    expect(screen.getByTestId("level-nback").textContent).toBe("Level 3");
  });
});
