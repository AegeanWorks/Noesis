import { useEffect } from "react";
import { sessionStore } from "../engine/store";
import { useSessionState } from "./useSession";

export function useSessionClock(paused: boolean): void {
  const state = useSessionState();
  const running = state?.phase === "running";

  useEffect(() => {
    if (!running || paused) return undefined;
    let frame = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const delta = Math.min(250, Math.max(0, now - last));
      last = now;
      if (delta >= 8) {
        sessionStore.dispatch({ type: "advance", ms: Math.round(delta) });
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [running, paused]);
}
