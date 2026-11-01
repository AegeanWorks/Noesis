import { stableHash } from "../src/engine/hash";
import { mechanicResult } from "../src/engine/mechanics";
import { defaultTrials } from "../src/engine/mechanics";
import { policyFor, replayMechanic, runMechanic } from "../src/engine/simulate";
import type { MechanicId } from "../src/engine/types";

const MECHANICS: readonly MechanicId[] = ["nback", "gonogo", "reasoning", "speed"];
const STRATEGIES = ["optimal", "random"] as const;
const SEEDS = Array.from({ length: 50 }, (_, index) => index + 1);

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function checkMetrics(id: MechanicId, seed: number, strategy: string, metrics: Record<string, number>): void {
  for (const [key, value] of Object.entries(metrics)) {
    assert(Number.isFinite(value), `${id} seed ${seed} ${strategy}: ${key} is not finite (${value})`);
  }
  if ("accuracy" in metrics) {
    assert(metrics.accuracy! >= 0 && metrics.accuracy! <= 1, `${id}: accuracy out of range`);
  }
  if ("d_prime" in metrics) {
    assert(metrics.d_prime! >= -5 && metrics.d_prime! <= 5, `${id}: d_prime out of range`);
  }
}

function main(): number {
  let runs = 0;
  for (const id of MECHANICS) {
    for (const strategy of STRATEGIES) {
      for (const seed of SEEDS) {
        const difficulty = (seed % 3) + 1;
        const trials = defaultTrials(id, difficulty);
        const run = runMechanic(id, seed, difficulty, trials, policyFor(strategy, seed));
        assert(run.completed, `${id} seed ${seed} ${strategy}: did not complete`);
        const result = mechanicResult(run.state);
        checkMetrics(id, seed, strategy, result.metrics);
        const replay = replayMechanic(id, seed, difficulty, trials, run.actions);
        assert(
          stableHash(replay) === result.stateHash,
          `${id} seed ${seed} ${strategy}: replay hash mismatch`,
        );
        runs += 1;
      }
    }
    console.log(`[OK] ${id}: ${SEEDS.length} seeds x ${STRATEGIES.length} strategies`);
  }
  console.log(`[OK] ${runs} deterministic mechanic simulations`);
  return 0;
}

try {
  const code = main();
  process.exit(code);
} catch (error: unknown) {
  console.error(`[FAIL] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
