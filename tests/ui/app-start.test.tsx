// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { App } from "../../src/App";
import { applySessionAction, createSession, defaultSessionConfig } from "../../src/engine/session";
import { sessionStore } from "../../src/engine/store";
import { clearHistory } from "../../src/storage/history";
import { clearSafety, saveSafety } from "../../src/storage/safety";
import {
  clearSessionSnapshot,
  saveSessionSnapshot,
} from "../../src/storage/sessionSnapshot";

beforeEach(() => {
  vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  sessionStore.reset();
  clearHistory();
  clearSessionSnapshot();
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
  vi.unstubAllGlobals();
});

describe("one-click start", () => {
  it("starts and begins the first block from home in one click", () => {
    render(<App />);
    fireEvent.click(screen.getByTestId("start-session"));
    const root = screen.getByTestId("session-root");
    expect(root.getAttribute("data-phase")).toBe("running");
    expect(screen.getByTestId("stimulus")).toBeTruthy();
    expect(sessionStore.getSnapshot()?.phase).toBe("running");
    expect(sessionStore.getSnapshot()?.current?.mechanic).toBe("nback");
    expect(screen.getByTestId("streak")).toBeTruthy();
  });

  it("restores a saved session and resumes it", () => {
    const state = applySessionAction(createSession(defaultSessionConfig(42)), {
      type: "begin",
    });
    saveSessionSnapshot(state);
    render(<App />);
    const resume = screen.getByTestId("start-session");
    expect(resume.textContent).toContain("Resume session");
    fireEvent.click(resume);
    expect(screen.getByTestId("session-root").getAttribute("data-phase")).toBe("running");
    expect(sessionStore.getSnapshot()?.config.seed).toBe(42);
  });

  it("shows the resume label and resumes in one click", () => {
    render(<App />);
    fireEvent.click(screen.getByTestId("start-session"));
    fireEvent.click(screen.getByRole("button", { name: "Noesis home" }));
    const resume = screen.getByTestId("start-session");
    expect(resume.textContent).toContain("Resume session");
    fireEvent.click(resume);
    expect(screen.getByTestId("session-root").getAttribute("data-phase")).toBe("running");
  });
});
