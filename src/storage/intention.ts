import { readLocal, removeLocal, writeLocal } from "./browserStorage";

export interface PracticeIntention {
  when: string;
  where: string;
  pairing: string;
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
    const pairing = typeof parsed.pairing === "string" ? clean(parsed.pairing) : "";
    if (!when && !where && !pairing) return null;
    return {
      when,
      where,
      pairing,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
    };
  } catch {
    return null;
  }
}

export function saveIntention(input: {
  when: string;
  where: string;
  pairing?: string;
}): PracticeIntention | null {
  const when = clean(input.when);
  const where = clean(input.where);
  const pairing = clean(input.pairing ?? "");
  if (!when && !where && !pairing) {
    clearIntention();
    return null;
  }
  const intention: PracticeIntention = {
    when,
    where,
    pairing,
    updatedAt: new Date().toISOString(),
  };
  writeLocal(KEY, JSON.stringify(intention));
  return intention;
}

export function clearIntention(): void {
  removeLocal(KEY);
}
