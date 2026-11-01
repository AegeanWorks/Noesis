import { REASONING_ITEMS, itemsForDifficulty, type ReasoningItem } from "../../content/reasoningItems";
import { stableHash } from "../hash";
import { clamp, currentStreak, longestStreak, mean, rate, round } from "../scoring";
import { normalizeSeed, shuffle } from "../rng";
import type {
  MechanicAction,
  MechanicResult,
  MechanicView,
  ReasoningAnswer,
  ReasoningConfig,
  ReasoningState,
} from "../types";

const ITEM_MAP = new Map(REASONING_ITEMS.map((item) => [item.id, item]));

export function reasoningConfig(
  difficulty: number,
  items = 8,
): ReasoningConfig {
  const safeDifficulty = clamp(Math.round(difficulty), 1, 3) as 1 | 2 | 3;
  const poolSize = itemsForDifficulty(safeDifficulty).length;
  return {
    items: Math.round(clamp(items, 1, poolSize)),
    difficulty: safeDifficulty,
    timeLimitMs: 30_000,
    feedbackMs: 1200,
  };
}

export function createReasoning(
  seed: number,
  config: ReasoningConfig = reasoningConfig(2),
): ReasoningState {
  const normalizedSeed = normalizeSeed(seed);
  const pool = itemsForDifficulty(config.difficulty);
  const [shuffled, rng] = shuffle(pool, normalizedSeed);
  const selected = shuffled.slice(0, config.items);
  return {
    mechanic: "reasoning",
    seed: normalizedSeed,
    rng,
    tick: 0,
    config,
    order: selected.map((item) => item.id),
    index: 0,
    phase: "question",
    phaseElapsed: 0,
    phaseDuration: config.timeLimitMs,
    itemStartTick: 0,
    selected: null,
    answers: [],
    completed: false,
  };
}

function currentItem(state: ReasoningState): ReasoningItem | null {
  const id = state.order[state.index];
  return id ? ITEM_MAP.get(id) ?? null : null;
}

function recordAnswer(
  state: ReasoningState,
  selected: number | null,
  timedOut: boolean,
): ReasoningState {
  const item = currentItem(state);
  if (!item) return state;
  const correct = selected === item.correctIndex;
  const answer: ReasoningAnswer = {
    itemId: item.id,
    selected,
    correct,
    responseMs: timedOut ? null : state.tick - state.itemStartTick,
    timedOut,
  };
  return {
    ...state,
    answers: [...state.answers, answer],
    selected,
    phase: "feedback",
    phaseElapsed: 0,
    phaseDuration: state.config.feedbackMs,
  };
}

function transition(state: ReasoningState): ReasoningState {
  if (state.phase === "question") {
    return recordAnswer(state, null, true);
  }
  if (state.phase === "feedback") {
    if (state.index >= state.order.length - 1) {
      return { ...state, phase: "complete", phaseElapsed: 0, phaseDuration: 0, completed: true };
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
  return state;
}

function sanitizeMs(ms: number): number {
  if (!Number.isFinite(ms)) return 0;
  return clamp(Math.round(ms), 0, 10_000);
}

export function applyReasoningAction(
  state: ReasoningState,
  action: MechanicAction,
): ReasoningState {
  if (state.completed) return state;
  if (action.type === "answer") {
    if (state.phase !== "question") return state;
    const option = Math.round(action.option);
    if (!Number.isInteger(option) || option < 0 || option > 3) return state;
    return recordAnswer(state, option, false);
  }
  if (action.type !== "advance") return state;
  const ms = sanitizeMs(action.ms);
  if (ms === 0) return state;
  let next: ReasoningState = { ...state, tick: state.tick + ms };
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

function computeMetrics(state: ReasoningState): Record<string, number> {
  const answered = state.answers.length;
  const correct = state.answers.filter((answer) => answer.correct).length;
  const timedOut = state.answers.filter((answer) => answer.timedOut).length;
  const responseTimes = state.answers
    .filter((answer) => !answer.timedOut && answer.responseMs !== null)
    .map((answer) => answer.responseMs as number);
  const meanResponse = mean(responseTimes);
  const correctness = state.answers.map((answer) => answer.correct);
  return {
    items_seen: answered,
    correct,
    incorrect: answered - correct - timedOut,
    timed_out: timedOut,
    accuracy: rate(correct, answered),
    mean_response_ms: meanResponse === null ? 0 : round(meanResponse, 0),
    current_streak: currentStreak(correctness, Boolean),
    max_streak: longestStreak(correctness, Boolean),
  };
}

export function reasoningView(state: ReasoningState): MechanicView {
  const item = currentItem(state);
  const last = state.answers[state.answers.length - 1] ?? null;
  const metrics = computeMetrics(state);
  const feedback =
    state.phase === "feedback" && last
      ? last.timedOut
        ? "Time"
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
    mechanic: "reasoning",
    name: "Reasoning",
    phase: state.phase,
    prompt: state.phase === "complete" ? "Block complete" : item?.prompt ?? "",
    stimulus: null,
    options: state.phase === "question" && item ? [...item.options] : null,
    explanation: state.phase === "feedback" && item && last ? item.explanation : null,
    progressCurrent: state.completed
      ? state.order.length
      : Math.min(state.index + 1, state.order.length),
    progressTotal: state.order.length,
    feedback,
    feedbackTone: tone,
    canRespond: state.phase === "question",
    controls: ["1-4 or tap an option"],
    metrics,
    complete: state.completed,
  };
}

export function reasoningResult(state: ReasoningState): MechanicResult {
  const metrics = computeMetrics(state);
  const correct = metrics.correct ?? 0;
  const total = state.order.length;
  return {
    mechanic: "reasoning",
    domain: "reasoning",
    trials: total,
    durationMs: state.tick,
    metrics: { ...metrics, items_total: total },
    summary: `Reasoning: ${correct}/${total} correct (${Math.round((metrics.accuracy ?? 0) * 100)}%), ${metrics.timed_out ?? 0} timed out.`,
    seed: state.seed,
    stateHash: stableHash(state),
  };
}

export function reasoningComplete(state: ReasoningState): boolean {
  return state.completed;
}
