import { useState } from "react";
import { MECHANIC_META } from "../../engine/evidence";
import type { MechanicId, MechanicMeta } from "../../engine/types";
import type { SessionRecord, TodayStats, WeekStats } from "../../storage/history";
import { accuracySeries, bestAccuracyFor, lastResultFor } from "../../storage/history";
import type { HeavyUseSignal } from "../../storage/engagement";
import type { PracticeIntention } from "../../storage/intention";
import type { SessionLength } from "../../storage/settings";
import { Button } from "../components/Button";
import { EvidenceBadge } from "../components/EvidenceBadge";
import { HeavyUseNotice } from "../components/HeavyUseNotice";
import { Sparkline } from "../components/Sparkline";

interface HomeScreenProps {
  hasSession: boolean;
  history: readonly SessionRecord[];
  week: WeekStats;
  today: TodayStats;
  intention: PracticeIntention | null;
  sessionLength: SessionLength;
  heavyUse: HeavyUseSignal | null;
  heavyUseDismissed: boolean;
  motivationOn: boolean;
  motivationPaused: boolean;
  onStart: () => void;
  onContinue: () => void;
  onSaveIntention: (when: string, where: string) => void;
  onClearIntention: () => void;
  onEvidence: () => void;
  onPauseMotivation: () => void;
  onDismissHeavyUse: () => void;
}

