import { useEffect, useRef } from "react";
import type { MotivationState } from "../engine/motivation";
import type { SessionState } from "../engine/types";
import { saveSessionSnapshot } from "../storage/sessionSnapshot";

export function useSessionPersistence(
  state: SessionState | null,
  motivation: MotivationState | null,
  active: boolean,
): void {
  const latest = useRef<{ state: SessionState | null; motivation: MotivationState | null }>({
    state,
    motivation,
  });
  latest.current = { state, motivation };

  useEffect(() => {
    if (!active) return undefined;
    const save = () => {
      const current = latest.current;
      if (current.state) saveSessionSnapshot(current.state, current.motivation);
    };
    save();
    const timer = window.setInterval(save, 1500);
    return () => window.clearInterval(timer);
  }, [active]);
}
