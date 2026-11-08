import type { AdherenceEvent } from "./adherence";
import { downloadTextFile } from "./export";
import type { SessionRecord } from "./history";

const SESSION_HEADER = [
  "session_id",
  "finished_at",
  "seed",
  "arm",
  "mechanic",
  "domain",
  "difficulty",
  "trials",
  "duration_ms",
  "accuracy",
  "summary",
  "state_hash",
  "metrics_json",
  "motivation_json",
] as const;

const ADHERENCE_HEADER = [
  "event_id",
  "seed",
  "started_at",
  "ended_at",
  "status",
  "blocks_completed",
  "block_count",
  "arm",
] as const;

function cell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function line(values: readonly unknown[]): string {
  return values.map(cell).join(",");
}

export function buildSessionsCsv(sessions: readonly SessionRecord[]): string {
  const rows: string[] = [line(SESSION_HEADER)];
  for (const session of sessions) {
    for (const result of session.results) {
      rows.push(
        line([
          session.id,
          session.finishedAt,
          session.seed,
          session.arm ?? "",
          result.mechanic,
          result.domain,
          result.difficulty ?? "",
          result.trials,
          result.durationMs,
          result.metrics.accuracy ?? "",
          result.summary,
          result.stateHash,
          JSON.stringify(result.metrics),
          session.motivation ? JSON.stringify(session.motivation) : "",
        ]),
      );
    }
  }
  return `${rows.join("\n")}\n`;
}

export function buildAdherenceCsv(events: readonly AdherenceEvent[]): string {
  const rows: string[] = [line(ADHERENCE_HEADER)];
  for (const event of events) {
    rows.push(
      line([
        event.id,
        event.seed,
        event.startedAt,
        event.endedAt ?? "",
        event.status,
        event.blocksCompleted,
        event.blockCount,
        event.arm ?? "",
      ]),
    );
  }
  return `${rows.join("\n")}\n`;
}

function day(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function downloadSessionsCsv(
  sessions: readonly SessionRecord[],
  now: Date = new Date(),
): void {
  downloadTextFile(
    `noesis-sessions-${day(now)}.csv`,
    buildSessionsCsv(sessions),
    "text/csv",
  );
}

export function downloadAdherenceCsv(
  events: readonly AdherenceEvent[],
  now: Date = new Date(),
): void {
  downloadTextFile(
    `noesis-adherence-${day(now)}.csv`,
    buildAdherenceCsv(events),
    "text/csv",
  );
}
