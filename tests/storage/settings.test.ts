// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  clearSettings,
  loadSettings,
  saveSettings,
} from "../../src/storage/settings";
import { writeLocal } from "../../src/storage/browserStorage";

afterEach(() => {
  clearSettings();
});

describe("settings", () => {
  it("returns defaults when nothing is stored", () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("round-trips difficulty and session length", () => {
    saveSettings({
      reducedMotion: true,
      difficulty: 3,
      sessionLength: "quick",
      motivationMode: false,
      largeText: true,
      highContrast: false,
    });
    expect(loadSettings()).toEqual({
      reducedMotion: true,
      difficulty: 3,
      sessionLength: "quick",
      motivationMode: false,
      largeText: true,
      highContrast: false,
    });
  });

  it("migrates old settings without the new fields", () => {
    writeLocal("noesis.settings.v1", JSON.stringify({ reducedMotion: true }));
    expect(loadSettings()).toEqual({
      reducedMotion: true,
      difficulty: DEFAULT_SETTINGS.difficulty,
      sessionLength: DEFAULT_SETTINGS.sessionLength,
      motivationMode: DEFAULT_SETTINGS.motivationMode,
      largeText: DEFAULT_SETTINGS.largeText,
      highContrast: DEFAULT_SETTINGS.highContrast,
    });
  });

  it("rejects invalid values", () => {
    writeLocal(
      "noesis.settings.v1",
      JSON.stringify({ reducedMotion: false, difficulty: 9, sessionLength: "marathon" }),
    );
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("survives corrupted storage", () => {
    writeLocal("noesis.settings.v1", "{broken");
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
});
