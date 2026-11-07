import { stableHash } from "../hash";
import { clamp, countLabel, currentStreak, longestStreak, mean, rate, round } from "../scoring";
import { normalizeSeed, sampleIndices } from "../rng";
import type {
  GoNoGoConfig,
  GoNoGoResponse,
  GoNoGoState,
  MechanicAction,
  MechanicResult,
  MechanicView,
} from "../types";

const MIN_TRIALS = 12;
const MAX_TRIALS = 80;

export function gonogoConfig(difficulty: number, trials = 30): GoNoGoConfig {
  const safeDifficulty = clamp(Math.round(difficulty), 1, 3);
  return {
    trials: Math.round(clamp(trials, MIN_TRIALS, MAX_TRIALS)),
    goRate: 0.76 - (safeDifficulty - 1) * 0.04,
    stimulusDurationMs: 900 - (safeDifficulty - 1) * 110,
    responseWindowMs: 700 - (safeDifficulty - 1) * 60,
    feedbackMs: 400 - (safeDifficulty - 1) * 50,
    interTrialMs: 420 - (safeDifficulty - 1) * 40,
  };
}

function generateTrials(
  config: GoNoGoConfig,
  seed: number,
): { trials: { go: boolean }[]; rng: number } {
  const goCount = Math.round(config.trials * config.goRate);
  const [goPositions, rng] = sampleIndices(config.trials, goCount, seed);
  const goSet = new Set(goPositions);
  return {
    trials: Array.from({ length: config.trials }, (_, index) => ({ go: goSet.has(index) })),
    rng,
  };
}

export function createGoNoGo(
  seed: number,
  config: GoNoGoConfig = gonogoConfig(1),
): GoNoGoState {
  const normalizedSeed = normalizeSeed(seed);
  const { trials, rng } = generateTrials(config, normalizedSeed);
  return {
    mechanic: "gonogo",
    seed: normalizedSeed,
    rng,
    tick: 0,
    config,
    trials,
    index: 0,
    phase: "stimulus",
    phaseElapsed: 0,
    phaseDuration: config.stimulusDurationMs,
    trialStartTick: 0,
    respondedThisTrial: false,
    responses: [],
    completed: false,
  };
}

function currentTrial(state: GoNoGoState): { go: boolean } | null {
  return state.trials[state.index] ?? null;
}

function recordResponse(state: GoNoGoState, responded: boolean): GoNoGoState {
  const trial = currentTrial(state);
  if (!trial) return state;
  const correct = trial.go === responded;
  let kind: GoNoGoResponse["kind"];
  if (trial.go) {
    kind = responded ? "hit" : "miss";
  } else {
    kind = responded ? "commission" : "correct_rejection";
  }
  const reactionMs = responded ? state.tick - state.trialStartTick : null;
  const response: GoNoGoResponse = {
    trial: state.index,
    go: trial.go,
    responded,
    correct,
    kind,
    reactionMs,
  };
  return {
    ...state,
    responses: [...state.responses, response],
    respondedThisTrial: true,
  };
}

function toFeedback(state: GoNoGoState): GoNoGoState {
  return {
    ...state,
    phase: "feedback",
    phaseElapsed: 0,
    phaseDuration: state.config.feedbackMs,
  };
}

function transition(state: GoNoGoState): GoNoGoState {
  if (state.phase === "stimulus") {
    return {
      ...state,
      phase: "response",
      phaseElapsed: 0,
      phaseDuration: state.config.responseWindowMs,
    };
  }
  if (state.phase === "response") {
    return toFeedback(recordResponse(state, false));
  }
  if (state.phase === "feedback") {
    if (state.index >= state.trials.length - 1) {
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
      phase: "stimulus",
      phaseElapsed: 0,
      phaseDuration: state.config.stimulusDurationMs,
      trialStartTick: state.tick,
      respondedThisTrial: false,
    };
  }
  return state;
}

function sanitizeMs(ms: number): number {
  if (!Number.isFinite(ms)) return 0;
  return clamp(Math.round(ms), 0, 10_000);
}

