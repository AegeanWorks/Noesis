import { readLocal, removeLocal, writeLocal } from "./browserStorage";
import { isValidEmail } from "./researchSettings";

export const RESEARCH_CONSENT_VERSION = 1;
export const RESEARCH_CONSENT_KEY = "noesis.research-consent.v1";

export type ConsentLanguage = "en" | "tr";

export interface ResearchConsentScopes {
  dataSharing: boolean;
  futureArticles: boolean;
}

export interface ResearchConsent {
  version: number;
  participantCode: string;
  consentedAt: string;
  withdrawnAt: string | null;
  scopes: ResearchConsentScopes;
  studyContactEmail: string;
  language: ConsentLanguage;
}

export interface ResearchConsentInput {
  studyContactEmail: string;
  scopes: ResearchConsentScopes;
  language: ConsentLanguage;
  consentedAt?: string;
  participantCode?: string;
}

const CODE_PATTERN = /^N-[A-Z0-9]{4,32}$/;

function randomParticipantCode(): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) {
    return `N-${uuid.replace(/-/g, "").slice(0, 12).toUpperCase()}`;
  }
  const fallback = Math.random().toString(36).slice(2, 14).toUpperCase();
  return `N-${fallback.padEnd(12, "0").slice(0, 12)}`;
}

function isLanguage(value: unknown): value is ConsentLanguage {
  return value === "en" || value === "tr";
}

function isScopes(value: unknown): value is ResearchConsentScopes {
  if (typeof value !== "object" || value === null) return false;
  const scopes = value as Partial<ResearchConsentScopes>;
  return (
    typeof scopes.dataSharing === "boolean" &&
    typeof scopes.futureArticles === "boolean"
  );
}

function isConsent(value: unknown): value is ResearchConsent {
  if (typeof value !== "object" || value === null) return false;
  const consent = value as Partial<ResearchConsent>;
  return (
    typeof consent.version === "number" &&
    typeof consent.participantCode === "string" &&
    CODE_PATTERN.test(consent.participantCode) &&
    typeof consent.consentedAt === "string" &&
    (consent.withdrawnAt === null || typeof consent.withdrawnAt === "string") &&
    isScopes(consent.scopes) &&
    typeof consent.studyContactEmail === "string" &&
    isLanguage(consent.language)
  );
}

export function loadResearchConsent(): ResearchConsent | null {
  try {
    const raw = readLocal(RESEARCH_CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!isConsent(parsed)) return null;
    return { ...parsed, scopes: { ...parsed.scopes } };
  } catch {
    return null;
  }
}

function saveConsent(consent: ResearchConsent): ResearchConsent {
  writeLocal(RESEARCH_CONSENT_KEY, JSON.stringify(consent));
  return consent;
}

export function giveResearchConsent(
  input: ResearchConsentInput,
): ResearchConsent | null {
  if (!isValidEmail(input.studyContactEmail)) return null;
  if (!isScopes(input.scopes) || !input.scopes.dataSharing || !input.scopes.futureArticles) {
    return null;
  }
  if (!isLanguage(input.language)) return null;

  const existing = loadResearchConsent();
  const code = (input.participantCode ?? existing?.participantCode ?? randomParticipantCode())
    .trim()
    .toUpperCase();
  if (!CODE_PATTERN.test(code)) return null;

  return saveConsent({
    version: RESEARCH_CONSENT_VERSION,
    participantCode: code,
    consentedAt: input.consentedAt ?? new Date().toISOString(),
    withdrawnAt: null,
    scopes: { ...input.scopes },
    studyContactEmail: input.studyContactEmail.trim(),
    language: input.language,
  });
}

export function withdrawResearchConsent(): ResearchConsent | null {
  const existing = loadResearchConsent();
  if (!existing) return null;
  if (existing.withdrawnAt !== null) return existing;
  return saveConsent({ ...existing, withdrawnAt: new Date().toISOString() });
}

export function isActiveResearchConsent(
  consent: ResearchConsent | null,
): consent is ResearchConsent {
  return (
    consent !== null &&
    consent.version === RESEARCH_CONSENT_VERSION &&
    consent.withdrawnAt === null &&
    consent.scopes.dataSharing &&
    consent.scopes.futureArticles &&
    isValidEmail(consent.studyContactEmail)
  );
}

export function clearResearchConsent(): void {
  removeLocal(RESEARCH_CONSENT_KEY);
}