function MechanicCard({ meta }: { meta: MechanicMeta }) {
  return (
    <article className="card mechanic-card">
      <div className="card-top">
        <h3>{meta.name}</h3>
        <EvidenceBadge level={meta.claimLevel} />
      </div>
      <p className="muted">{meta.tagline}</p>
      <p>{meta.claim}</p>
      <p className="fine">{meta.qualifier}</p>
    </article>
  );
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function percent(value: number | null): string {
  return value === null ? "—" : `${Math.round(value * 100)}%`;
}

function PracticePlan({
  intention,
  onSave,
  onClear,
}: {
  intention: PracticeIntention | null;
  onSave: (when: string, where: string) => void;
  onClear: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [when, setWhen] = useState(intention?.when ?? "");
  const [where, setWhere] = useState(intention?.where ?? "");
  const showForm = editing || intention === null;

  if (!showForm) {
    return (
      <section className="card plan-card" aria-labelledby="plan-heading" data-testid="practice-plan">
        <div className="card-top">
          <div>
            <p className="eyebrow">Your plan</p>
            <h2 id="plan-heading">Next session</h2>
          </div>
        </div>
        <p>
          {intention.when ? <strong>{intention.when}</strong> : "Anytime"}
          {intention.where ? ` · ${intention.where}` : ""}
        </p>
        <div className="hero-actions">
          <Button variant="ghost" onClick={() => setEditing(true)}>
            Edit plan
          </Button>
          <Button variant="subtle" onClick={onClear}>
            Clear
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="card plan-card" aria-labelledby="plan-heading" data-testid="practice-plan">
      <div className="card-top">
        <div>
          <p className="eyebrow">Optional</p>
          <h2 id="plan-heading">Plan your next session</h2>
        </div>
      </div>
      <p className="muted">
        A specific when-and-where plan makes follow-through easier. This stays on this device.
      </p>
      <div className="plan-fields">
        <label>
          When?
          <input
            value={when}
            onChange={(event) => setWhen(event.target.value)}
            placeholder="e.g. tomorrow at 9am"
            maxLength={120}
          />
        </label>
        <label>
          Where?
          <input
            value={where}
            onChange={(event) => setWhere(event.target.value)}
            placeholder="e.g. at the kitchen table"
            maxLength={120}
          />
        </label>
      </div>
      <div className="hero-actions">
        <Button
          onClick={() => {
            onSave(when, where);
            setEditing(false);
          }}
          disabled={!when.trim() && !where.trim()}
        >
          Save plan
        </Button>
        {intention ? (
          <Button variant="subtle" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        ) : null}
      </div>
    </section>
  );
}

function PracticeSummary({
  history,
  week,
  today,
}: {
  history: readonly SessionRecord[];
  week: WeekStats;
  today: TodayStats;
}) {
  if (history.length === 0) {
    return (
      <section className="card practice-card" aria-labelledby="practice-heading">
        <div className="card-top">
          <div>
            <p className="eyebrow">Your practice</p>
            <h2 id="practice-heading">No sessions yet</h2>
          </div>
        </div>
        <p className="muted">
          Your first session takes about eight minutes. Results stay on this device.
        </p>
      </section>
    );
  }

  const latest = history[0];
  return (
    <section className="card practice-card" aria-labelledby="practice-heading">
      <div className="card-top">
        <div>
          <p className="eyebrow">Your practice</p>
          <h2 id="practice-heading">
            {history.length} completed {history.length === 1 ? "session" : "sessions"}
          </h2>
        </div>
        <span className="seed">{latest ? formatDate(latest.finishedAt) : ""}</span>
      </div>
      <p className="week-line">
        This week: <strong>{week.sessions}</strong>{" "}
        {week.sessions === 1 ? "session" : "sessions"} · <strong>{week.days}</strong>{" "}
        {week.days === 1 ? "day" : "days"} · <strong>{week.minutes}</strong> min
      </p>
      {today.sessions >= 2 ? (
        <p className="break-note" role="status">
          You have completed {today.sessions} sessions today. A break is fine; rest is part of
          practice.
        </p>
      ) : null}
      <dl className="practice-list">
        {(Object.keys(MECHANIC_META) as MechanicId[]).map((id) => {
          const meta = MECHANIC_META[id];
          const last = lastResultFor(history, id);
          const best = bestAccuracyFor(history, id);
          return (
            <div className="practice-row" key={id}>
              <dt>{meta.name}</dt>
              <dd>
                <Sparkline
                  values={accuracySeries(history, id)}
                  label={`${meta.name} recent accuracy trend`}
                />
                <span className="practice-last">Last {percent(last?.metrics.accuracy ?? null)}</span>
                <span className="practice-best">Best {percent(best)}</span>
              </dd>
            </div>
          );
        })}
      </dl>
      <p className="fine">
        Compare a block only with your own earlier runs of the same task. There is no
        composite score; Motivation momentum is cosmetic and never changes these accuracy
        values.
      </p>
    </section>
  );
}

export function HomeScreen({
  hasSession,
  history,
  week,
  today,
  intention,
  sessionLength,
  heavyUse,
  heavyUseDismissed,
  motivationOn,
  motivationPaused,
  onStart,
  onContinue,
  onSaveIntention,
  onClearIntention,
  onEvidence,
  onPauseMotivation,
  onDismissHeavyUse,
}: HomeScreenProps) {
  return (
    <section className="screen home-screen">
      <div className="hero">
        <p className="eyebrow">Evidence-led practice</p>
        <h1>Short sessions. Specific skills. Honest claims.</h1>
        <p className="lede">
          Noesis trains working memory, response inhibition, reasoning and processing speed,
          and measures each separately. There is no single brain score.
        </p>
        <button
          type="button"
          className="start-cta"
          onClick={hasSession ? onContinue : onStart}
          data-testid="start-session"
        >
          <span className="start-cta-label">{hasSession ? "Resume session" : "Start session"}</span>
          <span className="start-cta-meta">
            One click · about {sessionLength === "quick" ? "5" : "8"} minutes · no flashing
          </span>
        </button>
        <div className="hero-actions hero-actions-secondary">
          {hasSession ? (
            <Button variant="subtle" onClick={onStart}>
              Start a new session
            </Button>
          ) : null}
          <Button variant="subtle" onClick={onEvidence}>
            Read the evidence
          </Button>
        </div>
      </div>

      <PracticePlan intention={intention} onSave={onSaveIntention} onClear={onClearIntention} />
      <PracticeSummary history={history} week={week} today={today} />

      {heavyUse && !heavyUseDismissed ? (
        <HeavyUseNotice
          signal={heavyUse}
          motivationOn={motivationOn}
          motivationPaused={motivationPaused}
          onPauseMotivation={onPauseMotivation}
          onDismiss={onDismissHeavyUse}
        />
      ) : null}

      <div className="grid">
        {Object.values(MECHANIC_META).map((meta) => (
          <MechanicCard key={meta.id} meta={meta} />
        ))}
      </div>

      <aside className="notice">
        <h3>What this is not</h3>
        <p>
          Noesis is not medical care. It does not diagnose, treat or prevent ADHD, dementia,
          depression or insomnia, and it does not claim to raise intelligence or academic
          achievement.
        </p>
      </aside>
    </section>
  );
}
