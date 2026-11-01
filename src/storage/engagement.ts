import type { AdaptationEvent } from "./adaptive";
import type { MechanicId } from "../engine/types";
import type { SessionRecord } from "./history";
import { currentDayStreak } from "./history";
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
  seenMilestones: string[];
}

function isEngagementState(value: unknown): value is EngagementState {
  if (typeof value !== "object" || value === null) return false;
  const state = value as Partial<EngagementState>;
  const seen = state.seenMilestones;
  return (
    (state.motivationPausedDay === null ||
      typeof state.motivationPausedDay === "string") &&
    (state.heavyUseDismissedDay === null ||
      typeof state.heavyUseDismissedDay === "string") &&
    (seen === undefined || (Array.isArray(seen) && seen.every((id) => typeof id === "string")))
  );
}

const EMPTY: EngagementState = {
  motivationPausedDay: null,
  heavyUseDismissedDay: null,
  seenMilestones: [],
};

export function loadEngagement(): EngagementState {
  try {
    const raw = readLocal(KEY);
    if (!raw) return { ...EMPTY, seenMilestones: [] };
    const parsed = JSON.parse(raw) as unknown;
    if (!isEngagementState(parsed)) return { ...EMPTY, seenMilestones: [] };
    return { ...EMPTY, ...parsed, seenMilestones: [...(parsed.seenMilestones ?? [])] };
  } catch {
    return { ...EMPTY, seenMilestones: [] };
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

export interface Milestone {
  id: string;
  title: string;
  detail: string;
}

const SESSION_MILESTONES: { count: number; title: string }[] = [
  { count: 1, title: "First session complete" },
  { count: 10, title: "10 sessions practised" },
  { count: 25, title: "25 sessions practised" },
  { count: 50, title: "50 sessions practised" },
  { count: 100, title: "100 sessions practised" },
];

const STREAK_MILESTONES: { days: number; title: string }[] = [
  { days: 3, title: "3-day streak" },
  { days: 7, title: "A full week of practice" },
  { days: 14, title: "Two-week streak" },
  { days: 30, title: "A month of practice days" },
];

export function detectMilestones(
  history: readonly SessionRecord[],
  adaptationLog: readonly AdaptationEvent[],
  seen: readonly string[],
  now: Date = new Date(),
): Milestone[] {
  const seenSet = new Set(seen);
  const fresh: Milestone[] = [];
  const total = history.length;
  for (const { count, title } of SESSION_MILESTONES) {
    const id = `sessions-${count}`;
    if (total >= count && !seenSet.has(id)) {
      fresh.push({
        id,
        title,
        detail:
          count === 1
            ? "The first block is done. Short sessions, repeated, are the whole method."
            : `${total} sessions are stored on this device. Consistency beats intensity.`,
      });
    }
  }
  const streak = currentDayStreak(history, now);
  for (const { days, title } of STREAK_MILESTONES) {
    const id = `streak-${days}`;
    if (streak >= days && !seenSet.has(id)) {
      fresh.push({
        id,
        title,
        detail: `${streak} practice days in a row. Rest days are allowed; the streak counts days you showed up.`,
      });
    }
  }
  const leveled = new Map<MechanicId, AdaptationEvent>();
  for (const event of adaptationLog) {
    const current = leveled.get(event.mechanic);
    if (!current || event.to > current.to) leveled.set(event.mechanic, event);
  }
  for (const [mechanic, event] of leveled) {
    const id = `adaptive-${mechanic}-${event.to}`;
    if (!seenSet.has(id)) {
      fresh.push({
        id,
        title: `${mechanic} reached level ${event.to}`,
        detail: "Adaptive difficulty stepped up after strong blocks. Compare new scores within this level.",
      });
    }
  }
  return fresh;
}

export function markMilestonesSeen(ids: readonly string[]): EngagementState {
  const state = loadEngagement();
  const seen = new Set(state.seenMilestones);
  for (const id of ids) seen.add(id);
  const next = { ...state, seenMilestones: [...seen] };
  saveEngagement(next);
  return next;
}
