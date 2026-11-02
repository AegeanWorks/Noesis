import { describe, expect, it } from "vitest";
import {
  addBlockMotivation,
  bankMotivation,
  createMotivation,
  FINISHER_BONUS,
  finishSessionMotivation,
  riskMotivation,
  scheduleLabel,
  STEADY_SCHEDULE,
  totalMomentum,
  VOLATILE_SCHEDULE,
} from "../../src/engine/motivation";
import type { MechanicResult } from "../../src/engine/types";

function result(accuracy: number, maxStreak = 0): MechanicResult {
  return {
    mechanic: "nback",
    domain: "working_memory",
    trials: 10,
    durationMs: 1000,
    metrics: { accuracy, max_streak: maxStreak },
    summary: "test",
    seed: 1,
    stateHash: "0123456789abcdef",
  };
}

describe("motivation", () => {
  it("is deterministic for the same seed and block", () => {
    const first = addBlockMotivation(createMotivation(5), 0, result(0.8, 6), null);
    const second = addBlockMotivation(createMotivation(5), 0, result(0.8, 6), null);
    expect(first.outcomes).toEqual(second.outcomes);
    expect(first.rng).toBe(second.rng);
  });

  it("covers all bonus tiers across seeds", () => {
    const tiers = new Set<string>();
    for (let seed = 1; seed <= 100; seed += 1) {
      const state = addBlockMotivation(createMotivation(seed), 0, result(0.8, 4), null);
      tiers.add(state.outcomes[0]!.tier);
    }
    expect(tiers).toEqual(new Set(["steady", "boost", "rare"]));
  });

  it("applies a streak multiplier and caps a block at 100 points", () => {
    const state = addBlockMotivation(createMotivation(3), 0, result(1, 20), null);
    const outcome = state.outcomes[0]!;
    expect(outcome.multiplier).toBe(3);
    expect(outcome.points).toBeLessThanOrEqual(100);
  });

  it("marks a near-best result and adds the near-best bonus", () => {
    const state = addBlockMotivation(createMotivation(3), 0, result(0.82), 0.85);
    const outcome = state.outcomes[0]!;
    expect(outcome.nearBest).toBe(true);
    const without = addBlockMotivation(createMotivation(3), 0, result(0.82), 0.95);
    expect(without.outcomes[0]!.nearBest).toBe(false);
    expect(outcome.points).toBeGreaterThanOrEqual(without.outcomes[0]!.points + 10);
  });

  it("banks unbanked momentum", () => {
    const state = addBlockMotivation(createMotivation(3), 0, result(0.9, 5), null);
    const banked = bankMotivation(state);
    expect(banked.banked).toBe(state.unbanked);
    expect(banked.unbanked).toBe(0);
    expect(totalMomentum(banked)).toBe(state.unbanked);
  });

  it("doubles a successful risk and clears the stake", () => {
    const first = addBlockMotivation(createMotivation(3), 0, result(0.9, 5), null);
    const risked = riskMotivation(first);
    expect(risked.risk).toBe(true);
    expect(risked.unbanked).toBe(0);
    expect(risked.riskAmount).toBe(first.unbanked);
    const resolved = addBlockMotivation(risked, 1, result(0.8, 3), null);
    expect(resolved.risk).toBe(false);
    expect(resolved.banked).toBe(first.unbanked * 2);
  });

  it("loses only the risked bonus on failure", () => {
    const first = addBlockMotivation(createMotivation(3), 0, result(0.9, 5), null);
    const risked = riskMotivation(first);
    const resolved = addBlockMotivation(risked, 1, result(0.5, 0), null);
    expect(resolved.risk).toBe(false);
    expect(resolved.banked).toBe(0);
    expect(resolved.unbanked).toBeGreaterThan(0);
  });

  it("does not risk when there is nothing to risk", () => {
    const state = createMotivation(3);
    expect(riskMotivation(state)).toEqual(state);
  });

  it("banks a pending risk stake on completion", () => {
    const first = addBlockMotivation(createMotivation(3), 0, result(0.9, 5), null);
    const risked = riskMotivation(first);
    const banked = bankMotivation(risked);
    expect(banked.banked).toBe(first.unbanked);
    expect(banked.risk).toBe(false);
    expect(banked.riskAmount).toBe(0);
  });

  it("defaults to the steady schedule and labels it honestly", () => {
    expect(createMotivation(3).schedule).toEqual(STEADY_SCHEDULE);
    expect(scheduleLabel(STEADY_SCHEDULE)).toBe("70% steady, 20% boost and 10% rare");
    expect(scheduleLabel(VOLATILE_SCHEDULE)).toBe("60% steady, 25% boost and 15% rare");
  });

  it("keeps the schedule in state and stays deterministic per schedule", () => {
    const steady = addBlockMotivation(createMotivation(5), 0, result(0.8, 6), null);
    const steadyAgain = addBlockMotivation(createMotivation(5), 0, result(0.8, 6), null);
    expect(steady.outcomes).toEqual(steadyAgain.outcomes);
    const volatile = addBlockMotivation(
      createMotivation(5, VOLATILE_SCHEDULE),
      0,
      result(0.8, 6),
      null,
    );
    expect(volatile.schedule).toEqual(VOLATILE_SCHEDULE);
    expect(volatile.rng).toBe(steady.rng);
  });

  it("banks a finisher bonus only when one is awarded", () => {
    const played = addBlockMotivation(createMotivation(3), 0, result(0.9, 5), null);
    const finished = finishSessionMotivation(played, FINISHER_BONUS);
    expect(finished.completionBonus).toBe(FINISHER_BONUS);
    expect(finished.banked).toBe(played.unbanked + FINISHER_BONUS);
    expect(finished.unbanked).toBe(0);
    const plain = finishSessionMotivation(played, 0);
    expect(plain.completionBonus).toBe(0);
    expect(plain.banked).toBe(played.unbanked);
  });
});
