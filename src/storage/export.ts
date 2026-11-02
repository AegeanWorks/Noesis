import type { SessionRecord } from "./history";
import { startOfWeek, weekStats } from "./history";
import type { StudyArm } from "./study";
import type { FarCheck } from "./farChecks";
import type { AdverseEvent } from "./adverseEvents";

export interface StudyExport {
  studyId: string;
  arm: StudyArm;
  consentedAt: string;
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
}

export interface ExportExtras {
  farChecks?: readonly FarCheck[];
  adverseEvents?: readonly AdverseEvent[];
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

export function downloadHistoryExport(
  sessions: readonly SessionRecord[],
  study: StudyExport | null = null,
  extras: ExportExtras = {},
): void {
  const blob = new Blob([buildHistoryExport(sessions, study, new Date(), extras)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `noesis-history-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
