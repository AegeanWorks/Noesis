// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import {
  clearResearchSettings,
  isValidEmail,
  loadResearchSettings,
  normalizeEmail,
  saveResearchSettings,
} from "../../src/storage/researchSettings";
import { writeLocal } from "../../src/storage/browserStorage";

afterEach(() => {
  clearResearchSettings();
});

describe("research settings", () => {
  it("starts with no study contact", () => {
    expect(loadResearchSettings()).toEqual({ studyContactEmail: "" });
  });

  it("round-trips and trims the study contact email", () => {
    saveResearchSettings({ studyContactEmail: "  study@example.org  " });
    expect(loadResearchSettings()).toEqual({ studyContactEmail: "study@example.org" });
  });

  it("survives corrupted storage", () => {
    writeLocal("noesis.research.v1", "{broken");
    expect(loadResearchSettings()).toEqual({ studyContactEmail: "" });
  });

  it("normalizes and validates email addresses", () => {
    expect(normalizeEmail("  Study@Example.ORG ")).toBe("study@example.org");
    expect(isValidEmail("study@example.org")).toBe(true);
    expect(isValidEmail(" Study@Example.org ")).toBe(true);
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("study@example")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});
