// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import {
  activeArm,
  clearStudy,
  enrollStudy,
  loadStudy,
  withdrawStudy,
} from "../../src/storage/study";

afterEach(() => {
  clearStudy();
});

describe("study enrollment", () => {
  it("starts unenrolled with no active arm", () => {
    expect(loadStudy().enrolled).toBe(false);
    expect(activeArm()).toBeNull();
  });

  it("enrolls with an explicit study id, arm and consent", () => {
    const state = enrollStudy({ studyId: "RCT-1", arm: "engagement", consented: true });
    expect(state.enrolled).toBe(true);
    expect(activeArm()).toBe("engagement");
    expect(state.consentedAt).toBeTruthy();
    expect(loadStudy().studyId).toBe("RCT-1");
  });

  it("refuses enrollment without consent, an id or an arm", () => {
    enrollStudy({ studyId: "RCT-1", arm: "engagement", consented: false });
    expect(loadStudy().enrolled).toBe(false);
    enrollStudy({ studyId: "   ", arm: "control", consented: true });
    expect(loadStudy().enrolled).toBe(false);
    enrollStudy({ studyId: "RCT-1", arm: "other" as never, consented: true });
    expect(loadStudy().enrolled).toBe(false);
  });

  it("withdraws without deleting practice history", () => {
    enrollStudy({ studyId: "RCT-1", arm: "control", consented: true });
    const state = withdrawStudy();
    expect(state.enrolled).toBe(false);
    expect(activeArm()).toBeNull();
  });

  it("rejects corrupt or half-written enrollment", () => {
    expect(loadStudy().enrolled).toBe(false);
  });
});
