import type { MechanicResult } from "../engine/types";
import { readLocal, removeLocal, writeLocal } from "./browserStorage";

export interface SessionRecord {
  id: string;
  finishedAt: string;
  seed: number;
  results: MechanicResult[];
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
  const date = new Date(iso);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
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
