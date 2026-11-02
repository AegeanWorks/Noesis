import { useState } from "react";
import { MECHANIC_META } from "../../engine/evidence";
import type { MechanicId, MechanicMeta } from "../../engine/types";
import type { SessionRecord, TodayStats, WeekStats, WeakestMechanic } from "../../storage/history";
import { accuracySeries, bestAccuracyFor, currentDayStreak, lastDaysActivity, lastResultFor } from "../../storage/history";
import type { FarCheck } from "../../storage/farChecks";
import { isFarCheckDue } from "../../storage/farChecks";
import type { HeavyUseSignal, Milestone } from "../../storage/engagement";
import type { StudyArm } from "../../storage/study";
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
  weeklyGoal: number;
  heavyUse: HeavyUseSignal | null;
  heavyUseDismissed: boolean;
  motivationOn: boolean;
  motivationPaused: boolean;
  milestones: Milestone[];
  studyArm: StudyArm | null;
  farChecks: readonly FarCheck[];
  onStartFarCheck: () => void;
  weakest: WeakestMechanic | null;
  onFocusMechanic: (mechanic: MechanicId) => void;
  onStart: () => void;
  onContinue: () => void;
  onSaveIntention: (when: string, where: string, pairing: string, obstacle: string) => void;
  onClearIntention: () => void;
  onEvidence: () => void;
  onPauseMotivation: () => void;
  onDismissHeavyUse: () => void;
  onDismissMilestones: () => void;
}

