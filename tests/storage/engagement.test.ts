// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import {
  detectHeavyUse,
  detectMilestones,
  clearEngagement,
  dismissHeavyUseToday,
  isHeavyUseDismissedToday,
  isMotivationPaused,
  loadEngagement,
  markMilestonesSeen,
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
      seenMilestones: [],
    });
  });
});

describe("milestones", () => {
  const day = (offset: number) => {
    const date = new Date("2026-11-02T10:00:00");
    date.setDate(date.getDate() - offset);
    return date.toISOString();
  };

  it("celebrates the first session once", () => {
    const history = [record("a", day(0))];
    const fresh = detectMilestones(history, [], [], new Date("2026-11-02T20:00:00"));
    expect(fresh.map((item) => item.id)).toEqual(["sessions-1"]);
    markMilestonesSeen(fresh.map((item) => item.id));
    expect(detectMilestones(history, [], loadEngagement().seenMilestones)).toEqual([]);
  });

  it("celebrates streaks without shaming gaps", () => {
    const history = [record("a", day(0)), record("b", day(1)), record("c", day(2))];
    const fresh = detectMilestones(history, [], [], new Date("2026-11-02T20:00:00"));
    expect(fresh.map((item) => item.id)).toContain("streak-3");
    expect(fresh.map((item) => item.id)).not.toContain("streak-7");
  });

  it("celebrates adaptive level-ups from the adaptation log", () => {
    const fresh = detectMilestones(
      [],
      [{ at: day(0), mechanic: "nback", from: 2, to: 3, accuracy: 0.9 }],
      [],
    );
    expect(fresh.map((item) => item.id)).toEqual(["adaptive-nback-3"]);
  });
});
