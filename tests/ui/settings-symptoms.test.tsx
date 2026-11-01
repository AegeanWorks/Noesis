// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SettingsScreen } from "../../src/ui/screens/SettingsScreen";
import type { AdverseEvent } from "../../src/storage/adverseEvents";

const BASE = {
  reducedMotion: false,
  difficulty: 2 as const,
  sessionLength: "quick" as const,
  motivationMode: false,
  largeText: false,
  highContrast: false,
  historyCount: 0,
  onReducedMotion: () => {},
  onDifficulty: () => {},
  onSessionLength: () => {},
  onMotivationMode: () => {},
  onLargeText: () => {},
  onHighContrast: () => {},
  onResetSafety: () => {},
  onExportHistory: () => {},
  onClearHistory: () => {},
  onClearData: () => {},
  onHome: () => {},
  motivationPaused: false,
  onResumeMotivation: () => {},
  adaptiveEnabled: false,
  adaptiveLevels: { nback: 2, gonogo: 2, reasoning: 2, speed: 2 } as const,
  onAdaptiveToggle: () => {},
};

const REPORT: AdverseEvent = {
  id: "ae-1",
  reportedAt: "2026-11-01T10:00:00.000Z",
  sessionId: "session-1",
  symptoms: ["headache"],
  severity: "moderate",
  note: "",
  stoppedSession: false,
};

afterEach(() => {
  cleanup();
});

describe("SettingsScreen symptom reports", () => {
  it("shows the empty state with clearing disabled", () => {
    render(<SettingsScreen {...BASE} adverseEvents={[]} onClearAdverseEvents={() => {}} />);
    expect(screen.getByText(/no symptoms have been reported/i)).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "Clear symptom reports" }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("lists reports and clears them on request", () => {
    const onClear = vi.fn();
    render(<SettingsScreen {...BASE} adverseEvents={[REPORT]} onClearAdverseEvents={onClear} />);
    expect(screen.getByText(/1 symptom report is stored/i)).toBeTruthy();
    expect(screen.getByText(/headache/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Clear symptom reports" }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});

describe("SettingsScreen adaptive difficulty", () => {
  it("toggles the experiment and shows levels only when on", () => {
    const onToggle = vi.fn();
    const { rerender } = render(
      <SettingsScreen
        {...BASE}
        adverseEvents={[]}
        onClearAdverseEvents={() => {}}
        adaptiveEnabled={false}
        onAdaptiveToggle={onToggle}
      />,
    );
    expect(screen.queryByText("Level 2")).toBeNull();
    fireEvent.click(screen.getByLabelText(/experimental: adjust each task level/i));
    expect(onToggle).toHaveBeenCalledWith(true);
    rerender(
      <SettingsScreen
        {...BASE}
        adverseEvents={[]}
        onClearAdverseEvents={() => {}}
        adaptiveEnabled={true}
        onAdaptiveToggle={onToggle}
      />,
    );
    expect(screen.getAllByText("Level 2")).toHaveLength(4);
  });
});
