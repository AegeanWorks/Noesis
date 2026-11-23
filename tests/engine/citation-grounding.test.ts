import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
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

const EVIDENCE_SCREEN = new URL("../../src/ui/screens/EvidenceScreen.tsx", import.meta.url);

// Narrative-only by design (see SEARCH_LOG): a landmark primary experiment,
// cited with its publication details wherever it appears.
const NARRATIVE_ALLOWLIST = new Set(["19217383"]);

function screenPmids(): string[] {
  const source = readFileSync(EVIDENCE_SCREEN, "utf-8");
  const found = source.match(/\b([1-4]\d{7})\b/g) ?? [];
  return [...new Set(found)];
}

function uiSourceFiles(dir: URL): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(fileURLToPath(dir), entry);
    if (statSync(path).isDirectory()) {
      files.push(...uiSourceFiles(new URL(`./${entry}/`, dir)));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      files.push(path);
    }
  }
  return files;
}

function allUiPmids(): string[] {
  const found = new Set<string>();
  for (const file of uiSourceFiles(new URL("../../src/ui/", import.meta.url))) {
    for (const pmid of readFileSync(file, "utf-8").match(/\b([1-4]\d{7})\b/g) ?? []) {
      found.add(pmid);
    }
  }
  return [...found];
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

  it("resolves every hardcoded EvidenceScreen PMID to the corpus or the allowlist", () => {
    const known = tablePmids();
    const dangling = screenPmids().filter(
      (pmid) => !known.has(pmid) && !NARRATIVE_ALLOWLIST.has(pmid),
    );
    expect(dangling).toEqual([]);
  });

  it("resolves every PMID hardcoded in any UI source to the corpus", () => {
    const known = tablePmids();
    const dangling = allUiPmids().filter(
      (pmid) => !known.has(pmid) && !NARRATIVE_ALLOWLIST.has(pmid),
    );
    expect(dangling).toEqual([]);
  });

  it("states the current corpus size, not a stale count", () => {
    const source = readFileSync(EVIDENCE_SCREEN, "utf-8");
    const known = tablePmids();
    const match = /umbrella review of (\d+) reviews and trials/.exec(source);
    expect(match?.[1]).toBe(String(known.size));
  });
});
