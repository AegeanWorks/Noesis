import type { StudyArm } from "./study";
import { readLocal, removeLocal, writeLocal } from "./browserStorage";

export interface FarCheck {
  id: string;
  finishedAt: string;
  seed: number;
  studied: number;
  tested: number;
  hits: number;
  falseAlarms: number;
  accuracy: number;
  arm: StudyArm | null;
}

const KEY = "noesis.far.v1";
const MAX_CHECKS = 12;
const DUE_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

function isFarCheck(value: unknown): value is FarCheck {
  if (typeof value !== "object" || value === null) return false;
  const check = value as Partial<FarCheck>;
  return (
    typeof check.id === "string" &&
    typeof check.finishedAt === "string" &&
    typeof check.seed === "number" &&
    typeof check.studied === "number" &&
    typeof check.tested === "number" &&
    typeof check.hits === "number" &&
    typeof check.falseAlarms === "number" &&
    typeof check.accuracy === "number" &&
    (check.arm === null || check.arm === "control" || check.arm === "engagement")
  );
}

export function loadFarChecks(): FarCheck[] {
  try {
    const raw = readLocal(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isFarCheck).slice(0, MAX_CHECKS);
  } catch {
    return [];
  }
}

export type LogFarCheckInput = Omit<FarCheck, "id" | "finishedAt"> & {
  id?: string;
  finishedAt?: string;
};

export function logFarCheck(input: LogFarCheckInput): FarCheck[] {
  if (
    !Number.isFinite(input.seed) ||
    input.tested <= 0 ||
    input.hits < 0 ||
    input.falseAlarms < 0 ||
    input.hits + input.falseAlarms > input.tested
  ) {
    return loadFarChecks();
  }
  const id = input.id ?? `far-${Date.now()}`;
  if (id.trim() === "") return loadFarChecks();
  const check: FarCheck = {
    id,
    finishedAt: input.finishedAt ?? new Date().toISOString(),
    seed: input.seed,
    studied: input.studied,
    tested: input.tested,
    hits: input.hits,
    falseAlarms: input.falseAlarms,
    accuracy: input.accuracy,
    arm: input.arm ?? null,
  };
  const existing = loadFarChecks().filter((entry) => entry.id !== check.id);
  const next = [check, ...existing].slice(0, MAX_CHECKS);
  writeLocal(KEY, JSON.stringify(next));
  return next;
}

export function clearFarChecks(): void {
  removeLocal(KEY);
}

export function isFarCheckDue(
  checks: readonly FarCheck[],
  now: Date = new Date(),
): boolean {
  if (checks.length === 0) return true;
  const latest = checks.reduce((a, b) => (a.finishedAt > b.finishedAt ? a : b));
  const time = Date.parse(latest.finishedAt);
  if (!Number.isFinite(time)) return true;
  return now.getTime() - time >= DUE_AFTER_MS;
}
