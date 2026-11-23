import { stableHash } from "../hash";
import { normalizeSeed, randomInt } from "../rng";
import {
  clamp,
  currentStreak,
  longestStreak,
  mean,
  rate,
  round,
} from "../scoring";
import type {
  DigitConfig,
  DigitResponse,
  DigitState,
  DigitTrial,
  MechanicAction,
  MechanicResult,
  MechanicView,
} from "../types";

const START_SPANS = [3, 4, 5] as const;
const MIN_SPAN = 2;
const MAX_SPAN = 8;
const DIGITS = 10;

export function digitConfig(difficulty: number, trials = 8): DigitConfig {
  const safeDifficulty = clamp(Math.round(difficulty), 1, 3);
  return {
    trials: Math.round(clamp(trials, 4, 30)),
    startSpan: START_SPANS[safeDifficulty - 1] ?? 4,
    showMs: 850 - (safeDifficulty - 1) * 100,
    gapMs: 350,
    feedbackMs: 900,
    recallLimitMs: 25_000,
  };
}

function makeTrial(
  span: number,
  direction: "forward" | "backward",
  rng: number,
): [DigitTrial, number] {
  const sequence: number[] = [];
  let cursor = rng;
  for (let index = 0; index < span; index += 1) {
    const [digit, next] = randomInt(cursor, DIGITS);
    sequence.push(digit);
    cursor = next;
  }
  return [{ sequence, span, direction }, cursor];
}

export function createDigit(
  seed: number,
  config: DigitConfig = digitConfig(2),
): DigitState {
  const normalizedSeed = normalizeSeed(seed);
  const [trial, rng] = makeTrial(config.startSpan, "forward", normalizedSeed);
  return {
    mechanic: "digit",
    seed: normalizedSeed,
    rng,
    tick: 0,
    config,
    trials: [trial],
    index: 0,
    span: trial.span,
    phase: "show",
    phaseElapsed: 0,
    phaseDuration: config.showMs,
    showIndex: 0,
    selected: [],
    responses: [],
    completed: false,
  };
}

function currentTrial(state: DigitState): DigitTrial | null {
  return state.trials[state.index] ?? null;
}

function expectedSequence(trial: DigitTrial): number[] {
  return trial.direction === "backward"
    ? [...trial.sequence].reverse()
    : [...trial.sequence];
}

