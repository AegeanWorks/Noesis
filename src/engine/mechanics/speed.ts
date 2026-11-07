import { stableHash } from "../hash";
import {
  clamp,
  countLabel,
  currentStreak,
  longestStreak,
  mean,
  median,
  rate,
  round,
  standardDeviation,
} from "../scoring";
import { normalizeSeed, randomInt } from "../rng";
import type {
  MechanicAction,
  MechanicResult,
  MechanicView,
  SpeedConfig,
  SpeedResponse,
  SpeedState,
} from "../types";

const MIN_TRIALS = 10;
const MAX_TRIALS = 40;

export function speedConfig(difficulty: number, trials = 20): SpeedConfig {
  const safeDifficulty = clamp(Math.round(difficulty), 1, 3);
  return {
    trials: Math.round(clamp(trials, MIN_TRIALS, MAX_TRIALS)),
    foreperiodMinMs: 900 - (safeDifficulty - 1) * 100,
    foreperiodMaxMs: 2000 - (safeDifficulty - 1) * 200,
    responseWindowMs: 1500 - (safeDifficulty - 1) * 200,
    feedbackMs: 350,
    interTrialMs: 400,
  };
}

function generateForeperiods(config: SpeedConfig, seed: number): { values: number[]; rng: number } {
  const values: number[] = [];
  let rng = seed;
  const span = Math.max(1, config.foreperiodMaxMs - config.foreperiodMinMs);
  for (let index = 0; index < config.trials; index += 1) {
    const [offset, next] = randomInt(rng, span + 1);
    rng = next;
    values.push(config.foreperiodMinMs + offset);
  }
  return { values, rng };
}

export function createSpeed(seed: number, config: SpeedConfig = speedConfig(1)): SpeedState {
  const normalizedSeed = normalizeSeed(seed);
  const { values, rng } = generateForeperiods(config, normalizedSeed);
  return {
    mechanic: "speed",
    seed: normalizedSeed,
    rng,
    tick: 0,
    config,
    foreperiods: values,
    index: 0,
    phase: "wait",
    phaseElapsed: 0,
    phaseDuration: values[0] ?? config.foreperiodMinMs,
    stimulusStartTick: 0,
    respondedThisTrial: false,
    responses: [],
    completed: false,
  };
}

function recordResponse(state: SpeedState, responded: boolean): SpeedState {
  const reactionMs = responded ? Math.max(0, state.tick - state.stimulusStartTick) : null;
  const response: SpeedResponse = {
    trial: state.index,
    responded,
    correct: responded,
    reactionMs,
  };
  return {
    ...state,
    responses: [...state.responses, response],
    respondedThisTrial: true,
  };
}

function toFeedback(state: SpeedState): SpeedState {
  return {
    ...state,
    phase: "feedback",
    phaseElapsed: 0,
    phaseDuration: state.config.feedbackMs,
  };
}

function transition(state: SpeedState): SpeedState {
  if (state.phase === "wait") {
    return {
      ...state,
      phase: "stimulus",
      phaseElapsed: 0,
      phaseDuration: state.config.responseWindowMs,
      stimulusStartTick: state.tick,
    };
  }
  if (state.phase === "stimulus") {
    return toFeedback(recordResponse(state, false));
  }
  if (state.phase === "feedback") {
    if (state.index >= state.foreperiods.length - 1) {
      return { ...state, phase: "complete", phaseElapsed: 0, phaseDuration: 0, completed: true };
    }
    return {
      ...state,
      phase: "iti",
      phaseElapsed: 0,
      phaseDuration: state.config.interTrialMs,
    };
  }
  if (state.phase === "iti") {
    const nextIndex = state.index + 1;
    return {
      ...state,
      index: nextIndex,
      phase: "wait",
      phaseElapsed: 0,
      phaseDuration: state.foreperiods[nextIndex] ?? state.config.foreperiodMinMs,
      respondedThisTrial: false,
    };
  }
  return state;
}

