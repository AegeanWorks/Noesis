import type { SessionRecord } from "./history";
import { readLocal, removeLocal, writeLocal } from "./browserStorage";

export type HeavyUseKind = "many_today" | "back_to_back" | "long_day";

export interface HeavyUseSignal {
  kind: HeavyUseKind;
  sessionsToday: number;
  minutesToday: number;
}

export const MANY_TODAY_THRESHOLD = 4;
export const BACK_TO_BACK_MINUTES = 30;
export const LONG_DAY_MINUTES = 45;

function localDayKeyFromDate(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

interface TodaySession {
  finishedAt: number;
  durationMs: number;
}

function todaySessions(
  history: readonly SessionRecord[],
  now: Date,
): TodaySession[] {
  const todayKey = localDayKeyFromDate(now);
  const sessions: TodaySession[] = [];
  for (const session of history) {
    const finishedAt = Date.parse(session.finishedAt);
    if (!Number.isFinite(finishedAt)) continue;
    if (localDayKeyFromDate(new Date(finishedAt)) !== todayKey) continue;
    const durationMs = session.results.reduce(
      (sum, result) => sum + result.durationMs,
      0,
    );
    sessions.push({ finishedAt, durationMs });
  }
  return sessions.sort((a, b) => a.finishedAt - b.finishedAt);
}

export function detectHeavyUse(
  history: readonly SessionRecord[],
  now: Date = new Date(),
): HeavyUseSignal | null {
  const sessions = todaySessions(history, now);
  if (sessions.length === 0) return null;
  const minutesToday = Math.round(
    sessions.reduce((sum, session) => sum + session.durationMs, 0) / 60_000,
  );
  const signal = { sessionsToday: sessions.length, minutesToday };
  if (sessions.length >= MANY_TODAY_THRESHOLD) {
    return { ...signal, kind: "many_today" };
  }
  const last = sessions[sessions.length - 1];
  if (
    sessions.length >= 2 &&
    last &&
    now.getTime() - last.finishedAt < BACK_TO_BACK_MINUTES * 60_000
  ) {
    return { ...signal, kind: "back_to_back" };
  }
  if (minutesToday >= LONG_DAY_MINUTES) {
    return { ...signal, kind: "long_day" };
  }
  return null;
}

const KEY = "noesis.engagement.v1";

interface EngagementState {
  motivationPausedDay: string | null;
  heavyUseDismissedDay: string | null;
}

function isEngagementState(value: unknown): value is EngagementState {
  if (typeof value !== "object" || value === null) return false;
  const state = value as Partial<EngagementState>;
  return (
    (state.motivationPausedDay === null ||
      typeof state.motivationPausedDay === "string") &&
    (state.heavyUseDismissedDay === null ||
      typeof state.heavyUseDismissedDay === "string")
  );
}

export function loadEngagement(): EngagementState {
  try {
    const raw = readLocal(KEY);
    if (!raw) return { motivationPausedDay: null, heavyUseDismissedDay: null };
    const parsed = JSON.parse(raw) as unknown;
    if (!isEngagementState(parsed)) {
      return { motivationPausedDay: null, heavyUseDismissedDay: null };
    }
    return parsed;
  } catch {
    return { motivationPausedDay: null, heavyUseDismissedDay: null };
  }
}

function saveEngagement(state: EngagementState): void {
  writeLocal(KEY, JSON.stringify(state));
}

export function clearEngagement(): void {
  removeLocal(KEY);
}

export function pauseMotivationToday(now: Date = new Date()): EngagementState {
  const state = {
    ...loadEngagement(),
    motivationPausedDay: localDayKeyFromDate(now),
  };
  saveEngagement(state);
  return state;
}

export function resumeMotivation(): EngagementState {
  const state = { ...loadEngagement(), motivationPausedDay: null };
  saveEngagement(state);
  return state;
}

export function isMotivationPaused(now: Date = new Date()): boolean {
  return (
    loadEngagement().motivationPausedDay === localDayKeyFromDate(now)
  );
}

export function dismissHeavyUseToday(now: Date = new Date()): EngagementState {
  const state = {
    ...loadEngagement(),
    heavyUseDismissedDay: localDayKeyFromDate(now),
  };
  saveEngagement(state);
  return state;
}

export function isHeavyUseDismissedToday(now: Date = new Date()): boolean {
  return (
    loadEngagement().heavyUseDismissedDay === localDayKeyFromDate(now)
  );
}
