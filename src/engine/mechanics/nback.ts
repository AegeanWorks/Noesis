import { stableHash } from "../hash";
import { clamp, currentStreak, dPrime, longestStreak, mean, rate, round } from "../scoring";
import { normalizeSeed, randomInt, sampleIndices } from "../rng";
import type {
  MechanicAction,
  MechanicResult,
  MechanicView,
  NBackConfig,
  NBackResponse,
  NBackState,
  NBackTrial,
} from "../types";

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;
const MIN_TRIALS = 10;
const MAX_TRIALS = 60;

export function nbackConfig(difficulty: number, trials = 20): NBackConfig {
  const safeDifficulty = clamp(Math.round(difficulty), 1, 3);
  const n = safeDifficulty;
  return {
    n,
    trials: Math.round(clamp(trials, MIN_TRIALS, MAX_TRIALS)),
    trialDurationMs: 2200 + (safeDifficulty - 1) * 200,
    feedbackMs: 450,
    interTrialMs: 500,
    targetRate: 0.3,
  };
}

function generateTrials(
  config: NBackConfig,
  seed: number,
): { trials: NBackTrial[]; rng: number } {
  const targetCount = Math.round(config.trials * config.targetRate);
  const eligiblePositions = Array.from(
    { length: Math.max(0, config.trials - config.n) },
    (_, index) => index + config.n,
  );
  const [targetPositions, afterTargets] = sampleIndices(
    eligiblePositions.length,
    targetCount,
    seed,
  );
  const targetSet = new Set(targetPositions.map((position) => eligiblePositions[position] ?? 0));
  const trials: NBackTrial[] = [];
  let rng = afterTargets;
  for (let index = 0; index < config.trials; index += 1) {
    const previous = index >= config.n ? trials[index - config.n] : undefined;
    if (previous && targetSet.has(index)) {
      trials.push({ letter: previous.letter, target: true });
      continue;
    }
    let letterIndex: number;
    if (previous) {
      [letterIndex, rng] = randomInt(rng, LETTERS.length - 1);
      const forbidden = LETTERS.indexOf(previous.letter as (typeof LETTERS)[number]);
      if (forbidden >= 0 && letterIndex >= forbidden) {
        letterIndex += 1;
      }
    } else {
      [letterIndex, rng] = randomInt(rng, LETTERS.length);
    }
    trials.push({
      letter: LETTERS[letterIndex] ?? "A",
      target: false,
    });
  }
  return { trials, rng };
}

export function createNBack(seed: number, config: NBackConfig = nbackConfig(2)): NBackState {
  const normalizedSeed = normalizeSeed(seed);
  const { trials, rng } = generateTrials(config, normalizedSeed);
  return {
    mechanic: "nback",
    seed: normalizedSeed,
    rng,
    tick: 0,
    config,
    trials,
    index: 0,
    phase: "trial",
    phaseElapsed: 0,
    phaseDuration: config.trialDurationMs,
    respondedThisTrial: false,
    responses: [],
    completed: false,
  };
}

function currentTrial(state: NBackState): NBackTrial | null {
  return state.trials[state.index] ?? null;
}

export function nearMissLag(
  trials: readonly NBackTrial[],
  index: number,
  n: number,
): number | null {
  const current = trials[index];
  if (!current) return null;
  for (const lag of [n - 1, n + 1]) {
    if (lag <= 0) continue;
    const previous = trials[index - lag];
    if (previous && previous.letter === current.letter) return lag;
  }
  return null;
}

function recordResponse(state: NBackState, responded: boolean): NBackState {
  const trial = currentTrial(state);
  if (!trial) return state;
  const correct = trial.target === responded;
  let kind: NBackResponse["kind"];
  if (trial.target) {
    kind = responded ? "hit" : "miss";
  } else {
    kind = responded ? "false_alarm" : "correct_rejection";
  }
  const lag = !correct && kind === "false_alarm"
    ? nearMissLag(state.trials, state.index, state.config.n)
    : null;
  const response: NBackResponse = {
    trial: state.index,
    responded,
    correct,
    kind,
    reactionMs: responded ? state.phaseElapsed : null,
    nearMiss: lag !== null,
    nearMissLag: lag,
  };
  return {
    ...state,
    responses: [...state.responses, response],
    respondedThisTrial: true,
  };
}

function toFeedback(state: NBackState): NBackState {
  return {
    ...state,
    phase: "feedback",
    phaseElapsed: 0,
    phaseDuration: state.config.feedbackMs,
  };
}

