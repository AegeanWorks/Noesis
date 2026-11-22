import { stableHash } from "../hash";
import { clamp, currentStreak, longestStreak, mean, rate, round } from "../scoring";
import { normalizeSeed, nextRandom } from "../rng";
import type {
  MechanicAction,
  MechanicResult,
  MechanicView,
  SearchConfig,
  SearchResponse,
  SearchState,
  SearchTrial,
} from "../types";

const MIN_TRIALS = 10;
const MAX_TRIALS = 40;

const TARGET = "circle-red";
const DISTRACTORS = ["circle-blue", "square-red"] as const;

export function searchConfig(difficulty: number, trials = 20): SearchConfig {
  const safeDifficulty = clamp(Math.round(difficulty), 1, 3);
  return {
    trials: Math.round(clamp(trials, MIN_TRIALS, MAX_TRIALS)),
    timeLimitMs: 3400 - (safeDifficulty - 1) * 300,
    feedbackMs: 450 - (safeDifficulty - 1) * 50,
    smallSetSize: 9,
    largeSetSize: safeDifficulty === 1 ? 16 : 25,
  };
}

function generateTrials(config: SearchConfig, seed: number): { trials: SearchTrial[]; rng: number } {
  let rng = seed;
  const trials: SearchTrial[] = [];
  for (let index = 0; index < config.trials; index += 1) {
    const large = index % 2 === 1;
    const setSize = large ? config.largeSetSize : config.smallSetSize;
    const [targetRoll, afterTarget] = nextRandom(rng);
    rng = afterTarget;
    const targetIndex = Math.floor(targetRoll * setSize) % setSize;
    const cells: string[] = [];
    for (let cell = 0; cell < setSize; cell += 1) {
      if (cell === targetIndex) {
        cells.push(TARGET);
        continue;
      }
      const [distractorRoll, afterDistractor] = nextRandom(rng);
      rng = afterDistractor;
      cells.push(DISTRACTORS[distractorRoll < 0.5 ? 0 : 1]);
    }
    trials.push({ cells, targetIndex, setSize, large });
  }
  return { trials, rng };
}

export function createSearch(seed: number, config: SearchConfig = searchConfig(2)): SearchState {
  const normalizedSeed = normalizeSeed(seed);
  const { trials, rng } = generateTrials(config, normalizedSeed);
  return {
    mechanic: "search",
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

function currentTrial(state: SearchState): SearchTrial | null {
  return state.trials[state.index] ?? null;
}

function recordResponse(
  state: SearchState,
  selected: number | null,
  timedOut: boolean,
): SearchState {
  const trial = currentTrial(state);
  if (!trial) return state;
  const response: SearchResponse = {
    trial: state.index,
    setSize: trial.setSize,
    large: trial.large,
    selected,
    targetIndex: trial.targetIndex,
    correct: selected === trial.targetIndex,
    reactionMs: timedOut ? null : state.tick - state.itemStartTick,
    timedOut,
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

function nextTrial(state: SearchState): SearchState {
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

export function applySearchAction(state: SearchState, action: MechanicAction): SearchState {
  if (state.completed) return state;
  if (action.type === "answer") {
    if (state.phase !== "question") return state;
    const option = Math.round(action.option);
    const trial = currentTrial(state);
    if (!trial || !Number.isInteger(option) || option < 0 || option >= trial.cells.length) {
      return state;
    }
    return recordResponse(state, option, false);
  }
  if (action.type !== "advance") return state;
  const ms = sanitizeMs(action.ms);
  if (ms === 0) return state;
  let next: SearchState = { ...state, tick: state.tick + ms };
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

function timesFor(responses: SearchResponse[], large: boolean): number[] {
  return responses
    .filter((response) => response.large === large)
    .map((response) => response.reactionMs)
    .filter((value): value is number => typeof value === "number");
}

function computeMetrics(state: SearchState): Record<string, number> {
  const seen = state.responses.length;
  const correct = state.responses.filter((response) => response.correct).length;
  const timedOut = state.responses.filter((response) => response.timedOut).length;
  const reactionTimes = state.responses
    .map((response) => response.reactionMs)
    .filter((value): value is number => typeof value === "number");
  const smallTimes = timesFor(state.responses, false);
  const largeTimes = timesFor(state.responses, true);
  const smallMean = mean(smallTimes);
  const largeMean = mean(largeTimes);
  return {
    trials_seen: seen,
    correct,
    incorrect: seen - correct - timedOut,
    timed_out: timedOut,
    accuracy: rate(correct, seen),
    mean_response_ms: reactionTimes.length === 0 ? 0 : round(mean(reactionTimes) ?? 0, 0),
    small_set_trials: smallTimes.length,
    large_set_trials: largeTimes.length,
    small_set_mean_ms: smallMean === null ? 0 : round(smallMean, 0),
    large_set_mean_ms: largeMean === null ? 0 : round(largeMean, 0),
    set_size_cost_ms:
      smallMean === null || largeMean === null ? 0 : round(largeMean - smallMean, 0),
    current_streak: currentStreak(state.responses.map((response) => response.correct), Boolean),
    max_streak: longestStreak(state.responses.map((response) => response.correct), Boolean),
  };
}

export function searchView(state: SearchState): MechanicView {
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
    mechanic: "search",
    name: "Visual Search",
    phase: state.phase,
    prompt:
      state.phase === "complete"
        ? "Block complete"
        : "Tap the red circle among the shapes.",
    stimulus: trial ? `set-${trial.setSize}` : null,
    options: state.phase === "question" || state.phase === "feedback" ? (trial?.cells ?? null) : null,
    explanation:
      state.phase === "feedback" && trial
        ? `The red circle was in position ${trial.targetIndex + 1}.`
        : null,
    progressCurrent: state.completed ? state.trials.length : Math.min(state.index + 1, state.trials.length),
    progressTotal: state.trials.length,
    feedback,
    feedbackTone: feedback ? (last?.correct ? "correct" : "incorrect") : null,
    canRespond: state.phase === "question",
    controls: [],
    metrics,
    complete: state.completed,
  };
}

export function searchResult(state: SearchState): MechanicResult {
  const metrics = computeMetrics(state);
  const accuracy = metrics.accuracy ?? 0;
  const correct = metrics.correct ?? 0;
  return {
    mechanic: "search",
    domain: "executive_function",
    trials: state.trials.length,
    durationMs: state.tick,
    metrics,
    summary: `Visual Search: ${Math.round(accuracy * 100)}% accuracy, ${correct}/${state.trials.length} correct, ${metrics.set_size_cost_ms ?? 0} ms set-size cost.`,
    seed: state.seed,
    stateHash: stableHash(state),
  };
}

export function searchComplete(state: SearchState): boolean {
  return state.completed;
}
