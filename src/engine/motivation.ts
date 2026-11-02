import type { MechanicResult } from "./types";
import { normalizeSeed, nextRandom } from "./rng";
import { clamp } from "./scoring";

export type BonusTier = "steady" | "boost" | "rare";

export interface BlockMotivation {
  blockIndex: number;
  mechanic: MechanicResult["mechanic"];
  accuracy: number;
  streak: number;
  multiplier: number;
  tier: BonusTier;
  bonus: number;
  nearBest: boolean;
  points: number;
}

export interface MotivationState {
  seed: number;
  rng: number;
  banked: number;
  unbanked: number;
  risk: boolean;
  riskAmount: number;
  outcomes: BlockMotivation[];
  schedule: BonusSchedule;
  completionBonus: number;
}

export interface BonusSchedule {
  steadyUpTo: number;
  boostUpTo: number;
}

export const STEADY_SCHEDULE: BonusSchedule = { steadyUpTo: 0.7, boostUpTo: 0.9 };

export const VOLATILE_SCHEDULE: BonusSchedule = { steadyUpTo: 0.6, boostUpTo: 0.85 };

export function scheduleLabel(schedule: BonusSchedule): string {
  const steady = Math.round(schedule.steadyUpTo * 100);
  const boost = Math.round((schedule.boostUpTo - schedule.steadyUpTo) * 100);
  const rare = 100 - steady - boost;
  return `${steady}% steady, ${boost}% boost and ${rare}% rare`;
}

export const MOTIVATION_TIERS: Record<BonusTier, { label: string; bonus: number }> = {
  steady: { label: "Steady", bonus: 0 },
  boost: { label: "Boost", bonus: 5 },
  rare: { label: "Rare", bonus: 15 },
};

const RISK_THRESHOLD = 0.7;
const NEAR_BEST_WINDOW = 0.05;
const MAX_BLOCK_POINTS = 100;

export function createMotivation(seed: number, schedule: BonusSchedule = STEADY_SCHEDULE): MotivationState {
  const normalized = normalizeSeed(seed);
  return {
    seed: normalized,
    rng: normalized,
    banked: 0,
    unbanked: 0,
    risk: false,
    riskAmount: 0,
    outcomes: [],
    schedule,
    completionBonus: 0,
  };
}

function rollTier(roll: number, schedule: BonusSchedule): BonusTier {
  if (roll < schedule.steadyUpTo) return "steady";
  if (roll < schedule.boostUpTo) return "boost";
  return "rare";
}

function resolveRisk(state: MotivationState, result: MechanicResult): MotivationState {
  if (!state.risk || state.riskAmount <= 0) return { ...state, risk: false, riskAmount: 0 };
  const accuracy = result.metrics.accuracy ?? 0;
  const won = accuracy >= RISK_THRESHOLD;
  return {
    ...state,
    banked: won ? state.banked + state.riskAmount * 2 : state.banked,
    unbanked: state.unbanked,
    risk: false,
    riskAmount: 0,
  };
}

export function addBlockMotivation(
  state: MotivationState,
  blockIndex: number,
  result: MechanicResult,
  personalBest: number | null,
): MotivationState {
  const afterRisk = resolveRisk(state, result);
  const [roll, rng] = nextRandom(afterRisk.rng);
  const tier = rollTier(roll, afterRisk.schedule);
  const bonus = MOTIVATION_TIERS[tier].bonus;
  const accuracy = result.metrics.accuracy ?? 0;
  const streak = Math.max(0, Math.round(result.metrics.max_streak ?? 0));
  const multiplier = 1 + Math.min(2, Math.floor(streak / 5));
  const nearBest =
    personalBest !== null &&
    accuracy < personalBest &&
    personalBest - accuracy <= NEAR_BEST_WINDOW;
  const nearBestBonus = nearBest ? 10 : 0;
  const points = clamp(
    (10 + bonus + streak * 2 + nearBestBonus) * multiplier,
    0,
    MAX_BLOCK_POINTS,
  );
  const outcome: BlockMotivation = {
    blockIndex,
    mechanic: result.mechanic,
    accuracy,
    streak,
    multiplier,
    tier,
    bonus,
    nearBest,
    points,
  };
  return {
    ...afterRisk,
    rng,
    unbanked: afterRisk.unbanked + points,
    outcomes: [...afterRisk.outcomes, outcome],
  };
}

export function bankMotivation(state: MotivationState): MotivationState {
  const total = state.unbanked + state.riskAmount;
  return {
    ...state,
    banked: state.banked + total,
    unbanked: 0,
    risk: false,
    riskAmount: 0,
  };
}

export function riskMotivation(state: MotivationState): MotivationState {
  if (state.unbanked <= 0 || state.risk) return state;
  return {
    ...state,
    unbanked: 0,
    risk: true,
    riskAmount: state.unbanked,
  };
}

export function totalMomentum(state: MotivationState): number {
  return state.banked + state.unbanked + (state.risk ? state.riskAmount : 0);
}

export const FINISHER_BONUS = 15;

export function finishSessionMotivation(state: MotivationState, bonus: number): MotivationState {
  const withBonus =
    bonus > 0
      ? { ...state, unbanked: state.unbanked + bonus, completionBonus: bonus }
      : state;
  return bankMotivation(withBonus);
}

export function riskThreshold(): number {
  return RISK_THRESHOLD;
}
