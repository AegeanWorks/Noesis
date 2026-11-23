import { stableHash } from "../hash";
import { clamp, currentStreak, longestStreak, mean, rate, round } from "../scoring";
import { normalizeSeed, nextRandom } from "../rng";
import type {
  MechanicAction,
  MechanicResult,
  MechanicView,
  SymbolConfig,
  SymbolResponse,
  SymbolState,
  SymbolTrial,
} from "../types";

const MIN_TRIALS = 12;
const MAX_TRIALS = 40;

export const SYMBOL_LEGEND = ["circle", "square", "triangle", "diamond"] as const;

export function symbolConfig(difficulty: number, trials = 20): SymbolConfig {
  const safeDifficulty = clamp(Math.round(difficulty), 1, 3);
  return {
    trials: Math.round(clamp(trials, MIN_TRIALS, MAX_TRIALS)),
    timeLimitMs: 3000 - (safeDifficulty - 1) * 350,
    feedbackMs: 420 - (safeDifficulty - 1) * 50,
  };
}

function generateTrials(config: SymbolConfig, seed: number): { trials: SymbolTrial[]; rng: number } {
  let rng = seed;
  const trials: SymbolTrial[] = [];
  for (let index = 0; index < config.trials; index += 1) {
    const [roll, next] = nextRandom(rng);
    rng = next;
    const correctDigit = Math.floor(roll * SYMBOL_LEGEND.length) % SYMBOL_LEGEND.length;
    trials.push({ shape: SYMBOL_LEGEND[correctDigit]!, correctDigit });
  }
  return { trials, rng };
}

export function createSymbol(seed: number, config: SymbolConfig = symbolConfig(2)): SymbolState {
  const normalizedSeed = normalizeSeed(seed);
  const { trials, rng } = generateTrials(config, normalizedSeed);
  return {
    mechanic: "symbol",
    seed: normalizedSeed,
    rng,
    tick: 0,
    config,
    trials,
    index: 0,
    phase: "question",
    phaseElapsed: 0,
    phaseDuration: config.timeLimitMs,
    itemStartTick: 0,
    selected: null,
    responses: [],
    completed: false,
  };
}

function currentTrial(state: SymbolState): SymbolTrial | null {
  return state.trials[state.index] ?? null;
}

function recordResponse(
  state: SymbolState,
  selected: number | null,
  timedOut: boolean,
): SymbolState {
  const trial = currentTrial(state);
  if (!trial) return state;
  const response: SymbolResponse = {
    trial: state.index,
    shape: trial.shape,
    selected,
    correctDigit: trial.correctDigit,
    correct: selected === trial.correctDigit,
    reactionMs: timedOut ? null : state.tick - state.itemStartTick,
    timedOut,
    secondHalf: state.index >= Math.floor(state.trials.length / 2),
  };
  return {
    ...state,
    responses: [...state.responses, response],
    selected,
    phase: "feedback",
    phaseElapsed: 0,
    phaseDuration: state.config.feedbackMs,
  };
}

function nextTrial(state: SymbolState): SymbolState {
  if (state.index >= state.trials.length - 1) {
    return {
      ...state,
      phase: "complete",
      phaseElapsed: 0,
      phaseDuration: 0,
      completed: true,
    };
  }
  return {
    ...state,
    index: state.index + 1,
    phase: "question",
    phaseElapsed: 0,
    phaseDuration: state.config.timeLimitMs,
    itemStartTick: state.tick,
    selected: null,
  };
}

function sanitizeMs(ms: number): number {
  if (!Number.isFinite(ms)) return 0;
  return clamp(Math.round(ms), 0, 10_000);
}

