// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { App } from "../../src/App";
import { addBlockMotivation, createMotivation } from "../../src/engine/motivation";
import { applySessionAction, createSession } from "../../src/engine/session";
import { sessionStore } from "../../src/engine/store";
import type { SessionState } from "../../src/engine/types";
import { clearHistory } from "../../src/storage/history";
import { clearSafety, saveSafety } from "../../src/storage/safety";
import {
  clearSessionSnapshot,
  saveSessionSnapshot,
} from "../../src/storage/sessionSnapshot";
import { clearSettings, DEFAULT_SETTINGS, saveSettings } from "../../src/storage/settings";

function blockCompleteState(): SessionState {
  let state = applySessionAction(
    createSession({
      seed: 42,
      label: "Resume proof",
      blocks: [{ mechanic: "nback", difficulty: 1, trials: 10 }],
    }),
    { type: "begin" },
  );
  for (let step = 0; step < 20 && state.phase === "running"; step += 1) {
    state = applySessionAction(state, { type: "advance", ms: 10_000 });
  }
  if (state.phase !== "block_complete" || state.results.length !== 1) {
    throw new Error(`expected a completed block, got ${state.phase}`);
  }
  return state;
}

beforeEach(() => {
  vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  sessionStore.reset();
  clearHistory();
  clearSessionSnapshot();
  clearSettings();
  saveSettings({ ...DEFAULT_SETTINGS, motivationMode: true });
  saveSafety({
    acknowledged: true,
    photosensitive: false,
    exerciseConcern: false,
    consent: true,
  });
});

afterEach(() => {
  cleanup();
  sessionStore.reset();
  clearHistory();
  clearSafety();
  clearSessionSnapshot();
  clearSettings();
  vi.unstubAllGlobals();
});

describe("resume at a block boundary", () => {
  it("does not credit the same block's momentum twice after a reload", () => {
    const state = blockCompleteState();
    const motivation = addBlockMotivation(
      createMotivation(42),
      0,
      state.results[0]!,
      null,
    );
    const points = motivation.outcomes[0]!.points;
    saveSessionSnapshot(state, motivation);

    render(<App />);
    fireEvent.click(screen.getByTestId("start-session"));

    const text = screen.getByTestId("momentum").textContent ?? "";
    const unbanked = Number(/Unbanked (\d+)/.exec(text)?.[1]);
    expect(unbanked).toBe(points);
  });
});