function MechanicCard({
  meta,
  onFocus,
}: {
  meta: MechanicMeta;
  onFocus: (mechanic: MechanicId) => void;
}) {
  return (
    <article className="card mechanic-card">
      <div className="card-top">
        <h3>{meta.name}</h3>
        <EvidenceBadge level={meta.claimLevel} />
      </div>
      <p className="muted">{meta.tagline}</p>
      <p>{meta.claim}</p>
      <p className="fine">{meta.qualifier}</p>
      <div className="hero-actions">
        <Button variant="ghost" onClick={() => onFocus(meta.id)}>
          Focus {meta.name}
        </Button>
      </div>
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
  weeklyGoal,
  onSave,
  onClear,
}: {
  intention: PracticeIntention | null;
  weeklyGoal: number;
  onSave: (when: string, where: string, pairing: string, obstacle: string) => void;
  onClear: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [when, setWhen] = useState(intention?.when ?? "");
  const [where, setWhere] = useState(intention?.where ?? "");
  const [pairing, setPairing] = useState(intention?.pairing ?? "");
  const [obstacle, setObstacle] = useState(intention?.obstacle ?? "");
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
          {intention.pairing ? ` · paired with ${intention.pairing}` : ""}
          {intention.obstacle ? ` · if stuck, ${intention.obstacle}` : ""}
        </p>
        <p className="fine" data-testid="plan-goal-link">
          Toward your {weeklyGoal}-day week.
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
      <p className="fine">
        Same time and place each day works best — morning sessions form stronger habits.
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
        <label>
          Pair it with? <span className="muted">(optional)</span>
          <input
            value={pairing}
            onChange={(event) => setPairing(event.target.value)}
            placeholder="e.g. morning coffee, a podcast"
            maxLength={120}
          />
        </label>
        <label>
          If I get stuck, I will… <span className="muted">(optional)</span>
          <input
            value={obstacle}
            onChange={(event) => setObstacle(event.target.value)}
            placeholder="e.g. do just one block instead of quitting"
            maxLength={120}
          />
        </label>
      </div>
      <div className="hero-actions">
        <Button
          onClick={() => {
            onSave(when, where, pairing, obstacle);
            setEditing(false);
          }}
          disabled={!when.trim() && !where.trim() && !pairing.trim() && !obstacle.trim()}
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
  studyArm,
  weeklyGoal,
}: {
  history: readonly SessionRecord[];
  week: WeekStats;
  today: TodayStats;
  studyArm: StudyArm | null;
  weeklyGoal: number;
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
  const activity = lastDaysActivity(history);
  const streak = currentDayStreak(history);
  const todayActive = activity[activity.length - 1]?.active === true;
  const yesterdayActive = activity[activity.length - 2]?.active === true;
  const priorActive = activity.slice(-8, -2).some((day) => day.active);
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
        values. Every block tests you and scores you immediately; that retrieval is the
        training.
      </p>
      <p className="fine" data-testid="weekly-goal">
        {week.days >= weeklyGoal
          ? `Weekly goal met — ${weeklyGoal} of ${weeklyGoal} days. Rest is earned.`
          : week.days === weeklyGoal - 1
            ? `Weekly goal: ${week.days} of ${weeklyGoal} days — one more day hits it.`
            : `Weekly goal: ${Math.min(week.days, weeklyGoal)} of ${weeklyGoal} practice days.`}
      </p>
      <div
        className="goalbar"
        role="img"
        aria-label={`Weekly goal progress: ${Math.min(week.days, weeklyGoal)} of ${weeklyGoal} days`}
        data-testid="weekly-goal-bar"
      >
        {Array.from({ length: weeklyGoal }, (_, index) => (
          <span
            key={index}
            className={index < Math.min(week.days, weeklyGoal) ? "dot dot-active" : "dot"}
          />
        ))}
      </div>
      {!todayActive && !yesterdayActive && priorActive ? (
        <p className="fine" data-testid="slip-recovery">
          Yesterday slipped — that doesn&apos;t reset anything. One session today keeps
          it forming.
        </p>
      ) : null}
      {studyArm === "engagement" && streak > 0 ? (
        <p className="fine" data-testid="streak-at-risk">
          {streak}-day streak — practice today to keep it alive. Streaks are cosmetic and
          never change your scores.
        </p>
      ) : null}
      <div
        className="calendar"
        role="img"
        aria-label={`Practice days in the last two weeks: ${activity.filter((day) => day.active).length} active days`}
        data-testid="practice-calendar"
      >
        {activity.map((day) => (
          <span
            key={day.key}
            title={`${day.label}${day.active ? ": practised" : ""}`}
            className={
              day.active && day.isToday
                ? "dot dot-active dot-today"
                : day.active
                  ? "dot dot-active"
                  : "dot"
            }
          />
        ))}
      </div>
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
  weeklyGoal,
  heavyUse,
  heavyUseDismissed,
  motivationOn,
  motivationPaused,
  milestones,
  studyArm,
  farChecks,
  onStartFarCheck,
  weakest,
  onFocusMechanic,
  onStart,
  onContinue,
  onSaveIntention,
  onClearIntention,
  onEvidence,
  onPauseMotivation,
  onDismissHeavyUse,
  onDismissMilestones,
}: HomeScreenProps) {
  const lapsed =
    history.length > 0 && !lastDaysActivity(history).some((day) => day.active);
  const farCheckDue = isFarCheckDue(farChecks);
  const lastFarCheck = farChecks.length > 0 ? farChecks[0] : undefined;
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

      <PracticePlan intention={intention} weeklyGoal={weeklyGoal} onSave={onSaveIntention} onClear={onClearIntention} />
      <PracticeSummary history={history} week={week} today={today} studyArm={studyArm} weeklyGoal={weeklyGoal} />

      {lapsed ? (
        <section className="notice" data-testid="welcome-back">
          <h3>Welcome back</h3>
          <p>
            It has been a while — that is a lapse, not a relapse. One short session today
            restarts the habit; nothing was lost.
          </p>
        </section>
      ) : null}

      {heavyUse && !heavyUseDismissed ? (
        <HeavyUseNotice
          signal={heavyUse}
          motivationOn={motivationOn}
          motivationPaused={motivationPaused}
          onPauseMotivation={onPauseMotivation}
          onDismiss={onDismissHeavyUse}
        />
      ) : null}

      {milestones.length > 0 ? (
        <section className="notice" data-testid="milestone-notice">
          <h3>{milestones[0]?.title}</h3>
          <p>{milestones[0]?.detail}</p>
          {milestones.length > 1 ? (
            <p className="fine">Plus {milestones.length - 1} more unlocked.</p>
          ) : null}
          <div className="hero-actions">
            <Button variant="ghost" onClick={onDismissMilestones}>
              Nice
            </Button>
          </div>
        </section>
      ) : null}

      {farCheckDue ? (
        <section className="notice" data-testid="far-check-card">
          <h3>Monthly far check is due</h3>
          <p>
            Two minutes of word recognition, kept separate from practice. It checks whether
            training reaches untrained memory — which reviews usually find it does not.
          </p>
          <div className="hero-actions">
            <Button variant="ghost" onClick={onStartFarCheck}>
              Start far check
            </Button>
          </div>
        </section>
      ) : lastFarCheck ? (
        <p className="fine" data-testid="far-check-last">
          Last far check {formatDate(lastFarCheck.finishedAt)}: {lastFarCheck.hits} of{" "}
          {lastFarCheck.studied} remembered.
        </p>
      ) : null}

      <div className="grid">
        {Object.values(MECHANIC_META).map((meta) => (
          <MechanicCard key={meta.id} meta={meta} onFocus={onFocusMechanic} />
        ))}
      </div>

      {weakest ? (
        <section className="notice" data-testid="weakest-link">
          <h3>
            Wobbliest lately: {MECHANIC_META[weakest.mechanic]?.name} (
            {Math.round(weakest.accuracy * 100)}%)
          </h3>
          <p>
            Spaced retrieval works best on what you almost know. One focused session
            re-tests just this task.
          </p>
          <div className="hero-actions">
            <Button
              variant="ghost"
              onClick={() => onFocusMechanic(weakest.mechanic)}
            >
              Focus {MECHANIC_META[weakest.mechanic]?.name}
            </Button>
          </div>
        </section>
      ) : null}

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
