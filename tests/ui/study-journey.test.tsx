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
import { clearFarChecks, loadFarChecks } from "../../src/storage/farChecks";

vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
vi.stubGlobal("cancelAnimationFrame", vi.fn());

beforeEach(() => {
  sessionStore.reset();
  clearHistory();
  clearSessionSnapshot();
  clearSafety();
  clearStudy();
  clearSettings();
  clearFarChecks();
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
    const actions: SessionAction[] = runMechanic(
      block.mechanic,
      blockSeed,
      block.difficulty,
      block.trials,
      optimalPolicy,
    ).actions;
    // Batch the block's 50 ms ticks into one act: React still renders the
    // block_complete frame (where the per-block Motivation effect runs),
    // but not thousands of intermediate trial frames.
    act(() => {
      for (const action of actions) {
        sessionStore.dispatch(action);
      }
    });
    act(() => {
      sessionStore.dispatch({ type: "next" });
    });
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
    const exposure = history[0]?.motivation;
    expect(exposure?.completionBonus).toBe(15);
    expect(exposure?.schedule).toEqual({ steadyUpTo: 0.6, boostUpTo: 0.85 });
    expect(exposure?.banked).toBeGreaterThan(0);
    expect(exposure?.tiers.length).toBeGreaterThan(0);
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
    expect(loadHistory()[0]?.arm).toBe("engagement");
    expect(loadHistory()[0]?.motivation).toMatchObject({
      schedule: { steadyUpTo: 0.6, boostUpTo: 0.85 },
      completionBonus: 15,
    });
    cleanup();
    sessionStore.reset();
    clearHistory();
    clearStudy();
    enrollStudy({ studyId: "RCT-1", arm: "control", consented: true });
    render(<App />);
    fireEvent.click(screen.getByTestId("start-session"));
    completeSession();
    expect(screen.getByTestId("momentum-summary").textContent).toMatch(/block 1 · boost/i);
    expect(loadHistory()[0]?.arm).toBe("control");
    expect(loadHistory()[0]?.motivation).toMatchObject({
      schedule: { steadyUpTo: 0.7, boostUpTo: 0.9 },
      completionBonus: 0,
    });
  });

  it("completes a far check through the app and tags it with the arm", () => {
    enrollStudy({ studyId: "RCT-1", arm: "engagement", consented: true });
    render(<App />);
    fireEvent.click(screen.getByTestId("far-check-card"));
    fireEvent.click(screen.getByRole("button", { name: "Start far check" }));
    for (let i = 0; i < 8; i += 1) {
      fireEvent.click(screen.getByRole("button", { name: /next word|start test/i }));
    }
    expect(screen.getByTestId("far-check-test")).toBeTruthy();
    for (let i = 0; i < 16; i += 1) {
      fireEvent.click(screen.getByRole("button", { name: "Seen before" }));
    }
    expect(screen.getByTestId("far-check-done")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Save result" }));
    const checks = loadFarChecks();
    expect(checks).toHaveLength(1);
    expect(checks[0]).toMatchObject({ arm: "engagement", studied: 8, tested: 16 });
  });
});
