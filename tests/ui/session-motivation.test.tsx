// @vitest-environment jsdom
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { addBlockMotivation, createMotivation } from "../../src/engine/motivation";
import type { MechanicResult, MechanicView, SessionView } from "../../src/engine/types";
import { SessionScreen } from "../../src/ui/screens/SessionScreen";

afterEach(cleanup);

const RESULT: MechanicResult = {
  mechanic: "nback",
  domain: "working_memory",
  trials: 20,
  durationMs: 50_000,
  metrics: { accuracy: 0.8, current_streak: 4, max_streak: 6 },
  summary: "2-back: 80% accuracy",
  seed: 42,
  stateHash: "0123456789abcdef",
};

const MECHANIC: MechanicView = {
  mechanic: "nback",
  name: "2-back",
  phase: "complete",
  prompt: "",
  stimulus: null,
  options: null,
  explanation: null,
  progressCurrent: 20,
  progressTotal: 20,
  feedback: null,
  feedbackTone: null,
  canRespond: false,
  controls: [],
  metrics: { current_streak: 4, max_streak: 6 },
  complete: true,
};

function view(blockIndex = 0, blockCount = 3): SessionView {
  return {
    phase: "block_complete",
    blockIndex,
    blockCount,
    blockLabel: "N-back",
    mechanic: MECHANIC,
    progressCurrent: 1,
    progressTotal: blockCount,
    results: [RESULT],
    error: null,
    canAdvance: true,
  };
}

function renderSession(overrides: Partial<ComponentProps<typeof SessionScreen>> = {}) {
  const props: ComponentProps<typeof SessionScreen> = {
    view: view(),
    paused: false,
    motivation: addBlockMotivation(createMotivation(42), 0, RESULT, 0.85),
    targetMs: 8 * 60_000,
    elapsedMs: 60_000,
    showClock: true,
    onPause: vi.fn(),
    onResume: vi.fn(),
    onEnd: vi.fn(),
    onNext: vi.fn(),
    onBankAndNext: vi.fn(),
    onRiskAndNext: vi.fn(),
    onRespond: vi.fn(),
    onAnswer: vi.fn(),
    ...overrides,
  };
  render(<SessionScreen {...props} />);
  return props;
}

describe("SessionScreen Motivation mode", () => {
  it("shows momentum and offers bank and risk", () => {
    renderSession();
    expect(screen.getByTestId("momentum").textContent).toContain("momentum");
    expect(screen.getByTestId("streak").textContent).toContain("Streak");
    expect(screen.getByTestId("bank-next")).toBeTruthy();
    expect(screen.getByTestId("risk-next")).toBeTruthy();
  });

  it("banks and continues", () => {
    const props = renderSession();
    fireEvent.click(screen.getByTestId("bank-next"));
    expect(props.onBankAndNext).toHaveBeenCalledTimes(1);
  });

  it("risks and continues", () => {
    const props = renderSession();
    fireEvent.click(screen.getByTestId("risk-next"));
    expect(props.onRiskAndNext).toHaveBeenCalledTimes(1);
  });

  it("offers only finish on the final block", () => {
    const props = renderSession({ view: view(2, 3) });
    expect(screen.queryByTestId("risk-next")).toBeNull();
    fireEvent.click(screen.getByTestId("next-block"));
    expect(props.onBankAndNext).toHaveBeenCalledTimes(1);
  });

  it("falls back to plain continue when motivation is off", () => {
    const props = renderSession({ motivation: null });
    expect(screen.queryByTestId("momentum")).toBeNull();
    fireEvent.click(screen.getByTestId("next-block"));
    expect(props.onNext).toHaveBeenCalledTimes(1);
  });

  it("shows the clock by default and hides it on request", () => {
    renderSession({ showClock: true });
    expect(screen.getByText(/elapsed 1:00/i)).toBeTruthy();
    cleanup();
    renderSession({ showClock: false });
    expect(screen.queryByText(/elapsed/i)).toBeNull();
  });
});
