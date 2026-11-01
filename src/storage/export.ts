import type { SessionRecord } from "./history";

export interface HistoryExport {
  app: "noesis";
  version: 1;
  exportedAt: string;
  sessionCount: number;
  sessions: SessionRecord[];
}

export function buildHistoryExport(
  sessions: readonly SessionRecord[],
  exportedAt: Date = new Date(),
): string {
  const payload: HistoryExport = {
    app: "noesis",
    version: 1,
    exportedAt: exportedAt.toISOString(),
    sessionCount: sessions.length,
    sessions: [...sessions],
  };
  return `${JSON.stringify(payload, null, 2)}\n`;
}

export function downloadHistoryExport(sessions: readonly SessionRecord[]): void {
  const blob = new Blob([buildHistoryExport(sessions)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `noesis-history-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
