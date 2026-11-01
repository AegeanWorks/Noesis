import { useState } from "react";
import { loadSafety, saveSafety } from "../../storage/safety";
import { Button } from "../components/Button";

interface SafetyScreenProps {
  onComplete: () => void;
}

export function SafetyScreen({ onComplete }: SafetyScreenProps) {
  const existing = loadSafety();
  const [photosensitive, setPhotosensitive] = useState<boolean | null>(
    existing?.photosensitive ?? null,
  );
  const [exerciseConcern, setExerciseConcern] = useState<boolean | null>(
    existing?.exerciseConcern ?? null,
  );
  const [consent, setConsent] = useState(existing?.consent ?? false);
  const [visualAck, setVisualAck] = useState(existing?.consent ?? false);

  const canSubmit =
    photosensitive !== null && exerciseConcern !== null && consent && visualAck;

  const submit = () => {
    if (photosensitive === null || exerciseConcern === null) return;
    saveSafety({
      acknowledged: true,
      photosensitive,
      exerciseConcern,
      consent: consent && visualAck,
    });
    onComplete();
  };

  return (
    <section className="screen safety-screen">
      <p className="eyebrow">Before you start</p>
      <h1>Safety and consent</h1>
      <p className="lede">
        Noesis is a practice tool, not medical care. These questions decide which exercises
        are appropriate and what warnings the app shows.
      </p>

      <form
        className="card form"
        onSubmit={(event) => {
          event.preventDefault();
          if (canSubmit) submit();
        }}
      >
        <div className="field-group" role="group" aria-labelledby="photosensitive-label">
          <p className="field-label" id="photosensitive-label">
            Have you ever had a seizure, or been diagnosed with photosensitive epilepsy?
          </p>
          <div className="choice-row">
            <label className="choice">
              <input
                type="radio"
                name="photosensitive"
                checked={photosensitive === true}
                onChange={() => setPhotosensitive(true)}
              />
              Yes
            </label>
            <label className="choice">
              <input
                type="radio"
                name="photosensitive"
                checked={photosensitive === false}
                onChange={() => setPhotosensitive(false)}
              />
              No
            </label>
          </div>
        </div>

        <div className="field-group" role="group" aria-labelledby="exercise-label">
          <p className="field-label" id="exercise-label">
            Has a clinician advised you to avoid exercise or cognitive strain?
          </p>
          <div className="choice-row">
            <label className="choice">
              <input
                type="radio"
                name="exerciseConcern"
                checked={exerciseConcern === true}
                onChange={() => setExerciseConcern(true)}
              />
              Yes
            </label>
            <label className="choice">
              <input
                type="radio"
                name="exerciseConcern"
                checked={exerciseConcern === false}
                onChange={() => setExerciseConcern(false)}
              />
              No
            </label>
          </div>
        </div>

        {photosensitive ? (
          <p className="notice notice-warn" role="alert">
            Visual entrainment is not available. The current exercises use static letters,
            shapes and text, with no flashing. Stop if you feel unwell.
          </p>
        ) : null}

        <label className="check">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
          />
          I understand Noesis is not medical care and makes no diagnosis or treatment claim.
        </label>

        <label className="check">
          <input
            type="checkbox"
            checked={visualAck}
            onChange={(event) => setVisualAck(event.target.checked)}
          />
          I understand visual exercises may contain motion, and flashing is disabled.
        </label>

        <Button type="submit" disabled={!canSubmit} className="wide">
          Save and start
        </Button>
      </form>

      <p className="fine">
        You can change these answers later in Settings. No data leaves this device in this
        version.
      </p>
    </section>
  );
}