export function applyGoNoGoAction(
  state: GoNoGoState,
  action: MechanicAction,
): GoNoGoState {
  if (state.completed) return state;
  if (action.type === "respond") {
    if ((state.phase !== "stimulus" && state.phase !== "response") || state.respondedThisTrial) {
      return state;
    }
    const recorded = recordResponse(state, true);
    return toFeedback(recorded);
  }
  if (action.type !== "advance") return state;
  const ms = sanitizeMs(action.ms);
  if (ms === 0) return state;
  let next: GoNoGoState = { ...state, tick: state.tick + ms };
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

function computeMetrics(state: GoNoGoState, final: boolean): Record<string, number> {
  const seen = final ? state.trials : state.trials.slice(0, state.responses.length);
  const goTrials = seen.filter((trial) => trial.go).length;
  const noGoTrials = seen.length - goTrials;
  const hits = state.responses.filter((response) => response.kind === "hit").length;
  const misses = state.responses.filter((response) => response.kind === "miss").length;
  const commissions = state.responses.filter(
    (response) => response.kind === "commission",
  ).length;
  const correctRejections = state.responses.filter(
    (response) => response.kind === "correct_rejection",
  ).length;
  const goReactionTimes = state.responses
    .filter((response) => response.kind === "hit" && response.reactionMs !== null)
    .map((response) => response.reactionMs as number);
  const meanGoReaction = mean(goReactionTimes);
  const correct = state.responses.map((response) => response.correct);
  return {
    trials_seen: seen.length,
    go_trials: goTrials,
    no_go_trials: noGoTrials,
    hits,
    misses,
    commissions,
    correct_rejections: correctRejections,
    go_accuracy: rate(hits, goTrials),
    no_go_accuracy: rate(correctRejections, noGoTrials),
    accuracy: rate(hits + correctRejections, seen.length),
    mean_go_reaction_ms: meanGoReaction === null ? 0 : round(meanGoReaction, 0),
    current_streak: currentStreak(correct, Boolean),
    max_streak: longestStreak(correct, Boolean),
  };
}

export function gonogoView(state: GoNoGoState): MechanicView {
  const trial = currentTrial(state);
  const last = state.responses[state.responses.length - 1] ?? null;
  const metrics = computeMetrics(state, state.completed);
  const feedback =
    state.phase === "feedback" && last
      ? last.kind === "hit"
        ? "Hit"
        : last.kind === "commission"
          ? "Impulse error"
          : last.kind === "miss"
            ? "Missed go"
            : "Correct rejection"
      : null;
  const tone = feedback
    ? last?.correct
      ? ("correct" as const)
      : ("incorrect" as const)
    : null;
  return {
    mechanic: "gonogo",
    name: "Go / No-Go",
    phase: state.phase,
    prompt:
      state.phase === "complete"
        ? "Block complete"
        : state.phase === "iti"
          ? "Get ready."
          : "Circles: respond. Squares: withhold.",
    stimulus:
      (state.phase === "stimulus" || state.phase === "feedback") && trial
        ? trial.go
          ? "circle"
          : "square"
        : null,
    options: null,
    explanation: null,
    progressCurrent: state.completed
      ? state.trials.length
      : Math.min(state.index + 1, state.trials.length),
    progressTotal: state.trials.length,
    feedback,
    feedbackTone: tone,
    canRespond:
      (state.phase === "stimulus" || state.phase === "response") && !state.respondedThisTrial,
    controls: ["Space or Respond"],
    metrics,
    complete: state.completed,
  };
}

export function gonogoResult(state: GoNoGoState): MechanicResult {
  const metrics = computeMetrics(state, true);
  const accuracy = metrics.accuracy ?? 0;
  const commissions = metrics.commissions ?? 0;
  return {
    mechanic: "gonogo",
    domain: "inhibition",
    trials: state.trials.length,
    durationMs: state.tick,
    metrics,
    summary: `Go/No-Go: ${Math.round(accuracy * 100)}% accuracy, ${countLabel(commissions, "impulse error")}, ${metrics.mean_go_reaction_ms ?? 0} ms mean go reaction.`,
    seed: state.seed,
    stateHash: stableHash(state),
  };
}

export function gonogoComplete(state: GoNoGoState): boolean {
  return state.completed;
}
