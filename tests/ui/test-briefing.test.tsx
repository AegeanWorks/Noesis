// @vitest-environment jsdom
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { MechanicView, SessionView } from "../../src/engine/types";
import { SessionScreen } from "../../src/ui/screens/SessionScreen";

afterEach(cleanup);

const MECHANIC: MechanicView = {
  mechanic: "nback",
  name: "2-back",
  phase: "trial",
  prompt: "Match when the letter is the same as 2 back.",
  stimulus: "A",
  options: null,
  explanation: null,
  progressCurrent: 1,
  progressTotal: 10,
  feedback: null,
  feedbackTone: null,
  canRespond: true,
  controls: [],
  metrics: {},
  complete: false,
};

function view(blockIndex = 0, blockCount = 3): SessionView {
  return {
    phase: "running",
    blockIndex,
    blockCount,
    blockLabel: "N-back",
    blockDifficulty: 2,
    mechanic: MECHANIC,
    progressCurrent: 1,
    progressTotal: blockCount,
    results: [],
    error: null,
    canAdvance: false,
  };
}

function renderSession(
  overrides: Partial<ComponentProps<typeof SessionScreen>> = {},
) {
  const props: ComponentProps<typeof SessionScreen> = {
    view: view(),
    paused: false,
    motivation: null,
    targetMs: 8 * 60_000,
    elapsedMs: 0,
    showClock: true,
    onPause: vi.fn(),
    onResume: vi.fn(),
    onEnd: vi.fn(),
    onNext: vi.fn(),
    onBankAndNext: vi.fn(),
    onRiskAndNext: vi.fn(),
    onRespond: vi.fn(),
    onAnswer: vi.fn(),
    onBriefingChange: vi.fn(),
    ...overrides,
  };
  const result = render(<SessionScreen {...props} />);
  return { props, ...result };
}

describe("pre-test briefing", () => {
  it("explains the test, its evidence boundary and source before the stage appears", () => {
    const onBriefingChange = vi.fn();
    const { props } = renderSession({ onBriefingChange });

    const briefing = screen.getByTestId("test-briefing");
    expect(briefing.textContent).toMatch(/before this test/i);
    expect(briefing.textContent).toMatch(/what this measures/i);
    expect(briefing.textContent).toMatch(/working-memory updating/i);
    expect(briefing.textContent).toMatch(/what the evidence supports/i);
    expect(briefing.textContent).toMatch(/untrained n-back/i);
    expect(briefing.textContent).toMatch(/PMID 28116702/);
    expect(briefing.textContent).toMatch(/not claimed/i);
    expect(briefing.textContent).toMatch(/safety/i);
    expect(screen.queryByTestId("stimulus")).toBeNull();
    expect(onBriefingChange).toHaveBeenLastCalledWith(true);
    fireEvent.keyDown(window, { code: "Space" });
    expect(props.onRespond).not.toHaveBeenCalled();
  });

  it("starts the block only after Begin test and re-briefs the next block", () => {
    const onBriefingChange = vi.fn();
    const rendered = renderSession({ onBriefingChange });

    fireEvent.click(screen.getByTestId("begin-test"));
    expect(screen.queryByTestId("test-briefing")).toBeNull();
    expect(screen.getByTestId("stimulus").textContent).toBe("A");
    expect(onBriefingChange).toHaveBeenLastCalledWith(false);

    rendered.rerender(
      <SessionScreen {...rendered.props} view={view(1, 3)} />,
    );
    expect(screen.getByTestId("test-briefing").textContent).toMatch(/block 2 of 3/i);
    expect(screen.queryByTestId("stimulus")).toBeNull();
  });

  it("begins the test with Enter from the briefing", () => {
    renderSession();
    fireEvent.keyDown(window, { key: "Enter" });
    expect(screen.queryByTestId("test-briefing")).toBeNull();
    expect(screen.getByTestId("stimulus")).toBeTruthy();
  });

  it("shows the Paired Associates mnemonic hint in its pre-test briefing", () => {
    const pairedView: SessionView = {
      ...view(),
      blockLabel: "Paired Associates",
      mechanic: {
        ...MECHANIC,
        mechanic: "paired",
        name: "Paired Associates",
      },
    };
    renderSession({ view: pairedView });
    const hint = screen.getByTestId("briefing-strategy");
    expect(hint.textContent).toMatch(/vivid image|short sentence/i);
    expect(hint.textContent).toMatch(/link/i);
  });

  it("offers an optional confidence check and reports the choice", () => {
    const onConfidence = vi.fn();
    renderSession({ onConfidence, confidence: "high" });
    expect(screen.getByTestId("confidence-high").getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByTestId("confidence-low"));
    expect(onConfidence).toHaveBeenCalledWith("low");
  });

  it("bounds the confidence check with judgments-of-learning evidence", () => {
    renderSession({ onConfidence: vi.fn() });
    const note = screen.getByTestId("confidence-evidence");
    expect(note.textContent).toMatch(/weak predictor|weakly related/i);
    expect(note.textContent).toMatch(/not a validated memory intervention/i);
    expect(note.querySelector('a[href*="40875340"]')).toBeTruthy();
    expect(note.querySelector('a[href*="29161973"]')).toBeTruthy();
    expect(note.querySelector('a[href*="40845062"]')).toBeTruthy();
  });

  it("does not brief a paused or completed block", () => {
    renderSession({ view: { ...view(), phase: "block_complete" } });
    expect(screen.queryByTestId("test-briefing")).toBeNull();
  });
});

describe("keyboard answers for recent focus tests", () => {
  it("maps digit keys 0-9 directly to Digit Span options", () => {
    const onAnswer = vi.fn();
    renderSession({
      onAnswer,
      view: {
        ...view(),
        mechanic: {
          ...MECHANIC,
          mechanic: "digit",
          name: "Digit Span",
          controls: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
          options: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
        },
      },
    });
    fireEvent.click(screen.getByTestId("begin-test"));
    fireEvent.keyDown(window, { key: "7" });
    expect(onAnswer).toHaveBeenCalledWith(7);
  });

  it("maps keys 1-4 to the four Symbol options", () => {
    const onAnswer = vi.fn();
    renderSession({
      onAnswer,
      view: {
        ...view(),
        mechanic: {
          ...MECHANIC,
          mechanic: "symbol",
          name: "Digit Symbol",
          controls: ["1", "2", "3", "4"],
          options: ["1", "2", "3", "4"],
        },
      },
    });
    fireEvent.click(screen.getByTestId("begin-test"));
    fireEvent.keyDown(window, { key: "3" });
    expect(onAnswer).toHaveBeenCalledWith(2);
    fireEvent.keyDown(window, { key: "9" });
    expect(onAnswer).toHaveBeenCalledTimes(1);
  });
});
