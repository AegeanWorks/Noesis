import { describe, expect, it } from "vitest";
import {
  buildResearchEmailDraft,
  researchExportFilename,
} from "../../src/storage/researchEmail";

function payload(): string {
  return JSON.stringify({
    app: "noesis",
    version: 1,
    exportedAt: "2026-11-08T12:00:00.000Z",
    sessionCount: 2,
    sessions: [],
    study: null,
    farChecks: [{ id: "far-1" }],
    adverseEvents: [{ id: "ae-1" }, { id: "ae-2" }],
    adaptationLog: [],
    research: {
      participantCode: "N-ABC12345",
      consentVersion: 1,
      consentedAt: "2026-11-08T10:00:00.000Z",
      withdrawnAt: null,
      scopes: { dataSharing: true, futureArticles: true },
      language: "en",
    },
  });
}

describe("research email draft", () => {
  it("names the file after the participant code and export date", () => {
    expect(
      researchExportFilename("N-ABC12345", new Date("2026-11-08T12:00:00.000Z")),
    ).toBe("noesis-research-N-ABC12345-2026-11-08.json");
  });

  it("builds a de-identified subject, body and mailto draft", () => {
    const draft = buildResearchEmailDraft(
      payload(),
      " Study@Example.ORG ",
      new Date("2026-11-08T12:00:00.000Z"),
    );
    expect(draft.recipient).toBe("study@example.org");
    expect(draft.subject).toContain("N-ABC12345");
    expect(draft.subject).toContain("2026-11-08");
    expect(draft.body).toContain("Participant code: N-ABC12345");
    expect(draft.body).toContain("Consent version: 1");
    expect(draft.body).toContain("Sessions: 2");
    expect(draft.body).toContain("Far checks: 1");
    expect(draft.body).toContain("Symptom reports: 2");
    expect(draft.body).toContain(draft.filename);
    expect(draft.body).not.toContain("Study@Example");
    expect(draft.body).not.toContain("study@example.org");
    expect(draft.mailto.startsWith("mailto:")).toBe(true);
    expect(decodeURIComponent(draft.mailto)).toContain("subject=");
    expect(decodeURIComponent(draft.mailto)).toContain("N-ABC12345");
  });

  it("refuses an invalid recipient", () => {
    expect(() =>
      buildResearchEmailDraft(payload(), "not-an-email", new Date("2026-11-08T12:00:00.000Z")),
    ).toThrow(/valid email/i);
  });

  it("refuses an export without a research consent record", () => {
    const withoutResearch = JSON.stringify({ sessionCount: 0, sessions: [] });
    expect(() =>
      buildResearchEmailDraft(withoutResearch, "study@example.org"),
    ).toThrow(/research consent/i);
  });
});
