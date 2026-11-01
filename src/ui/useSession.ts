import { useSyncExternalStore } from "react";
import { sessionStore } from "../engine/store";
import type { SessionState } from "../engine/types";

export function useSessionState(): SessionState | null {
  return useSyncExternalStore(
    sessionStore.subscribe,
    sessionStore.getSnapshot,
    () => null,
  );
}
