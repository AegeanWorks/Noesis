// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hasDependencies, nodeVersionOk, parseStartArgs } from "../../scripts/start.mjs";

const tempRoots: string[] = [];

function tempRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "noesis-start-"));
  tempRoots.push(root);
  return root;
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

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

  it("accepts no-open, port and host flags in both spacing forms", () => {
    const expected = {
      open: false,
      check: false,
      help: false,
      port: 5182,
      host: "127.0.0.1",
    };
    expect(parseStartArgs(["--no-open", "--port", "5182", "--host", "127.0.0.1"])).toEqual(
      expected,
    );
    expect(parseStartArgs(["--no-open", "--port=5182", "--host=127.0.0.1"])).toEqual(expected);
  });

  it("rejects invalid ports, missing values and unknown flags", () => {
    expect(() => parseStartArgs(["--port", "0"])).toThrow(/port/i);
    expect(() => parseStartArgs(["--port", "nope"])).toThrow(/port/i);
    expect(() => parseStartArgs(["--port"])).toThrow(/port/i);
    expect(() => parseStartArgs(["--host"])).toThrow(/host/i);
    expect(() => parseStartArgs(["--host="])).toThrow(/host/i);
    expect(() => parseStartArgs(["--wat"])).toThrow(/unknown/i);
  });

  it("requires Node 20.19 or newer", () => {
    expect(nodeVersionOk("20.18.9")).toBe(false);
    expect(nodeVersionOk("20.19")).toBe(true);
    expect(nodeVersionOk("20.19.0")).toBe(true);
    expect(nodeVersionOk("v22.1.0")).toBe(true);
    expect(nodeVersionOk("not-a-version")).toBe(false);
  });

  it("detects whether the Vite dependency is installed", () => {
    const root = tempRoot();
    expect(hasDependencies(root)).toBe(false);
    mkdirSync(join(root, "node_modules", "vite", "bin"), { recursive: true });
    writeFileSync(join(root, "node_modules", "vite", "bin", "vite.js"), "");
    expect(hasDependencies(root)).toBe(true);
  });
});
