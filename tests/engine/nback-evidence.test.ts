import { describe, expect, it } from "vitest";
import { mechanicMeta } from "../../src/engine/evidence";

describe("N-back task-specific evidence", () => {
  it("cites the 2017 n-back training meta-analysis first", () => {
    const meta = mechanicMeta("nback");
    expect(meta.citations[0]).toEqual({
      pmid: "28116702",
      label: "N-back training meta-analysis (2017)",
    });
  });

  it("bounds the claim to untrained n-back transfer", () => {
    const meta = mechanicMeta("nback");
    expect(meta.brief).toMatch(/33 randomized/i);
    expect(meta.brief).toMatch(/untrained n-back/i);
    expect(meta.claim).toMatch(/untrained n-back/i);
    expect(meta.claim).not.toMatch(/closely related working-memory tasks/i);
    expect(meta.qualifier).toMatch(/very small effects/i);
  });
});
