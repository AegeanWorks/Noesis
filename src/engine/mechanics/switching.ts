import { stableHash } from "../hash";
import { chance, nextRandom, normalizeSeed } from "../rng";
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
  SwitchingConfig,
  SwitchingCue,
  SwitchingState,
  SwitchingTrial,
} from "../types";

const SWITCH_RATES = [0.25, 0.4, 0.55] as const;
const TIME_LIMITS = [5_000, 4_000, 3_000] as const;

export function switchingConfig(
  difficulty: number,
  trials = 16,
): SwitchingConfig {
  const safeDifficulty = clamp(Math.round(difficulty), 1, 3) as 1 | 2 | 3;
  return {
    trials: Math.round(clamp(trials, 1, 80)),
    difficulty: safeDifficulty,
    switchRate: SWITCH_RATES[safeDifficulty - 1] ?? 0.4,
    timeLimitMs: TIME_LIMITS[safeDifficulty - 1] ?? 4_000,
    feedbackMs: 700,
  };
}

function createTrials(count: number, switchRate: number, seed: number): [SwitchingTrial[], number] {
  let rng = seed;
  let previousCue: SwitchingCue | null = null;
  const trials: SwitchingTrial[] = [];
  for (let index = 0; index < count; index += 1) {
    let cue: SwitchingCue;
    if (previousCue === null) {
      const [value, next] = nextRandom(rng);
      rng = next;
      cue = value < 0.5 ? "colour" : "shape";
    } else {
      const [shouldSwitch, next] = chance(rng, switchRate);
      rng = next;
      cue = shouldSwitch
        ? previousCue === "colour"
          ? "shape"
          : "colour"
        : previousCue;
    }
    const [colourValue, nextColour] = nextRandom(rng);
    rng = nextColour;
    const [shapeValue, nextShape] = nextRandom(rng);
    rng = nextShape;
    trials.push({
      cue,
      colour: colourValue < 0.5 ? "red" : "blue",
      shape: shapeValue < 0.5 ? "circle" : "square",
      switched: previousCue !== null && cue !== previousCue,
    });
    previousCue = cue;
  }
  return [trials, rng];
}