function sanitizeMs(ms: number): number {
  if (!Number.isFinite(ms)) return 0;
  return clamp(Math.round(ms), 0, 10_000);
}

export function applySpeedAction(state: SpeedState, action: MechanicAction): SpeedState {
  if (state.completed) return state;
  if (action.type === "respond") {
    if (state.phase !== "stimulus" || state.respondedThisTrial) return state;
    return toFeedback(recordResponse(state, true));
  }
  if (action.type !== "advance") return state;
  const ms = sanitizeMs(action.ms);
  if (ms === 0) return state;
  let next: SpeedState = { ...state, tick: state.tick + ms };
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
    next = transition(next);
  }
  return next;
}

function computeMetrics(state: SpeedState, final: boolean): Record<string, number> {
  const seen = final ? state.foreperiods.length : state.responses.length;
  const hits = state.responses.filter((response) => response.correct).length;
  const misses = state.responses.length - hits;
  const reactionTimes = state.responses
    .filter((response) => response.correct && response.reactionMs !== null)
    .map((response) => response.reactionMs as number);
  const correctness = state.responses.map((response) => response.correct);
  const meanReaction = mean(reactionTimes);
  const medianReaction = median(reactionTimes);
  const fastest = reactionTimes.length > 0 ? Math.min(...reactionTimes) : null;
  const lapses = reactionTimes.filter((reaction) => reaction > 500).length;
  return {
    trials_seen: seen,
    hits,
    misses,
    lapses,
    accuracy: rate(hits, seen),
    mean_reaction_ms: meanReaction === null ? 0 : round(meanReaction, 0),
    median_reaction_ms: medianReaction === null ? 0 : round(medianReaction, 0),
    fastest_reaction_ms: fastest === null ? 0 : round(fastest, 0),
    reaction_sd_ms: round(standardDeviation(reactionTimes), 0),
    current_streak: currentStreak(correctness, Boolean),
    max_streak: longestStreak(correctness, Boolean),
  };
}

export function speedView(state: SpeedState): MechanicView {
  const last = state.responses[state.responses.length - 1] ?? null;
  const metrics = computeMetrics(state, state.completed);
  const feedback =
    state.phase === "feedback" && last
      ? last.correct
        ? `${last.reactionMs ?? 0} ms`
        : "Missed"
      : null;
  const tone = feedback
    ? last?.correct
      ? ("correct" as const)
      : ("incorrect" as const)
    : null;
  return {
    mechanic: "speed",
    name: "Speed Tap",
    phase: state.phase,
    prompt:
      state.phase === "complete"
        ? "Block complete"
        : state.phase === "stimulus"
          ? "Tap now."
          : state.phase === "wait"
            ? "Wait for the circle."
            : state.phase === "feedback"
              ? "Keep your eyes on the centre."
              : "Get ready.",
    stimulus: state.phase === "stimulus" || state.phase === "feedback" ? "circle" : null,
    options: null,
    explanation: null,
    progressCurrent: state.completed
      ? state.foreperiods.length
      : Math.min(state.index + 1, state.foreperiods.length),
    progressTotal: state.foreperiods.length,
    feedback,
    feedbackTone: tone,
    canRespond: state.phase === "stimulus" && !state.respondedThisTrial,
    controls: ["Space or Tap"],
    metrics,
    complete: state.completed,
  };
}

export function speedResult(state: SpeedState): MechanicResult {
  const metrics = computeMetrics(state, true);
  return {
    mechanic: "speed",
    domain: "processing_speed",
    trials: state.foreperiods.length,
    durationMs: state.tick,
    metrics,
    summary: `Speed Tap: ${metrics.hits}/${state.foreperiods.length} responses, ${metrics.median_reaction_ms ?? 0} ms median reaction, ${countLabel(metrics.lapses ?? 0, "lapse")}.`,
    seed: state.seed,
    stateHash: stableHash(state),
  };
}

export function speedComplete(state: SpeedState): boolean {
  return state.completed;
}
