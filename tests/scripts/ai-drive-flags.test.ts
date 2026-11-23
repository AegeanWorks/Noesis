import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(join(__dirname, "../../scripts/ai-drive.ts"), "utf8");

describe("ai-drive flags", () => {
  it("documents every mechanic in help and error text", () => {
    expect(source).toContain("nback|gonogo|reasoning|speed|switching|flanker|spatial|rotation|prospective|paired|change|search|symbol");
    expect(source).toContain("Use nback, gonogo, reasoning, speed, switching, flanker, spatial, rotation, prospective, paired, change, search or symbol.");
  });
});
