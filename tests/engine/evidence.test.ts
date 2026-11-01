import { describe, expect, it } from "vitest";
import { MECHANIC_META } from "../../src/engine/evidence";
import { MECHANIC_IDS } from "../../src/engine/types";

describe("evidence registry", () => {
  it("covers every mechanic", () => {
    expect(Object.keys(MECHANIC_META).sort()).toEqual([...MECHANIC_IDS].sort());
  });

  it("gives every mechanic a claim boundary", () => {
    for (const meta of Object.values(MECHANIC_META)) {
      expect(meta.claim.length).toBeGreaterThan(20);
      expect(meta.qualifier.length).toBeGreaterThan(20);
      expect(meta.notClaimed.length).toBeGreaterThan(0);
      expect(meta.citations.length).toBeGreaterThan(0);
      expect(["supported", "experimental", "wellness_only"]).toContain(meta.claimLevel);
    }
  });

  it("uses numeric PMIDs", () => {
    for (const meta of Object.values(MECHANIC_META)) {
      for (const citation of meta.citations) {
        expect(citation.pmid).toMatch(/^\d+$/);
      }
    }
  });
});
