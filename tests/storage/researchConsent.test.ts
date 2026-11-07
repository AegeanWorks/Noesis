// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import {
  RESEARCH_CONSENT_VERSION,
  clearResearchConsent,
  giveResearchConsent,
  isActiveResearchConsent,
  loadResearchConsent,
  withdrawResearchConsent,
} from "../../src/storage/researchConsent";
import type { ResearchConsentInput } from "../../src/storage/researchConsent";
import { clearResearchSettings } from "../../src/storage/researchSettings";
import { writeLocal } from "../../src/storage/browserStorage";

const INPUT: ResearchConsentInput = {
  studyContactEmail: "study@example.org",
  scopes: { dataSharing: true, futureArticles: true },
  language: "en",
  consentedAt: "2026-11-08T10:00:00.000Z",
  participantCode: "N-TEST1234",
};

afterEach(() => {
  clearResearchConsent();
  clearResearchSettings();
});

describe("research consent", () => {
  it("starts empty", () => {
    expect(loadResearchConsent()).toBeNull();
  });

  it("stores a versioned, pseudonymous consent record", () => {
    const consent = giveResearchConsent(INPUT);
    expect(consent).toMatchObject({
      version: RESEARCH_CONSENT_VERSION,
      participantCode: "N-TEST1234",
      consentedAt: "2026-11-08T10:00:00.000Z",
      withdrawnAt: null,
      language: "en",
      scopes: { dataSharing: true, futureArticles: true },
    });
    expect(loadResearchConsent()).toEqual(consent);
    expect(isActiveResearchConsent(consent)).toBe(true);
  });

  it("refuses a missing scope or an invalid contact email", () => {
    expect(
      giveResearchConsent({ ...INPUT, scopes: { dataSharing: true, futureArticles: false } }),
    ).toBeNull();
    expect(giveResearchConsent({ ...INPUT, studyContactEmail: "not-an-email" })).toBeNull();
    expect(loadResearchConsent()).toBeNull();
  });

  it("reuses the participant code when consent is given again after withdrawal", () => {
    giveResearchConsent(INPUT);
    withdrawResearchConsent();
    const { participantCode: _ignored, ...rest } = INPUT;
    const second = giveResearchConsent({
      ...rest,
      consentedAt: "2026-12-01T10:00:00.000Z",
    });
    expect(second?.participantCode).toBe("N-TEST1234");
  });

  it("withdraws without deleting the audit record", () => {
    giveResearchConsent(INPUT);
    const withdrawn = withdrawResearchConsent();
    expect(Number.isFinite(Date.parse(withdrawn?.withdrawnAt ?? ""))).toBe(true);
    expect(loadResearchConsent()).not.toBeNull();
    expect(isActiveResearchConsent(withdrawn)).toBe(false);
  });

  it("treats an older consent version as inactive", () => {
    writeLocal(
      "noesis.research-consent.v1",
      JSON.stringify({
        ...INPUT,
        version: RESEARCH_CONSENT_VERSION - 1,
        withdrawnAt: null,
      }),
    );
    const consent = loadResearchConsent();
    expect(consent).not.toBeNull();
    expect(isActiveResearchConsent(consent)).toBe(false);
  });

  it("survives corrupted storage", () => {
    writeLocal("noesis.research-consent.v1", "{broken");
    expect(loadResearchConsent()).toBeNull();
  });
});
