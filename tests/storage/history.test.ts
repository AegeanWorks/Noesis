// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { writeLocal } from "../../src/storage/browserStorage";
import {
  appendSession,
  bestAccuracyFor,
  clearHistory,
  currentDayStreak,
  detectNewBests,
  lastDaysActivity,
  lastResultFor,
  accuracySeries,
  loadHistory,
  todayStats,
  weakestRecentMechanic,
  weekStats,
  type SessionRecord,
} from "../../src/storage/history";

function record(id: string, accuracy: number, mechanic: "nback" | "gonogo" = "nback"): SessionRecord {
  return {
    id,
    finishedAt: "2026-10-31T10:00:00.000Z",
    seed: 42,
    results: [
      {
        mechanic,
        domain: mechanic === "nback" ? "working_memory" : "inhibition",
        trials: 10,
        durationMs: 1000,
        metrics: { accuracy },
        summary: `${mechanic} summary`,
        seed: 42,
        stateHash: "0123456789abcdef",
      },
    ],
  };
}

function leveled(id: string, accuracy: number, difficulty: number): SessionRecord {
  const entry = record(id, accuracy);
  entry.results[0]!.difficulty = difficulty;
  return entry;
}

afterEach(() => {
  clearHistory();
});

describe("session history", () => {
  it("starts empty", () => {
    expect(loadHistory()).toEqual([]);
  });

  it("prepends the newest session", () => {
    appendSession(record("a", 0.5));
    appendSession(record("b", 0.8));
    const history = loadHistory();
    expect(history.map((entry) => entry.id)).toEqual(["b", "a"]);
  });

  it("replaces a duplicate id instead of duplicating it", () => {
    appendSession(record("a", 0.5));
    appendSession(record("a", 0.9));
    const history = loadHistory();
    expect(history).toHaveLength(1);
    expect(history[0]?.results[0]?.metrics.accuracy).toBe(0.9);
  });

  it("caps stored sessions at twenty", () => {
    for (let index = 0; index < 25; index += 1) {
      appendSession(record(`s-${index}`, 0.5));
    }
    expect(loadHistory()).toHaveLength(20);
  });

  it("finds the last result for a mechanic", () => {
    appendSession(record("a", 0.5));
    appendSession(record("b", 0.8, "gonogo"));
    const history = loadHistory();
    expect(lastResultFor(history, "nback")?.metrics.accuracy).toBe(0.5);
    expect(lastResultFor(history, "gonogo")?.metrics.accuracy).toBe(0.8);
    expect(lastResultFor(history, "reasoning")).toBeNull();
  });

  it("computes the best accuracy for a mechanic", () => {
    appendSession(record("a", 0.5));
    appendSession(record("b", 0.9));
    appendSession(record("c", 0.7, "gonogo"));
    const history = loadHistory();
    expect(bestAccuracyFor(history, "nback")).toBe(0.9);
    expect(bestAccuracyFor(history, "gonogo")).toBe(0.7);
    expect(bestAccuracyFor(history, "reasoning")).toBeNull();
  });

  it("filters the best accuracy by block level", () => {
    const history = [leveled("l1", 0.7, 1), leveled("l3", 0.9, 3), record("legacy", 0.85)];
    expect(bestAccuracyFor(history, "nback", 1)).toBe(0.7);
    expect(bestAccuracyFor(history, "nback", 3)).toBe(0.9);
    expect(bestAccuracyFor(history, "nback", 2)).toBeNull();
    expect(bestAccuracyFor(history, "nback")).toBe(0.9);
  });

  it("counts only sessions in the current week", () => {
    const now = new Date(2026, 9, 31, 12, 0, 0);
    const inWeek = record("a", 0.5);
    inWeek.finishedAt = new Date(2026, 9, 31, 10, 0, 0).toISOString();
    inWeek.results[0]!.durationMs = 120_000;
    const sameDay = record("b", 0.7);
    sameDay.finishedAt = new Date(2026, 9, 31, 9, 0, 0).toISOString();
    sameDay.results[0]!.durationMs = 60_000;
    const earlier = record("c", 0.9);
    earlier.finishedAt = new Date(2026, 9, 20, 10, 0, 0).toISOString();
    earlier.results[0]!.durationMs = 600_000;
    const stats = weekStats([inWeek, sameDay, earlier], now);
    expect(stats.sessions).toBe(2);
    expect(stats.days).toBe(1);
    expect(stats.minutes).toBe(3);
  });

  it("builds an oldest-to-newest accuracy series", () => {
    appendSession(record("a", 0.5));
    appendSession(record("b", 0.9));
    appendSession(record("c", 0.7));
    expect(accuracySeries(loadHistory(), "nback")).toEqual([0.5, 0.9, 0.7]);
    expect(accuracySeries(loadHistory(), "reasoning")).toEqual([]);
  });

  it("limits the accuracy series", () => {
    for (let index = 0; index < 15; index += 1) {
      appendSession(record(`s-${index}`, index / 15));
    }
    expect(accuracySeries(loadHistory(), "nback", 5)).toHaveLength(5);
  });

  it("counts today's sessions and minutes", () => {
    const now = new Date(2026, 10, 1, 12, 0, 0);
    const today = record("today", 0.8);
    today.finishedAt = new Date(2026, 10, 1, 9, 0, 0).toISOString();
    today.results[0]!.durationMs = 120_000;
    const yesterday = record("yesterday", 0.7);
    yesterday.finishedAt = new Date(2026, 9, 31, 9, 0, 0).toISOString();
    yesterday.results[0]!.durationMs = 600_000;
    expect(todayStats([today, yesterday], now)).toEqual({ sessions: 1, minutes: 2 });
  });

  it("ignores malformed stored data", () => {
    writeLocal("noesis.history.v1", "{broken");
    expect(loadHistory()).toEqual([]);
    writeLocal("noesis.history.v1", JSON.stringify([{ id: 1 }, record("ok", 0.6)]));
    expect(loadHistory().map((entry) => entry.id)).toEqual(["ok"]);
  });
});

