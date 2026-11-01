import { describe, expect, it } from "vitest";
import { nextRandom, normalizeSeed, sampleIndices, shuffle } from "../../src/engine/rng";

describe("rng", () => {
  it("is deterministic for the same seed", () => {
    const first = nextRandom(123);
    const second = nextRandom(123);
    expect(first).toEqual(second);
    expect(first[0]).toBeGreaterThanOrEqual(0);
    expect(first[0]).toBeLessThan(1);
  });

  it("produces different sequences for different seeds", () => {
    const first = Array.from({ length: 5 }, (_, index) => nextRandom(index + 1)[0]);
    const second = Array.from({ length: 5 }, (_, index) => nextRandom(index + 100)[0]);
    expect(first).not.toEqual(second);
  });

  it("normalizes invalid seeds", () => {
    expect(normalizeSeed(Number.NaN)).toBe(1);
    expect(normalizeSeed(0)).toBe(1);
    expect(normalizeSeed(-1)).toBe(4294967295);
  });

  it("shuffles deterministically and preserves the elements", () => {
    const [first, firstState] = shuffle([1, 2, 3, 4, 5], 42);
    const [second, secondState] = shuffle([1, 2, 3, 4, 5], 42);
    expect(first).toEqual(second);
    expect(firstState).toBe(secondState);
    expect([...first].sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it("samples unique indices", () => {
    const [indices] = sampleIndices(10, 4, 9);
    expect(indices).toHaveLength(4);
    expect(new Set(indices).size).toBe(4);
    expect(indices.every((index) => index >= 0 && index < 10)).toBe(true);
  });
});
