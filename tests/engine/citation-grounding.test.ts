import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { MECHANIC_META } from "../../src/engine/evidence";

const TABLE = new URL(
  "../../docs/research/analysis/evidence_table.json",
  import.meta.url,
);

function tablePmids(): Set<string> {
  const table = JSON.parse(readFileSync(TABLE, "utf-8")) as {
    entries: { pmid: string }[];
  };
  return new Set(table.entries.map((entry) => entry.pmid));
}

function tableYears(): Map<string, number> {
  const table = JSON.parse(readFileSync(TABLE, "utf-8")) as {
    entries: { pmid: string; year: number }[];
  };
  return new Map(table.entries.map((entry) => [entry.pmid, entry.year]));
}

describe("mechanic citation grounding (R4/R6)", () => {
  it("resolves every in-app citation to a review-corpus record", () => {
    const known = tablePmids();
    const missing: string[] = [];
    for (const meta of Object.values(MECHANIC_META)) {
      expect(meta.citations.length).toBeGreaterThan(0);
      for (const citation of meta.citations) {
        if (!known.has(citation.pmid)) {
          missing.push(`${meta.id}: PMID ${citation.pmid} (${citation.label})`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it("labels carry the record year shown in the corpus", () => {
    const years = tableYears();
    const stale: string[] = [];
    for (const meta of Object.values(MECHANIC_META)) {
      for (const citation of meta.citations) {
        const match = /\((\d{4})\)\s*$/.exec(citation.label);
        const expected = years.get(citation.pmid);
        if (!match || Number(match[1]) !== expected) {
          stale.push(`${meta.id}: "${citation.label}" should end with (${expected})`);
        }
      }
    }
    expect(stale).toEqual([]);
  });
});
