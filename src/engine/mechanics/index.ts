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
import {
  applySwitchingAction,
  createSwitching,
  switchingComplete,
  switchingConfig,
  switchingResult,
  switchingView,
} from "./switching";
import {
  applyFlankerAction,
  createFlanker,
  flankerComplete,
  flankerConfig,
  flankerResult,
  flankerView,
} from "./flanker";
import {
  applySpatialAction,
  createSpatial,
  spatialComplete,
  spatialConfig,
  spatialResult,
  spatialView,
} from "./spatial";
import {
  applyRotationAction,
  createRotation,
  rotationComplete,
  rotationConfig,
  rotationResult,
  rotationView,
} from "./rotation";
import {
  applyProspectiveAction,
  createProspective,
  prospectiveComplete,
  prospectiveConfig,
  prospectiveResult,
  prospectiveView,
} from "./prospective";
import {
  applyPairedAction,
  createPaired,
  pairedComplete,
  pairedConfig,
  pairedResult,
  pairedView,
} from "./paired";
import {
  applyChangeAction,
  changeComplete,
  changeConfig,
  changeResult,
  changeView,
  createChange,
} from "./change";
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
  if (id === "switching") return 16 + (difficulty - 1) * 4;
  if (id === "flanker") return 18 + (difficulty - 1) * 2;
  if (id === "spatial") return 8;
  if (id === "rotation") return 12;
  if (id === "prospective") return 24;
  if (id === "paired") return 12;
  if (id === "change") return 12;
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
  if (id === "switching") return createSwitching(seed, switchingConfig(difficulty, trials));
  if (id === "flanker") return createFlanker(seed, flankerConfig(difficulty, trials));
  if (id === "spatial") return createSpatial(seed, spatialConfig(difficulty, trials));
  if (id === "rotation") return createRotation(seed, rotationConfig(difficulty, trials));
  if (id === "prospective") return createProspective(seed, prospectiveConfig(difficulty, trials));
  if (id === "paired") return createPaired(seed, pairedConfig(difficulty, trials));
  if (id === "change") return createChange(seed, changeConfig(difficulty, trials));
  return createReasoning(seed, reasoningConfig(difficulty, trials));
}

export function applyMechanicAction(
  state: MechanicState,
  action: MechanicAction,
): MechanicState {
  if (state.mechanic === "nback") return applyNBackAction(state, action);
  if (state.mechanic === "gonogo") return applyGoNoGoAction(state, action);
  if (state.mechanic === "speed") return applySpeedAction(state, action);
  if (state.mechanic === "switching") return applySwitchingAction(state, action);
  if (state.mechanic === "flanker") return applyFlankerAction(state, action);
  if (state.mechanic === "spatial") return applySpatialAction(state, action);
  if (state.mechanic === "rotation") return applyRotationAction(state, action);
  if (state.mechanic === "prospective") return applyProspectiveAction(state, action);
  if (state.mechanic === "paired") return applyPairedAction(state, action);
  if (state.mechanic === "change") return applyChangeAction(state, action);
  return applyReasoningAction(state, action);
}

export function mechanicView(state: MechanicState): MechanicView {
  if (state.mechanic === "nback") return nbackView(state);
  if (state.mechanic === "gonogo") return gonogoView(state);
  if (state.mechanic === "speed") return speedView(state);
  if (state.mechanic === "switching") return switchingView(state);
  if (state.mechanic === "flanker") return flankerView(state);
  if (state.mechanic === "spatial") return spatialView(state);
  if (state.mechanic === "rotation") return rotationView(state);
  if (state.mechanic === "prospective") return prospectiveView(state);
  if (state.mechanic === "paired") return pairedView(state);
  if (state.mechanic === "change") return changeView(state);
  return reasoningView(state);
}

export function mechanicResult(state: MechanicState): MechanicResult {
  if (state.mechanic === "nback") return nbackResult(state);
  if (state.mechanic === "gonogo") return gonogoResult(state);
  if (state.mechanic === "speed") return speedResult(state);
  if (state.mechanic === "switching") return switchingResult(state);
  if (state.mechanic === "flanker") return flankerResult(state);
  if (state.mechanic === "spatial") return spatialResult(state);
  if (state.mechanic === "rotation") return rotationResult(state);
  if (state.mechanic === "prospective") return prospectiveResult(state);
  if (state.mechanic === "paired") return pairedResult(state);
  if (state.mechanic === "change") return changeResult(state);
  return reasoningResult(state);
}

export function mechanicComplete(state: MechanicState): boolean {
  if (state.mechanic === "nback") return nbackComplete(state);
  if (state.mechanic === "gonogo") return gonogoComplete(state);
  if (state.mechanic === "speed") return speedComplete(state);
  if (state.mechanic === "switching") return switchingComplete(state);
  if (state.mechanic === "flanker") return flankerComplete(state);
  if (state.mechanic === "spatial") return spatialComplete(state);
  if (state.mechanic === "rotation") return rotationComplete(state);
  if (state.mechanic === "prospective") return prospectiveComplete(state);
  if (state.mechanic === "paired") return pairedComplete(state);
  if (state.mechanic === "change") return changeComplete(state);
  return reasoningComplete(state);
}
