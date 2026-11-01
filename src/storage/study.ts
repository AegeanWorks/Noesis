import { readLocal, removeLocal, writeLocal } from "./browserStorage";

export type StudyArm = "control" | "engagement";

export interface StudyState {
  enrolled: boolean;
  studyId: string | null;
  arm: StudyArm | null;
  consentedAt: string | null;
}

const KEY = "noesis.study.v1";
const MAX_STUDY_ID = 60;

const EMPTY: StudyState = {
  enrolled: false,
  studyId: null,
  arm: null,
  consentedAt: null,
};

function isArm(value: unknown): value is StudyArm {
  return value === "control" || value === "engagement";
}

function isStudyState(value: unknown): value is StudyState {
  if (typeof value !== "object" || value === null) return false;
  const state = value as Partial<StudyState>;
  return (
    typeof state.enrolled === "boolean" &&
    (state.studyId === null || typeof state.studyId === "string") &&
    (state.arm === null || isArm(state.arm)) &&
    (state.consentedAt === null || typeof state.consentedAt === "string")
  );
}

export function loadStudy(): StudyState {
  try {
    const raw = readLocal(KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as unknown;
    if (!isStudyState(parsed)) return { ...EMPTY };
    if (parsed.enrolled && (parsed.studyId === null || parsed.arm === null)) {
      return { ...EMPTY };
    }
    return { ...parsed };
  } catch {
    return { ...EMPTY };
  }
}

function saveStudy(state: StudyState): StudyState {
  writeLocal(KEY, JSON.stringify(state));
  return state;
}

export function clearStudy(): void {
  removeLocal(KEY);
}

export interface EnrollStudyInput {
  studyId: string;
  arm: StudyArm;
  consented: boolean;
  consentedAt?: string;
}

export function enrollStudy(input: EnrollStudyInput): StudyState {
  const studyId = input.studyId.trim().slice(0, MAX_STUDY_ID);
  if (studyId === "" || !isArm(input.arm) || input.consented !== true) {
    return loadStudy();
  }
  return saveStudy({
    enrolled: true,
    studyId,
    arm: input.arm,
    consentedAt: input.consentedAt ?? new Date().toISOString(),
  });
}

export function withdrawStudy(): StudyState {
  return saveStudy({ ...EMPTY });
}

export function activeArm(): StudyArm | null {
  const state = loadStudy();
  return state.enrolled ? state.arm : null;
}
