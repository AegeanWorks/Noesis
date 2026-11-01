import type { HeavyUseSignal } from "../../storage/engagement";
import { Button } from "./Button";

interface HeavyUseNoticeProps {
  signal: HeavyUseSignal;
  motivationOn: boolean;
  motivationPaused: boolean;
  onPauseMotivation: () => void;
  onDismiss: () => void;
}

const COPY: Record<HeavyUseSignal["kind"], { title: string; body: (signal: HeavyUseSignal) => string }> = {
  many_today: {
    title: "That's plenty for today.",
    body: (signal) =>
      `${signal.sessionsToday} sessions in one day is a lot. Rest is part of training: ` +
      "gains consolidate between sessions, not inside marathons.",
  },
  back_to_back: {
    title: "Sessions work best spaced out.",
    body: () =>
      "Two sessions with almost no break between them. Take a real break — " +
      "a walk, water, daylight — before the next one.",
  },
  long_day: {
    title: "That's a long training day.",
    body: (signal) =>
      `${signal.minutesToday} minutes today is plenty. Stop here and come back fresh tomorrow.`,
  },
};

export function HeavyUseNotice({
  signal,
  motivationOn,
  motivationPaused,
  onPauseMotivation,
  onDismiss,
}: HeavyUseNoticeProps) {
  const copy = COPY[signal.kind];
  return (
    <section className="notice" data-testid="heavy-use-notice">
      <h3>{copy.title}</h3>
      <p>{copy.body(signal)}</p>
      {motivationPaused ? (
        <p className="fine">Motivation bonuses are paused until tomorrow. Training stays available.</p>
      ) : null}
      <div className="hero-actions">
        {motivationOn && !motivationPaused ? (
          <Button variant="ghost" onClick={onPauseMotivation}>
            Pause Motivation for today
          </Button>
        ) : null}
        <Button variant="subtle" onClick={onDismiss}>
          Not now
        </Button>
      </div>
    </section>
  );
}
