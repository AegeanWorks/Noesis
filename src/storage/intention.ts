import { readLocal, removeLocal, writeLocal } from "./browserStorage";

export interface PracticeIntention {
  when: string;
  where: string;
  updatedAt: string;
}

const KEY = "noesis.intention.v1";
const MAX_LENGTH = 120;

function clean(value: string): string {
  return value.trim().slice(0, MAX_LENGTH);
}

export function loadIntention(): PracticeIntention | null {
  try {
    const raw = readLocal(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PracticeIntention>;
    const when = typeof parsed.when === "string" ? clean(parsed.when) : "";
    const where = typeof parsed.where === "string" ? clean(parsed.where) : "";
    if (!when && !where) return null;
    return {
      when,
      where,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
    };
  } catch {
    return null;
  }
}

export function saveIntention(
  input: Omit<PracticeIntention, "updatedAt">,
): PracticeIntention | null {
  const when = clean(input.when);
  const where = clean(input.where);
  if (!when && !where) {
    clearIntention();
    return null;
  }
  const intention: PracticeIntention = {
    when,
    where,
    updatedAt: new Date().toISOString(),
  };
  writeLocal(KEY, JSON.stringify(intention));
  return intention;
}

export function clearIntention(): void {
  removeLocal(KEY);
}
