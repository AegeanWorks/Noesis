// @vitest-environment jsdom
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { HomeScreen } from "../../src/ui/screens/HomeScreen";
import type { TodayStats, WeekStats } from "../../src/storage/history";

afterEach(cleanup);

const EMPTY_WEEK: WeekStats = { sessions: 0, days: 0, minutes: 0 };
const EMPTY_TODAY: TodayStats = { sessions: 0, minutes: 0 };

function renderHome(overrides: Partial<ComponentProps<typeof HomeScreen>> = {}) {
  const props: ComponentProps<typeof HomeScreen> = {
    hasSession: false,
    history: [],
    week: EMPTY_WEEK,
    today: EMPTY_TODAY,
    intention: null,
    sessionLength: "standard",
    weeklyGoal: 3,
    heavyUse: null,
    heavyUseDismissed: false,
    motivationOn: true,
    motivationPaused: false,
    milestones: [],
    studyArm: null,
    weakest: null,
    onFocusMechanic: vi.fn(),
    onStart: vi.fn(),
    onContinue: vi.fn(),
    onSaveIntention: vi.fn(),
    onClearIntention: vi.fn(),
    onEvidence: vi.fn(),
    onPauseMotivation: vi.fn(),
    onDismissHeavyUse: vi.fn(),
    onDismissMilestones: vi.fn(),
    ...overrides,
  };
  render(<HomeScreen {...props} />);
  return props;
}

describe("HeavyUseNotice", () => {
  it("stays hidden without a signal", () => {
    renderHome();
    expect(screen.queryByTestId("heavy-use-notice")).toBeNull();
  });

  it("stays hidden once dismissed today", () => {
    renderHome({
      heavyUse: { kind: "many_today", sessionsToday: 4, minutesToday: 32 },
      heavyUseDismissed: true,
    });
    expect(screen.queryByTestId("heavy-use-notice")).toBeNull();
  });

  it("offers a one-tap motivation pause and a dismissal", () => {
    const props = renderHome({
      heavyUse: { kind: "many_today", sessionsToday: 4, minutesToday: 32 },
    });
    expect(screen.getByTestId("heavy-use-notice").textContent).toMatch(/plenty for today/i);
    fireEvent.click(screen.getByRole("button", { name: "Pause Motivation for today" }));
    expect(props.onPauseMotivation).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Not now" }));
    expect(props.onDismissHeavyUse).toHaveBeenCalledTimes(1);
  });

  it("shows the paused state without a second pause button", () => {
    renderHome({
      heavyUse: { kind: "long_day", sessionsToday: 2, minutesToday: 80 },
      motivationPaused: true,
    });
    expect(screen.getByTestId("heavy-use-notice").textContent).toMatch(/paused until tomorrow/i);
    expect(
      screen.queryByRole("button", { name: "Pause Motivation for today" }),
    ).toBeNull();
  });
});
