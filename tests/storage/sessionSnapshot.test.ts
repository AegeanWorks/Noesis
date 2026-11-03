// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { applySessionAction, createSession, defaultSessionConfig } from "../../src/engine/session";
import { stableHash } from "../../src/engine/hash";
import { createMotivation } from "../../src/engine/motivation";
import type { SessionState } from "../../src/engine/types";
import {
  clearSessionSnapshot,
  loadSessionSnapshot,
  saveSessionSnapshot,
} from "../../src/storage/sessionSnapshot";
import { writeLocal } from "../../src/storage/browserStorage";

function runningSession(): SessionState {
  const state = applySessionAction(createSession(defaultSessionConfig(42)), { type: "begin" });
  if (state.phase !== "running") throw new Error("session did not start");
  return state;
}

afterEach(() => {
  clearSessionSnapshot();
});

describe("session snapshot", () => {
  it("round-trips a running session exactly", () => {
    const state = runningSession();
    saveSessionSnapshot(state);
    const loaded = loadSessionSnapshot();
    expect(loaded).not.toBeNull();
    expect(loaded?.state.phase).toBe("running");
    expect(stableHash(loaded?.state)).toBe(stableHash(state));
  });

  it("round-trips motivation with the session", () => {
    const state = runningSession();
    const motivation = createMotivation(42);
    saveSessionSnapshot(state, motivation);
    expect(loadSessionSnapshot()?.motivation).toEqual(motivation);
  });

  it("migrates a snapshot without motivation to null", () => {
    const state = runningSession();
    writeLocal(
      "noesis.session.v1",
      JSON.stringify({ version: 1, savedAt: "2026-11-01T00:00:00.000Z", state }),
    );
    expect(loadSessionSnapshot()?.motivation).toBeNull();
  });

  it("rejects malformed motivation", () => {
    const state = runningSession();
    writeLocal(
      "noesis.session.v1",
      JSON.stringify({
        version: 1,
        savedAt: "2026-11-01T00:00:00.000Z",
        state,
        motivation: "not-a-motivation-state",
      }),
    );
    expect(loadSessionSnapshot()).toBeNull();
  });

  it("does not persist a completed session", () => {
    const state: SessionState = { ...runningSession(), phase: "complete", current: null };
    saveSessionSnapshot(state);
    expect(loadSessionSnapshot()).toBeNull();
  });

  it("rejects a wrong version", () => {
    writeLocal("noesis.session.v1", JSON.stringify({ version: 2, savedAt: "", state: {} }));
    expect(loadSessionSnapshot()).toBeNull();
  });

  it("rejects corrupted JSON", () => {
    writeLocal("noesis.session.v1", "{broken");
    expect(loadSessionSnapshot()).toBeNull();
  });

  it("rejects a snapshot with no current mechanic", () => {
    writeLocal(
      "noesis.session.v1",
      JSON.stringify({
        version: 1,
        savedAt: "2026-11-01T00:00:00.000Z",
        state: { ...runningSession(), current: null },
      }),
    );
    expect(loadSessionSnapshot()).toBeNull();
  });

  it("clears", () => {
    saveSessionSnapshot(runningSession());
    clearSessionSnapshot();
    expect(loadSessionSnapshot()).toBeNull();
  });

  it("round-trips a running speed block (regression: MECHANICS must include speed)", async () => {
    const { createSpeed, speedConfig } = await import("../../src/engine/mechanics/speed");
    const base = runningSession();
    const state = {
      ...base,
      current: createSpeed(9, speedConfig(1, 20)),
    } as SessionState;
    saveSessionSnapshot(state);
    expect(loadSessionSnapshot()?.state.current?.mechanic).toBe("speed");
  });
});
