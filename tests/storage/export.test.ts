import { describe, expect, it } from "vitest";
import { buildHistoryExport } from "../../src/storage/export";
import type { SessionRecord } from "../../src/storage/history";

const SESSION: SessionRecord = {
  id: "session-1",
  finishedAt: "2026-10-31T10:00:00.000Z",
  seed: 42,
  results: [
    {
      mechanic: "nback",
      domain: "working_memory",
      trials: 10,
      durationMs: 1000,
      metrics: { accuracy: 0.8 },
      summary: "2-back",
      seed: 42,
      stateHash: "0123456789abcdef",
    },
  ],
};

describe("history export", () => {
  it("serializes a versioned payload with metadata", () => {
    const parsed = JSON.parse(
      buildHistoryExport([SESSION], new Date("2026-11-01T12:00:00.000Z")),
    ) as Record<string, unknown>;
    expect(parsed.app).toBe("noesis");
    expect(parsed.version).toBe(1);
    expect(parsed.exportedAt).toBe("2026-11-01T12:00:00.000Z");
    expect(parsed.sessionCount).toBe(1);
    expect(parsed.sessions).toEqual([SESSION]);
  });

  it("exports an empty history without failing", () => {
    const parsed = JSON.parse(
      buildHistoryExport([], new Date("2026-11-01T12:00:00.000Z")),
    ) as Record<string, unknown>;
    expect(parsed.sessionCount).toBe(0);
    expect(parsed.sessions).toEqual([]);
  });

  it("ends with a newline for diff-friendly files", () => {
    expect(buildHistoryExport([]).endsWith("\n")).toBe(true);
  });
});
