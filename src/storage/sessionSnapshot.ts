import type { MotivationState } from "../engine/motivation";
import { SessionConfigSchema } from "../engine/schema";
import type { SessionState } from "../engine/types";
import { readLocal, removeLocal, writeLocal } from "./browserStorage";

export interface SessionSnapshot {
  version: 1;
  savedAt: string;
  state: SessionState;
  motivation: MotivationState | null;
}

const KEY = "noesis.session.v1";
const MECHANICS = new Set(["nback", "gonogo", "reasoning"]);
const RESUMABLE_PHASES = new Set(["running", "block_complete"]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isMechanicState(value: unknown): boolean {
  return isObject(value) && typeof value.mechanic === "string" && MECHANICS.has(value.mechanic);
}

function isMotivation(value: unknown): value is MotivationState {
  if (!isObject(value)) return false;
  return (
    typeof value.seed === "number" &&
    typeof value.rng === "number" &&
    typeof value.banked === "number" &&
    typeof value.unbanked === "number" &&
    typeof value.risk === "boolean" &&
    typeof value.riskAmount === "number" &&
    Array.isArray(value.outcomes) &&
    value.outcomes.every(
      (outcome) =>
        isObject(outcome) &&
        typeof outcome.tier === "string" &&
        ["steady", "boost", "rare"].includes(outcome.tier) &&
        typeof outcome.points === "number" &&
        typeof outcome.streak === "number",
    )
  );
}

export function isSessionSnapshot(value: unknown): value is SessionSnapshot {
  if (!isObject(value)) return false;
  if (value.version !== 1 || typeof value.savedAt !== "string") return false;
  const state = value.state;
  if (!isObject(state)) return false;
  if (typeof state.phase !== "string" || !RESUMABLE_PHASES.has(state.phase)) return false;
  if (!SessionConfigSchema.safeParse(state.config).success) return false;
  if (!Array.isArray(state.results)) return false;
  if (!isMechanicState(state.current)) return false;
  if (
    value.motivation !== undefined &&
    value.motivation !== null &&
    !isMotivation(value.motivation)
  ) {
    return false;
  }
  return true;
}

export function saveSessionSnapshot(
  state: SessionState,
  motivation: MotivationState | null = null,
): void {
  if (!RESUMABLE_PHASES.has(state.phase) || state.current === null) return;
  const snapshot: SessionSnapshot = {
    version: 1,
    savedAt: new Date().toISOString(),
    state,
    motivation,
  };
  writeLocal(KEY, JSON.stringify(snapshot));
}

export function loadSessionSnapshot(): SessionSnapshot | null {
  try {
    const raw = readLocal(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isSessionSnapshot(parsed)) {
      removeLocal(KEY);
      return null;
    }
    return { ...parsed, motivation: parsed.motivation ?? null };
  } catch {
    removeLocal(KEY);
    return null;
  }
}

export function clearSessionSnapshot(): void {
  removeLocal(KEY);
}
