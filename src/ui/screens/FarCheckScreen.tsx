import { useMemo, useState } from "react";
import { normalizeSeed, sampleIndices, shuffle } from "../../engine/rng";
import { Button } from "../components/Button";

const WORD_POOL = [
  "apple", "bridge", "candle", "doctor", "eagle", "forest", "garden", "hammer",
  "island", "jacket", "kite", "lemon", "mountain", "needle", "ocean", "piano",
  "queen", "river", "stone", "table", "umbrella", "village", "window", "yarn",
  "zebra", "anchor", "baker", "cloud", "dance", "engine", "feather", "grape",
  "horse", "ice", "jungle", "key", "ladder", "mirror", "nest", "onion",
  "pencil", "quilt", "robot", "saddle", "tiger", "uniform", "violin", "whale",
] as const;

const STUDY_COUNT = 8;
const LURE_COUNT = 8;

export interface FarCheckOutcome {
  studied: number;
  tested: number;
  hits: number;
  falseAlarms: number;
  accuracy: number;
}

interface FarCheckScreenProps {
  seed: number;
  onComplete: (outcome: FarCheckOutcome) => void;
  onCancel: () => void;
}

export function FarCheckScreen({ seed, onComplete, onCancel }: FarCheckScreenProps) {
  const { studied, trials } = useMemo(() => {
    const normalized = normalizeSeed(seed);
    const [picked, rng] = sampleIndices(WORD_POOL.length, STUDY_COUNT + LURE_COUNT, normalized);
    const studied = picked.slice(0, STUDY_COUNT).map((index) => WORD_POOL[index] ?? "");
    const lures = picked.slice(STUDY_COUNT).map((index) => WORD_POOL[index] ?? "");
    const [order] = shuffle(
      [...studied.map((word) => ({ word, old: true })), ...lures.map((word) => ({ word, old: false }))],
      rng,
    );
    return { studied, trials: order };
  }, [seed]);

  const [studyIndex, setStudyIndex] = useState(0);
  const [testIndex, setTestIndex] = useState(0);
  const [hits, setHits] = useState(0);
  const [falseAlarms, setFalseAlarms] = useState(0);

  if (studyIndex < studied.length) {
    return (
      <section className="screen session-screen" data-testid="far-check-study">
        <p className="eyebrow">Far check · memorize</p>
        <h1>{studied[studyIndex]}</h1>
        <p className="fine">
          Word {studyIndex + 1} of {studied.length}. Memorize each word; you will be tested after.
        </p>
        <div className="hero-actions">
          <Button onClick={() => setStudyIndex((index) => index + 1)}>
            {studyIndex + 1 === studied.length ? "Start test" : "Next word"}
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </section>
    );
  }

  if (testIndex < trials.length) {
    const trial = trials[testIndex];
    const answer = (seen: boolean) => {
      if (!trial) return;
      if (trial.old && seen) setHits((count) => count + 1);
      if (!trial.old && seen) setFalseAlarms((count) => count + 1);
      setTestIndex((index) => index + 1);
    };
    return (
      <section className="screen session-screen" data-testid="far-check-test">
        <p className="eyebrow">Far check · recognize</p>
        <h1>{trial?.word}</h1>
        <p className="fine">
          Question {testIndex + 1} of {trials.length}. Was this word in the study list?
        </p>
        <div className="hero-actions">
          <Button onClick={() => answer(true)}>Seen before</Button>
          <Button variant="ghost" onClick={() => answer(false)}>
            New word
          </Button>
        </div>
      </section>
    );
  }

  const correct = hits + (trials.length - studied.length - falseAlarms);
  const accuracy = trials.length === 0 ? 0 : correct / trials.length;
  return (
    <section className="screen session-screen" data-testid="far-check-done">
      <p className="eyebrow">Far check complete</p>
      <h1>
        {hits} of {studied.length} remembered
      </h1>
      <p className="fine">
        {falseAlarms} false {falseAlarms === 1 ? "alarm" : "alarms"}. Reviews usually find
        practice does not reach word memory — either answer is useful data.
      </p>
      <div className="hero-actions">
        <Button
          onClick={() =>
            onComplete({
              studied: studied.length,
              tested: trials.length,
              hits,
              falseAlarms,
              accuracy,
            })
          }
        >
          Save result
        </Button>
      </div>
    </section>
  );
}
