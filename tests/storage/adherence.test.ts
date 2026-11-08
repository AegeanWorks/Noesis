// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import {
  abortSessionAdherence,
  adherenceCounts,
  clearAdherence,
  completeSessionAdherence,
  loadAdherence,
  logSessionStart,
} from "../../src/storage/adherence";
import { writeLocal } from "../../src/storage/browserStorage";

afterEach(() => {
  clearAdherence();
});

describe("adherence log", () => {
  it("starts empty", () => {
    expect(loadAdherence()).toEqual([]);
  });

  it("logs a session start with its seed, block count and arm", () => {
    const events = logSessionStart({
      seed: 42,
      blockCount: 4,
      arm: "engagement",
      startedAt: "2026-11-08T10:00:00.000Z",
      id: "session-42",
    });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      id: "session-42",
      seed: 42,
      status: "started",
      blocksCompleted: 0,
      blockCount: 4,
      arm: "engagement",
      startedAt: "2026-11-08T10:00:00.000Z",
      endedAt: null,
    });
    expect(loadAdherence()).toEqual(events);
  });

  it("marks the latest open session complete", () => {
    logSessionStart({ seed: 42, blockCount: 4, arm: null, id: "session-42" });
    const events = completeSessionAdherence({
      seed: 42,
      blocksCompleted: 4,
      endedAt: "2026-11-08T10:05:00.000Z",
    });
    expect(events[0]).toMatchObject({
      seed: 42,
      status: "completed",
      blocksCompleted: 4,
      blockCount: 4,
      endedAt: "2026-11-08T10:05:00.000Z",
    });
    expect(adherenceCounts(events)).toEqual({
      started: 1,
      completed: 1,
      aborted: 0,
    });
  });

  it("marks an early ending with the blocks completed so far", () => {
    logSessionStart({ seed: 7, blockCount: 4, arm: "control", id: "session-7" });
    const events = abortSessionAdherence({
      seed: 7,
      blocksCompleted: 1,
      endedAt: "2026-11-08T10:02:00.000Z",
    });
    expect(events[0]).toMatchObject({
      status: "aborted",
      blocksCompleted: 1,
      blockCount: 4,
      arm: "control",
    });
  });

  it("closes a dangling start when a new session begins", () => {
    logSessionStart({ seed: 1, blockCount: 4, arm: null, id: "session-1" });
    const events = logSessionStart({
      seed: 2,
      blockCount: 2,
      arm: null,
      startedAt: "2026-11-09T10:00:00.000Z",
      id: "session-2",
    });
    expect(events).toHaveLength(2);
    expect(events.find((event) => event.id === "session-1")?.status).toBe("aborted");
    expect(events.find((event) => event.id === "session-2")?.status).toBe("started");
    expect(adherenceCounts(events)).toEqual({
      started: 2,
      completed: 0,
      aborted: 1,
    });
  });

  it("creates a completed fallback when no open start exists", () => {
    const events = completeSessionAdherence({
      seed: 99,
      blocksCompleted: 3,
      endedAt: "2026-11-08T10:05:00.000Z",
    });
    expect(events[0]).toMatchObject({
      seed: 99,
      status: "completed",
      blocksCompleted: 3,
      startedAt: "2026-11-08T10:05:00.000Z",
      endedAt: "2026-11-08T10:05:00.000Z",
    });
  });

  it("survives corrupted storage", () => {
    writeLocal("noesis.adherence.v1", "{broken");
    expect(loadAdherence()).toEqual([]);
  });
});
