import { readLocal, removeLocal, writeLocal } from "./browserStorage";

export interface ResearchSettings {
  studyContactEmail: string;
}

const KEY = "noesis.research.v1";
const EMPTY: ResearchSettings = { studyContactEmail: "" };
const MAX_EMAIL_LENGTH = 254;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  const email = normalizeEmail(value);
  return (
    email.length > 3 &&
    email.length <= MAX_EMAIL_LENGTH &&
    EMAIL_PATTERN.test(email)
  );
}

function isResearchSettings(value: unknown): value is ResearchSettings {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Partial<ResearchSettings>;
  return typeof record.studyContactEmail === "string";
}

export function loadResearchSettings(): ResearchSettings {
  try {
    const raw = readLocal(KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as unknown;
    if (!isResearchSettings(parsed)) return { ...EMPTY };
    return {
      studyContactEmail: parsed.studyContactEmail.slice(0, MAX_EMAIL_LENGTH),
    };
  } catch {
    return { ...EMPTY };
  }
}

export function saveResearchSettings(settings: ResearchSettings): ResearchSettings {
  const next: ResearchSettings = {
    studyContactEmail: settings.studyContactEmail.trim().slice(0, MAX_EMAIL_LENGTH),
  };
  writeLocal(KEY, JSON.stringify(next));
  return next;
}

export function clearResearchSettings(): void {
  removeLocal(KEY);
}
