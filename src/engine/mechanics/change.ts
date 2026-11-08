import { stableHash } from "../hash";
import { nextRandom, normalizeSeed, randomInt, sampleIndices } from "../rng";
import {
  clamp,
  currentStreak,
  longestStreak,
  mean,
  rate,
  round,
} from "../scoring";
import type {
  ChangeConfig,
  ChangeResponse,
  ChangeState,
  ChangeTrial,
  MechanicAction,
  MechanicResult,
  MechanicView,
} from "../types";

const CELLS = 9;
const COLOURS = 4;
const SET_SIZES = [4, 5, 6] as const;

export function changeConfig(
  difficulty: number,
  trials = 12,
): ChangeConfig {
  const safeDifficulty = clamp(Math.round(difficulty), 1, 3);
  return {
    trials: Math.round(clamp(trials, 4, 30)),
    setSize: SET_SIZES[safeDifficulty - 1] ?? 5,
    studyMs: 1_000 - (safeDifficulty - 1) * 100,
    delayMs: 600,
    testLimitMs: 8_000,
    feedbackMs: 700,
  };
}

function generateTrials(
  config: ChangeConfig,
  seed: number,
): { trials: ChangeTrial[]; rng: number } {
  let rng = seed;
  const trials: ChangeTrial[] = [];
  for (let index = 0; index < config.trials; index += 1) {
    const [positions, afterPositions] = sampleIndices(
      CELLS,
      config.setSize,
      rng,
    );
    rng = afterPositions;
    const studyColours: number[] = [];
    for (let cell = 0; cell < config.setSize; cell += 1) {
      const [value, next] = nextRandom(rng);
      rng = next;
      studyColours.push(Math.floor(value * COLOURS));
    }
    const [changedIndex, afterChange] = randomInt(rng, config.setSize);
    rng = afterChange;
    const testColours = [...studyColours];
    const oldColour = studyColours[changedIndex] ?? 0;
    const [offsetValue, afterOffset] = nextRandom(rng);
    rng = afterOffset;
    testColours[changedIndex] =
      (oldColour + 1 + Math.floor(offsetValue * (COLOURS - 1))) % COLOURS;
    trials.push({
      positions,
      studyColours,
      testColours,
      changedIndex,
    });
  }
  return { trials, rng };
}

export function createChange(
  seed: number,
  config: ChangeConfig = changeConfig(2),
): ChangeState {
  const normalizedSeed = normalizeSeed(seed);
  const { trials, rng } = generateTrials(config, normalizedSeed);
  return {
    mechanic: "change",
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

function currentTrial(state: ChangeState): ChangeTrial | null {
  return state.trials[state.index] ?? null;
}

export function changeCorrectCell(trial: ChangeTrial): number {
  return trial.positions[trial.changedIndex] ?? 0;
}

function recordResponse(
  state: ChangeState,
  selected: number | null,
  timedOut: boolean,
): ChangeState {
  const trial = currentTrial(state);
  if (!trial) return state;
  const changedCell = changeCorrectCell(trial);
  const correct = selected === changedCell;
  const response: ChangeResponse = {
    trial: state.index,
    setSize: trial.positions.length,
    selected,
    changedCell,
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

function nextTrial(state: ChangeState): ChangeState {
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

export function applyChangeAction(
  state: ChangeState,
  action: MechanicAction,
): ChangeState {
  if (state.completed) return state;
  if (action.type === "answer") {
    if (state.phase !== "test") return state;
    const option = Math.round(action.option);
    if (!Number.isInteger(option) || option < 0 || option >= CELLS) return state;
    return recordResponse(state, option, false);
  }
  if (action.type !== "advance") return state;
  const ms = sanitizeMs(action.ms);
  if (ms === 0) return state;
  let next: ChangeState = { ...state, tick: state.tick + ms };
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
        phase: "delay",
        phaseElapsed: 0,
        phaseDuration: next.config.delayMs,
      };
    } else if (next.phase === "delay") {
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

function computeMetrics(state: ChangeState): Record<string, number> {
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
    set_size: state.config.setSize,
    accuracy: rate(correct, seen),
    mean_response_ms:
      responseTimes.length === 0 ? 0 : round(mean(responseTimes) ?? 0, 0),
    current_streak: currentStreak(correctness, Boolean),
    max_streak: longestStreak(correctness, Boolean),
  };
}

function cellsForTrial(trial: ChangeTrial, colours: readonly number[]): string[] {
  const cells = Array.from({ length: CELLS }, () => "");
  trial.positions.forEach((cell, index) => {
    cells[cell] = `c${colours[index] ?? 0}`;
  });
  return cells;
}

export function changeView(state: ChangeState): MechanicView {
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
  let cells = Array.from({ length: CELLS }, () => "");
  if (trial && state.phase === "study") {
    cells = cellsForTrial(trial, trial.studyColours);
  } else if (trial && (state.phase === "test" || state.phase === "feedback")) {
    cells = cellsForTrial(trial, trial.testColours);
    if (state.phase === "feedback") {
      cells[changeCorrectCell(trial)] = "changed";
    }
  }
  return {
    mechanic: "change",
    name: "Change Detection",
    phase: state.phase,
    prompt:
      state.phase === "complete"
        ? "Block complete"
        : state.phase === "study"
          ? "Remember the colours"
          : state.phase === "delay"
            ? "Get ready…"
            : state.phase === "test"
              ? "Which square changed colour?"
              : "Change feedback",
    stimulus: null,
    options: cells,
    explanation:
      state.phase === "feedback" && trial
        ? `The changed square was ${changeCorrectCell(trial) + 1}.`
        : null,
    progressCurrent: state.completed
      ? state.trials.length
      : Math.min(state.index + 1, state.trials.length),
    progressTotal: state.trials.length,
    feedback,
    feedbackTone: tone,
    canRespond: state.phase === "test",
    controls: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
    metrics: computeMetrics(state),
    complete: state.completed,
  };
}

export function changeResult(state: ChangeState): MechanicResult {
  const metrics = computeMetrics(state);
  const accuracy = metrics.accuracy ?? 0;
  const correct = metrics.correct ?? 0;
  return {
    mechanic: "change",
    domain: "working_memory",
    trials: state.trials.length,
    durationMs: state.tick,
    metrics,
    summary: `Change Detection: ${Math.round(accuracy * 100)}% accuracy, ${correct}/${state.trials.length} correct, set size ${state.config.setSize}.`,
    seed: state.seed,
    stateHash: stableHash(state),
  };
}

export function changeComplete(state: ChangeState): boolean {
  return state.completed;
}
