// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import {
  clearFarChecks,
  isFarCheckDue,
  loadFarChecks,
  logFarCheck,
} from "../../src/storage/farChecks";

afterEach(() => {
  clearFarChecks();
});

describe("far-check log", () => {
  it("starts empty and due", () => {
    expect(loadFarChecks()).toEqual([]);
    expect(isFarCheckDue([], new Date("2026-11-02T10:00:00"))).toBe(true);
  });

  it("records a completed check with its arm", () => {
    const checks = logFarCheck({
      seed: 7,
      studied: 8,
      tested: 16,
      hits: 6,
      falseAlarms: 2,
      accuracy: 0.75,
      arm: "engagement",
    });
    expect(checks).toHaveLength(1);
    expect(checks[0]).toMatchObject({ hits: 6, falseAlarms: 2, arm: "engagement" });
  });

  it("refuses impossible tallies", () => {
    logFarCheck({ seed: 1, studied: 8, tested: 16, hits: 20, falseAlarms: 0, accuracy: 1, arm: null });
    expect(loadFarChecks()).toEqual([]);
  });

  it("is not due again within thirty days", () => {
    logFarCheck({
      seed: 1,
      studied: 8,
      tested: 16,
      hits: 6,
      falseAlarms: 2,
      accuracy: 0.75,
      arm: null,
      finishedAt: "2026-11-02T10:00:00.000Z",
    });
    expect(isFarCheckDue(loadFarChecks(), new Date("2026-11-20T10:00:00"))).toBe(false);
    expect(isFarCheckDue(loadFarChecks(), new Date("2026-12-03T10:00:00"))).toBe(true);
  });
});
