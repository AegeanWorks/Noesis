import { stableHash } from "../hash";
import { normalizeSeed, shuffle } from "../rng";
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
  PairedConfig,
  PairedResponse,
  PairedState,
  PairedTrial,
} from "../types";

const WORDS = [
  "apple",
  "bridge",
  "candle",
  "desert",
  "engine",
  "forest",
  "garden",
  "harbor",
  "island",
  "jacket",
  "kettle",
  "ladder",
  "meadow",
  "needle",
  "orange",
  "pencil",
  "quartz",
  "rocket",
  "saddle",
  "temple",
  "umbrella",
  "valley",
  "wagon",
  "yellow",
];

export function pairedConfig(
  difficulty: number,
  trials = 12,
): PairedConfig {
  const safeDifficulty = clamp(Math.round(difficulty), 1, 3);
  return {
    trials: Math.round(clamp(trials, 4, 30)),
    studyMs: 2_200 - (safeDifficulty - 1) * 300,
    testLimitMs: 8_000 - (safeDifficulty - 1) * 1_000,
    feedbackMs: 850,
  };
}

function generateTrials(
  config: PairedConfig,
  seed: number,
): { trials: PairedTrial[]; rng: number } {
  let rng = seed;
  const trials: PairedTrial[] = [];
  for (let index = 0; index < config.trials; index += 1) {
    const [order, next] = shuffle(
      Array.from({ length: WORDS.length }, (_, wordIndex) => wordIndex),
      rng,
    );
    rng = next;
    const firstWord = WORDS[order[0] ?? 0] ?? "apple";
    const secondWord = WORDS[order[1] ?? 1] ?? "bridge";
    const distractors = (order.slice(2, 5) as number[]).map(
      (wordIndex) => WORDS[wordIndex] ?? "candle",
    );
    const [options, afterOptions] = shuffle(
      [secondWord, ...distractors],
      rng,
    );
    rng = afterOptions;
    trials.push({
      first: firstWord,
      second: secondWord,
      options,
      correctIndex: options.indexOf(secondWord),
    });
  }
  return { trials, rng };
}

export function createPaired(
  seed: number,
  config: PairedConfig = pairedConfig(2),
): PairedState {
  const normalizedSeed = normalizeSeed(seed);
  const { trials, rng } = generateTrials(config, normalizedSeed);
  return {
    mechanic: "paired",
    seed: normalizedSeed,
    rng,
    tick: 0,
    config,
    trials,
    index: 0,
    phase: "study",
    phaseElapsed: 0,
    phaseDuration: config.studyMs,
    itemStartTick: 0,
    selected: null,
    responses: [],
    completed: false,
  };
}

function currentTrial(state: PairedState): PairedTrial | null {
  return state.trials[state.index] ?? null;
}

function recordResponse(
  state: PairedState,
  selected: number | null,
  timedOut: boolean,
): PairedState {
  const trial = currentTrial(state);
  if (!trial) return state;
  const correct = selected === trial.correctIndex;
  const response: PairedResponse = {
    trial: state.index,
    first: trial.first,
    second: trial.second,
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

function nextTrial(state: PairedState): PairedState {
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
    phase: "study",
    phaseElapsed: 0,
    phaseDuration: state.config.studyMs,
    itemStartTick: state.tick,
    selected: null,
  };
}

function sanitizeMs(ms: number): number {
  if (!Number.isFinite(ms)) return 0;
  return clamp(Math.round(ms), 0, 10_000);
}

export function applyPairedAction(
  state: PairedState,
  action: MechanicAction,
): PairedState {
  if (state.completed) return state;
  if (action.type === "answer") {
    if (state.phase !== "test") return state;
    const option = Math.round(action.option);
    if (!Number.isInteger(option) || option < 0 || option > 3) return state;
    return recordResponse(state, option, false);
  }
  if (action.type !== "advance") return state;
  const ms = sanitizeMs(action.ms);
  if (ms === 0) return state;
  let next: PairedState = { ...state, tick: state.tick + ms };
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
    if (next.phase === "study") {
      next = {
        ...next,
        phase: "test",
        phaseElapsed: 0,
        phaseDuration: next.config.testLimitMs,
        itemStartTick: next.tick,
      };
    } else if (next.phase === "test") {
      next = recordResponse(next, null, true);
    } else if (next.phase === "feedback") {
      next = nextTrial(next);
    } else {
      break;
    }
  }
  return next;
}

function computeMetrics(state: PairedState): Record<string, number> {
  const seen = state.responses.length;
  const correct = state.responses.filter((response) => response.correct).length;
  const timedOut = state.responses.filter((response) => response.timedOut).length;
  const responseTimes = state.responses
    .map((response) => response.reactionMs)
    .filter((value): value is number => typeof value === "number");
  const correctness = state.responses.map((response) => response.correct);
  return {
    trials_seen: seen,
    correct,
    incorrect: seen - correct - timedOut,
    timed_out: timedOut,
    accuracy: rate(correct, seen),
    mean_response_ms:
      responseTimes.length === 0 ? 0 : round(mean(responseTimes) ?? 0, 0),
    current_streak: currentStreak(correctness, Boolean),
    max_streak: longestStreak(correctness, Boolean),
  };
}

export function pairedView(state: PairedState): MechanicView {
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
    mechanic: "paired",
    name: "Paired Associates",
    phase: state.phase,
    prompt:
      state.phase === "complete"
        ? "Block complete"
        : state.phase === "study"
          ? "Remember this word pair"
          : state.phase === "test" && trial
            ? `Which word was paired with "${trial.first}"?`
            : "Pair feedback",
    stimulus:
      state.phase === "study" && trial
        ? `${trial.first}|${trial.second}`
        : state.phase === "test"
          ? trial?.first ?? null
          : null,
    options: state.phase === "test" && trial ? trial.options : null,
    explanation:
      state.phase === "feedback" && trial
        ? `Correct pair: ${trial.first} — ${trial.second}.`
        : null,
    progressCurrent: state.completed
      ? state.trials.length
      : Math.min(state.index + 1, state.trials.length),
    progressTotal: state.trials.length,
    feedback,
    feedbackTone: tone,
    canRespond: state.phase === "test",
    controls: ["1", "2", "3", "4"],
    metrics: computeMetrics(state),
    complete: state.completed,
  };
}

export function pairedResult(state: PairedState): MechanicResult {
  const metrics = computeMetrics(state);
  const accuracy = metrics.accuracy ?? 0;
  const correct = metrics.correct ?? 0;
  return {
    mechanic: "paired",
    domain: "episodic_memory",
    trials: state.trials.length,
    durationMs: state.tick,
    metrics,
    summary: `Paired Associates: ${Math.round(accuracy * 100)}% accuracy, ${correct}/${state.trials.length} correct, ${metrics.mean_response_ms ?? 0} ms mean response.`,
    seed: state.seed,
    stateHash: stableHash(state),
  };
}

export function pairedComplete(state: PairedState): boolean {
  return state.completed;
}