function transition(state: NBackState): NBackState {
  if (state.phase === "trial") {
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
    return {
      ...state,
      index: state.index + 1,
      phase: "trial",
      phaseElapsed: 0,
      phaseDuration: state.config.trialDurationMs,
      respondedThisTrial: false,
    };
  }
  return state;
}

function sanitizeMs(ms: number): number {
  if (!Number.isFinite(ms)) return 0;
  return clamp(Math.round(ms), 0, 10_000);
}

export function applyNBackAction(
  state: NBackState,
  action: MechanicAction,
): NBackState {
  if (state.completed) return state;
  if (action.type === "respond") {
    if (state.phase !== "trial" || state.respondedThisTrial) return state;
    const recorded = recordResponse(state, true);
    return toFeedback(recorded);
  }
  if (action.type !== "advance") return state;
  const ms = sanitizeMs(action.ms);
  if (ms === 0) return state;
  let next: NBackState = { ...state, tick: state.tick + ms };
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

function computeMetrics(
  state: NBackState,
  final: boolean,
): { metrics: Record<string, number>; targets: number; hits: number; falseAlarms: number } {
  const seen = final ? state.trials : state.trials.slice(0, state.responses.length);
  const targets = seen.filter((trial) => trial.target).length;
  const nonTargets = seen.length - targets;
  const hits = state.responses.filter((response) => response.kind === "hit").length;
  const misses = state.responses.filter((response) => response.kind === "miss").length;
  const falseAlarms = state.responses.filter((response) => response.kind === "false_alarm").length;
  const correctRejections = state.responses.filter(
    (response) => response.kind === "correct_rejection",
  ).length;
  const nearMisses = state.responses.filter(
    (response) => typeof response.nearMissLag === "number",
  ).length;
  const accuracy = rate(hits + correctRejections, seen.length);
  const reactionTimes = state.responses
    .filter((response) => response.kind === "hit" && response.reactionMs !== null)
    .map((response) => response.reactionMs as number);
  const meanReaction = mean(reactionTimes);
  const correct = state.responses.map((response) => response.correct);
  return {
    targets,
    hits,
    falseAlarms,
    metrics: {
      trials_seen: seen.length,
      targets,
      hits,
      misses,
      false_alarms: falseAlarms,
      correct_rejections: correctRejections,
      near_misses: nearMisses,
      accuracy,
      d_prime: dPrime(hits, targets, falseAlarms, nonTargets),
      mean_hit_reaction_ms: meanReaction === null ? 0 : round(meanReaction, 0),
      current_streak: currentStreak(correct, Boolean),
      max_streak: longestStreak(correct, Boolean),
    },
  };
}

export function nbackView(state: NBackState): MechanicView {
  const trial = currentTrial(state);
  const last = state.responses[state.responses.length - 1] ?? null;
  const { metrics } = computeMetrics(state, state.completed);
  const feedback =
    state.phase === "feedback" && last
      ? last.kind === "hit"
        ? "Hit"
        : last.kind === "false_alarm"
          ? typeof last.nearMissLag === "number"
            ? `Almost: that letter matched ${last.nearMissLag} back, not ${state.config.n} back.`
            : "False alarm"
          : last.kind === "miss"
            ? "Missed target"
            : "Correct rejection"
      : null;
  const tone = feedback
    ? last?.correct
      ? ("correct" as const)
      : ("incorrect" as const)
    : null;
  return {
    mechanic: "nback",
    name: `${state.config.n}-back`,
    phase: state.phase,
    prompt:
      state.phase === "complete"
        ? "Block complete"
        : `Match when the letter is the same as ${state.config.n} back.`,
    stimulus: state.phase === "trial" && trial ? trial.letter : null,
    options: null,
    explanation: null,
    progressCurrent: state.completed ? state.trials.length : Math.min(state.index + 1, state.trials.length),
    progressTotal: state.trials.length,
    feedback,
    feedbackTone: tone,
    canRespond: state.phase === "trial" && !state.respondedThisTrial,
    controls: ["Space or Match"],
    metrics,
    complete: state.completed,
  };
}

export function nbackResult(state: NBackState): MechanicResult {
  const { metrics, targets, hits, falseAlarms } = computeMetrics(state, true);
  const accuracy = metrics.accuracy ?? 0;
  return {
    mechanic: "nback",
    domain: "working_memory",
    trials: state.trials.length,
    durationMs: state.tick,
    metrics,
    summary: `${state.config.n}-back: ${Math.round(accuracy * 100)}% accuracy, ${hits}/${targets} targets, ${falseAlarms} false alarms.`,
    seed: state.seed,
    stateHash: stableHash(state),
  };
}

export function nbackComplete(state: NBackState): boolean {
  return state.completed;
}
