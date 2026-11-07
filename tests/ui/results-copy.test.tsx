// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { formatMetric } from "../../src/ui/screens/ResultsScreen";

describe("result metric formatting", () => {
  it("shows the exact rounded millisecond value", () => {
    expect(formatMetric("mean_go_reaction_ms", 15)).toBe("15 ms");
    expect(formatMetric("mean_go_reaction_ms", 0)).toBe("0 ms");
    expect(formatMetric("mean_go_reaction_ms", 612)).toBe("612 ms");
  });
});