function recordResponse(
  state: DigitState,
  selected: number[],
  correct: boolean,
  timedOut: boolean,
): DigitState {
  const trial = currentTrial(state);
  if (!trial) return state;
  const response: DigitResponse = {
    trial: state.index,
    span: trial.span,
    direction: trial.direction,
    selected,
    correct,
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

function nextTrial(state: DigitState): DigitState {
  const last = state.responses[state.responses.length - 1];
  const span = clamp(state.span + (last?.correct ? 1 : -1), MIN_SPAN, MAX_SPAN);
  if (state.index >= state.config.trials - 1) {
    return {
      ...state,
      phase: "complete",
      phaseElapsed: 0,
      phaseDuration: 0,
      completed: true,
    };
  }
  const direction = state.index % 2 === 0 ? "backward" : "forward";
  const [trial, rng] = makeTrial(span, direction, state.rng);
  return {
    ...state,
    rng,
    index: state.index + 1,
    span,
    trials: [...state.trials, trial],
    phase: "show",
    phaseElapsed: 0,
    phaseDuration: state.config.showMs,
    showIndex: 0,
    selected: [],
  };
}

function sanitizeMs(ms: number): number {
  if (!Number.isFinite(ms)) return 0;
  return clamp(Math.round(ms), 0, 10_000);
}

export function applyDigitAction(
  state: DigitState,
  action: MechanicAction,
): DigitState {
  if (state.completed) return state;
  if (action.type === "answer") {
    if (state.phase !== "recall") return state;
    const trial = currentTrial(state);
    if (!trial) return state;
    const option = Math.round(action.option);
    if (!Number.isInteger(option) || option < 0 || option >= DIGITS) return state;
    const selected = [...state.selected, option];
    const position = state.selected.length;
    if (option !== expectedSequence(trial)[position]) {
      return recordResponse(state, selected, false, false);
    }
    if (selected.length === trial.sequence.length) {
      return recordResponse(state, selected, true, false);
    }
    return { ...state, selected };
  }
  if (action.type !== "advance") return state;
  const ms = sanitizeMs(action.ms);
  if (ms === 0) return state;
  let next: DigitState = { ...state, tick: state.tick + ms };
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
    if (next.phase === "show") {
      if (next.showIndex + 1 < next.span) {
        next = {
          ...next,
          showIndex: next.showIndex + 1,
          phaseElapsed: 0,
          phaseDuration: next.config.showMs,
        };
      } else {
        next = {
          ...next,
          phase: "gap",
          phaseElapsed: 0,
          phaseDuration: next.config.gapMs,
        };
      }
    } else if (next.phase === "gap") {
      next = {
        ...next,
        phase: "recall",
        phaseElapsed: 0,
        phaseDuration: next.config.recallLimitMs,
      };
    } else if (next.phase === "recall") {
      next = recordResponse(next, next.selected, false, true);
    } else if (next.phase === "feedback") {
      next = nextTrial(next);
    } else {
      break;
    }
  }
  return next;
}

function computeMetrics(state: DigitState): Record<string, number> {
  const seen = state.responses.length;
  const correct = state.responses.filter((response) => response.correct).length;
  const timedOut = state.responses.filter((response) => response.timedOut).length;
  const spans = state.responses.map((response) => response.span);
  const correctSpans = state.responses
    .filter((response) => response.correct)
    .map((response) => response.span);
  const correctness = state.responses.map((response) => response.correct);
  const forward = state.responses.filter((response) => response.direction === "forward");
  const backward = state.responses.filter((response) => response.direction === "backward");
  return {
    trials_seen: seen,
    correct,
    incorrect: seen - correct - timedOut,
    timed_out: timedOut,
    accuracy: rate(correct, seen),
    forward_accuracy: rate(forward.filter((response) => response.correct).length, forward.length),
    backward_accuracy: rate(backward.filter((response) => response.correct).length, backward.length),
    mean_span: spans.length === 0 ? 0 : round(mean(spans) ?? 0, 1),
    max_span: correctSpans.length === 0 ? 0 : Math.max(...correctSpans),
    current_streak: currentStreak(correctness, Boolean),
    max_streak: longestStreak(correctness, Boolean),
  };
}

export function digitView(state: DigitState): MechanicView {
  const trial = currentTrial(state);
  const last = state.responses[state.responses.length - 1] ?? null;
  const activeDigit =
    trial && state.phase === "show" ? trial.sequence[state.showIndex] : null;
  const feedback =
    state.phase === "feedback" && last
      ? last.timedOut
        ? "Too slow"
        : last.correct
          ? "Correct"
          : "Incorrect"
      : null;
  const tone = feedback ? (last?.correct ? ("correct" as const) : ("incorrect" as const)) : null;
  const options: string[] | null =
    state.phase === "recall" || state.phase === "feedback"
      ? Array.from({ length: DIGITS }, (_, index) => String(index))
      : null;
  return {
    mechanic: "digit",
    name: "Digit Span",
    phase: state.phase,
    prompt:
      state.phase === "complete"
        ? "Block complete"
        : state.phase === "show"
          ? `Remember the digit · ${state.showIndex + 1} of ${state.span}`
          : state.phase === "gap"
            ? trial?.direction === "backward"
              ? "Get ready to repeat the digits backwards"
              : "Get ready to repeat the digits"
            : state.phase === "recall"
              ? `Tap the digits ${trial?.direction === "backward" ? "backwards" : "in order"} (${state.selected.length}/${state.span})`
              : "Sequence feedback",
    stimulus: activeDigit === null || activeDigit === undefined ? null : String(activeDigit),
    options,
    explanation:
      state.phase === "feedback" && trial
        ? expectedSequence(trial).join(" → ")
        : null,
    progressCurrent: state.completed
      ? state.trials.length
      : Math.min(state.index + 1, state.trials.length),
    progressTotal: state.config.trials,
    feedback,
    feedbackTone: tone,
    canRespond: state.phase === "recall",
    controls: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
    metrics: computeMetrics(state),
    complete: state.completed,
  };
}

export function digitResult(state: DigitState): MechanicResult {
  const metrics = computeMetrics(state);
  const accuracy = metrics.accuracy ?? 0;
  const correct = metrics.correct ?? 0;
  return {
    mechanic: "digit",
    domain: "working_memory",
    trials: state.config.trials,
    durationMs: state.tick,
    metrics,
    summary: `Digit Span: ${Math.round(accuracy * 100)}% accuracy, ${correct}/${state.config.trials} correct, longest span ${metrics.max_span ?? 0}.`,
    seed: state.seed,
    stateHash: stableHash(state),
  };
}

export function digitComplete(state: DigitState): boolean {
  return state.completed;
}
