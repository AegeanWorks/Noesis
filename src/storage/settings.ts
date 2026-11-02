import { readLocal, removeLocal, writeLocal } from "./browserStorage";

export type Difficulty = 1 | 2 | 3;
export type SessionLength = "quick" | "standard";

export interface Settings {
  reducedMotion: boolean;
  difficulty: Difficulty;
  sessionLength: SessionLength;
  motivationMode: boolean;
  largeText: boolean;
  highContrast: boolean;
  hideClock: boolean;
  weeklyGoal: number;
}

const KEY = "noesis.settings.v1";

export const DEFAULT_SETTINGS: Settings = {
  reducedMotion: false,
  difficulty: 2,
  sessionLength: "standard",
  motivationMode: true,
  largeText: false,
  highContrast: false,
  hideClock: false,
  weeklyGoal: 3,
};

export const MIN_WEEKLY_GOAL = 1;
export const MAX_WEEKLY_GOAL = 7;

function isDifficulty(value: unknown): value is Difficulty {
  return value === 1 || value === 2 || value === 3;
}

function isWeeklyGoal(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= MIN_WEEKLY_GOAL &&
    value <= MAX_WEEKLY_GOAL
  );
}

function isLength(value: unknown): value is SessionLength {
  return value === "quick" || value === "standard";
}

export function loadSettings(): Settings {
  try {
    const raw = readLocal(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      reducedMotion: parsed.reducedMotion === true,
      difficulty: isDifficulty(parsed.difficulty) ? parsed.difficulty : DEFAULT_SETTINGS.difficulty,
      sessionLength: isLength(parsed.sessionLength)
        ? parsed.sessionLength
        : DEFAULT_SETTINGS.sessionLength,
      motivationMode:
        typeof parsed.motivationMode === "boolean"
          ? parsed.motivationMode
          : DEFAULT_SETTINGS.motivationMode,
      largeText:
        typeof parsed.largeText === "boolean" ? parsed.largeText : DEFAULT_SETTINGS.largeText,
      highContrast:
        typeof parsed.highContrast === "boolean"
          ? parsed.highContrast
          : DEFAULT_SETTINGS.highContrast,
      weeklyGoal: isWeeklyGoal(parsed.weeklyGoal)
        ? parsed.weeklyGoal
        : DEFAULT_SETTINGS.weeklyGoal,
      hideClock:
        typeof parsed.hideClock === "boolean" ? parsed.hideClock : DEFAULT_SETTINGS.hideClock,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  writeLocal(KEY, JSON.stringify(settings));
}

export function clearSettings(): void {
  removeLocal(KEY);
}
