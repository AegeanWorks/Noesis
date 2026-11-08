import type { SessionRecord } from "./history";
import { startOfWeek, weekStats } from "./history";
import type { StudyArm } from "./study";
import type { AdaptationEvent } from "./adaptive";
import type { FarCheck } from "./farChecks";
import type { AdverseEvent } from "./adverseEvents";
import type { ConsentLanguage, ResearchConsent } from "./researchConsent";
import type { AdherenceEvent } from "./adherence";

export interface StudyExport {
  studyId: string;
  arm: StudyArm;
  consentedAt: string;
}

export interface ResearchExport {
  participantCode: string;
  consentVersion: number;
  consentedAt: string;
  withdrawnAt: string | null;
  scopes: { dataSharing: boolean; futureArticles: boolean };
  language: ConsentLanguage;
}

export interface HistoryExport {
  app: "noesis";
  version: 1;
  exportedAt: string;
  sessionCount: number;
  sessions: SessionRecord[];
  study: StudyExport | null;
  farChecks: FarCheck[];
  adverseEvents: AdverseEvent[];
  adaptationLog: AdaptationEvent[];
  adherence: AdherenceEvent[];
  research: ResearchExport | null;
}

export interface ExportExtras {
  farChecks?: readonly FarCheck[];
  adverseEvents?: readonly AdverseEvent[];
  adaptationLog?: readonly AdaptationEvent[];
  adherence?: readonly AdherenceEvent[];
  research?: ResearchExport | null;
}

export function toResearchExport(
  consent: ResearchConsent | null,
): ResearchExport | null {
  if (!consent) return null;
  return {
    participantCode: consent.participantCode,
    consentVersion: consent.version,
    consentedAt: consent.consentedAt,
    withdrawnAt: consent.withdrawnAt,
    scopes: { ...consent.scopes },
    language: consent.language,
  };
}

export function buildHistoryExport(
  sessions: readonly SessionRecord[],
  study: StudyExport | null = null,
  exportedAt: Date = new Date(),
  extras: ExportExtras = {},
): string {
  const payload: HistoryExport = {
    app: "noesis",
    version: 1,
    exportedAt: exportedAt.toISOString(),
    sessionCount: sessions.length,
    sessions: [...sessions],
    study: study,
    farChecks: [...(extras.farChecks ?? [])],
    adverseEvents: [...(extras.adverseEvents ?? [])],
    adaptationLog: [...(extras.adaptationLog ?? [])],
    adherence: [...(extras.adherence ?? [])],
    research: extras.research ?? null,
  };
  return `${JSON.stringify(payload, null, 2)}\n`;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

export function buildWeekSummaryText(
  history: readonly SessionRecord[],
  weeklyGoal: number,
  now: Date = new Date(),
): string {
  const week = weekStats(history, now);
  const done = Math.min(week.days, weeklyGoal);
  const start = startOfWeek(now);
  const label = `${MONTHS[start.getMonth()]} ${start.getDate()}`;
  return (
    `Noesis practice week of ${label}: ${done} of ${weeklyGoal} practice days, ` +
    `${week.sessions} ${week.sessions === 1 ? "session" : "sessions"}, ${week.minutes} minutes.`
  );
}

export function downloadTextFile(
  filename: string,
  text: string,
  type = "application/json",
): void {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function downloadHistoryExport(
  sessions: readonly SessionRecord[],
  study: StudyExport | null = null,
  extras: ExportExtras = {},
): void {
  downloadTextFile(
    `noesis-history-${new Date().toISOString().slice(0, 10)}.json`,
    buildHistoryExport(sessions, study, new Date(), extras),
  );
}
