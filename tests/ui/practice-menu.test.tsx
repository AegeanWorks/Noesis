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

function spatialRecord(
  level: number,
  spans: readonly (readonly [number, number])[],
  id: string,
  finishedAt: string,
): SessionRecord {
  return {
    id,
    finishedAt,
    seed: 42,
    results: spans.map(([meanSpan, longestSpan], index) => ({
      mechanic: "spatial",
      domain: "working_memory",
      trials: 8,
      durationMs: 70_000,
      metrics: { accuracy: 1, mean_span: meanSpan, max_span: longestSpan },
      summary: `Spatial Span: 100% accuracy, 8/8 correct, longest span ${longestSpan}.`,
      seed: 42,
      stateHash: `0123456789abcde${index}`,
      difficulty: level,
    })),
  };
}

function rotationRecord(
  level: number,
  blocks: readonly (readonly [number, number])[],
  id: string,
  finishedAt: string,
): SessionRecord {
  return {
    id,
    finishedAt,
    seed: 42,
    results: blocks.map(([accuracy, responseMs], index) => ({
      mechanic: "rotation",
      domain: "reasoning",
      trials: 12,
      durationMs: 60_000,
      metrics: { accuracy, mean_response_ms: responseMs, mirror_accuracy: accuracy },
      summary: `Mental Rotation: ${Math.round(accuracy * 100)}% accuracy.`,
      seed: 42,
      stateHash: `0123456789abcde${index}`,
      difficulty: level,
    })),
  };
}

function prospectiveRecord(
  level: number,
  blocks: readonly (readonly [number, number, number, number])[],
  id: string,
  finishedAt: string,
): SessionRecord {
  return {
    id,
    finishedAt,
    seed: 42,
    results: blocks.map(([ongoing, cueHits, cueTrials, falseAlarms], index) => ({
      mechanic: "prospective",
      domain: "episodic_memory",
      trials: 24,
      durationMs: 60_000,
      metrics: {
        accuracy: ongoing,
        ongoing_accuracy: ongoing,
        cue_hits: cueHits,
        cue_trials: cueTrials,
        cue_accuracy: cueTrials === 0 ? 0 : cueHits / cueTrials,
        false_alarms: falseAlarms,
      },
      summary: `Prospective Memory: ${Math.round(ongoing * 100)}% ongoing accuracy.`,
      seed: 42,
      stateHash: `0123456789abcde${index}`,
      difficulty: level,
    })),
  };
}

