// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import {
  clearIntention,
  loadIntention,
  saveIntention,
} from "../../src/storage/intention";
import { writeLocal } from "../../src/storage/browserStorage";

afterEach(() => {
  clearIntention();
});

describe("practice intention", () => {
  it("starts empty", () => {
    expect(loadIntention()).toBeNull();
  });

  it("saves and loads a when/where plan", () => {
    const saved = saveIntention({ when: "tomorrow at 9am", where: "kitchen table" });
    expect(saved?.when).toBe("tomorrow at 9am");
    expect(loadIntention()?.where).toBe("kitchen table");
  });

  it("trims whitespace and caps length", () => {
    const saved = saveIntention({ when: `  ${"a".repeat(200)}  `, where: "  desk  " });
    expect(saved?.when).toHaveLength(120);
    expect(saved?.where).toBe("desk");
  });

  it("clears when both fields are empty", () => {
    saveIntention({ when: "tomorrow", where: "desk" });
    expect(saveIntention({ when: "   ", where: "  " })).toBeNull();
    expect(loadIntention()).toBeNull();
  });

  it("ignores corrupt storage", () => {
    writeLocal("noesis.intention.v1", "{broken");
    expect(loadIntention()).toBeNull();
  });
});
