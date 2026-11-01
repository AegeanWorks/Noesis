// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SymptomCheckin } from "../../src/ui/components/SymptomCheckin";
import { clearAdverseEvents, loadAdverseEvents } from "../../src/storage/adverseEvents";

afterEach(() => {
  cleanup();
  clearAdverseEvents();
});

describe("SymptomCheckin", () => {
  it("renders the symptom options with logging disabled until one is picked", () => {
    render(<SymptomCheckin sessionId="session-1" />);
    expect(screen.getByTestId("symptom-checkin")).toBeTruthy();
    expect(screen.getByLabelText("Headache")).toBeTruthy();
    const log = screen.getByRole("button", { name: "Log symptoms" });
    expect((log as HTMLButtonElement).disabled).toBe(true);
  });

  it("logs a mild check-in without a stop verdict", () => {
    const onLogged = vi.fn();
    render(<SymptomCheckin sessionId="session-1" onLogged={onLogged} />);
    fireEvent.click(screen.getByLabelText("Headache"));
    fireEvent.click(screen.getByRole("button", { name: "Log symptoms" }));
    expect(loadAdverseEvents()).toHaveLength(1);
    expect(loadAdverseEvents()[0]).toMatchObject({
      sessionId: "session-1",
      symptoms: ["headache"],
      severity: "mild",
      stoppedSession: false,
    });
    expect(onLogged).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("symptom-verdict").textContent).toMatch(/take it easy/i);
  });

  it("advises a stop on a severe symptom", () => {
    render(<SymptomCheckin sessionId="session-1" />);
    fireEvent.click(screen.getByLabelText("Dizziness"));
    fireEvent.click(screen.getByLabelText("Severe"));
    fireEvent.click(screen.getByRole("button", { name: "Log symptoms" }));
    const verdict = screen.getByTestId("symptom-verdict");
    expect(verdict.getAttribute("role")).toBe("alert");
    expect(verdict.textContent).toMatch(/stop training/i);
    expect(loadAdverseEvents()[0]?.stoppedSession).toBe(true);
  });

  it("records nothing when the user feels fine", () => {
    render(<SymptomCheckin sessionId="session-1" />);
    fireEvent.click(screen.getByRole("button", { name: "I feel fine" }));
    expect(loadAdverseEvents()).toEqual([]);
    expect(screen.getByTestId("symptom-verdict").textContent).toMatch(/no symptoms reported/i);
  });
});