function pairedRecord(
  level: number,
  blocks: readonly (readonly [number, number])[],
  id: string,
  finishedAt: string,
): SessionRecord {
  return {
    id,
    finishedAt,
    seed: 42,
    results: blocks.map(([accuracy, responseMs], index) => ({
      mechanic: "paired",
      domain: "episodic_memory",
      trials: 12,
      durationMs: 60_000,
      metrics: { accuracy, mean_response_ms: responseMs },
      summary: `Paired Associates: ${Math.round(accuracy * 100)}% accuracy.`,
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
    for (const name of ["N-back", "Go / No-Go", "Reasoning", "Speed Tap", "Task Switch", "Flanker", "Spatial Span", "Mental Rotation", "Prospective Memory", "Paired Associates"]) {
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

  it("shows a level-aware Spatial Span mean and longest-span trend", () => {
    renderMenu({
      history: [
        spatialRecord(3, [[6.0, 7], [6.5, 8]], "p3", "2026-11-03T10:00:00.000Z"),
        spatialRecord(2, [[5.5, 7], [5.0, 7]], "p2", "2026-11-02T10:00:00.000Z"),
        spatialRecord(1, [[4.0, 5]], "p1", "2026-11-01T10:00:00.000Z"),
      ],
      initialTab: "history",
    });
    const card = screen.getByTestId("spatial-span-trend");
    expect(card.textContent).toMatch(/mean span/i);
    expect(card.textContent).toMatch(/longest/i);
    const rows = screen.getAllByTestId(/^spatial-span-level-/);
    expect(rows.map((row) => row.getAttribute("data-testid"))).toEqual([
      "spatial-span-level-3",
      "spatial-span-level-2",
      "spatial-span-level-1",
    ]);
    const level3 = screen.getByTestId("spatial-span-level-3");
    expect(level3.textContent).toMatch(/Last mean 6.5/);
    expect(level3.textContent).toMatch(/Longest 8/);
    expect(level3.textContent).not.toMatch(/4\.0/);
    expect(screen.getByTestId("spatial-span-level-2").textContent).toMatch(/Last mean 5\.0/);
    expect(screen.getByTestId("spatial-span-level-1").textContent).toMatch(/Longest 5/);
    expect(screen.getByTestId("spatial-span-change-3").textContent).toBe(
      "Improved +0.5 mean span vs previous block at this level",
    );
    expect(screen.getByTestId("spatial-span-change-2").textContent).toBe(
      "Worsened -0.5 mean span vs previous block at this level",
    );
    expect(screen.getByTestId("spatial-span-change-1").textContent).toBe(
      "First block at this level",
    );
  });

  it("shows the latest same-level spatial span on the Spatial Span card", () => {
    renderMenu({
      history: [
        spatialRecord(2, [[5.5, 7], [5.0, 7]], "p2", "2026-11-08T10:00:00.000Z"),
        spatialRecord(3, [[6.0, 7], [6.5, 8]], "p3", "2026-11-07T10:00:00.000Z"),
      ],
    });
    expect(screen.getByTestId("menu-spatial-span").textContent).toBe(
      "Spatial span L2: last mean 5.0 · longest 7 · worsened -0.5 vs previous block",
    );
  });

  it("omits the Spatial Span trend when there are no Spatial Span blocks", () => {
    renderMenu({ history: [record()], initialTab: "history" });
    expect(screen.queryByTestId("spatial-span-trend")).toBeNull();
    cleanup();
    renderMenu({ history: [record()] });
    expect(screen.queryByTestId("menu-spatial-span")).toBeNull();
  });

  it("shows a level-aware Mental Rotation accuracy and response-time trend", () => {
    renderMenu({
      history: [
        rotationRecord(3, [[0.9, 500], [1, 400]], "r3", "2026-11-03T10:00:00.000Z"),
        rotationRecord(2, [[0.8, 600], [0.9, 500]], "r2", "2026-11-02T10:00:00.000Z"),
        rotationRecord(1, [[0.7, 700]], "r1", "2026-11-01T10:00:00.000Z"),
      ],
      initialTab: "history",
    });
    const card = screen.getByTestId("rotation-trend");
    expect(card.textContent).toMatch(/accuracy/i);
    expect(card.textContent).toMatch(/response time/i);
    const rows = screen.getAllByTestId(/^rotation-level-/);
    expect(rows.map((row) => row.getAttribute("data-testid"))).toEqual([
      "rotation-level-3",
      "rotation-level-2",
      "rotation-level-1",
    ]);
    const level3 = screen.getByTestId("rotation-level-3");
    expect(level3.textContent).toMatch(/Last 100%/);
    expect(level3.textContent).toMatch(/Best 100%/);
    expect(level3.textContent).toMatch(/Last 400 ms/);
    expect(level3.textContent).toMatch(/Mean 450 ms/);
    expect(level3.textContent).not.toMatch(/70%/);
    const level2 = screen.getByTestId("rotation-level-2");
    expect(level2.textContent).toMatch(/Last 90%/);
    expect(level2.textContent).toMatch(/Last 500 ms/);
    expect(level2.textContent).toMatch(/Mean 550 ms/);
    expect(screen.getByTestId("rotation-level-1").textContent).toMatch(/Last 700 ms/);
  });

  it("shows the latest same-level accuracy and response time on the Mental Rotation card", () => {
    renderMenu({
      history: [
        rotationRecord(2, [[0.8, 600], [0.9, 500]], "r2", "2026-11-08T10:00:00.000Z"),
        rotationRecord(3, [[0.9, 500], [1, 400]], "r3", "2026-11-07T10:00:00.000Z"),
      ],
    });
    expect(screen.getByTestId("menu-rotation-trend").textContent).toBe(
      "Mental rotation L2: last 90% accuracy · RT 500 ms · best 90%",
    );
  });

  it("omits the Mental Rotation trend when there are no Mental Rotation blocks", () => {
    renderMenu({ history: [record()], initialTab: "history" });
    expect(screen.queryByTestId("rotation-trend")).toBeNull();
    cleanup();
    renderMenu({ history: [record()] });
    expect(screen.queryByTestId("menu-rotation-trend")).toBeNull();
  });

  it("shows a level-aware Prospective Memory accuracy, cue and false-alarm trend", () => {
    renderMenu({
      history: [
        prospectiveRecord(3, [[1, 4, 4, 0], [1, 4, 4, 0]], "m3", "2026-11-03T10:00:00.000Z"),
        prospectiveRecord(2, [[0.9, 3, 4, 1], [1, 4, 4, 0]], "m2", "2026-11-02T10:00:00.000Z"),
        prospectiveRecord(1, [[0.8, 2, 4, 2]], "m1", "2026-11-01T10:00:00.000Z"),
      ],
      initialTab: "history",
    });
    const card = screen.getByTestId("prospective-trend");
    expect(card.textContent).toMatch(/ongoing accuracy/i);
    expect(card.textContent).toMatch(/cue accuracy/i);
    expect(card.textContent).toMatch(/false alarms/i);
    const rows = screen.getAllByTestId(/^prospective-level-/);
    expect(rows.map((row) => row.getAttribute("data-testid"))).toEqual([
      "prospective-level-3",
      "prospective-level-2",
      "prospective-level-1",
    ]);
    const level3 = screen.getByTestId("prospective-level-3");
    expect(level3.textContent).toMatch(/Last 100%/);
    expect(level3.textContent).toMatch(/Last 4\/4/);
    expect(level3.textContent).toMatch(/Last 0/);
    expect(level3.textContent).toMatch(/Total 0/);
    expect(level3.textContent).not.toMatch(/Last 2\/4/);
    const level2 = screen.getByTestId("prospective-level-2");
    expect(level2.textContent).toMatch(/Last 100%/);
    expect(level2.textContent).toMatch(/Last 4\/4/);
    expect(level2.textContent).toMatch(/Total 1/);
    expect(screen.getByTestId("prospective-level-1").textContent).toMatch(/Last 2\/4/);
  });

  it("shows the latest same-level Prospective Memory values on its card", () => {
    renderMenu({
      history: [
        prospectiveRecord(2, [[0.9, 3, 4, 1], [1, 4, 4, 0]], "m2", "2026-11-08T10:00:00.000Z"),
        prospectiveRecord(3, [[1, 4, 4, 0], [1, 4, 4, 0]], "m3", "2026-11-07T10:00:00.000Z"),
      ],
    });
    expect(screen.getByTestId("menu-prospective-trend").textContent).toBe(
      "Prospective memory L2: ongoing 100% · cues 4/4 · false alarms 0",
    );
  });

  it("omits the Prospective Memory trend when there are no blocks", () => {
    renderMenu({ history: [record()], initialTab: "history" });
    expect(screen.queryByTestId("prospective-trend")).toBeNull();
    cleanup();
    renderMenu({ history: [record()] });
    expect(screen.queryByTestId("menu-prospective-trend")).toBeNull();
  });

  it("shows a level-aware Paired Associates accuracy and response-time trend", () => {
    renderMenu({
      history: [
        pairedRecord(3, [[0.9, 500], [1, 400]], "a3", "2026-11-03T10:00:00.000Z"),
        pairedRecord(2, [[0.8, 600], [0.9, 500]], "a2", "2026-11-02T10:00:00.000Z"),
        pairedRecord(1, [[0.7, 700]], "a1", "2026-11-01T10:00:00.000Z"),
      ],
      initialTab: "history",
    });
    const card = screen.getByTestId("paired-trend");
    expect(card.textContent).toMatch(/accuracy/i);
    expect(card.textContent).toMatch(/response time/i);
    const rows = screen.getAllByTestId(/^paired-level-/);
    expect(rows.map((row) => row.getAttribute("data-testid"))).toEqual([
      "paired-level-3",
      "paired-level-2",
      "paired-level-1",
    ]);
    const level3 = screen.getByTestId("paired-level-3");
    expect(level3.textContent).toMatch(/Last 100%/);
    expect(level3.textContent).toMatch(/Best 100%/);
    expect(level3.textContent).toMatch(/Last 400 ms/);
    expect(level3.textContent).toMatch(/Mean 450 ms/);
    expect(level3.textContent).not.toMatch(/70%/);
    const level2 = screen.getByTestId("paired-level-2");
    expect(level2.textContent).toMatch(/Last 90%/);
    expect(level2.textContent).toMatch(/Last 500 ms/);
    expect(level2.textContent).toMatch(/Mean 550 ms/);
    expect(screen.getByTestId("paired-level-1").textContent).toMatch(/Last 700 ms/);
  });

  it("shows the latest same-level values on the Paired Associates card", () => {
    renderMenu({
      history: [
        pairedRecord(2, [[0.8, 600], [0.9, 500]], "a2", "2026-11-08T10:00:00.000Z"),
        pairedRecord(3, [[0.9, 500], [1, 400]], "a3", "2026-11-07T10:00:00.000Z"),
      ],
    });
    expect(screen.getByTestId("menu-paired-trend").textContent).toBe(
      "Paired associates L2: last 90% accuracy · RT 500 ms · best 90%",
    );
  });

  it("omits the Paired Associates trend when there are no blocks", () => {
    renderMenu({ history: [record()], initialTab: "history" });
    expect(screen.queryByTestId("paired-trend")).toBeNull();
    cleanup();
    renderMenu({ history: [record()] });
    expect(screen.queryByTestId("menu-paired-trend")).toBeNull();
  });

  it("switches between choosing a test and viewing history", () => {
    renderMenu({ history: [record()] });
    fireEvent.click(screen.getByRole("tab", { name: /history/i }));
    expect(screen.getByTestId("history-session")).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: /choose a test/i }));
    expect(screen.getByTestId("menu-test-nback")).toBeTruthy();
  });
});
