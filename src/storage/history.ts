import type { MechanicResult } from "../engine/types";
import type { StudyArm } from "./study";
import { readLocal, removeLocal, writeLocal } from "./browserStorage";

export interface SessionRecord {
  id: string;
  finishedAt: string;
  seed: number;
  results: MechanicResult[];
  arm?: StudyArm | null;
}

const KEY = "noesis.history.v1";
const MAX_SESSIONS = 20;

function isRecord(value: unknown): value is SessionRecord {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Partial<SessionRecord>;
  return (
    typeof record.id === "string" &&
    typeof record.finishedAt === "string" &&
    typeof record.seed === "number" &&
    Array.isArray(record.results)
  );
}

export function loadHistory(): SessionRecord[] {
  try {
    const raw = readLocal(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRecord).slice(0, MAX_SESSIONS);
  } catch {
    return [];
  }
}

export function appendSession(record: SessionRecord): SessionRecord[] {
  const existing = loadHistory().filter((entry) => entry.id !== record.id);
  const next = [record, ...existing].slice(0, MAX_SESSIONS);
  writeLocal(KEY, JSON.stringify(next));
  return next;
}

export function clearHistory(): void {
  removeLocal(KEY);
}

export interface WeekStats {
  sessions: number;
  days: number;
  minutes: number;
}

function startOfWeek(now: Date): Date {
  const start = new Date(now);
  const mondayOffset = (start.getDay() + 6) % 7;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - mondayOffset);
  return start;
}

function localDayKey(iso: string): string {
  return localDayKeyFromDate(new Date(iso));
}

function localDayKeyFromDate(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export interface TodayStats {
  sessions: number;
  minutes: number;
}

export function todayStats(
  history: readonly SessionRecord[],
  now: Date = new Date(),
): TodayStats {
  const todayKey = localDayKeyFromDate(now);
  const sessions = history.filter(
    (session) =>
      Number.isFinite(Date.parse(session.finishedAt)) &&
      localDayKey(session.finishedAt) === todayKey,
  );
  const totalMs = sessions.reduce(
    (sum, session) =>
      sum + session.results.reduce((resultSum, result) => resultSum + result.durationMs, 0),
    0,
  );
  return { sessions: sessions.length, minutes: Math.round(totalMs / 60_000) };
}

export function accuracySeries(
  history: readonly SessionRecord[],
  mechanic: MechanicResult["mechanic"],
  limit = 10,
): number[] {
  const series: number[] = [];
  for (const session of [...history].reverse()) {
    const result = session.results.find((entry) => entry.mechanic === mechanic);
    if (!result) continue;
    const accuracy = result.metrics.accuracy;
    if (typeof accuracy === "number") series.push(accuracy);
  }
  return series.slice(-Math.max(1, limit));
}

export function weekStats(
  history: readonly SessionRecord[],
  now: Date = new Date(),
): WeekStats {
  const start = startOfWeek(now).getTime();
  const end = now.getTime();
  const sessions = history.filter((session) => {
    const time = Date.parse(session.finishedAt);
    return Number.isFinite(time) && time >= start && time <= end;
  });
  const days = new Set(sessions.map((session) => localDayKey(session.finishedAt)));
  const totalMs = sessions.reduce(
    (sum, session) =>
      sum + session.results.reduce((resultSum, result) => resultSum + result.durationMs, 0),
    0,
  );
  return {
    sessions: sessions.length,
    days: days.size,
    minutes: Math.round(totalMs / 60_000),
  };
}

export function lastResultFor(
  history: readonly SessionRecord[],
  mechanic: MechanicResult["mechanic"],
): MechanicResult | null {
  for (const session of history) {
    const result = session.results.find((entry) => entry.mechanic === mechanic);
    if (result) return result;
  }
  return null;
}

export function bestAccuracyFor(
  history: readonly SessionRecord[],
  mechanic: MechanicResult["mechanic"],
): number | null {
  let best: number | null = null;
  for (const session of history) {
    for (const result of session.results) {
      if (result.mechanic !== mechanic) continue;
      const accuracy = result.metrics.accuracy;
      if (typeof accuracy !== "number") continue;
      if (best === null || accuracy > best) best = accuracy;
    }
  }
  return best;
}

export interface DayActivity {
  key: string;
  label: string;
  active: boolean;
  isToday: boolean;
}

export function lastDaysActivity(
  history: readonly SessionRecord[],
  count = 14,
  now: Date = new Date(),
): DayActivity[] {
  const activeKeys = new Set<string>();
  for (const session of history) {
    const time = Date.parse(session.finishedAt);
    if (Number.isFinite(time)) activeKeys.add(localDayKeyFromDate(new Date(time)));
  }
  const days: DayActivity[] = [];
  for (let offset = count - 1; offset >= 0; offset--) {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    const key = localDayKeyFromDate(date);
    days.push({
      key,
      label: date.toLocaleDateString(undefined, { weekday: "narrow" }),
      active: activeKeys.has(key),
      isToday: offset === 0,
    });
  }
  return days;
}

export function currentDayStreak(
  history: readonly SessionRecord[],
  now: Date = new Date(),
): number {
  const activeKeys = new Set<string>();
  for (const session of history) {
    const time = Date.parse(session.finishedAt);
    if (Number.isFinite(time)) activeKeys.add(localDayKeyFromDate(new Date(time)));
  }
  let streak = 0;
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  if (!activeKeys.has(localDayKeyFromDate(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (activeKeys.has(localDayKeyFromDate(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function detectNewBests(
  results: readonly MechanicResult[],
  history: readonly SessionRecord[],
  sessionId: string,
): MechanicResult["mechanic"][] {
  const prior = history.filter((session) => session.id !== sessionId);
  const bests: MechanicResult["mechanic"][] = [];
  for (const result of results) {
    const accuracy = result.metrics.accuracy;
    if (typeof accuracy !== "number") continue;
    const before = bestAccuracyFor(prior, result.mechanic);
    if (before !== null && accuracy > before) bests.push(result.mechanic);
  }
  return bests;
}

export interface WeakestMechanic {
  mechanic: MechanicResult["mechanic"];
  accuracy: number;
  sessions: number;
}

export function weakestRecentMechanic(
  history: readonly SessionRecord[],
  lookback = 5,
): WeakestMechanic | null {
  const recent = history.slice(0, lookback);
  if (recent.length === 0) return null;
  const totals = new Map<MechanicResult["mechanic"], { sum: number; count: number }>();
  for (const session of recent) {
    for (const result of session.results) {
      const accuracy = result.metrics.accuracy;
      if (typeof accuracy !== "number") continue;
      const entry = totals.get(result.mechanic) ?? { sum: 0, count: 0 };
      entry.sum += accuracy;
      entry.count += 1;
      totals.set(result.mechanic, entry);
    }
  }
  let weakest: WeakestMechanic | null = null;
  for (const [mechanic, entry] of totals) {
    if (entry.count === 0) continue;
    const accuracy = entry.sum / entry.count;
    if (accuracy >= 1) continue;
    if (!weakest || accuracy < weakest.accuracy) {
      weakest = { mechanic, accuracy, sessions: entry.count };
    }
  }
  return weakest;
}
