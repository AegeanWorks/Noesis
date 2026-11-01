import { REASONING_ITEMS } from "../content/reasoningItems";
import { applyMechanicAction, createMechanic } from "./mechanics";
import { normalizeSeed, nextRandom, randomInt } from "./rng";
import type {
  GoNoGoState,
  MechanicAction,
  MechanicId,
  MechanicState,
  NBackState,
  ReasoningState,
} from "./types";

export type Policy = (state: MechanicState) => MechanicAction | null;

function current<T>(items: readonly T[], index: number): T | null {
  return items[index] ?? null;
}

export function optimalPolicy(state: MechanicState): MechanicAction | null {
  if (state.mechanic === "nback") {
    if (state.phase !== "trial" || state.respondedThisTrial) return null;
    if (state.phaseElapsed < 250) return null;
    return current(state.trials, state.index)?.target ? { type: "respond" } : null;
  }
  if (state.mechanic === "gonogo") {
    if (
      (state.phase !== "stimulus" && state.phase !== "response") ||
      state.respondedThisTrial
    ) {
      return null;
    }
    const go = current(state.trials, state.index)?.go === true;
    if (!go) return null;
    return state.phase === "response" || state.phaseElapsed >= 250
      ? { type: "respond" }
      : null;
  }
  if (state.phase !== "question") return null;
  if (state.phaseElapsed < 500) return null;
  const id = state.order[state.index];
  const item = REASONING_ITEMS.find((candidate) => candidate.id === id);
  return item ? { type: "answer", option: item.correctIndex } : null;
}

export function neverPolicy(): Policy {
  return () => null;
}

export function alwaysPolicy(state: MechanicState): MechanicAction | null {
  if (state.mechanic === "nback") {
    return state.phase === "trial" && !state.respondedThisTrial ? { type: "respond" } : null;
  }
  if (state.mechanic === "gonogo") {
    return (state.phase === "stimulus" || state.phase === "response") &&
      !state.respondedThisTrial
      ? { type: "respond" }
      : null;
  }
  return state.phase === "question" ? { type: "answer", option: 0 } : null;
}

export function randomPolicy(seed: number): Policy {
  let rng = normalizeSeed(seed);
  return (state) => {
    if (state.mechanic === "nback") {
      if (state.phase !== "trial" || state.respondedThisTrial) return null;
      const [respond, next] = nextRandom(rng);
      rng = next;
      return respond < 0.5 ? { type: "respond" } : null;
    }
    if (state.mechanic === "gonogo") {
      if (
        (state.phase !== "stimulus" && state.phase !== "response") ||
        state.respondedThisTrial
      ) {
        return null;
      }
      const [respond, next] = nextRandom(rng);
      rng = next;
      return respond < 0.5 ? { type: "respond" } : null;
    }
    if (state.phase !== "question") return null;
    const [option, next] = randomInt(rng, 4);
    rng = next;
    return { type: "answer", option };
  };
}

export function policyFor(name: string, seed: number): Policy {
  if (name === "optimal") return optimalPolicy;
  if (name === "always") return alwaysPolicy;
  if (name === "random") return randomPolicy(seed);
  return neverPolicy();
}

export interface SimulationOptions {
  tickMs?: number;
  maxSteps?: number;
}

export interface SimulationResult<S extends MechanicState = MechanicState> {
  state: S;
  actions: MechanicAction[];
  steps: number;
  completed: boolean;
}

export function runMechanic(
  id: "nback",
  seed: number,
  difficulty: number,
  trials: number,
  policy: Policy,
  options?: SimulationOptions,
): SimulationResult<NBackState>;
export function runMechanic(
  id: "gonogo",
  seed: number,
  difficulty: number,
  trials: number,
  policy: Policy,
  options?: SimulationOptions,
): SimulationResult<GoNoGoState>;
export function runMechanic(
  id: "reasoning",
  seed: number,
  difficulty: number,
  trials: number,
  policy: Policy,
  options?: SimulationOptions,
): SimulationResult<ReasoningState>;
export function runMechanic(
  id: MechanicId,
  seed: number,
  difficulty: number,
  trials: number,
  policy: Policy,
  options?: SimulationOptions,
): SimulationResult;
export function runMechanic(
  id: MechanicId,
  seed: number,
  difficulty: number,
  trials: number,
  policy: Policy,
  options: SimulationOptions = {},
): SimulationResult {
  const tickMs = options.tickMs ?? 50;
  const maxSteps = options.maxSteps ?? 50_000;
  let state = createMechanic(id, seed, difficulty, trials);
  const actions: MechanicAction[] = [];
  let steps = 0;
  while (!state.completed && steps < maxSteps) {
    const action = policy(state);
    if (action) {
      const next = applyMechanicAction(state, action);
      if (next !== state) {
        state = next;
        actions.push(action);
        steps += 1;
        continue;
      }
    }
    const advance: MechanicAction = { type: "advance", ms: tickMs };
    state = applyMechanicAction(state, advance);
    actions.push(advance);
    steps += 1;
  }
  return { state, actions, steps, completed: state.completed };
}

export function replayMechanic(
  id: MechanicId,
  seed: number,
  difficulty: number,
  trials: number,
  actions: readonly MechanicAction[],
): MechanicState {
  let state = createMechanic(id, seed, difficulty, trials);
  for (const action of actions) {
    state = applyMechanicAction(state, action);
  }
  return state;
}
