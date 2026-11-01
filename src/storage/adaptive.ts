import type { MechanicId, MechanicResult } from "../engine/types";
import { readLocal, removeLocal, writeLocal } from "./browserStorage";

export type AdaptiveLevel = 1 | 2 | 3;

export type AdaptiveLevels = Record<MechanicId, AdaptiveLevel>;

export interface AdaptationEvent {
  at: string;
  mechanic: MechanicId;
  from: AdaptiveLevel;
  to: AdaptiveLevel;
  accuracy: number;
}

export interface AdaptiveState {
  enabled: boolean;
  levels: AdaptiveLevels;
  log: AdaptationEvent[];
}

const KEY = "noesis.adaptive.v1";
const MAX_LOG = 100;

export const ADAPT_UP_AT = 0.8;
export const ADAPT_DOWN_BELOW = 0.6;

const DEFAULTS: AdaptiveState = {
  enabled: false,
  levels: { nback: 2, gonogo: 2, reasoning: 2, speed: 2 },
  log: [],
};

const MECHANICS: readonly MechanicId[] = ["nback", "gonogo", "reasoning", "speed"];

function isLevel(value: unknown): value is AdaptiveLevel {
  return value === 1 || value === 2 || value === 3;
}

function isMechanic(value: unknown): value is MechanicId {
  return (
    typeof value === "string" &&
    (MECHANICS as readonly string[]).includes(value)
  );
}

function isState(value: unknown): value is AdaptiveState {
  if (typeof value !== "object" || value === null) return false;
  const state = value as Partial<AdaptiveState>;
  if (typeof state.enabled !== "boolean") return false;
  if (typeof state.levels !== "object" || state.levels === null) return false;
  const levels = state.levels as Partial<Record<string, unknown>>;
  if (!MECHANICS.every((mechanic) => isLevel(levels[mechanic]))) return false;
  if (!Array.isArray(state.log)) return false;
  return state.log.every(
    (entry) =>
      typeof entry === "object" &&
      entry !== null &&
      typeof (entry as AdaptationEvent).at === "string" &&
      isMechanic((entry as AdaptationEvent).mechanic) &&
      isLevel((entry as AdaptationEvent).from) &&
      isLevel((entry as AdaptationEvent).to) &&
      typeof (entry as AdaptationEvent).accuracy === "number",
  );
}

export function loadAdaptive(): AdaptiveState {
  try {
    const raw = readLocal(KEY);
    if (!raw) return structuredClone(DEFAULTS);
    const parsed = JSON.parse(raw) as unknown;
    if (!isState(parsed)) return structuredClone(DEFAULTS);
    return { ...parsed, log: parsed.log.slice(-MAX_LOG) };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

function saveAdaptive(state: AdaptiveState): AdaptiveState {
  writeLocal(KEY, JSON.stringify({ ...state, log: state.log.slice(-MAX_LOG) }));
  return state;
}

export function clearAdaptive(): void {
  removeLocal(KEY);
}

export function setAdaptiveEnabled(enabled: boolean): AdaptiveState {
  return saveAdaptive({ ...loadAdaptive(), enabled });
}

export function adaptLevel(current: AdaptiveLevel, accuracy: number): AdaptiveLevel {
  if (!Number.isFinite(accuracy)) return current;
  if (accuracy >= ADAPT_UP_AT) return Math.min(3, current + 1) as AdaptiveLevel;
  if (accuracy < ADAPT_DOWN_BELOW) return Math.max(1, current - 1) as AdaptiveLevel;
  return current;
}

export function adaptLevels(
  levels: AdaptiveLevels,
  results: readonly MechanicResult[],
  at: string = new Date().toISOString(),
): { levels: AdaptiveLevels; events: AdaptationEvent[] } {
  const next: AdaptiveLevels = { ...levels };
  const events: AdaptationEvent[] = [];
  const seen = new Set<MechanicId>();
  for (const result of [...results].reverse()) {
    if (seen.has(result.mechanic)) continue;
    seen.add(result.mechanic);
    const accuracy = result.metrics.accuracy;
    if (typeof accuracy !== "number") continue;
    const from = next[result.mechanic] ?? 2;
    const to = adaptLevel(from, accuracy);
    next[result.mechanic] = to;
    if (to !== from) {
      events.push({ at, mechanic: result.mechanic, from, to, accuracy });
    }
  }
  return { levels: next, events };
}

export function applySessionResults(
  results: readonly MechanicResult[],
  at: string = new Date().toISOString(),
): AdaptiveState {
  const state = loadAdaptive();
  if (!state.enabled) return state;
  const { levels, events } = adaptLevels(state.levels, results, at);
  return saveAdaptive({
    ...state,
    levels,
    log: [...state.log, ...events].slice(-MAX_LOG),
  });
}
