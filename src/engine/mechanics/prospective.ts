import { stableHash } from "../hash";
import { normalizeSeed, nextRandom, sampleIndices } from "../rng";
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
  ProspectiveConfig,
  ProspectiveResponse,
  ProspectiveState,
  ProspectiveTrial,
} from "../types";

const VOWELS = new Set(["A", "E", "I", "U"]);
const LETTERS = ["A", "E", "I", "U", "B", "C", "D", "F", "G", "H", "J", "K", "L", "M", "N", "P", "R", "S", "T", "V"];
const CUE_LETTER = "Q";
const TIME_LIMITS = [4_500, 4_000, 3_500] as const;

export function prospectiveConfig(
  difficulty: number,
  trials = 24,
): ProspectiveConfig {
  const safeDifficulty = clamp(Math.round(difficulty), 1, 3);
  return {
    trials: Math.round(clamp(trials, 8, 60)),
    cueRate: 1 / 6,
    timeLimitMs: TIME_LIMITS[safeDifficulty - 1] ?? 4_000,
    feedbackMs: 600,
  };
}

function generateTrials(
  config: ProspectiveConfig,
  seed: number,
): { trials: ProspectiveTrial[]; rng: number } {
  const cueCount = Math.max(1, Math.round(config.trials * config.cueRate));
  const [cuePositions, afterCues] = sampleIndices(config.trials, cueCount, seed);
  const cueSet = new Set(cuePositions);
  let rng = afterCues;
  const trials: ProspectiveTrial[] = [];
  for (let index = 0; index < config.trials; index += 1) {
    if (cueSet.has(index)) {
      trials.push({ letter: CUE_LETTER, cue: true });
      continue;
    }
    const [value, next] = nextRandom(rng);
    rng = next;
    const letter = LETTERS[Math.floor(value * LETTERS.length)] ?? "B";
    trials.push({ letter, cue: false });
  }
  return { trials, rng };
}

export function createProspective(
  seed: number,
  config: ProspectiveConfig = prospectiveConfig(2),
): ProspectiveState {
  const normalizedSeed = normalizeSeed(seed);
  const { trials, rng } = generateTrials(config, normalizedSeed);
  return {
    mechanic: "prospective",
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

function currentTrial(state: ProspectiveState): ProspectiveTrial | null {
  return state.trials[state.index] ?? null;
}

export function prospectiveCorrectIndex(trial: ProspectiveTrial): number {
  if (trial.cue) return 2;
  return VOWELS.has(trial.letter) ? 0 : 1;
}

function recordResponse(
  state: ProspectiveState,
  selected: number | null,
  timedOut: boolean,
): ProspectiveState {
  const trial = currentTrial(state);
  if (!trial) return state;
  const correct = selected === prospectiveCorrectIndex(trial);
  const response: ProspectiveResponse = {
    trial: state.index,
    letter: trial.letter,
    cue: trial.cue,
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

function nextTrial(state: ProspectiveState): ProspectiveState {
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

export function applyProspectiveAction(
  state: ProspectiveState,
  action: MechanicAction,
): ProspectiveState {
  if (state.completed) return state;
  if (action.type === "answer") {
    if (state.phase !== "question") return state;
    const option = Math.round(action.option);
    if (!Number.isInteger(option) || option < 0 || option > 2) return state;
    return recordResponse(state, option, false);
  }
  if (action.type !== "advance") return state;
  const ms = sanitizeMs(action.ms);
  if (ms === 0) return state;
  let next: ProspectiveState = { ...state, tick: state.tick + ms };
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

function computeMetrics(state: ProspectiveState): Record<string, number> {
  const seen = state.responses.length;
  const correct = state.responses.filter((response) => response.correct).length;
  const timedOut = state.responses.filter((response) => response.timedOut).length;
  const ongoing = state.responses.filter((response) => !response.cue);
  const cues = state.responses.filter((response) => response.cue);
  const ongoingCorrect = ongoing.filter((response) => response.correct).length;
  const cueHits = cues.filter((response) => response.correct).length;
  const cueMisses = cues.filter(
    (response) => !response.correct && !response.timedOut,
  ).length;
  const falseAlarms = ongoing.filter((response) => response.selected === 2).length;
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
    ongoing_trials: ongoing.length,
    ongoing_accuracy: rate(ongoingCorrect, ongoing.length),
    cue_trials: cues.length,
    cue_hits: cueHits,
    cue_misses: cueMisses,
    false_alarms: falseAlarms,
    cue_accuracy: rate(cueHits, cues.length),
    mean_response_ms:
      responseTimes.length === 0 ? 0 : round(mean(responseTimes) ?? 0, 0),
    current_streak: currentStreak(correctness, Boolean),
    max_streak: longestStreak(correctness, Boolean),
  };
}

export function prospectiveView(state: ProspectiveState): MechanicView {
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
    mechanic: "prospective",
    name: "Prospective Memory",
    phase: state.phase,
    prompt:
      state.phase === "complete"
        ? "Block complete"
        : "Sort the letter as a vowel or consonant. If the letter is Q, choose Remember instead.",
    stimulus: state.phase === "question" || state.phase === "feedback" ? trial?.letter ?? null : null,
    options: state.phase === "question" ? ["Vowel", "Consonant", "Remember"] : null,
    explanation:
      state.phase === "feedback" && trial
        ? trial.cue
          ? "Q was the delayed-intention cue; Remember was correct."
          : `The letter was a ${VOWELS.has(trial.letter) ? "vowel" : "consonant"}.`
        : null,
    progressCurrent: state.completed
      ? state.trials.length
      : Math.min(state.index + 1, state.trials.length),
    progressTotal: state.trials.length,
    feedback,
    feedbackTone: tone,
    canRespond: state.phase === "question",
    controls: ["1", "2", "3"],
    metrics: computeMetrics(state),
    complete: state.completed,
  };
}

export function prospectiveResult(state: ProspectiveState): MechanicResult {
  const metrics = computeMetrics(state);
  const accuracy = metrics.accuracy ?? 0;
  const hits = metrics.cue_hits ?? 0;
  const cues = metrics.cue_trials ?? 0;
  const falseAlarms = metrics.false_alarms ?? 0;
  return {
    mechanic: "prospective",
    domain: "episodic_memory",
    trials: state.trials.length,
    durationMs: state.tick,
    metrics,
    summary: `Prospective Memory: ${Math.round(accuracy * 100)}% accuracy, ${hits}/${cues} cues remembered, ${falseAlarms} false alarms.`,
    seed: state.seed,
    stateHash: stableHash(state),
  };
}

export function prospectiveComplete(state: ProspectiveState): boolean {
  return state.completed;
}
