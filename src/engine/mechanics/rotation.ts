import { stableHash } from "../hash";
import { nextRandom, normalizeSeed, sampleIndices } from "../rng";
import {
  clamp,
  currentStreak,
  longestStreak,
  mean,
  rate,
  round,
} from "../scoring";
import type {
  MechanicAction,
  MechanicResult,
  MechanicView,
  RotationConfig,
  RotationResponse,
  RotationState,
  RotationTrial,
} from "../types";

const SHAPES = 2;
const ROTATIONS = [0, 90, 180, 270] as const;
const TIME_LIMITS = [6_000, 5_000, 4_000] as const;

export function rotationConfig(
  difficulty: number,
  trials = 12,
): RotationConfig {
  const safeDifficulty = clamp(Math.round(difficulty), 1, 3);
  return {
    trials: Math.round(clamp(trials, 4, 40)),
    mirrorRate: 0.5,
    timeLimitMs: TIME_LIMITS[safeDifficulty - 1] ?? 5_000,
    feedbackMs: 650,
  };
}

function generateTrials(
  config: RotationConfig,
  seed: number,
): { trials: RotationTrial[]; rng: number } {
  const mirrorCount = Math.round(config.trials * config.mirrorRate);
  const [mirrorPositions, afterMirror] = sampleIndices(
    config.trials,
    mirrorCount,
    seed,
  );
  const mirrorSet = new Set(mirrorPositions);
  let rng = afterMirror;
  const trials: RotationTrial[] = [];
  for (let index = 0; index < config.trials; index += 1) {
    const [shapeValue, nextShape] = nextRandom(rng);
    rng = nextShape;
    const [rotationValue, nextRotation] = nextRandom(rng);
    rng = nextRotation;
    trials.push({
      shape: Math.floor(shapeValue * SHAPES),
      rotation: ROTATIONS[Math.floor(rotationValue * ROTATIONS.length)] ?? 0,
      mirrored: mirrorSet.has(index),
    });
  }
  return { trials, rng };
}

export function createRotation(
  seed: number,
  config: RotationConfig = rotationConfig(2),
): RotationState {
  const normalizedSeed = normalizeSeed(seed);
  const { trials, rng } = generateTrials(config, normalizedSeed);
  return {
    mechanic: "rotation",
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

function currentTrial(state: RotationState): RotationTrial | null {
  return state.trials[state.index] ?? null;
}

export function rotationCorrectIndex(trial: RotationTrial): number {
  return trial.mirrored ? 1 : 0;
}

function recordResponse(
  state: RotationState,
  selected: number | null,
  timedOut: boolean,
): RotationState {
  const trial = currentTrial(state);
  if (!trial) return state;
  const correct = selected === rotationCorrectIndex(trial);
  const response: RotationResponse = {
    trial: state.index,
    shape: trial.shape,
    rotation: trial.rotation,
    mirrored: trial.mirrored,
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

function nextTrial(state: RotationState): RotationState {
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

export function applyRotationAction(
  state: RotationState,
  action: MechanicAction,
): RotationState {
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
  let next: RotationState = { ...state, tick: state.tick + ms };
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

function computeMetrics(state: RotationState): Record<string, number> {
  const seen = state.responses.length;
  const correct = state.responses.filter((response) => response.correct).length;
  const timedOut = state.responses.filter((response) => response.timedOut).length;
  const same = state.responses.filter((response) => !response.mirrored);
  const mirrored = state.responses.filter((response) => response.mirrored);
  const sameCorrect = same.filter((response) => response.correct).length;
  const mirrorCorrect = mirrored.filter((response) => response.correct).length;
  const responseTimes = state.responses
    .map((response) => response.reactionMs)
    .filter((value): value is number => typeof value === "number");
  const correctness = state.responses.map((response) => response.correct);
  return {
    trials_seen: seen,
    correct,
    incorrect: seen - correct - timedOut,
    timed_out: timedOut,
    same_trials: same.length,
    mirror_trials: mirrored.length,
    same_accuracy: rate(sameCorrect, same.length),
    mirror_accuracy: rate(mirrorCorrect, mirrored.length),
    accuracy: rate(correct, seen),
    mean_response_ms:
      responseTimes.length === 0 ? 0 : round(mean(responseTimes) ?? 0, 0),
    current_streak: currentStreak(correctness, Boolean),
    max_streak: longestStreak(correctness, Boolean),
  };
}

export function rotationView(state: RotationState): MechanicView {
  const trial = currentTrial(state);
  const last = state.responses[state.responses.length - 1] ?? null;
  const feedback =
    state.phase === "feedback" && last
      ? last.timedOut
        ? "Too slow"
        : last.correct
          ? "Correct"
          : "Incorrect"
      : null;
  const tone = feedback ? (last?.correct ? ("correct" as const) : ("incorrect" as const)) : null;
  return {
    mechanic: "rotation",
    name: "Mental Rotation",
    phase: state.phase,
    prompt:
      state.phase === "complete"
        ? "Block complete"
        : "Is the right figure a rotation of the left, or a mirror image?",
    stimulus: trial
      ? `${trial.shape}-${trial.rotation}-${trial.mirrored ? "1" : "0"}`
      : null,
    options: state.phase === "question" ? ["Same", "Mirrored"] : null,
    explanation:
      state.phase === "feedback" && trial
        ? trial.mirrored
          ? "The right figure was a mirror image."
          : "The right figure was a rotation."
        : null,
    progressCurrent: state.completed
      ? state.trials.length
      : Math.min(state.index + 1, state.trials.length),
    progressTotal: state.trials.length,
    feedback,
    feedbackTone: tone,
    canRespond: state.phase === "question",
    controls: ["1", "2"],
    metrics: computeMetrics(state),
    complete: state.completed,
  };
}

export function rotationResult(state: RotationState): MechanicResult {
  const metrics = computeMetrics(state);
  const accuracy = metrics.accuracy ?? 0;
  const correct = metrics.correct ?? 0;
  return {
    mechanic: "rotation",
    domain: "reasoning",
    trials: state.trials.length,
    durationMs: state.tick,
    metrics,
    summary: `Mental Rotation: ${Math.round(accuracy * 100)}% accuracy, ${correct}/${state.trials.length} correct, ${metrics.mean_response_ms ?? 0} ms mean response.`,
    seed: state.seed,
    stateHash: stableHash(state),
  };
}

export function rotationComplete(state: RotationState): boolean {
  return state.completed;
}
