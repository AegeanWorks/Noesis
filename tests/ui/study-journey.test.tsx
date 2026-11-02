// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { App } from "../../src/App";
import { sessionStore } from "../../src/engine/store";
import { defaultSessionConfig } from "../../src/engine/session";
import { optimalPolicy, runMechanic } from "../../src/engine/simulate";
import type { SessionAction } from "../../src/engine/types";
import { clearHistory, loadHistory } from "../../src/storage/history";
import { clearStudy, enrollStudy } from "../../src/storage/study";
import { clearSafety, saveSafety } from "../../src/storage/safety";
import { clearSessionSnapshot } from "../../src/storage/sessionSnapshot";
import { clearSettings } from "../../src/storage/settings";
import { clearEngagement } from "../../src/storage/engagement";

vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
vi.stubGlobal("cancelAnimationFrame", vi.fn());

beforeEach(() => {
  sessionStore.reset();
  clearHistory();
  clearSessionSnapshot();
  clearSafety();
  clearStudy();
  clearSettings();
  clearEngagement();
  saveSafety({ acknowledged: true, photosensitive: false, exerciseConcern: false, consent: true });
});

afterEach(() => {
  cleanup();
  sessionStore.reset();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function completeSession(): void {
  const config = sessionStore.getSnapshot()?.config ?? defaultSessionConfig(1);
  config.blocks.forEach((block, index) => {
    const blockSeed = (config.seed + (index + 1) * 1009) >>> 0;
    const actions: SessionAction[] = [
      ...runMechanic(block.mechanic, blockSeed, block.difficulty, block.trials, optimalPolicy).actions,
      { type: "next" },
    ];
    // One act() per dispatch so every intermediate phase renders and the
    // per-block motivation effect observes each block completion.
    for (const action of actions) {
      act(() => {
        sessionStore.dispatch(action);
      });
    }
  });
}

describe("trial data path", () => {
  it("tags a completed session with the enrolled arm and banks the finisher bonus", () => {
    enrollStudy({ studyId: "RCT-1", arm: "engagement", consented: true });
    render(<App />);
    fireEvent.click(screen.getByTestId("start-session"));
    completeSession();

    expect(screen.getByRole("heading", { name: "Your blocks, separately" })).toBeTruthy();
    const history = loadHistory();
    expect(history).toHaveLength(1);
    expect(history[0]?.arm).toBe("engagement");
    const momentum = screen.getByTestId("momentum-summary");
    expect(momentum.textContent).toMatch(/finisher bonus/i);
    expect(momentum.textContent).toContain("+15");
  });

  it("leaves sessions untagged outside a study", () => {
    render(<App />);
    fireEvent.click(screen.getByTestId("start-session"));

    const config = sessionStore.getSnapshot()?.config ?? defaultSessionConfig(1);
    expect(config.blocks.length).toBeGreaterThan(0);
    act(() => {
      sessionStore.dispatch({ type: "abort" });
    });
    expect(loadHistory()).toEqual([]);
  });

  it("deals volatile bonuses in the engagement arm and steady ones in control", () => {
    // Date.now() = 30 fixes the session seed so the first bonus roll (0.86)
    // lands between the volatile rare cutoff (0.85) and the steady one (0.9).
    vi.spyOn(Date, "now").mockReturnValue(30);
    enrollStudy({ studyId: "RCT-1", arm: "engagement", consented: true });
    render(<App />);
    fireEvent.click(screen.getByTestId("start-session"));
    completeSession();
    expect(screen.getByTestId("momentum-summary").textContent).toMatch(/block 1 · rare/i);
    cleanup();
    sessionStore.reset();
    clearHistory();
    clearStudy();
    enrollStudy({ studyId: "RCT-1", arm: "control", consented: true });
    render(<App />);
    fireEvent.click(screen.getByTestId("start-session"));
    completeSession();
    expect(screen.getByTestId("momentum-summary").textContent).toMatch(/block 1 · boost/i);
  });
});
