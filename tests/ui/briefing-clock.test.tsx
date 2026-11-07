// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { App } from "../../src/App";
import { sessionStore } from "../../src/engine/store";
import { clearHistory } from "../../src/storage/history";
import { clearSafety, saveSafety } from "../../src/storage/safety";
import { clearSessionSnapshot } from "../../src/storage/sessionSnapshot";
import { clearSettings } from "../../src/storage/settings";

let frames: FrameRequestCallback[] = [];
let now = 0;

beforeEach(() => {
  frames = [];
  now = 0;
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn((callback: FrameRequestCallback) => {
      frames.push(callback);
      return frames.length;
    }),
  );
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  vi.spyOn(performance, "now").mockImplementation(() => now);
  sessionStore.reset();
  clearHistory();
  clearSessionSnapshot();
  clearSettings();
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
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function runFrame(at: number): void {
  now = at;
  const callbacks = frames;
  frames = [];
  act(() => {
    for (const callback of callbacks) callback(at);
  });
}

describe("briefing clock gate", () => {
  it("does not advance the session clock while the briefing is open", () => {
    render(<App />);
    fireEvent.click(screen.getByTestId("start-session"));
    expect(screen.getByTestId("test-briefing")).toBeTruthy();
    expect(frames).toHaveLength(0);

    runFrame(500);
    expect(sessionStore.getSnapshot()?.tick ?? 0).toBe(0);

    fireEvent.click(screen.getByTestId("begin-test"));
    expect(frames.length).toBeGreaterThan(0);
    runFrame(1_000);
    expect(sessionStore.getSnapshot()?.tick ?? 0).toBeGreaterThan(0);
  });
});
