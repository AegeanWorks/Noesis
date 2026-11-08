import { describe, expect, it } from "vitest";
import type { AdherenceEvent } from "../../src/storage/adherence";
import { buildAdherenceCsv, buildSessionsCsv } from "../../src/storage/csvExport";
import type { SessionRecord } from "../../src/storage/history";

const SESSION: SessionRecord = {
  id: "session-1",
  finishedAt: "2026-11-08T10:05:00.000Z",
  seed: 42,
  arm: "control",
  results: [
    {
      mechanic: "nback",
      domain: "working_memory",
      trials: 18,
      durationMs: 60_000,
      metrics: { accuracy: 0.8, d_prime: 2.1 },
      summary: '2-back, "best"',
      seed: 42,
      stateHash: "0123456789abcdef",
      difficulty: 2,
    },
  ],
  motivation: {
    banked: 40,
    schedule: { steadyUpTo: 0.7, boostUpTo: 0.9 },
    completionBonus: 0,
    tiers: ["steady"],
  },
};

const EVENT: AdherenceEvent = {
  id: "session-42-1",
  seed: 42,
  startedAt: "2026-11-08T10:00:00.000Z",
  endedAt: "2026-11-08T10:05:00.000Z",
  status: "completed",
  blocksCompleted: 4,
  blockCount: 4,
  arm: "control",
};

describe("analysis CSV exports", () => {
  it("writes a stable sessions header even with no data", () => {
    expect(buildSessionsCsv([])).toBe(
      "session_id,finished_at,seed,arm,mechanic,domain,difficulty,confidence,trials,duration_ms,accuracy,summary,state_hash,metrics_json,motivation_json\n",
    );
  });

  it("flattens one row per block and preserves metrics as JSON", () => {
    const csv = buildSessionsCsv([SESSION]);
    const [header, row] = csv.trimEnd().split("\n");
    expect(header).toBe(
      "session_id,finished_at,seed,arm,mechanic,domain,difficulty,confidence,trials,duration_ms,accuracy,summary,state_hash,metrics_json,motivation_json",
    );
    expect(row).toContain("session-1,2026-11-08T10:05:00.000Z,42,control,nback,working_memory,2,,18,60000,0.8,");
    expect(row).toContain('"2-back, ""best"""');
    expect(row).toContain('"{""accuracy"":0.8,""d_prime"":2.1}"');
    expect(row).toContain('"{""banked"":40');
  });

  it("leaves optional session fields blank rather than printing undefined", () => {
    const { difficulty: _ignored, ...result } = SESSION.results[0]!;
    const csv = buildSessionsCsv([
      {
        ...SESSION,
        arm: null,
        motivation: null,
        results: [{ ...result, metrics: {}, summary: "" }],
      },
    ]);
    const row = csv.trimEnd().split("\n")[1] ?? "";
    expect(row).not.toContain("undefined");
    expect(row).toContain("session-1,2026-11-08T10:05:00.000Z,42,,nback,working_memory,,,18,60000,,");
  });

  it("writes a stable adherence header and one row per event", () => {
    const csv = buildAdherenceCsv([EVENT]);
    const [header, row] = csv.trimEnd().split("\n");
    expect(header).toBe(
      "event_id,seed,started_at,ended_at,status,blocks_completed,block_count,arm",
    );
    expect(row).toBe(
      "session-42-1,42,2026-11-08T10:00:00.000Z,2026-11-08T10:05:00.000Z,completed,4,4,control",
    );
  });

  it("writes an adherence header even with no events", () => {
    expect(buildAdherenceCsv([])).toBe(
      "event_id,seed,started_at,ended_at,status,blocks_completed,block_count,arm\n",
    );
  });
});
