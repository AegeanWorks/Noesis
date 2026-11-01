import { readLocal, removeLocal, writeLocal } from "./browserStorage";

export type Symptom =
  | "headache"
  | "dizziness"
  | "nausea"
  | "eye_strain"
  | "anxiety"
  | "other";

export type Severity = "mild" | "moderate" | "severe";

export interface AdverseEvent {
  id: string;
  reportedAt: string;
  sessionId: string | null;
  symptoms: Symptom[];
  severity: Severity;
  note: string;
  stoppedSession: boolean;
}

export const SYMPTOMS: readonly Symptom[] = [
  "headache",
  "dizziness",
  "nausea",
  "eye_strain",
  "anxiety",
  "other",
] as const;

export const SYMPTOM_LABELS: Record<Symptom, string> = {
  headache: "Headache",
  dizziness: "Dizziness",
  nausea: "Nausea",
  eye_strain: "Eye strain",
  anxiety: "Anxiety or unease",
  other: "Something else",
};

const KEY = "noesis.adverse.v1";
const MAX_EVENTS = 50;
const MAX_NOTE = 280;
const RECENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function isSymptom(value: unknown): value is Symptom {
  return typeof value === "string" && (SYMPTOMS as readonly string[]).includes(value);
}

function isSeverity(value: unknown): value is Severity {
  return value === "mild" || value === "moderate" || value === "severe";
}

function isEvent(value: unknown): value is AdverseEvent {
  if (typeof value !== "object" || value === null) return false;
  const event = value as Partial<AdverseEvent>;
  return (
    typeof event.id === "string" &&
    typeof event.reportedAt === "string" &&
    (event.sessionId === null || typeof event.sessionId === "string") &&
    Array.isArray(event.symptoms) &&
    event.symptoms.every(isSymptom) &&
    isSeverity(event.severity) &&
    typeof event.note === "string" &&
    typeof event.stoppedSession === "boolean"
  );
}

export function loadAdverseEvents(): AdverseEvent[] {
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

export interface LogAdverseEventInput {
  id: string;
  sessionId: string | null;
  symptoms: Symptom[];
  severity: Severity;
  note?: string;
  stoppedSession?: boolean;
  reportedAt?: string;
}

export function logAdverseEvent(input: LogAdverseEventInput): AdverseEvent[] {
  const symptoms = input.symptoms.filter(isSymptom);
  if (input.id.trim() === "" || symptoms.length === 0 || !isSeverity(input.severity)) {
    return loadAdverseEvents();
  }
  const event: AdverseEvent = {
    id: input.id,
    reportedAt: input.reportedAt ?? new Date().toISOString(),
    sessionId: input.sessionId,
    symptoms,
    severity: input.severity,
    note: (input.note ?? "").slice(0, MAX_NOTE),
    stoppedSession: input.stoppedSession === true,
  };
  const existing = loadAdverseEvents().filter((entry) => entry.id !== event.id);
  const next = [event, ...existing].slice(0, MAX_EVENTS);
  writeLocal(KEY, JSON.stringify(next));
  return next;
}

export function clearAdverseEvents(): void {
  removeLocal(KEY);
}

export function countRecentAdverseEvents(
  events: readonly AdverseEvent[],
  now: Date = new Date(),
): number {
  const cutoff = now.getTime() - RECENT_WINDOW_MS;
  return events.filter((event) => {
    const time = Date.parse(event.reportedAt);
    return Number.isFinite(time) && time >= cutoff && time <= now.getTime();
  }).length;
}

export interface CheckinVerdict {
  stopAdvised: boolean;
  headline: string;
  detail: string;
}

export function evaluateCheckin(
  symptoms: readonly Symptom[],
  severity: Severity,
  recentCount: number,
): CheckinVerdict {
  if (symptoms.length === 0) {
    return {
      stopAdvised: false,
      headline: "No symptoms reported.",
      detail: "Your practice record is unchanged.",
    };
  }
  if (severity === "severe" || (severity === "moderate" && recentCount > 0)) {
    return {
      stopAdvised: true,
      headline: "Stop training and rest.",
      detail:
        "A severe symptom, or a repeated moderate one, means today is not a training day. " +
        "Rest, and consider speaking with a clinician if it persists or recurs. Your past " +
        "practice data is kept as-is.",
    };
  }
  return {
    stopAdvised: false,
    headline: "Noted. Take it easy.",
    detail:
      "Mild, one-off symptoms are logged with this session. Stop if anything worsens, " +
      "and skip tomorrow if it comes back.",
  };
}
