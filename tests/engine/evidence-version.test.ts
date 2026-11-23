import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { EVIDENCE_REVIEW_VERSION } from "../../src/content/appMeta";

const RESEARCH_README = new URL(
  "../../docs/research/README.md",
  import.meta.url,
);

describe("evidence review version metadata", () => {
  it("matches the revision declared in the research README", () => {
    const readme = readFileSync(RESEARCH_README, "utf-8");
    const match = /current review revision (v[\d.]+ \(\d{4}-\d{2}-\d{2}\))/i.exec(readme);
    expect(match?.[1]).toBe(EVIDENCE_REVIEW_VERSION);
  });
});
