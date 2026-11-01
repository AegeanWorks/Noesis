import { applySessionAction, createSession, sessionView } from "./session";
import type { SessionAction, SessionConfig, SessionState, SessionView } from "./types";

function createSessionStore() {
  let state: SessionState | null = null;
  const listeners = new Set<() => void>();

  const emit = () => {
    for (const listener of listeners) listener();
  };

  return {
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot(): SessionState | null {
      return state;
    },
    start(config: SessionConfig): SessionState {
      state = createSession(config);
      emit();
      return state;
    },
    dispatch(action: SessionAction): SessionState | null {
      if (!state) return null;
      state = applySessionAction(state, action);
      emit();
      return state;
    },
    restore(snapshot: SessionState): SessionState {
      state = snapshot;
      emit();
      return state;
    },
    reset(): void {
      state = null;
      emit();
    },
    view(): SessionView | null {
      return state ? sessionView(state) : null;
    },
  };
}

export type SessionStore = ReturnType<typeof createSessionStore>;

export const sessionStore = createSessionStore();
