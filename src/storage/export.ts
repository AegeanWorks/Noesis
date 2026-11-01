import type { SessionRecord } from "./history";
import type { StudyArm } from "./study";

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
}

export function buildHistoryExport(
  sessions: readonly SessionRecord[],
  study: StudyExport | null = null,
  exportedAt: Date = new Date(),
): string {
  const payload: HistoryExport = {
    app: "noesis",
    version: 1,
    exportedAt: exportedAt.toISOString(),
    sessionCount: sessions.length,
    sessions: [...sessions],
    study: study,
  };
  return `${JSON.stringify(payload, null, 2)}\n`;
}

export function downloadHistoryExport(
  sessions: readonly SessionRecord[],
  study: StudyExport | null = null,
): void {
  const blob = new Blob([buildHistoryExport(sessions, study)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `noesis-history-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
