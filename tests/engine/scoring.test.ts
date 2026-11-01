import { describe, expect, it } from "vitest";
import { clamp, dPrime, probit, rate, round } from "../../src/engine/scoring";

describe("scoring", () => {
  it("computes the inverse normal at known points", () => {
    expect(probit(0.5)).toBeCloseTo(0, 6);
    expect(probit(0.975)).toBeCloseTo(1.96, 2);
    expect(probit(0.025)).toBeCloseTo(-1.96, 2);
  });

  it("clamps and rounds", () => {
    expect(clamp(12, 0, 10)).toBe(10);
    expect(round(1.2345, 2)).toBe(1.23);
    expect(round(Number.NaN)).toBe(0);
  });

  it("computes rates safely", () => {
    expect(rate(1, 4)).toBe(0.25);
    expect(rate(1, 0)).toBe(0);
  });

  it("computes d-prime with log-linear correction", () => {
    expect(dPrime(10, 10, 0, 10)).toBeGreaterThan(1);
    expect(dPrime(0, 10, 10, 10)).toBeLessThan(-1);
    expect(Number.isFinite(dPrime(0, 0, 0, 0))).toBe(true);
  });
});