describe("consistency and personal bests", () => {
  const at = (year: number, month: number, day: number, hour = 10) =>
    new Date(year, month, day, hour, 0, 0);

  function dated(id: string, finishedAt: Date, accuracy = 0.8): SessionRecord {
    const entry = record(id, accuracy);
    entry.finishedAt = finishedAt.toISOString();
    return entry;
  }

  it("maps the last fourteen days to active flags", () => {
    const now = new Date(2026, 10, 2, 20, 0, 0);
    const history = [dated("a", at(2026, 10, 2)), dated("b", at(2026, 9, 30))];
    const days = lastDaysActivity(history, 14, now);
    expect(days).toHaveLength(14);
    expect(days[13]).toMatchObject({ active: true, isToday: true });
    expect(days[10]?.active).toBe(true);
    expect(days[11]?.active).toBe(false);
    expect(days[0]?.active).toBe(false);
  });

  it("counts consecutive practice days ending today or yesterday", () => {
    const now = new Date(2026, 10, 2, 20, 0, 0);
    expect(
      currentDayStreak(
        [dated("a", at(2026, 10, 2)), dated("b", at(2026, 10, 1)), dated("c", at(2026, 9, 31))],
        now,
      ),
    ).toBe(3);
    expect(currentDayStreak([dated("a", at(2026, 10, 1))], now)).toBe(1);
    expect(currentDayStreak([dated("a", at(2026, 9, 28))], now)).toBe(0);
  });

  it("flags only genuinely beaten bests, excluding the current session", () => {
    const prior = dated("old", at(2026, 10, 1), 0.6);
    const current = dated("new", at(2026, 10, 2), 0.9);
    expect(detectNewBests(current.results, [prior, current], "new")).toEqual(["nback"]);
    expect(detectNewBests(current.results, [current], "new")).toEqual([]);
    const worse = dated("low", at(2026, 10, 2), 0.4);
    expect(detectNewBests(worse.results, [prior, worse], "low")).toEqual([]);
  });

  it("flags a new best within the current level, not across levels", () => {
    const level1 = leveled("l1", 0.7, 1);
    const level3 = leveled("l3", 0.95, 3);
    const current = leveled("new", 0.8, 1);
    expect(detectNewBests(current.results, [level1, level3, current], "new")).toEqual(["nback"]);
  });

  it("finds the weakest recent mechanic and ignores perfect runs", () => {
    const weak = dated("a", at(2026, 10, 2), 0.5);
    expect(weakestRecentMechanic([weak])).toMatchObject({ mechanic: "nback", sessions: 1 });
    expect(weakestRecentMechanic([])).toBeNull();
    const perfect = dated("b", at(2026, 10, 2), 1);
    expect(weakestRecentMechanic([perfect])).toBeNull();
  });
});
