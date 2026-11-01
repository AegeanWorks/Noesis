import { afterEach, describe, expect, it } from "vitest";
import { createAiApi } from "../../src/engine/ai";
import { defaultSessionConfig } from "../../src/engine/session";
import { sessionStore } from "../../src/engine/store";

afterEach(() => {
  sessionStore.reset();
});

describe("AI harness", () => {
  it("lists every mechanic", () => {
    const api = createAiApi();
    expect(api.listMechanics()).toHaveLength(4);
  });

  it("creates a session and dispatches a parsed action", () => {
    const api = createAiApi();
    const created = api.createSession(defaultSessionConfig(42));
    expect(created.ok).toBe(true);
    expect(created.view?.phase).toBe("ready");
    const begun = api.dispatch({ type: "begin" });
    expect(begun.ok).toBe(true);
    expect(begun.view?.mechanic?.mechanic).toBe("nback");
    expect(begun.hash).toMatch(/^[0-9a-f]{16}$/);
  });

  it("rejects an invalid action without throwing", () => {
    const api = createAiApi();
    api.createSession(defaultSessionConfig(42));
    const result = api.dispatch({ type: "advance", ms: -5 });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("ms");
  });

  it("rejects dispatch without a session", () => {
    const api = createAiApi();
    const result = api.dispatch({ type: "begin" });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/no session/i);
  });

  it("runs a pure scenario without touching the store", () => {
    const api = createAiApi();
    const config = defaultSessionConfig(7);
    const response = api.runScenario(config, [{ type: "begin" }]);
    expect(response.ok).toBe(true);
    expect(response.result?.state.phase).toBe("running");
    expect(response.result?.hash).toMatch(/^[0-9a-f]{16}$/);
    expect(sessionStore.getSnapshot()).toBeNull();
  });

  it("is deterministic for the same scenario", () => {
    const api = createAiApi();
    const config = defaultSessionConfig(8);
    const actions = [{ type: "begin" }, { type: "advance", ms: 500 }];
    const first = api.runScenario(config, actions);
    const second = api.runScenario(config, actions);
    expect(first.result?.hash).toBe(second.result?.hash);
  });

  it("resets", () => {
    const api = createAiApi();
    api.createSession(defaultSessionConfig(42));
    api.reset();
    expect(api.getState()).toBeNull();
  });
});
