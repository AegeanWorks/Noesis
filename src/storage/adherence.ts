import { readLocal, removeLocal, writeLocal } from "./browserStorage";
import type { StudyArm } from "./study";

export type AdherenceStatus = "started" | "completed" | "aborted";

export interface AdherenceEvent {
  id: string;
  seed: number;
  startedAt: string;
  endedAt: string | null;
  status: AdherenceStatus;
  blocksCompleted: number;
  blockCount: number;
  arm: StudyArm | null;
}

export interface AdherenceCounts {
  started: number;
  completed: number;
  aborted: number;
}

export interface SessionStartInput {
  seed: number;
  blockCount: number;
  arm: StudyArm | null;
  startedAt?: string;
  id?: string;
}

export interface SessionEndInput {
  seed: number;
  blocksCompleted: number;
  endedAt?: string;
}

const KEY = "noesis.adherence.v1";
const MAX_EVENTS = 200;

function isArm(value: unknown): value is StudyArm {
  return value === "control" || value === "engagement";
}

function isStatus(value: unknown): value is AdherenceStatus {
  return value === "started" || value === "completed" || value === "aborted";
}

function isEvent(value: unknown): value is AdherenceEvent {
  if (typeof value !== "object" || value === null) return false;
  const event = value as Partial<AdherenceEvent>;
  return (
    typeof event.id === "string" &&
    typeof event.seed === "number" &&
    typeof event.startedAt === "string" &&
    (event.endedAt === null || typeof event.endedAt === "string") &&
    isStatus(event.status) &&
    typeof event.blocksCompleted === "number" &&
    typeof event.blockCount === "number" &&
    (event.arm === null || isArm(event.arm))
  );
}

function save(events: AdherenceEvent[]): AdherenceEvent[] {
  const next = events.slice(0, MAX_EVENTS);
  writeLocal(KEY, JSON.stringify(next));
  return next;
}

export function loadAdherence(): AdherenceEvent[] {
  try {
    const raw = readLocal(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isEvent).slice(0, MAX_EVENTS);
  } catch {
    return [];
  }
}

export function logSessionStart(input: SessionStartInput): AdherenceEvent[] {
  const startedAt = input.startedAt ?? new Date().toISOString();
  const existing = loadAdherence().map((event) =>
    event.status === "started"
      ? { ...event, status: "aborted" as const, endedAt: startedAt }
      : event,
  );
  const event: AdherenceEvent = {
    id: input.id ?? `session-${input.seed}-${Date.now()}`,
    seed: input.seed,
    startedAt,
    endedAt: null,
    status: "started",
    blocksCompleted: 0,
    blockCount: Math.max(0, Math.round(input.blockCount)),
    arm: input.arm,
  };
  return save([event, ...existing]);
}

function finishSession(
  input: SessionEndInput,
  status: "completed" | "aborted",
): AdherenceEvent[] {
  const endedAt = input.endedAt ?? new Date().toISOString();
  const blocksCompleted = Math.max(0, Math.round(input.blocksCompleted));
  const events = loadAdherence();
  const index = events.findIndex(
    (event) => event.seed === input.seed && event.status === "started",
  );
  if (index === -1) {
    return save([
      {
        id: `session-${input.seed}-${endedAt}`,
        seed: input.seed,
        startedAt: endedAt,
        endedAt,
        status,
        blocksCompleted,
        blockCount: blocksCompleted,
        arm: null,
      },
      ...events,
    ]);
  }
  const updated = events.map((event, eventIndex) =>
    eventIndex === index
      ? { ...event, status, blocksCompleted, endedAt }
      : event,
  );
  return save(updated);
}

export function completeSessionAdherence(input: SessionEndInput): AdherenceEvent[] {
  return finishSession(input, "completed");
}

export function abortSessionAdherence(input: SessionEndInput): AdherenceEvent[] {
  return finishSession(input, "aborted");
}

export function adherenceCounts(events: readonly AdherenceEvent[]): AdherenceCounts {
  return {
    started: events.length,
    completed: events.filter((event) => event.status === "completed").length,
    aborted: events.filter((event) => event.status === "aborted").length,
  };
}

export function clearAdherence(): void {
  removeLocal(KEY);
}
