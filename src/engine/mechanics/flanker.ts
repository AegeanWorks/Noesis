import { stableHash } from "../hash";
import { clamp, currentStreak, longestStreak, mean, rate, round } from "../scoring";
import { normalizeSeed, nextRandom, sampleIndices } from "../rng";
import type {
  FlankerConfig,
  FlankerDirection,
  FlankerResponse,
  FlankerState,
  FlankerTrial,
  MechanicAction,
  MechanicResult,
  MechanicView,
} from "../types";

const MIN_TRIALS = 10;
const MAX_TRIALS = 50;

export function flankerConfig(difficulty: number, trials = 20): FlankerConfig {
  const safeDifficulty = clamp(Math.round(difficulty), 1, 3);
  return {
    trials: Math.round(clamp(trials, MIN_TRIALS, MAX_TRIALS)),
    congruentRate: 0.72 - (safeDifficulty - 1) * 0.11,
    timeLimitMs: 2200 - (safeDifficulty - 1) * 200,
    feedbackMs: 500 - (safeDifficulty - 1) * 50,
  };
}

function arrow(direction: FlankerDirection): string {
  return direction === "left" ? "<" : ">";
}

function makeArrows(centre: FlankerDirection, congruent: boolean): string {
  const flanker = congruent
    ? centre
    : centre === "left"
      ? "right"
      : "left";
  return `${arrow(flanker)}${arrow(flanker)}${arrow(centre)}${arrow(flanker)}${arrow(flanker)}`;
}

function generateTrials(
  config: FlankerConfig,
  seed: number,
): { trials: FlankerTrial[]; rng: number } {
  const congruentCount = Math.round(config.trials * config.congruentRate);
  const [congruentPositions, afterPositions] = sampleIndices(
    config.trials,
    congruentCount,
    seed,
  );
  const congruentSet = new Set(congruentPositions);
  let rng = afterPositions;
  const trials: FlankerTrial[] = [];
  for (let index = 0; index < config.trials; index += 1) {
    const [value, next] = nextRandom(rng);
    rng = next;
    const centre: FlankerDirection = value < 0.5 ? "left" : "right";
    const congruent = congruentSet.has(index);
    trials.push({ centre, congruent, arrows: makeArrows(centre, congruent) });
  }
  return { trials, rng };
}

export function createFlanker(
  seed: number,
  config: FlankerConfig = flankerConfig(2),
): FlankerState {
  const normalizedSeed = normalizeSeed(seed);
  const { trials, rng } = generateTrials(config, normalizedSeed);
  return {
    mechanic: "flanker",
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

function currentTrial(state: FlankerState): FlankerTrial | null {
  return state.trials[state.index] ?? null;
}

export function flankerCorrectIndex(trial: FlankerTrial): number {
  return trial.centre === "left" ? 0 : 1;
}

function recordResponse(
  state: FlankerState,
  selected: number | null,
  timedOut: boolean,
): FlankerState {
  const trial = currentTrial(state);
  if (!trial) return state;
  const correct = selected === flankerCorrectIndex(trial);
  const response: FlankerResponse = {
    trial: state.index,
    centre: trial.centre,
    congruent: trial.congruent,
    selected,
    correct,
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

function nextTrial(state: FlankerState): FlankerState {
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

export function applyFlankerAction(
  state: FlankerState,
  action: MechanicAction,
): FlankerState {
  if (state.completed) return state;
  if (action.type === "answer") {
    if (state.phase !== "question") return state;
    const option = Math.round(action.option);
    if (!Number.isInteger(option) || option < 0 || option > 1) return state;
    return recordResponse(state, option, false);
  }
  if (action.type !== "advance") return state;
  const ms = sanitizeMs(action.ms);
  if (ms === 0) return state;
  let next: FlankerState = { ...state, tick: state.tick + ms };
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

function computeMetrics(state: FlankerState): Record<string, number> {
  const seen = state.responses.length;
  const correct = state.responses.filter((response) => response.correct).length;
  const timedOut = state.responses.filter((response) => response.timedOut).length;
  const congruent = state.responses.filter((response) => response.congruent);
  const incongruent = state.responses.filter((response) => !response.congruent);
  const congruentCorrect = congruent.filter((response) => response.correct).length;
  const incongruentCorrect = incongruent.filter((response) => response.correct).length;
  const responseTimes = state.responses
    .map((response) => response.reactionMs)
    .filter((value): value is number => typeof value === "number");
  const congruentTimes = congruent
    .map((response) => response.reactionMs)
    .filter((value): value is number => typeof value === "number");
  const incongruentTimes = incongruent
    .map((response) => response.reactionMs)
    .filter((value): value is number => typeof value === "number");
  const congruentMean = mean(congruentTimes);
  const incongruentMean = mean(incongruentTimes);
  const correctness = state.responses.map((response) => response.correct);
  return {
    trials_seen: seen,
    correct,
    incorrect: seen - correct - timedOut,
    timed_out: timedOut,
    congruent_trials: congruent.length,
    incongruent_trials: incongruent.length,
    congruent_correct: congruentCorrect,
    incongruent_correct: incongruentCorrect,
    congruent_accuracy: rate(congruentCorrect, congruent.length),
    incongruent_accuracy: rate(incongruentCorrect, incongruent.length),
    accuracy: rate(correct, seen),
    mean_response_ms: responseTimes.length === 0 ? 0 : round(mean(responseTimes) ?? 0, 0),
    congruent_mean_response_ms:
      congruentMean === null ? 0 : round(congruentMean, 0),
    incongruent_mean_response_ms:
      incongruentMean === null ? 0 : round(incongruentMean, 0),
    interference_cost_ms:
      congruentMean === null || incongruentMean === null
        ? 0
        : round(incongruentMean - congruentMean, 0),
    current_streak: currentStreak(correctness, Boolean),
    max_streak: longestStreak(correctness, Boolean),
  };
}

export function flankerView(state: FlankerState): MechanicView {
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
  const tone = feedback
    ? last?.correct
      ? ("correct" as const)
      : ("incorrect" as const)
    : null;
  return {
    mechanic: "flanker",
    name: "Flanker",
    phase: state.phase,
    prompt:
      state.phase === "complete"
        ? "Block complete"
        : "Choose the direction of the centre arrow.",
    stimulus: state.phase === "question" || state.phase === "feedback" ? trial?.arrows ?? null : null,
    options: state.phase === "question" ? ["Left", "Right"] : null,
    explanation:
      state.phase === "feedback" && trial
        ? `Centre arrow pointed ${trial.centre}.`
        : null,
    progressCurrent: state.completed
      ? state.trials.length
      : Math.min(state.index + 1, state.trials.length),
    progressTotal: state.trials.length,
    feedback,
    feedbackTone: tone,
    canRespond: state.phase === "question",
    controls: ["1", "2"],
    metrics,
    complete: state.completed,
  };
}

export function flankerResult(state: FlankerState): MechanicResult {
  const metrics = computeMetrics(state);
  const accuracy = metrics.accuracy ?? 0;
  const correct = metrics.correct ?? 0;
  return {
    mechanic: "flanker",
    domain: "executive_function",
    trials: state.trials.length,
    durationMs: state.tick,
    metrics,
    summary: `Flanker: ${Math.round(accuracy * 100)}% accuracy, ${correct}/${state.trials.length} correct, ${metrics.interference_cost_ms ?? 0} ms interference cost.`,
    seed: state.seed,
    stateHash: stableHash(state),
  };
}

export function flankerComplete(state: FlankerState): boolean {
  return state.completed;
}
