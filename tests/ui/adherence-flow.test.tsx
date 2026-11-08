// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { App } from "../../src/App";
import { sessionStore } from "../../src/engine/store";
import { clearAdherence, loadAdherence } from "../../src/storage/adherence";
import { clearHistory } from "../../src/storage/history";
import { clearSafety, saveSafety } from "../../src/storage/safety";
import { clearSessionSnapshot } from "../../src/storage/sessionSnapshot";

beforeEach(() => {
  vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  sessionStore.reset();
  clearHistory();
  clearAdherence();
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
  clearAdherence();
  clearSafety();
  clearSessionSnapshot();
  vi.unstubAllGlobals();
});

describe("session adherence flow", () => {
  it("logs a start and an early ending from the real UI", () => {
    render(<App />);
    fireEvent.click(screen.getByTestId("start-session"));
    expect(loadAdherence()).toHaveLength(1);
    expect(loadAdherence()[0]?.status).toBe("started");

    fireEvent.click(screen.getByTestId("begin-test"));
    fireEvent.click(screen.getByTestId("pause"));
    fireEvent.click(screen.getByTestId("end-session"));
    fireEvent.click(screen.getByTestId("confirm-end"));

    const events = loadAdherence();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ status: "aborted", blocksCompleted: 0 });
    expect(Number.isFinite(Date.parse(events[0]?.endedAt ?? ""))).toBe(true);
  });
});
