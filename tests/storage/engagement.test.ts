// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import {
  detectHeavyUse,
  clearEngagement,
  dismissHeavyUseToday,
  isHeavyUseDismissedToday,
  isMotivationPaused,
  loadEngagement,
  pauseMotivationToday,
  resumeMotivation,
} from "../../src/storage/engagement";
import type { SessionRecord } from "../../src/storage/history";

function record(id: string, finishedAt: string, durationMs = 480_000): SessionRecord {
  return {
    id,
    finishedAt,
    seed: 7,
    results: [
      {
        mechanic: "nback",
        domain: "working_memory",
        trials: 10,
        durationMs,
        metrics: { accuracy: 0.8 },
        summary: "n-back summary",
        seed: 7,
        stateHash: "0123456789abcdef",
      },
    ],
  };
}

afterEach(() => {
  clearEngagement();
});

describe("heavy-use detection", () => {
  it("stays quiet with no history", () => {
    expect(detectHeavyUse([], new Date("2026-11-02T20:00:00"))).toBeNull();
  });

  it("stays quiet for an ordinary day", () => {
    const history = [
      record("a", "2026-11-02T10:00:00"),
      record("b", "2026-11-02T18:00:00"),
    ];
    expect(detectHeavyUse(history, new Date("2026-11-02T20:00:00"))).toBeNull();
  });

  it("flags four sessions in a day", () => {
    const history = ["08:00", "11:00", "15:00", "19:00"].map(
      (time, index) => record(`s${index}`, `2026-11-02T${time}:00`),
    );
    const signal = detectHeavyUse(history, new Date("2026-11-02T20:00:00"));
    expect(signal).toMatchObject({ kind: "many_today", sessionsToday: 4 });
  });

  it("flags back-to-back sessions", () => {
    const history = [
      record("a", "2026-11-02T19:30:00"),
      record("b", "2026-11-02T19:50:00"),
    ];
    const signal = detectHeavyUse(history, new Date("2026-11-02T19:59:00"));
    expect(signal?.kind).toBe("back_to_back");
  });

  it("flags a long day even when spaced out", () => {
    const history = [
      record("a", "2026-11-02T09:00:00", 40 * 60_000),
      record("b", "2026-11-02T15:00:00", 40 * 60_000),
    ];
    const signal = detectHeavyUse(history, new Date("2026-11-02T20:00:00"));
    expect(signal).toMatchObject({ kind: "long_day", minutesToday: 80 });
  });

  it("ignores yesterday's sessions", () => {
    const history = ["08:00", "11:00", "15:00", "19:00"].map(
      (time, index) => record(`s${index}`, `2026-11-01T${time}:00`),
    );
    expect(detectHeavyUse(history, new Date("2026-11-02T20:00:00"))).toBeNull();
  });
});

describe("motivation pause and dismissal", () => {
  it("pauses for today only", () => {
    expect(isMotivationPaused(new Date("2026-11-02T20:00:00"))).toBe(false);
    pauseMotivationToday(new Date("2026-11-02T20:00:00"));
    expect(isMotivationPaused(new Date("2026-11-02T23:59:00"))).toBe(true);
    expect(isMotivationPaused(new Date("2026-11-03T00:01:00"))).toBe(false);
  });

  it("resumes on request", () => {
    pauseMotivationToday(new Date("2026-11-02T20:00:00"));
    resumeMotivation();
    expect(isMotivationPaused(new Date("2026-11-02T21:00:00"))).toBe(false);
  });

  it("dismisses the heavy-use notice for today only", () => {
    dismissHeavyUseToday(new Date("2026-11-02T20:00:00"));
    expect(isHeavyUseDismissedToday(new Date("2026-11-02T23:00:00"))).toBe(true);
    expect(isHeavyUseDismissedToday(new Date("2026-11-03T08:00:00"))).toBe(false);
  });

  it("starts empty and tolerates corrupt payloads", () => {
    expect(loadEngagement()).toEqual({
      motivationPausedDay: null,
      heavyUseDismissedDay: null,
    });
  });
});
