import {
  applyGoNoGoAction,
  createGoNoGo,
  gonogoComplete,
  gonogoConfig,
  gonogoResult,
  gonogoView,
} from "./gonogo";
import {
  applyNBackAction,
  createNBack,
  nbackComplete,
  nbackConfig,
  nbackResult,
  nbackView,
} from "./nback";
import {
  applyReasoningAction,
  createReasoning,
  reasoningComplete,
  reasoningConfig,
  reasoningResult,
  reasoningView,
} from "./reasoning";
import {
  applySpeedAction,
  createSpeed,
  speedComplete,
  speedConfig,
  speedResult,
  speedView,
} from "./speed";
import type {
  MechanicAction,
  MechanicId,
  MechanicResult,
  MechanicState,
  MechanicView,
} from "../types";

export function defaultTrials(id: MechanicId, difficulty: number): number {
  if (id === "nback") return 18 + (difficulty - 1) * 2;
  if (id === "gonogo") return 30 + (difficulty - 1) * 4;
  if (id === "speed") return 20 + (difficulty - 1) * 2;
  return 8;
}

export function createMechanic(
  id: MechanicId,
  seed: number,
  difficulty: number,
  trials = defaultTrials(id, difficulty),
): MechanicState {
  if (id === "nback") return createNBack(seed, nbackConfig(difficulty, trials));
  if (id === "gonogo") return createGoNoGo(seed, gonogoConfig(difficulty, trials));
  if (id === "speed") return createSpeed(seed, speedConfig(difficulty, trials));
  return createReasoning(seed, reasoningConfig(difficulty, trials));
}

export function applyMechanicAction(
  state: MechanicState,
  action: MechanicAction,
): MechanicState {
  if (state.mechanic === "nback") return applyNBackAction(state, action);
  if (state.mechanic === "gonogo") return applyGoNoGoAction(state, action);
  if (state.mechanic === "speed") return applySpeedAction(state, action);
  return applyReasoningAction(state, action);
}

export function mechanicView(state: MechanicState): MechanicView {
  if (state.mechanic === "nback") return nbackView(state);
  if (state.mechanic === "gonogo") return gonogoView(state);
  if (state.mechanic === "speed") return speedView(state);
  return reasoningView(state);
}

export function mechanicResult(state: MechanicState): MechanicResult {
  if (state.mechanic === "nback") return nbackResult(state);
  if (state.mechanic === "gonogo") return gonogoResult(state);
  if (state.mechanic === "speed") return speedResult(state);
  return reasoningResult(state);
}

export function mechanicComplete(state: MechanicState): boolean {
  if (state.mechanic === "nback") return nbackComplete(state);
  if (state.mechanic === "gonogo") return gonogoComplete(state);
  if (state.mechanic === "speed") return speedComplete(state);
  return reasoningComplete(state);
}
