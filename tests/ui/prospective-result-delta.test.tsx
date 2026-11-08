// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { MechanicResult } from "../../src/engine/types";
import type { SessionRecord } from "../../src/storage/history";
import { ResultsScreen } from "../../src/ui/screens/ResultsScreen";

afterEach(cleanup);

const RESULT: MechanicResult = {
  mechanic: "prospective",
  domain: "episodic_memory",
  trials: 24,
  durationMs: 60_000,
  metrics: {
    accuracy: 1,
    ongoing_accuracy: 1,
    cue_hits: 4,
    cue_trials: 4,
    cue_accuracy: 1,
    false_alarms: 0,
  },
  summary: "Prospective Memory: 100% accuracy, 4/4 cues remembered, 0 false alarms.",
  seed: 42,
  stateHash: "0123456789abcdef",
  difficulty: 2,
};

function prior(
  ongoing: number,
  cueHits: number,
  cueTrials: number,
  falseAlarms: number,
  level = 2,
): SessionRecord {
  return {
    id: "prior",
    finishedAt: "2026-11-07T10:00:00.000Z",
    seed: 41,
    results: [
      {
        ...RESULT,
        metrics: {
          accuracy: ongoing,
          ongoing_accuracy: ongoing,
          cue_hits: cueHits,
          cue_trials: cueTrials,
          cue_accuracy: cueTrials === 0 ? 0 : cueHits / cueTrials,
          false_alarms: falseAlarms,
        },
        stateHash: "fedcba9876543210",
        difficulty: level,
      },
    ],
  };
}

function renderResults(history: SessionRecord[], result = RESULT) {
  render(
    <ResultsScreen
      results={[result]}
      history={history}
      motivation={null}
      sessionId="session-1"
      newBests={[]}
      onAdverseLogged={vi.fn()}
      onRestart={vi.fn()}
      onEvidence={vi.fn()}
      onHome={vi.fn()}
    />,
  );
}

describe("Prospective Memory result delta", () => {
  it("shows an improved same-level comparison", () => {
    renderResults([prior(0.9, 3, 4, 1)]);
    expect(screen.getByTestId("prospective-vs-previous-0").textContent).toBe(
      "Improved vs previous Level 2 block: ongoing 90% → 100% (+10 pp), cues 3/4 → 4/4, false alarms 1 → 0.",
    );
  });

  it("shows a worsened same-level comparison", () => {
    const result = {
      ...RESULT,
      metrics: {
        ...RESULT.metrics,
        ongoing_accuracy: 0.9,
        cue_hits: 3,
        cue_accuracy: 0.75,
        false_alarms: 1,
      },
    };
    renderResults([prior(1, 4, 4, 0)], result);
    expect(screen.getByTestId("prospective-vs-previous-0").textContent).toBe(
      "Worsened vs previous Level 2 block: ongoing 100% → 90% (-10 pp), cues 4/4 → 3/4, false alarms 0 → 1.",
    );
  });

  it("shows no change when all three metrics match", () => {
    renderResults([prior(1, 4, 4, 0)]);
    expect(screen.getByTestId("prospective-vs-previous-0").textContent).toBe(
      "No change vs previous Level 2 block: ongoing 100%, cues 4/4, false alarms 0.",
    );
  });

  it("marks the first block at a level and does not compare across levels", () => {
    renderResults([]);
    expect(screen.getByTestId("prospective-vs-previous-0").textContent).toBe(
      "First block at this level; no earlier Prospective Memory comparison.",
    );
    cleanup();
    renderResults([prior(1, 4, 4, 0, 3)]);
    expect(screen.getByTestId("prospective-vs-previous-0").textContent).toBe(
      "First block at this level; no earlier Prospective Memory comparison.",
    );
  });
});
