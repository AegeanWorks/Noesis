import { describe, expect, it } from "vitest";
import { buildHistoryExport, buildWeekSummaryText } from "../../src/storage/export";
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
      buildHistoryExport([SESSION], null, new Date("2026-11-01T12:00:00.000Z")),
    ) as Record<string, unknown>;
    expect(parsed.app).toBe("noesis");
    expect(parsed.version).toBe(1);
    expect(parsed.exportedAt).toBe("2026-11-01T12:00:00.000Z");
    expect(parsed.sessionCount).toBe(1);
    expect(parsed.sessions).toEqual([SESSION]);
    expect(parsed.study).toBeNull();
  });

  it("exports an empty history without failing", () => {
    const parsed = JSON.parse(
      buildHistoryExport([], null, new Date("2026-11-01T12:00:00.000Z")),
    ) as Record<string, unknown>;
    expect(parsed.sessionCount).toBe(0);
    expect(parsed.sessions).toEqual([]);
  });

  it("carries the study enrollment for trial analysis", () => {
    const parsed = JSON.parse(
      buildHistoryExport(
        [],
        { studyId: "RCT-1", arm: "engagement", consentedAt: "2026-11-02T10:00:00.000Z" },
        new Date("2026-11-01T12:00:00.000Z"),
      ),
    ) as Record<string, unknown>;
    expect(parsed.study).toEqual({
      studyId: "RCT-1",
      arm: "engagement",
      consentedAt: "2026-11-02T10:00:00.000Z",
    });
  });

  it("carries far checks and symptom reports in the same file", () => {
    const parsed = JSON.parse(
      buildHistoryExport([], null, new Date("2026-11-01T12:00:00.000Z"), {
        farChecks: [
          {
            id: "far-1",
            finishedAt: "2026-11-01T10:00:00.000Z",
            seed: 3,
            studied: 8,
            tested: 16,
            hits: 5,
            falseAlarms: 3,
            accuracy: 0.625,
            arm: "control",
          },
        ],
        adverseEvents: [
          {
            id: "ae-1",
            reportedAt: "2026-11-01T11:00:00.000Z",
            sessionId: null,
            symptoms: ["headache"],
            severity: "mild",
            note: "",
            stoppedSession: false,
          },
        ],
      }),
    ) as Record<string, unknown>;
    expect((parsed.farChecks as unknown[]).length).toBe(1);
    expect((parsed.adverseEvents as unknown[]).length).toBe(1);
  });

  it("defaults far checks, symptom reports and the adaptation log to empty", () => {
    const parsed = JSON.parse(buildHistoryExport([])) as Record<string, unknown>;
    expect(parsed.farChecks).toEqual([]);
    expect(parsed.adverseEvents).toEqual([]);
    expect(parsed.adaptationLog).toEqual([]);
    expect(parsed.research).toBeNull();
    expect(parsed.adherence).toEqual([]);
  });

  it("carries the session adherence log for dropout analysis", () => {
    const parsed = JSON.parse(
      buildHistoryExport([], null, new Date("2026-11-08T12:00:00.000Z"), {
        adherence: [
          {
            id: "session-1",
            seed: 42,
            startedAt: "2026-11-08T10:00:00.000Z",
            endedAt: "2026-11-08T10:02:00.000Z",
            status: "aborted",
            blocksCompleted: 1,
            blockCount: 4,
            arm: null,
          },
        ],
      }),
    ) as Record<string, unknown>;
    expect((parsed.adherence as unknown[]).length).toBe(1);
    expect((parsed.adherence as { status: string }[])[0]?.status).toBe("aborted");
  });

  it("carries a self-describing manifest with provenance and counts", () => {
    const exportedAt = new Date("2026-11-08T12:00:00.000Z");
    const parsed = JSON.parse(
      buildHistoryExport([SESSION], null, exportedAt, {
        adherence: [
          {
            id: "session-42-1",
            seed: 42,
            startedAt: "2026-11-08T10:00:00.000Z",
            endedAt: "2026-11-08T10:05:00.000Z",
            status: "completed",
            blocksCompleted: 1,
            blockCount: 1,
            arm: null,
          },
        ],
        research: {
          participantCode: "N-ABC12345",
          consentVersion: 1,
          consentedAt: "2026-11-08T10:00:00.000Z",
          withdrawnAt: null,
          scopes: { dataSharing: true, futureArticles: true },
          language: "en",
        },
      }),
    ) as Record<string, unknown>;
    expect(parsed.manifest).toMatchObject({
      app: "noesis",
      appVersion: "0.1.0",
      exportSchemaVersion: 1,
      evidenceReview: expect.stringMatching(/v2\.61/),
      consentVersion: 1,
      exportedAt: "2026-11-08T12:00:00.000Z",
      counts: {
        sessions: 1,
        blocks: 1,
        farChecks: 0,
        adverseEvents: 0,
        adherence: 1,
        adaptationEvents: 0,
      },
    });
  });

  it("defaults the manifest to zero counts and no consent version", () => {
    const parsed = JSON.parse(
      buildHistoryExport([], null, new Date("2026-11-08T12:00:00.000Z")),
    ) as Record<string, unknown>;
    expect(parsed.manifest).toMatchObject({
      consentVersion: null,
      counts: {
        sessions: 0,
        blocks: 0,
        farChecks: 0,
        adverseEvents: 0,
        adherence: 0,
        adaptationEvents: 0,
      },
    });
  });

  it("carries research consent metadata without the study contact email", () => {
    const research = {
      participantCode: "N-ABC12345",
      consentVersion: 1,
      consentedAt: "2026-11-08T10:00:00.000Z",
      withdrawnAt: null,
      scopes: { dataSharing: true, futureArticles: true },
      language: "en" as const,
    };
    const text = buildHistoryExport([], null, new Date("2026-11-08T12:00:00.000Z"), {
      research,
    });
    const parsed = JSON.parse(text) as Record<string, unknown>;
    expect(parsed.research).toEqual(research);
    expect(text).not.toContain("studyContactEmail");
  });

  it("carries the adaptation log for dose-response analysis", () => {
    const parsed = JSON.parse(
      buildHistoryExport([], null, new Date("2026-11-01T12:00:00.000Z"), {
        adaptationLog: [
          { at: "2026-11-01T10:00:00.000Z", mechanic: "nback", from: 2, to: 3, accuracy: 0.9 },
        ],
      }),
    ) as Record<string, unknown>;
    expect(parsed.adaptationLog).toEqual([
      { at: "2026-11-01T10:00:00.000Z", mechanic: "nback", from: 2, to: 3, accuracy: 0.9 },
    ]);
  });

  it("summarises the calendar week for sharing", () => {
    const sessions = [
      {
        id: "mon",
        finishedAt: "2026-11-02T10:00:00.000Z",
        seed: 1,
        results: [],
      },
      {
        id: "wed",
        finishedAt: "2026-11-04T10:00:00.000Z",
        seed: 2,
        results: [],
      },
    ];
    expect(buildWeekSummaryText(sessions, 3, new Date("2026-11-05T12:00:00"))).toBe(
      "Noesis practice week of Nov 2: 2 of 3 practice days, 2 sessions, 0 minutes.",
    );
  });

  it("ends with a newline for diff-friendly files", () => {
    expect(buildHistoryExport([]).endsWith("\n")).toBe(true);
  });
});
