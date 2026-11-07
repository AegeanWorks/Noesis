// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { SessionView } from "../../src/engine/types";
import { SessionScreen } from "../../src/ui/screens/SessionScreen";

afterEach(cleanup);

const VIEW: SessionView = {
  phase: "running",
  blockIndex: 0,
  blockCount: 2,
  blockLabel: "N-back",
  blockDifficulty: 2,
  mechanic: null,
  progressCurrent: 1,
  progressTotal: 2,
  results: [],
  error: null,
  canAdvance: false,
};

function renderPaused(onEnd: () => void) {
  render(
    <SessionScreen
      view={VIEW}
      paused
      motivation={null}
      targetMs={5 * 60_000}
      elapsedMs={30_000}
      showClock
      onPause={vi.fn()}
      onResume={vi.fn()}
      onEnd={onEnd}
      onNext={vi.fn()}
      onBankAndNext={vi.fn()}
      onRiskAndNext={vi.fn()}
      onRespond={vi.fn()}
      onAnswer={vi.fn()}
    />,
  );
}

describe("ending a session", () => {
  it("asks before discarding an unfinished session and can keep it", () => {
    const onEnd = vi.fn();
    renderPaused(onEnd);
    fireEvent.click(screen.getByTestId("end-session"));
    expect(onEnd).not.toHaveBeenCalled();
    expect(screen.getByText("End this session?")).toBeTruthy();
    fireEvent.click(screen.getByTestId("keep-session"));
    expect(screen.queryByText("End this session?")).toBeNull();
    fireEvent.click(screen.getByTestId("end-session"));
    fireEvent.click(screen.getByTestId("confirm-end"));
    expect(onEnd).toHaveBeenCalledTimes(1);
  });
});
