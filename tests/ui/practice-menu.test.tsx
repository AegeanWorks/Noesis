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

function switchingRecord(
  level: number,
  costs: readonly number[],
  id: string,
  finishedAt: string,
): SessionRecord {
  return {
    id,
    finishedAt,
    seed: 42,
    results: costs.map((cost, index) => ({
      mechanic: "switching",
      domain: "cognitive_flexibility",
      trials: 24,
      durationMs: 70_000,
      metrics: { accuracy: 1, switch_cost_ms: cost },
      summary: `Task Switch: 100% accuracy, 24/24 correct, ${cost} ms switch cost.`,
      seed: 42,
      stateHash: `0123456789abcde${index}`,
      difficulty: level,
    })),
  };
}

function flankerRecord(
  level: number,
  costs: readonly number[],
  id: string,
  finishedAt: string,
): SessionRecord {
  return {
    id,
    finishedAt,
    seed: 42,
    results: costs.map((cost, index) => ({
      mechanic: "flanker",
      domain: "executive_function",
      trials: 20,
      durationMs: 60_000,
      metrics: { accuracy: 1, interference_cost_ms: cost },
      summary: `Flanker: 100% accuracy, 20/20 correct, ${cost} ms interference cost.`,
      seed: 42,
      stateHash: `0123456789abcde${index}`,
      difficulty: level,
    })),
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
    for (const name of ["N-back", "Go / No-Go", "Reasoning", "Speed Tap", "Task Switch", "Flanker"]) {
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

  it("shows a level-aware Task Switch switch-cost trend", () => {
    renderMenu({
      history: [
        switchingRecord(3, [180, 200], "s3", "2026-11-03T10:00:00.000Z"),
        switchingRecord(2, [90, 70], "s2", "2026-11-02T10:00:00.000Z"),
        switchingRecord(1, [50], "s1", "2026-11-01T10:00:00.000Z"),
      ],
      initialTab: "history",
    });
    const card = screen.getByTestId("switch-cost-trend");
    expect(card.textContent).toMatch(/switch cost/i);
    const rows = screen.getAllByTestId(/^switch-cost-level-/);
    expect(rows.map((row) => row.getAttribute("data-testid"))).toEqual([
      "switch-cost-level-3",
      "switch-cost-level-2",
      "switch-cost-level-1",
    ]);
    const level3 = screen.getByTestId("switch-cost-level-3");
    expect(level3.textContent).toMatch(/Last 200 ms/);
    expect(level3.textContent).toMatch(/Mean 190 ms/);
    expect(level3.textContent).toMatch(/Lowest 180 ms/);
    expect(level3.textContent).not.toMatch(/50 ms/);
    expect(screen.getByTestId("switch-cost-level-2").textContent).toMatch(/Last 70 ms/);
    expect(screen.getByTestId("switch-cost-level-1").textContent).toMatch(/Last 50 ms/);
    expect(screen.getByTestId("switch-cost-change-3").textContent).toBe(
      "Worsened +20 ms vs previous block at this level",
    );
    expect(screen.getByTestId("switch-cost-change-2").textContent).toBe(
      "Improved 20 ms vs previous block at this level",
    );
    expect(screen.getByTestId("switch-cost-change-1").textContent).toBe(
      "First block at this level",
    );
  });

  it("shows the latest same-level switch cost on the Task Switch card", () => {
    renderMenu({
      history: [
        switchingRecord(2, [90, 70], "s2", "2026-11-08T10:00:00.000Z"),
        switchingRecord(3, [180, 200], "s3", "2026-11-07T10:00:00.000Z"),
      ],
    });
    expect(screen.getByTestId("menu-switch-cost").textContent).toBe(
      "Switch cost L2: last 70 ms · 90 → 70 ms · improved 20 ms",
    );
  });

  it("omits the switch-cost trend when there are no Task Switch blocks", () => {
    renderMenu({ history: [record()], initialTab: "history" });
    expect(screen.queryByTestId("switch-cost-trend")).toBeNull();
  });

  it("shows a level-aware Flanker interference-cost trend", () => {
    renderMenu({
      history: [
        flankerRecord(3, [120, 90], "f3", "2026-11-03T10:00:00.000Z"),
        flankerRecord(2, [60, 80], "f2", "2026-11-02T10:00:00.000Z"),
        flankerRecord(1, [40], "f1", "2026-11-01T10:00:00.000Z"),
      ],
      initialTab: "history",
    });
    const card = screen.getByTestId("flanker-cost-trend");
    expect(card.textContent).toMatch(/interference cost/i);
    expect(card.textContent).toMatch(/incongruent/i);
    const rows = screen.getAllByTestId(/^flanker-cost-level-/);
    expect(rows.map((row) => row.getAttribute("data-testid"))).toEqual([
      "flanker-cost-level-3",
      "flanker-cost-level-2",
      "flanker-cost-level-1",
    ]);
    const level3 = screen.getByTestId("flanker-cost-level-3");
    expect(level3.textContent).toMatch(/Last 90 ms/);
    expect(level3.textContent).toMatch(/Mean 105 ms/);
    expect(level3.textContent).toMatch(/Lowest 90 ms/);
    expect(level3.textContent).not.toMatch(/40 ms/);
    expect(screen.getByTestId("flanker-cost-level-2").textContent).toMatch(/Last 80 ms/);
    expect(screen.getByTestId("flanker-cost-level-1").textContent).toMatch(/Last 40 ms/);
    expect(screen.getByTestId("flanker-cost-change-3").textContent).toBe(
      "Improved 30 ms vs previous block at this level",
    );
    expect(screen.getByTestId("flanker-cost-change-2").textContent).toBe(
      "Worsened +20 ms vs previous block at this level",
    );
    expect(screen.getByTestId("flanker-cost-change-1").textContent).toBe(
      "First block at this level",
    );
  });

  it("shows the latest same-level interference cost on the Flanker card", () => {
    renderMenu({
      history: [
        flankerRecord(2, [60, 80], "f2", "2026-11-08T10:00:00.000Z"),
        flankerRecord(3, [120, 90], "f3", "2026-11-07T10:00:00.000Z"),
      ],
    });
    expect(screen.getByTestId("menu-flanker-cost").textContent).toBe(
      "Interference cost L2: last 80 ms · 60 → 80 ms · worsened +20 ms",
    );
  });

  it("omits the Flanker trend when there are no Flanker blocks", () => {
    renderMenu({ history: [record()], initialTab: "history" });
    expect(screen.queryByTestId("flanker-cost-trend")).toBeNull();
    cleanup();
    renderMenu({ history: [record()] });
    expect(screen.queryByTestId("menu-flanker-cost")).toBeNull();
  });

  it("switches between choosing a test and viewing history", () => {
    renderMenu({ history: [record()] });
    fireEvent.click(screen.getByRole("tab", { name: /history/i }));
    expect(screen.getByTestId("history-session")).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: /choose a test/i }));
    expect(screen.getByTestId("menu-test-nback")).toBeTruthy();
  });
});