export function applySymbolAction(state: SymbolState, action: MechanicAction): SymbolState {
  if (state.completed) return state;
  if (action.type === "answer") {
    if (state.phase !== "question") return state;
    const option = Math.round(action.option);
    if (!Number.isInteger(option) || option < 0 || option >= SYMBOL_LEGEND.length) return state;
    return recordResponse(state, option, false);
  }
  if (action.type !== "advance") return state;
  const ms = sanitizeMs(action.ms);
  if (ms === 0) return state;
  let next: SymbolState = { ...state, tick: state.tick + ms };
  let remaining = ms;
  while (remaining > 0 && !next.completed) {
    const space = Math.max(0, next.phaseDuration - next.phaseElapsed);
    if (space > remaining) {
      next = { ...next, phaseElapsed: next.phaseElapsed + remaining };
      remaining = 0;
      break;
    }
    next = { ...next, phaseElapsed: next.phaseElapsed + space };
    remaining -= space;
    if (next.phase === "question") {
      next = recordResponse(next, null, true);
    } else if (next.phase === "feedback") {
      next = nextTrial(next);
    } else {
      break;
    }
  }
  return next;
}

function reactionTimes(responses: SymbolResponse[], secondHalf: boolean): number[] {
  return responses
    .filter((response) => response.secondHalf === secondHalf)
    .map((response) => response.reactionMs)
    .filter((value): value is number => typeof value === "number");
}

function computeMetrics(state: SymbolState): Record<string, number> {
  const seen = state.responses.length;
  const correct = state.responses.filter((response) => response.correct).length;
  const timedOut = state.responses.filter((response) => response.timedOut).length;
  const allTimes = state.responses
    .map((response) => response.reactionMs)
    .filter((value): value is number => typeof value === "number");
  const early = reactionTimes(state.responses, false);
  const late = reactionTimes(state.responses, true);
  const earlyMean = mean(early);
  const lateMean = mean(late);
  return {
    trials_seen: seen,
    correct,
    incorrect: seen - correct - timedOut,
    timed_out: timedOut,
    accuracy: rate(correct, seen),
    mean_response_ms: allTimes.length === 0 ? 0 : round(mean(allTimes) ?? 0, 0),
    early_mean_ms: earlyMean === null ? 0 : round(earlyMean, 0),
    late_mean_ms: lateMean === null ? 0 : round(lateMean, 0),
    within_block_rt_change_ms:
      earlyMean === null || lateMean === null ? 0 : round(lateMean - earlyMean, 0),
    current_streak: currentStreak(state.responses.map((response) => response.correct), Boolean),
    max_streak: longestStreak(state.responses.map((response) => response.correct), Boolean),
  };
}

export function symbolView(state: SymbolState): MechanicView {
  const trial = currentTrial(state);
  const last = state.responses[state.responses.length - 1] ?? null;
  const metrics = computeMetrics(state);
  const feedback =
    state.phase === "feedback" && last
      ? last.timedOut
        ? "Too slow"
        : last.correct
          ? "Correct"
          : "Incorrect"
      : null;
  return {
    mechanic: "symbol",
    name: "Digit Symbol",
    phase: state.phase,
    prompt:
      state.phase === "complete"
        ? "Block complete"
        : "Which digit matches this shape? Use the legend above.",
    stimulus: trial?.shape ?? null,
    options: state.phase === "question" || state.phase === "feedback" ? ["1", "2", "3", "4"] : null,
    explanation:
      state.phase === "feedback" && trial
        ? `${trial.shape} maps to digit ${trial.correctDigit + 1}.`
        : null,
    progressCurrent: state.completed ? state.trials.length : Math.min(state.index + 1, state.trials.length),
    progressTotal: state.trials.length,
    feedback,
    feedbackTone: feedback ? (last?.correct ? "correct" : "incorrect") : null,
    canRespond: state.phase === "question",
    controls: ["1", "2", "3", "4"],
    metrics,
    complete: state.completed,
  };
}

export function symbolResult(state: SymbolState): MechanicResult {
  const metrics = computeMetrics(state);
  const accuracy = metrics.accuracy ?? 0;
  const correct = metrics.correct ?? 0;
  return {
    mechanic: "symbol",
    domain: "processing_speed",
    trials: state.trials.length,
    durationMs: state.tick,
    metrics,
    summary: `Digit Symbol: ${Math.round(accuracy * 100)}% accuracy, ${correct}/${state.trials.length} correct, ${metrics.mean_response_ms ?? 0} ms mean response.`,
    seed: state.seed,
    stateHash: stableHash(state),
  };
}

export function symbolComplete(state: SymbolState): boolean {
  return state.completed;
}
