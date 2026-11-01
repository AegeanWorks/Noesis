// @vitest-environment jsdom
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { HomeScreen } from "../../src/ui/screens/HomeScreen";
import type { SessionRecord, WeekStats } from "../../src/storage/history";
import type { PracticeIntention } from "../../src/storage/intention";

afterEach(cleanup);

function record(accuracy: number, finishedAt = "2026-10-31T10:00:00.000Z"): SessionRecord {
  return {
    id: `session-${finishedAt}`,
    finishedAt,
    seed: 42,
    results: [
      {
        mechanic: "nback",
        domain: "working_memory",
        trials: 18,
        durationMs: 50_000,
        metrics: { accuracy, d_prime: 2.1 },
        summary: "2-back summary",
        seed: 42,
        stateHash: "0123456789abcdef",
      },
    ],
  };
}

const EMPTY_WEEK: WeekStats = { sessions: 0, days: 0, minutes: 0 };

function renderHome(overrides: Partial<ComponentProps<typeof HomeScreen>> = {}) {
  const props: ComponentProps<typeof HomeScreen> = {
    hasSession: false,
    history: [],
    week: EMPTY_WEEK,
    intention: null,
    sessionLength: "standard",
    onStart: vi.fn(),
    onContinue: vi.fn(),
    onSaveIntention: vi.fn(),
    onClearIntention: vi.fn(),
    onEvidence: vi.fn(),
    ...overrides,
  };
  render(<HomeScreen {...props} />);
  return props;
}

describe("HomeScreen", () => {
  it("has one primary one-click start button", () => {
    const props = renderHome();
    const start = screen.getByTestId("start-session");
    expect(start.textContent).toContain("Start session");
    fireEvent.click(start);
    expect(props.onStart).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("New session")).toBeNull();
  });

  it("resumes with the same one-click button when a session exists", () => {
    const onContinue = vi.fn();
    const onStart = vi.fn();
    renderHome({ hasSession: true, onContinue, onStart });
    const start = screen.getByTestId("start-session");
    expect(start.textContent).toContain("Resume session");
    fireEvent.click(start);
    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(onStart).not.toHaveBeenCalled();
  });

  it("shows an empty practice state before the first session", () => {
    renderHome();
    expect(screen.getByRole("heading", { name: "No sessions yet" })).toBeTruthy();
  });

  it("shows per-mechanic last and best accuracy", () => {
    renderHome({
      history: [record(0.5), record(0.9, "2026-10-30T10:00:00.000Z")],
      week: { sessions: 2, days: 2, minutes: 2 },
    });
    expect(screen.getByText("2 completed sessions")).toBeTruthy();
    expect(screen.getByText("Last 50%")).toBeTruthy();
    expect(screen.getByText("Best 90%")).toBeTruthy();
    expect(screen.getByText(/This week:/)).toBeTruthy();
  });

  it("saves an optional when/where plan", () => {
    const onSaveIntention = vi.fn();
    renderHome({ onSaveIntention });
    const form = screen.getByTestId("practice-plan");
    fireEvent.change(form.querySelectorAll("input")[0]!, {
      target: { value: "tomorrow at 9am" },
    });
    fireEvent.change(form.querySelectorAll("input")[1]!, {
      target: { value: "at the kitchen table" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save plan" }));
    expect(onSaveIntention).toHaveBeenCalledWith("tomorrow at 9am", "at the kitchen table");
  });

  it("shows a saved plan and can clear it", () => {
    const onClearIntention = vi.fn();
    const intention: PracticeIntention = {
      when: "tomorrow at 9am",
      where: "at the kitchen table",
      updatedAt: "2026-11-01T10:00:00.000Z",
    };
    renderHome({ intention, onClearIntention });
    expect(screen.getByText(/tomorrow at 9am/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onClearIntention).toHaveBeenCalledTimes(1);
  });

  it("shows all three mechanics", () => {
    renderHome();
    for (const name of ["N-back", "Go / No-Go", "Reasoning"]) {
      expect(screen.getByRole("heading", { name })).toBeTruthy();
    }
  });
});
