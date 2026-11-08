// @vitest-environment jsdom
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PracticeMenuScreen } from "../../src/ui/screens/PracticeMenuScreen";
import type { SessionRecord } from "../../src/storage/history";

afterEach(cleanup);

function record(
  finishedAt = "2026-11-08T10:00:00.000Z",
  id = "session-1",
): SessionRecord {
  return {
    id,
    finishedAt,
    seed: 42,
    results: [
      {
        mechanic: "nback",
        domain: "working_memory",
        trials: 18,
        durationMs: 60_000,
        metrics: { accuracy: 0.8 },
        summary: "2-back: 80% accuracy",
        seed: 42,
        stateHash: "0123456789abcdef",
        difficulty: 2,
      },
      {
        mechanic: "gonogo",
        domain: "inhibition",
        trials: 20,
        durationMs: 45_000,
        metrics: { accuracy: 0.65 },
        summary: "Go/No-Go: 65% accuracy",
        seed: 42,
        stateHash: "fedcba9876543210",
        difficulty: 2,
      },
    ],
  };
}

function renderMenu(overrides: Partial<ComponentProps<typeof PracticeMenuScreen>> = {}) {
  const props: ComponentProps<typeof PracticeMenuScreen> = {
    history: [],
    adherenceCounts: { started: 0, completed: 0, aborted: 0 },
    hasSession: false,
    sessionLength: "standard",
    initialTab: "tests",
    onStartTest: vi.fn(),
    onStartSession: vi.fn(),
    onResume: vi.fn(),
    onExportHistory: vi.fn(),
    onHome: vi.fn(),
    ...overrides,
  };
  render(<PracticeMenuScreen {...props} />);
  return props;
}

describe("PracticeMenuScreen", () => {
  it("lists every test with a literature brief and starts the chosen one", () => {
    const props = renderMenu();
    for (const name of ["N-back", "Go / No-Go", "Reasoning", "Speed Tap"]) {
      expect(screen.getByRole("heading", { name })).toBeTruthy();
    }
    const nback = screen.getByTestId("menu-test-nback");
    expect(nback.textContent).toMatch(/working-memory updating/i);
    expect(nback.textContent).toMatch(/PMID 42711482/);
    expect(nback.textContent).toMatch(/not claim/i);
    fireEvent.click(screen.getByRole("button", { name: "Start N-back test" }));
    expect(props.onStartTest).toHaveBeenCalledWith("nback");
    fireEvent.click(screen.getByRole("button", { name: "Start Go / No-Go test" }));
    expect(props.onStartTest).toHaveBeenCalledWith("gonogo");
  });

  it("starts or resumes the interleaved session from the menu", () => {
    const onStartSession = vi.fn();
    const onResume = vi.fn();
    renderMenu({ onStartSession, onResume });
    fireEvent.click(screen.getByTestId("menu-start-session"));
    expect(onStartSession).toHaveBeenCalledTimes(1);
    cleanup();
    renderMenu({ hasSession: true, onStartSession, onResume });
    expect(screen.getByTestId("menu-start-session").textContent).toMatch(/resume/i);
    fireEvent.click(screen.getByTestId("menu-start-session"));
    expect(onResume).toHaveBeenCalledTimes(1);
  });

  it("shows a neutral session completion summary in History", () => {
    renderMenu({
      initialTab: "history",
      adherenceCounts: { started: 4, completed: 3, aborted: 1 },
    });
    const summary = screen.getByTestId("menu-adherence");
    expect(summary.textContent).toMatch(/4 started/i);
    expect(summary.textContent).toMatch(/3 completed/i);
    expect(summary.textContent).toMatch(/1 ended early/i);
    expect(summary.textContent).toMatch(/75%/);
    expect(summary.textContent).toMatch(/not a failure/i);
  });

  it("shows an empty history state before the first session", () => {
    renderMenu({ initialTab: "history" });
    expect(screen.getByTestId("menu-history-empty").textContent).toMatch(/no completed sessions/i);
    expect(
      (screen.getByRole("button", { name: "Export practice data" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it("lists completed sessions with per-block levels and accuracies, and exports", () => {
    const onExportHistory = vi.fn();
    renderMenu({
      history: [record()],
      initialTab: "history",
      onExportHistory,
    });
    const session = screen.getByTestId("history-session");
    expect(session.textContent).toMatch(/N-back/);
    expect(session.textContent).toMatch(/Go \/ No-Go/);
    expect(session.textContent).toMatch(/Level 2/);
    expect(session.textContent).toMatch(/80%/);
    expect(session.textContent).toMatch(/65%/);
    expect(session.textContent).not.toMatch(/composite score of/i);
    fireEvent.click(screen.getByRole("button", { name: "Export practice data" }));
    expect(onExportHistory).toHaveBeenCalledTimes(1);
  });

  it("switches between choosing a test and viewing history", () => {
    renderMenu({ history: [record()] });
    fireEvent.click(screen.getByRole("tab", { name: /history/i }));
    expect(screen.getByTestId("history-session")).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: /choose a test/i }));
    expect(screen.getByTestId("menu-test-nback")).toBeTruthy();
  });
});
