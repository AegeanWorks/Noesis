import { mechanicMeta } from "./evidence";
import {
  applyMechanicAction,
  createMechanic,
  defaultTrials,
  mechanicComplete,
  mechanicResult,
  mechanicView,
} from "./mechanics";
import { normalizeSeed } from "./rng";
import type {
  BlockConfig,
  SessionAction,
  SessionConfig,
  SessionEvent,
  SessionLength,
  SessionState,
  SessionView,
} from "./types";

const MAX_EVENTS = 200;

export function sessionBlocks(
  difficulty: number,
  length: SessionLength,
): BlockConfig[] {
  const safeDifficulty = Math.min(3, Math.max(1, Math.round(difficulty)));
  const blocks: BlockConfig[] = [
    { mechanic: "nback", difficulty: safeDifficulty, trials: defaultTrials("nback", safeDifficulty) },
    { mechanic: "gonogo", difficulty: safeDifficulty, trials: defaultTrials("gonogo", safeDifficulty) },
    { mechanic: "reasoning", difficulty: safeDifficulty, trials: defaultTrials("reasoning", safeDifficulty) },
  ];
  return length === "quick" ? blocks.slice(0, 2) : blocks;
}

export function defaultSessionConfig(
  seed: number,
  difficulty = 2,
  length: SessionLength = "standard",
): SessionConfig {
  return {
    seed: normalizeSeed(seed),
    label: length === "quick" ? "Quick session" : "Starter session",
    blocks: sessionBlocks(difficulty, length),
  };
}

function event(state: SessionState, type: string, detail: string): SessionEvent[] {
  const next = [...state.events, { at: state.tick, type, detail }];
  return next.slice(-MAX_EVENTS);
}

export function createSession(config: SessionConfig): SessionState {
  const normalized: SessionConfig = {
    ...config,
    seed: normalizeSeed(config.seed),
    blocks: config.blocks.map((block) => ({ ...block })),
  };
  return {
    config: normalized,
    phase: "ready",
    blockIndex: 0,
    current: null,
    results: [],
    tick: 0,
    events: [{ at: 0, type: "created", detail: normalized.label }],
    error: null,
  };
}

function startBlock(state: SessionState): SessionState {
  const block = state.config.blocks[state.blockIndex];
  if (!block) {
    return {
      ...state,
      phase: "complete",
      current: null,
      error: null,
      events: event(state, "complete", "All blocks finished"),
    };
  }
  const seed = (state.config.seed + (state.blockIndex + 1) * 1009) >>> 0;
  const current = createMechanic(block.mechanic, seed, block.difficulty, block.trials);
  return {
    ...state,
    phase: "running",
    current,
    error: null,
    events: event(
      state,
      "block_start",
      `${block.mechanic} difficulty ${block.difficulty}, ${block.trials} trials`,
    ),
  };
}

function completeBlock(state: SessionState): SessionState {
  if (!state.current) return state;
  const result = mechanicResult(state.current);
  return {
    ...state,
    phase: "block_complete",
    results: [...state.results, result],
    error: null,
    events: event(state, "block_complete", `${result.mechanic}: ${result.summary}`),
  };
}

function sanitizeMs(ms: number): number {
  if (!Number.isFinite(ms)) return 0;
  return Math.min(10_000, Math.max(0, Math.round(ms)));
}

function fail(state: SessionState, message: string): SessionState {
  return {
    ...state,
    error: message,
    events: event(state, "invalid_action", message),
  };
}

export function applySessionAction(
  state: SessionState,
  action: SessionAction,
): SessionState {
  if (state.phase === "aborted") return state;
  if (state.phase === "complete" && action.type !== "abort") {
    return fail(state, "Session is already complete");
  }
  if (action.type === "begin") {
    if (state.phase !== "ready") return fail(state, "Session has already begun");
    return startBlock(state);
  }
  if (action.type === "abort") {
    return {
      ...state,
      phase: "aborted",
      current: null,
      error: null,
      events: event(state, "aborted", "Session aborted"),
    };
  }
  if (action.type === "next") {
    if (state.phase !== "block_complete") return fail(state, "No completed block to advance from");
    const nextIndex = state.blockIndex + 1;
    if (nextIndex >= state.config.blocks.length) {
      return {
        ...state,
        phase: "complete",
        current: null,
        error: null,
        events: event(state, "complete", "All blocks finished"),
      };
    }
    return startBlock({ ...state, blockIndex: nextIndex });
  }
  if (state.phase !== "running" || !state.current) {
    return fail(state, "Session is not running");
  }
  if (action.type === "advance") {
    const ms = sanitizeMs(action.ms);
    if (ms === 0) return fail(state, "Advance needs a positive duration");
    const current = applyMechanicAction(state.current, { type: "advance", ms });
    const advanced: SessionState = { ...state, current, tick: state.tick + ms, error: null };
    return mechanicComplete(current) ? completeBlock(advanced) : advanced;
  }
  if (action.type === "respond") {
    const current = applyMechanicAction(state.current, { type: "respond" });
    const advanced: SessionState = { ...state, current, error: null };
    return mechanicComplete(current) ? completeBlock(advanced) : advanced;
  }
  if (action.type === "answer") {
    const current = applyMechanicAction(state.current, {
      type: "answer",
      option: action.option,
    });
    const advanced: SessionState = { ...state, current, error: null };
    return mechanicComplete(current) ? completeBlock(advanced) : advanced;
  }
  return fail(state, "Unknown action");
}

export function sessionView(state: SessionState): SessionView {
  const block = state.config.blocks[state.blockIndex];
  const meta = block ? mechanicMeta(block.mechanic) : null;
  return {
    phase: state.phase,
    blockIndex: state.blockIndex,
    blockCount: state.config.blocks.length,
    blockLabel: meta?.name ?? "Session",
    mechanic: state.current ? mechanicView(state.current) : null,
    progressCurrent: Math.min(state.blockIndex + 1, state.config.blocks.length),
    progressTotal: state.config.blocks.length,
    results: state.results,
    error: state.error,
    canAdvance: state.phase === "block_complete",
  };
}
