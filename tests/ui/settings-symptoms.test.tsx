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
  study: { enrolled: false, studyId: null, arm: null, consentedAt: null },
  onEnrollStudy: () => {},
  onWithdrawStudy: () => {},
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

describe("SettingsScreen study enrollment", () => {  it("requires an id and consent before enrolling", () => {
    const onEnroll = vi.fn();
    render(
      <SettingsScreen
        {...BASE}
        adverseEvents={[]}
        onClearAdverseEvents={() => {}}
        onEnrollStudy={onEnroll}
        onWithdrawStudy={() => {}}
      />,
    );
    const enroll = screen.getByRole("button", { name: "Enroll in study" });
    expect((enroll as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/trial id/i), { target: { value: "RCT-1" } });
    expect((enroll as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByLabelText(/investigational use/i));
    expect((enroll as HTMLButtonElement).disabled).toBe(false);
    fireEvent.change(screen.getByLabelText(/assigned arm/i), { target: { value: "engagement" } });
    fireEvent.click(enroll);
    expect(onEnroll).toHaveBeenCalledWith("RCT-1", "engagement");
  });

  it("shows enrollment and withdraws on request", () => {
    const onWithdraw = vi.fn();
    render(
      <SettingsScreen
        {...BASE}
        adverseEvents={[]}
        onClearAdverseEvents={() => {}}
        study={{ enrolled: true, studyId: "RCT-1", arm: "engagement", consentedAt: "2026-11-02T10:00:00.000Z" }}
        onWithdrawStudy={onWithdraw}
      />,
    );
    expect(screen.getByText(/arm: engagement/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Withdraw from study" }));
    expect(onWithdraw).toHaveBeenCalledTimes(1);
  });

  it("discloses the steady schedule by default and the volatile one in the engagement arm", () => {
    const { rerender } = render(
      <SettingsScreen
        {...BASE}
        adverseEvents={[]}
        onClearAdverseEvents={() => {}}
        study={{ enrolled: false, studyId: null, arm: null, consentedAt: null }}
      />,
    );
    expect(screen.getByText(/70% steady, 20% boost and 10% rare/i)).toBeTruthy();
    rerender(
      <SettingsScreen
        {...BASE}
        adverseEvents={[]}
        onClearAdverseEvents={() => {}}
        study={{ enrolled: true, studyId: "RCT-1", arm: "engagement", consentedAt: "2026-11-02T10:00:00.000Z" }}
      />,
    );
    expect(screen.getByText(/60% steady, 25% boost and 15% rare/i)).toBeTruthy();
    expect(screen.getByText(/finisher bonus/i)).toBeTruthy();
  });
});
