import { readLocal, removeLocal, writeLocal } from "./browserStorage";

export interface SafetyProfile {
  version: 1;
  acknowledged: boolean;
  photosensitive: boolean;
  exerciseConcern: boolean;
  consent: boolean;
  updatedAt: string;
}

const KEY = "noesis.safety.v1";

export function loadSafety(): SafetyProfile | null {
  try {
    const raw = readLocal(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SafetyProfile>;
    if (parsed.version !== 1 || typeof parsed.acknowledged !== "boolean") return null;
    return {
      version: 1,
      acknowledged: parsed.acknowledged,
      photosensitive: parsed.photosensitive === true,
      exerciseConcern: parsed.exerciseConcern === true,
      consent: parsed.consent === true,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
    };
  } catch {
    return null;
  }
}

export function saveSafety(
  input: Omit<SafetyProfile, "version" | "updatedAt">,
): SafetyProfile {
  const profile: SafetyProfile = {
    ...input,
    version: 1,
    updatedAt: new Date().toISOString(),
  };
  writeLocal(KEY, JSON.stringify(profile));
  return profile;
}

export function clearSafety(): void {
  removeLocal(KEY);
}