export function createSwitching(
  seed: number,
  config: SwitchingConfig = switchingConfig(2),
): SwitchingState {
  const normalizedSeed = normalizeSeed(seed);
  const [trials, rng] = createTrials(config.trials, config.switchRate, normalizedSeed);
  return {
    mechanic: "switching",
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

function currentTrial(state: SwitchingState): SwitchingTrial | null {
  return state.trials[state.index] ?? null;
}

export function switchingChoices(trial: SwitchingTrial): {
  options: string[];
  correctIndex: number;
  correctChoice: string;
} {
  if (trial.cue === "colour") {
    return {
      options: ["Red", "Blue"],
      correctIndex: trial.colour === "red" ? 0 : 1,
      correctChoice: trial.colour,
    };
  }
  return {
    options: ["Circle", "Square"],
    correctIndex: trial.shape === "circle" ? 0 : 1,
    correctChoice: trial.shape,
  };
}

function computeMetrics(state: SwitchingState): Record<string, number> {
  const responses = state.responses;
  const answered = responses.length;
  const correct = responses.filter((response) => response.correct).length;
  const timedOut = responses.filter((response) => response.timedOut).length;
  const switchResponses = responses.filter((response) => response.switched);
  const repeatResponses = responses.filter((response) => !response.switched);
  const switchCorrect = switchResponses.filter((response) => response.correct).length;
  const repeatCorrect = repeatResponses.filter((response) => response.correct).length;
  const switchTimes = switchResponses
    .map((response) => response.reactionMs)
    .filter((value): value is number => typeof value === "number");
  const repeatTimes = repeatResponses
    .map((response) => response.reactionMs)
    .filter((value): value is number => typeof value === "number");
  const switchMean = mean(switchTimes);
  const repeatMean = mean(repeatTimes);
  const responseMean = mean(
    responses
      .map((response) => response.reactionMs)
      .filter((value): value is number => typeof value === "number"),
  );
  const correctness = responses.map((response) => response.correct);
  return {
    trials_seen: answered,
    correct,
    incorrect: answered - correct - timedOut,
    timed_out: timedOut,
    switch_trials: switchResponses.length,
    repeat_trials: repeatResponses.length,
    switch_correct: switchCorrect,
    repeat_correct: repeatCorrect,
    switch_accuracy: rate(switchCorrect, switchResponses.length),
    repeat_accuracy: rate(repeatCorrect, repeatResponses.length),
    accuracy: rate(correct, answered),
    mean_response_ms: responseMean === null ? 0 : round(responseMean, 0),
    switch_mean_response_ms: switchMean === null ? 0 : round(switchMean, 0),
    repeat_mean_response_ms: repeatMean === null ? 0 : round(repeatMean, 0),
    switch_cost_ms:
      switchMean === null || repeatMean === null ? 0 : round(switchMean - repeatMean, 0),
    current_streak: currentStreak(correctness, Boolean),
    max_streak: longestStreak(correctness, Boolean),
  };
}

function recordResponse(
  state: SwitchingState,
  selected: number | null,
  timedOut: boolean,
): SwitchingState {
  const trial = currentTrial(state);
  if (!trial) return state;
  const { correctIndex, correctChoice } = switchingChoices(trial);
  const correct = selected === correctIndex;
  return {
    ...state,
    responses: [
      ...state.responses,
      {
        trial: state.index,
        cue: trial.cue,
        switched: trial.switched,
        selected,
        correct,
        correctChoice,
        reactionMs: timedOut ? null : state.tick - state.itemStartTick,
        timedOut,
      },
    ],
    selected,
    phase: "feedback",
    phaseElapsed: 0,
    phaseDuration: state.config.feedbackMs,
  };
}

function nextTrial(state: SwitchingState): SwitchingState {
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

export function applySwitchingAction(
  state: SwitchingState,
  action: MechanicAction,
): SwitchingState {
  if (state.completed) return state;
  if (action.type === "answer") {
    if (state.phase !== "question") return state;
    const option = Math.round(action.option);
    if (!Number.isInteger(option) || option < 0 || option > 1) return state;
    if (state.responses.some((response) => response.trial === state.index)) return state;
    return recordResponse(state, option, false);
  }
  if (action.type !== "advance") return state;
  const ms = sanitizeMs(action.ms);
  if (ms === 0) return state;
  const tick = state.tick + ms;
  const phaseElapsed = state.phaseElapsed + ms;
  if (state.phase === "question" && phaseElapsed >= state.phaseDuration) {
    return recordResponse({ ...state, tick, phaseElapsed }, null, true);
  }
  if (state.phase === "feedback" && phaseElapsed >= state.phaseDuration) {
    return nextTrial({ ...state, tick, phaseElapsed });
  }
  return { ...state, tick, phaseElapsed };
}

export function switchingComplete(state: SwitchingState): boolean {
  return state.completed;
}

export function switchingView(state: SwitchingState): MechanicView {
  const trial = currentTrial(state);
  const metrics = computeMetrics(state);
  const choice = trial ? switchingChoices(trial) : null;
  const last = state.responses[state.responses.length - 1] ?? null;
  return {
    mechanic: "switching",
    name: "Task Switch",
    phase: state.phase,
    prompt: trial
      ? trial.cue === "colour"
        ? "Colour rule: choose the colour"
        : "Shape rule: choose the shape"
      : "",
    stimulus: trial ? `${trial.colour}-${trial.shape}` : null,
    options: choice?.options ?? null,
    explanation:
      state.phase === "feedback" && last
        ? `${last.correctChoice} was correct. ${
            last.cue === "colour" ? "Colour" : "Shape"
          } rule.`
        : null,
    progressCurrent: Math.min(state.index + 1, state.trials.length),
    progressTotal: state.trials.length,
    feedback:
      state.phase === "feedback" && last
        ? last.timedOut
          ? "Too slow"
          : last.correct
            ? "Correct"
            : "Incorrect"
        : null,
    feedbackTone:
      state.phase === "feedback" && last
        ? last.correct
          ? "correct"
          : "incorrect"
        : null,
    canRespond: state.phase === "question",
    controls: ["1", "2"],
    metrics,
    complete: state.completed,
  };
}

export function switchingResult(state: SwitchingState): MechanicResult {
  const metrics = computeMetrics(state);
  const accuracy = metrics.accuracy ?? 0;
  const correct = metrics.correct ?? 0;
  return {
    mechanic: "switching",
    domain: "cognitive_flexibility",
    trials: state.trials.length,
    durationMs: state.tick,
    metrics,
    summary: `Task Switch: ${Math.round(accuracy * 100)}% accuracy, ${correct}/${state.trials.length} correct, ${metrics.switch_cost_ms ?? 0} ms switch cost.`,
    seed: state.seed,
    stateHash: stableHash(state),
  };
}
