export const MECHANIC_IDS = ["nback", "gonogo", "reasoning", "speed"] as const;

export type MechanicId = (typeof MECHANIC_IDS)[number];
export type Domain = "working_memory" | "inhibition" | "reasoning" | "processing_speed";
export type SessionLength = "quick" | "standard";
export type ClaimLevel = "supported" | "experimental" | "wellness_only";
export type FeedbackTone = "correct" | "incorrect" | "neutral";

export interface MechanicMeta {
  id: MechanicId;
  name: string;
  domain: Domain;
  tagline: string;
  instructions: string;
  claimLevel: ClaimLevel;
  claim: string;
  qualifier: string;
  notClaimed: string[];
  citations: { pmid: string; label: string }[];
  safety: string;
}

export interface MechanicView {
  mechanic: MechanicId;
  name: string;
  phase: string;
  prompt: string;
  stimulus: string | null;
  options: string[] | null;
  explanation: string | null;
  progressCurrent: number;
  progressTotal: number;
  feedback: string | null;
  feedbackTone: FeedbackTone | null;
  canRespond: boolean;
  controls: string[];
  metrics: Record<string, number>;
  complete: boolean;
}

export interface MechanicResult {
  mechanic: MechanicId;
  domain: Domain;
  trials: number;
  durationMs: number;
  metrics: Record<string, number>;
  summary: string;
  seed: number;
  stateHash: string;
}

export interface NBackConfig {
  n: number;
  trials: number;
  trialDurationMs: number;
  feedbackMs: number;
  interTrialMs: number;
  targetRate: number;
}

export interface NBackTrial {
  letter: string;
  target: boolean;
}

export type NBackResponseKind = "hit" | "miss" | "false_alarm" | "correct_rejection";

export interface NBackResponse {
  trial: number;
  responded: boolean;
  correct: boolean;
  kind: NBackResponseKind;
  reactionMs: number | null;
  nearMiss: boolean;
  nearMissLag: number | null;
}

export interface NBackState {
  mechanic: "nback";
  seed: number;
  rng: number;
  tick: number;
  config: NBackConfig;
  trials: NBackTrial[];
  index: number;
  phase: "trial" | "feedback" | "iti" | "complete";
  phaseElapsed: number;
  phaseDuration: number;
  respondedThisTrial: boolean;
  responses: NBackResponse[];
  completed: boolean;
}

export interface GoNoGoConfig {
  trials: number;
  goRate: number;
  stimulusDurationMs: number;
  responseWindowMs: number;
  feedbackMs: number;
  interTrialMs: number;
}

export type GoNoGoResponseKind =
  | "hit"
  | "miss"
  | "commission"
  | "correct_rejection";

export interface GoNoGoResponse {
  trial: number;
  go: boolean;
  responded: boolean;
  correct: boolean;
  kind: GoNoGoResponseKind;
  reactionMs: number | null;
}

export interface GoNoGoState {
  mechanic: "gonogo";
  seed: number;
  rng: number;
  tick: number;
  config: GoNoGoConfig;
  trials: { go: boolean }[];
  index: number;
  phase: "stimulus" | "response" | "feedback" | "iti" | "complete";
  phaseElapsed: number;
  phaseDuration: number;
  trialStartTick: number;
  respondedThisTrial: boolean;
  responses: GoNoGoResponse[];
  completed: boolean;
}

export interface ReasoningConfig {
  items: number;
  difficulty: 1 | 2 | 3;
  timeLimitMs: number;
  feedbackMs: number;
}

export interface ReasoningAnswer {
  itemId: string;
  selected: number | null;
  correct: boolean;
  responseMs: number | null;
  timedOut: boolean;
}

export interface SpeedConfig {
  trials: number;
  foreperiodMinMs: number;
  foreperiodMaxMs: number;
  responseWindowMs: number;
  feedbackMs: number;
  interTrialMs: number;
}

export interface SpeedResponse {
  trial: number;
  responded: boolean;
  correct: boolean;
  reactionMs: number | null;
}

export interface SpeedState {
  mechanic: "speed";
  seed: number;
  rng: number;
  tick: number;
  config: SpeedConfig;
  foreperiods: number[];
  index: number;
  phase: "wait" | "stimulus" | "feedback" | "iti" | "complete";
  phaseElapsed: number;
  phaseDuration: number;
  stimulusStartTick: number;
  respondedThisTrial: boolean;
  responses: SpeedResponse[];
  completed: boolean;
}

export interface ReasoningState {
  mechanic: "reasoning";
  seed: number;
  rng: number;
  tick: number;
  config: ReasoningConfig;
  order: string[];
  index: number;
  phase: "question" | "feedback" | "complete";
  phaseElapsed: number;
  phaseDuration: number;
  itemStartTick: number;
  selected: number | null;
  answers: ReasoningAnswer[];
  completed: boolean;
}

export type MechanicState = NBackState | GoNoGoState | ReasoningState | SpeedState;

export type MechanicAction =
  | { type: "respond" }
  | { type: "answer"; option: number }
  | { type: "advance"; ms: number };

export interface BlockConfig {
  mechanic: MechanicId;
  difficulty: number;
  trials: number;
}

export interface SessionConfig {
  seed: number;
  label: string;
  blocks: BlockConfig[];
}

export type SessionPhase =
  | "ready"
  | "running"
  | "block_complete"
  | "complete"
  | "aborted";

export interface SessionEvent {
  at: number;
  type: string;
  detail: string;
}

export interface SessionState {
  config: SessionConfig;
  phase: SessionPhase;
  blockIndex: number;
  current: MechanicState | null;
  results: MechanicResult[];
  tick: number;
  events: SessionEvent[];
  error: string | null;
}

export type SessionAction =
  | { type: "begin" }
  | { type: "advance"; ms: number }
  | { type: "respond" }
  | { type: "answer"; option: number }
  | { type: "next" }
  | { type: "abort" };

export interface SessionView {
  phase: SessionPhase;
  blockIndex: number;
  blockCount: number;
  blockLabel: string;
  mechanic: MechanicView | null;
  progressCurrent: number;
  progressTotal: number;
  results: MechanicResult[];
  error: string | null;
  canAdvance: boolean;
}
