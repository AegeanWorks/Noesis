// @vitest-environment node
import { describe, expect, it } from "vitest";
import { nodeVersionOk, parseStartArgs } from "../../scripts/start.mjs";

describe("one-click start", () => {
  it("defaults to opening the app", () => {
    expect(parseStartArgs([])).toEqual({
      open: true,
      check: false,
      help: false,
      port: null,
      host: null,
    });
  });

  it("accepts no-open, port and host flags", () => {
    expect(parseStartArgs(["--no-open", "--port", "5182", "--host", "127.0.0.1"])).toEqual({
      open: false,
      check: false,
      help: false,
      port: 5182,
      host: "127.0.0.1",
    });
  });

  it("rejects invalid ports and unknown flags", () => {
    expect(() => parseStartArgs(["--port", "0"])).toThrow(/port/i);
    expect(() => parseStartArgs(["--port", "nope"])).toThrow(/port/i);
    expect(() => parseStartArgs(["--wat"])).toThrow(/unknown/i);
  });

  it("requires Node 20.19 or newer", () => {
    expect(nodeVersionOk("20.18.9")).toBe(false);
    expect(nodeVersionOk("20.19.0")).toBe(true);
    expect(nodeVersionOk("v22.1.0")).toBe(true);
  });
});
