import { REASONING_ITEMS } from "../content/reasoningItems";
import { applyMechanicAction, createMechanic } from "./mechanics";
import { flankerCorrectIndex } from "./mechanics/flanker";
import { prospectiveCorrectIndex } from "./mechanics/prospective";
import { rotationCorrectIndex } from "./mechanics/rotation";
import { switchingChoices } from "./mechanics/switching";
import { normalizeSeed, nextRandom, randomInt } from "./rng";
import type {
  GoNoGoState,
  MechanicAction,
  MechanicId,
  MechanicState,
  NBackState,
  ReasoningState,
  SpeedState,
  SwitchingState,
  FlankerState,
  SpatialState,
  RotationState,
  ProspectiveState,
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
  if (state.mechanic === "speed") {
    if (state.phase !== "stimulus" || state.respondedThisTrial) return null;
    return state.phaseElapsed >= 250 ? { type: "respond" } : null;
  }
  if (state.mechanic === "switching") {
    if (state.phase !== "question" || state.phaseElapsed < 500) return null;
    const trial = current(state.trials, state.index);
    return trial
      ? { type: "answer", option: switchingChoices(trial).correctIndex }
      : null;
  }
  if (state.mechanic === "flanker") {
    if (state.phase !== "question" || state.phaseElapsed < 500) return null;
    const trial = current(state.trials, state.index);
    return trial ? { type: "answer", option: flankerCorrectIndex(trial) } : null;
  }
  if (state.mechanic === "spatial") {
    if (state.phase !== "recall") return null;
    const trial = current(state.trials, state.index);
    const cell = trial?.sequence[state.selected.length];
    return cell === undefined ? null : { type: "answer", option: cell };
  }
  if (state.mechanic === "rotation") {
    if (state.phase !== "question" || state.phaseElapsed < 400) return null;
    const trial = current(state.trials, state.index);
    return trial ? { type: "answer", option: rotationCorrectIndex(trial) } : null;
  }
  if (state.mechanic === "prospective") {
    if (state.phase !== "question" || state.phaseElapsed < 300) return null;
    const trial = current(state.trials, state.index);
    return trial ? { type: "answer", option: prospectiveCorrectIndex(trial) } : null;
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
  if (state.mechanic === "speed") {
    return state.phase === "stimulus" && !state.respondedThisTrial
      ? { type: "respond" }
      : null;
  }
  if (state.mechanic === "switching") {
    return state.phase === "question" ? { type: "answer", option: 0 } : null;
  }
  if (state.mechanic === "flanker") {
    return state.phase === "question" ? { type: "answer", option: 0 } : null;
  }
  if (state.mechanic === "spatial") {
    return state.phase === "recall" ? { type: "answer", option: 0 } : null;
  }
  if (state.mechanic === "rotation") {
    return state.phase === "question" ? { type: "answer", option: 0 } : null;
  }
  if (state.mechanic === "prospective") {
    return state.phase === "question" ? { type: "answer", option: 0 } : null;
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
    if (state.mechanic === "speed") {
      if (state.phase !== "stimulus" || state.respondedThisTrial) return null;
      const [respond, next] = nextRandom(rng);
      rng = next;
      return respond < 0.5 ? { type: "respond" } : null;
    }
    if (state.mechanic === "switching") {
      if (state.phase !== "question") return null;
      const [option, next] = randomInt(rng, 2);
      rng = next;
      return { type: "answer", option };
    }
    if (state.mechanic === "flanker") {
      if (state.phase !== "question") return null;
      const [option, next] = randomInt(rng, 2);
      rng = next;
      return { type: "answer", option };
    }
    if (state.mechanic === "spatial") {
      if (state.phase !== "recall") return null;
      const [option, next] = randomInt(rng, 9);
      rng = next;
      return { type: "answer", option };
    }
    if (state.mechanic === "rotation") {
      if (state.phase !== "question") return null;
      const [option, next] = randomInt(rng, 2);
      rng = next;
      return { type: "answer", option };
    }
    if (state.mechanic === "prospective") {
      if (state.phase !== "question") return null;
      const [option, next] = randomInt(rng, 3);
      rng = next;
      return { type: "answer", option };
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
  id: "speed",
  seed: number,
  difficulty: number,
  trials: number,
  policy: Policy,
  options?: SimulationOptions,
): SimulationResult<SpeedState>;
export function runMechanic(
  id: "switching",
  seed: number,
  difficulty: number,
  trials: number,
  policy: Policy,
  options?: SimulationOptions,
): SimulationResult<SwitchingState>;
export function runMechanic(
  id: "flanker",
  seed: number,
  difficulty: number,
  trials: number,
  policy: Policy,
  options?: SimulationOptions,
): SimulationResult<FlankerState>;
export function runMechanic(
  id: "spatial",
  seed: number,
  difficulty: number,
  trials: number,
  policy: Policy,
  options?: SimulationOptions,
): SimulationResult<SpatialState>;
export function runMechanic(
  id: "rotation",
  seed: number,
  difficulty: number,
  trials: number,
  policy: Policy,
  options?: SimulationOptions,
): SimulationResult<RotationState>;
export function runMechanic(
  id: "prospective",
  seed: number,
  difficulty: number,
  trials: number,
  policy: Policy,
  options?: SimulationOptions,
): SimulationResult<ProspectiveState>;
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
