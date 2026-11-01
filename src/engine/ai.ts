import { MECHANIC_META } from "./evidence";
import { stableHash } from "./hash";
import { applySessionAction, createSession, defaultSessionConfig, sessionView } from "./session";
import { parseActions, parseConfig, parseAction } from "./schema";
import { sessionStore } from "./store";
import type { MechanicMeta, SessionState, SessionView } from "./types";

export interface AiDispatchResult {
  ok: boolean;
  error: string | null;
  state: SessionState | null;
  view: SessionView | null;
  hash: string | null;
}

export interface AiScenarioResult {
  state: SessionState;
  view: SessionView;
  hash: string;
}

export interface AiScenarioResponse {
  ok: boolean;
  error: string | null;
  result: AiScenarioResult | null;
}

export interface AiApi {
  version: string;
  listMechanics(): MechanicMeta[];
  defaultConfig(seed: number): ReturnType<typeof defaultSessionConfig>;
  createSession(config?: unknown): AiDispatchResult;
  getState(): SessionState | null;
  getView(): SessionView | null;
  dispatch(action: unknown): AiDispatchResult;
  runScenario(config: unknown, actions: unknown): AiScenarioResponse;
  reset(): void;
}

function resultFromState(state: SessionState | null, error: string | null = null): AiDispatchResult {
  return {
    ok: error === null,
    error,
    state,
    view: state ? sessionView(state) : null,
    hash: state ? stableHash(state) : null,
  };
}

export function createAiApi(): AiApi {
  return {
    version: "0.1.0",
    listMechanics: () => Object.values(MECHANIC_META),
    defaultConfig: (seed: number) => defaultSessionConfig(seed),
    createSession(config?: unknown): AiDispatchResult {
      if (config === undefined) {
        const state = sessionStore.start(defaultSessionConfig(1));
        return resultFromState(state);
      }
      const parsed = parseConfig(config);
      if (!parsed.ok) return resultFromState(null, parsed.error);
      const state = sessionStore.start(parsed.value);
      return resultFromState(state);
    },
    getState: () => sessionStore.getSnapshot(),
    getView: () => sessionStore.view(),
    dispatch(action: unknown): AiDispatchResult {
      const parsed = parseAction(action);
      if (!parsed.ok) return resultFromState(sessionStore.getSnapshot(), parsed.error);
      if (!sessionStore.getSnapshot()) {
        return resultFromState(null, "No session. Call createSession first.");
      }
      const state = sessionStore.dispatch(parsed.value);
      return resultFromState(state, state?.error ?? null);
    },
    runScenario(config: unknown, actions: unknown): AiScenarioResponse {
      const parsedConfig = parseConfig(config);
      if (!parsedConfig.ok) {
        return { ok: false, error: parsedConfig.error, result: null };
      }
      const parsedActions = parseActions(actions);
      if (!parsedActions.ok) {
        return { ok: false, error: parsedActions.error, result: null };
      }
      let state = createSession(parsedConfig.value);
      for (const action of parsedActions.value) {
        state = applySessionAction(state, action);
      }
      return {
        ok: true,
        error: null,
        result: { state, view: sessionView(state), hash: stableHash(state) },
      };
    },
    reset: () => sessionStore.reset(),
  };
}
