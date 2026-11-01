import { useState } from "react";
import {
  SYMPTOMS,
  SYMPTOM_LABELS,
  countRecentAdverseEvents,
  evaluateCheckin,
  loadAdverseEvents,
  logAdverseEvent,
  type AdverseEvent,
  type CheckinVerdict,
  type Severity,
  type Symptom,
} from "../../storage/adverseEvents";
import { Button } from "./Button";

interface SymptomCheckinProps {
  sessionId: string | null;
  onLogged?: (events: AdverseEvent[]) => void;
}

const SEVERITIES: readonly { value: Severity; label: string }[] = [
  { value: "mild", label: "Mild" },
  { value: "moderate", label: "Moderate" },
  { value: "severe", label: "Severe" },
] as const;

export function SymptomCheckin({ sessionId, onLogged }: SymptomCheckinProps) {
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [severity, setSeverity] = useState<Severity>("mild");
  const [note, setNote] = useState("");
  const [verdict, setVerdict] = useState<CheckinVerdict | null>(null);

  const toggle = (symptom: Symptom) => {
    setVerdict(null);
    setSymptoms((current) =>
      current.includes(symptom)
        ? current.filter((entry) => entry !== symptom)
        : [...current, symptom],
    );
  };

  const submit = () => {
    const recent = countRecentAdverseEvents(loadAdverseEvents());
    const outcome = evaluateCheckin(symptoms, severity, recent);
    const events = logAdverseEvent({
      id: `ae-${sessionId ?? "adhoc"}-${Date.now()}`,
      sessionId,
      symptoms,
      severity,
      note: note.trim(),
      stoppedSession: outcome.stopAdvised,
    });
    setVerdict(outcome);
    onLogged?.(events);
  };

  const feelFine = () => {
    setVerdict(evaluateCheckin([], "mild", 0));
  };

  if (verdict) {
    return (
      <section
        className={verdict.stopAdvised ? "notice notice-warn" : "notice"}
        role={verdict.stopAdvised ? "alert" : "status"}
        data-testid="symptom-verdict"
      >
        <h3>{verdict.headline}</h3>
        <p>{verdict.detail}</p>
      </section>
    );
  }

  return (
    <section className="card stack" data-testid="symptom-checkin">
      <h2>How do you feel?</h2>
      <p className="fine">
        A quick safety check after each session. Mild symptoms are logged with this session;
        severe or repeated ones advise a stop.
      </p>
      <div className="field-group" role="group" aria-label="Symptoms">
        <div className="choice-row">
          {SYMPTOMS.map((symptom) => (
            <label className="choice" key={symptom}>
              <input
                type="checkbox"
                checked={symptoms.includes(symptom)}
                onChange={() => toggle(symptom)}
              />
              {SYMPTOM_LABELS[symptom]}
            </label>
          ))}
        </div>
      </div>
      <div className="field-group" role="group" aria-label="Severity">
        <div className="choice-row">
          {SEVERITIES.map(({ value, label }) => (
            <label className="choice" key={value}>
              <input
                type="radio"
                name="symptom-severity"
                checked={severity === value}
                onChange={() => {
                  setSeverity(value);
                  setVerdict(null);
                }}
              />
              {label}
            </label>
          ))}
        </div>
      </div>
      <label className="fine" htmlFor="symptom-note">
        Optional note (stays on this device)
      </label>
      <input
        id="symptom-note"
        type="text"
        value={note}
        maxLength={280}
        placeholder="Anything that might matter next time"
        onChange={(event) => setNote(event.target.value)}
      />
      <div className="hero-actions">
        <Button onClick={submit} disabled={symptoms.length === 0}>
          Log symptoms
        </Button>
        <Button variant="ghost" onClick={feelFine}>
          I feel fine
        </Button>
      </div>
    </section>
  );
}
