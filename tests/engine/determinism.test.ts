import { describe, expect, it } from "vitest";
import { stableHash } from "../../src/engine/hash";
import { mechanicResult, defaultTrials } from "../../src/engine/mechanics";
import { policyFor, runMechanic } from "../../src/engine/simulate";
import type { MechanicId } from "../../src/engine/types";

const MECHANICS: readonly MechanicId[] = ["nback", "gonogo", "reasoning"];

describe("mechanic determinism", () => {
  for (const id of MECHANICS) {
    it(`replays ${id} identically across seeds`, () => {
      for (let seed = 1; seed <= 25; seed += 1) {
        const difficulty = (seed % 3) + 1;
        const trials = defaultTrials(id, difficulty);
        const first = runMechanic(id, seed, difficulty, trials, policyFor("random", seed));
        const second = runMechanic(id, seed, difficulty, trials, policyFor("random", seed));
        expect(first.completed).toBe(true);
        expect(stableHash(first.state)).toBe(stableHash(second.state));
        const result = mechanicResult(first.state);
        for (const [key, value] of Object.entries(result.metrics)) {
          expect(Number.isFinite(value), `${id} seed ${seed} metric ${key}`).toBe(true);
        }
        expect(result.stateHash).toBe(stableHash(first.state));
      }
    });
  }

  it("uses different sequences for different seeds", () => {
    const first = runMechanic("nback", 1, 2, 20, policyFor("optimal", 1));
    const second = runMechanic("nback", 2, 2, 20, policyFor("optimal", 2));
    expect(stableHash(first.state)).not.toBe(stableHash(second.state));
  });
});
