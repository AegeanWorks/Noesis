// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { writeLocal } from "../../src/storage/browserStorage";
import {
  clearAdverseEvents,
  countRecentAdverseEvents,
  evaluateCheckin,
  loadAdverseEvents,
  logAdverseEvent,
  type AdverseEvent,
} from "../../src/storage/adverseEvents";

function logged(id: string, reportedAt: string): AdverseEvent {
  return {
    id,
    reportedAt,
    sessionId: "session-1",
    symptoms: ["headache"],
    severity: "mild",
    note: "",
    stoppedSession: false,
  };
}

afterEach(() => {
  clearAdverseEvents();
});

describe("adverse-event log", () => {
  it("starts empty", () => {
    expect(loadAdverseEvents()).toEqual([]);
  });

  it("records a check-in against a session", () => {
    const events = logAdverseEvent({
      id: "ae-1",
      sessionId: "session-1",
      symptoms: ["headache", "eye_strain"],
      severity: "mild",
      note: "after the third block",
    });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      id: "ae-1",
      sessionId: "session-1",
      symptoms: ["headache", "eye_strain"],
      severity: "mild",
      note: "after the third block",
      stoppedSession: false,
    });
    expect(loadAdverseEvents()).toHaveLength(1);
  });

  it("refuses an empty id, empty symptoms or bad severity", () => {
    logAdverseEvent({ id: " ", sessionId: null, symptoms: ["headache"], severity: "mild" });
    logAdverseEvent({ id: "ae-2", sessionId: null, symptoms: [], severity: "mild" });
    logAdverseEvent({
      id: "ae-3",
      sessionId: null,
      symptoms: ["headache"],
      severity: "extreme" as never,
    });
    expect(loadAdverseEvents()).toEqual([]);
  });

  it("caps the note length and drops unknown symptoms", () => {
    const events = logAdverseEvent({
      id: "ae-1",
      sessionId: null,
      symptoms: ["headache", "gremlins" as never],
      severity: "moderate",
      note: "x".repeat(500),
    });
    expect(events[0]?.symptoms).toEqual(["headache"]);
    expect(events[0]?.note).toHaveLength(280);
  });

  it("replaces a duplicate id instead of duplicating it", () => {
    logAdverseEvent({ id: "ae-1", sessionId: null, symptoms: ["nausea"], severity: "mild" });
    const events = logAdverseEvent({
      id: "ae-1",
      sessionId: null,
      symptoms: ["nausea"],
      severity: "moderate",
    });
    expect(events).toHaveLength(1);
    expect(events[0]?.severity).toBe("moderate");
  });

  it("ignores corrupt stored payloads", () => {
    writeLocal(
      "noesis.adverse.v1",
      JSON.stringify([{ id: "broken" }, "junk", logged("ae-1", "2026-10-31T10:00:00.000Z")]),
    );
    const events = loadAdverseEvents();
    expect(events.map((event) => event.id)).toEqual(["ae-1"]);
  });
});

describe("recent-event window", () => {
  it("counts only events inside the last seven days", () => {
    const now = new Date("2026-11-01T12:00:00.000Z");
    const events = [
      logged("fresh", "2026-10-31T12:00:00.000Z"),
      logged("old", "2026-10-20T12:00:00.000Z"),
    ];
    expect(countRecentAdverseEvents(events, now)).toBe(1);
  });
});

describe("check-in stop rules", () => {
  it("advises stopping on any severe symptom", () => {
    const verdict = evaluateCheckin(["dizziness"], "severe", 0);
    expect(verdict.stopAdvised).toBe(true);
    expect(verdict.headline).toMatch(/stop/i);
  });

  it("advises stopping on a repeated moderate symptom", () => {
    const verdict = evaluateCheckin(["headache"], "moderate", 2);
    expect(verdict.stopAdvised).toBe(true);
  });

  it("logs without a stop on a first mild symptom", () => {
    const verdict = evaluateCheckin(["eye_strain"], "mild", 0);
    expect(verdict.stopAdvised).toBe(false);
  });

  it("logs without a stop on a first moderate symptom", () => {
    const verdict = evaluateCheckin(["headache"], "moderate", 0);
    expect(verdict.stopAdvised).toBe(false);
  });

  it("records nothing when no symptoms are reported", () => {
    const verdict = evaluateCheckin([], "mild", 0);
    expect(verdict.stopAdvised).toBe(false);
  });
});
