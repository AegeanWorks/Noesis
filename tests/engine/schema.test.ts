import { describe, expect, it } from "vitest";
import { parseAction, parseActions, parseConfig } from "../../src/engine/schema";

describe("runtime schema", () => {
  it("accepts a valid action", () => {
    const result = parseAction({ type: "advance", ms: 100 });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual({ type: "advance", ms: 100 });
  });

  it("rejects an invalid action", () => {
    const result = parseAction({ type: "advance", ms: -1 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("ms");
  });

  it("rejects an unknown action", () => {
    const result = parseAction({ type: "teleport" });
    expect(result.ok).toBe(false);
  });

  it("accepts a valid config", () => {
    const result = parseConfig({
      seed: 1,
      label: "Test",
      blocks: [{ mechanic: "nback", difficulty: 2, trials: 20 }],
    });
    expect(result.ok).toBe(true);
  });

  it("rejects an empty config", () => {
    const result = parseConfig({ seed: 1, label: "Test", blocks: [] });
    expect(result.ok).toBe(false);
  });

  it("rejects a bad difficulty", () => {
    const result = parseConfig({
      seed: 1,
      label: "Test",
      blocks: [{ mechanic: "nback", difficulty: 9, trials: 20 }],
    });
    expect(result.ok).toBe(false);
  });

  it("parses an action list", () => {
    const result = parseActions([{ type: "begin" }, { type: "advance", ms: 50 }]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toHaveLength(2);
  });
});
