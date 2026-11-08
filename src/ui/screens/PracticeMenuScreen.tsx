import { useState } from "react";
import { MECHANIC_META } from "../../engine/evidence";
import type { MechanicId, MechanicResult } from "../../engine/types";
import type { AdherenceCounts } from "../../storage/adherence";
import type { SessionRecord } from "../../storage/history";
import { bestAccuracyFor } from "../../storage/history";
import type { SessionLength } from "../../storage/settings";
import { Button } from "../components/Button";
import { EvidenceBadge } from "../components/EvidenceBadge";

export type MenuTab = "tests" | "history";

interface PracticeMenuScreenProps {
  history: readonly SessionRecord[];
  adherenceCounts: AdherenceCounts;
  hasSession: boolean;
  sessionLength: SessionLength;
  initialTab?: MenuTab;
  onStartTest: (mechanic: MechanicId) => void;
  onStartSession: () => void;
  onResume: () => void;
  onExportHistory: () => void;
  onHome: () => void;
}

function percent(value: number | null): string {
  return value === null ? "—" : `${Math.round(value * 100)}%`;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "under 1 min";
  const minutes = ms / 60_000;
  return minutes < 1 ? "under 1 min" : `${Math.round(minutes)} min`;
}

function totalDuration(record: SessionRecord): number {
  return record.results.reduce((sum, result) => sum + result.durationMs, 0);
}

function resultFor(
  history: readonly SessionRecord[],
  mechanic: MechanicId,
): { blocks: number; last: MechanicResult | null; best: number | null } {
  let blocks = 0;
  let last: MechanicResult | null = null;
  for (const record of history) {
    for (const result of record.results) {
      if (result.mechanic !== mechanic) continue;
      blocks += 1;
      if (last === null) last = result;
    }
  }
  const best = last
    ? bestAccuracyFor(history, mechanic, last.difficulty)
    : bestAccuracyFor(history, mechanic);
  return { blocks, last, best };
}

function TestCard({
  mechanic,
  history,
  onStartTest,
}: {
  mechanic: MechanicId;
  history: readonly SessionRecord[];
  onStartTest: (mechanic: MechanicId) => void;
}) {
  const meta = MECHANIC_META[mechanic];
  const stats = resultFor(history, mechanic);
  const level = typeof stats.last?.difficulty === "number" ? stats.last.difficulty : null;
  const source = meta.citations[0];

  return (
    <article className="card menu-test-card" data-testid={`menu-test-${mechanic}`}>
      <div className="card-top">
        <div>
          <p className="eyebrow">{meta.tagline}</p>
          <h2>{meta.name}</h2>
        </div>
        <EvidenceBadge level={meta.claimLevel} />
      </div>
      <p>{meta.brief}</p>
      <p className="fine">
        <strong>What the evidence supports:</strong> {meta.claim}
      </p>
      <p className="fine">
        <strong>What it does not claim:</strong> {meta.notClaimed.join(", ")}.
      </p>
      {source ? (
        <p className="fine">
          <strong>Primary source:</strong>{" "}
          <a
            href={`https://pubmed.ncbi.nlm.nih.gov/${source.pmid}/`}
            target="_blank"
            rel="noreferrer"
          >
            {source.label}
          </a>{" "}
          <span className="pmid">PMID {source.pmid}</span>
        </p>
      ) : null}
      <p className="menu-stats">
        {stats.last
          ? `Last ${level !== null ? `L${level} ` : ""}${percent(
              stats.last.metrics.accuracy ?? null,
            )} · Best ${level !== null ? `L${level} ` : ""}${percent(stats.best)} · ${
              stats.blocks
            } ${stats.blocks === 1 ? "block" : "blocks"} practised`
          : "No blocks practised yet. The first block is a baseline, not a test you can fail."}
      </p>
      <div className="hero-actions">
        <Button onClick={() => onStartTest(mechanic)} data-testid={`start-${mechanic}`}>
          Start {meta.name} test
        </Button>
      </div>
    </article>
  );
}

function HistoryPanel({
  history,
  adherenceCounts,
  onExportHistory,
}: {
  history: readonly SessionRecord[];
  adherenceCounts: AdherenceCounts;
  onExportHistory: () => void;
}) {
  const completionRate =
    adherenceCounts.started === 0
      ? null
      : Math.round((adherenceCounts.completed / adherenceCounts.started) * 100);

  return (
    <div
      className="stack"
      data-testid="menu-history"
      role="tabpanel"
      id="menu-panel-history"
      aria-labelledby="menu-tab-history"
    >
      <div className="menu-history-head">
        <div>
          <h2>Your history</h2>
          <p className="muted">
            Completed sessions stay on this device. Each block is reported separately; there
            is no combined score.
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={onExportHistory}
          disabled={history.length === 0}
        >
          Export practice data
        </Button>
      </div>

      <section className="card adherence-card" data-testid="menu-adherence">
        <div className="card-top">
          <div>
            <p className="eyebrow">Your adherence</p>
            <h2>Session completion</h2>
          </div>
          {completionRate !== null ? (
            <span className="seed">{completionRate}% completed</span>
          ) : null}
        </div>
        {adherenceCounts.started === 0 ? (
          <p className="muted">No sessions started yet.</p>
        ) : (
          <p className="week-line">
            <strong>{adherenceCounts.started}</strong> started ·{" "}
            <strong>{adherenceCounts.completed}</strong> completed ·{" "}
            <strong>{adherenceCounts.aborted}</strong> ended early
          </p>
        )}
        <p className="fine">
          Stopping early is not a failure; it is recorded so the study team can understand
          real-world use. This summary stays on this device.
        </p>
      </section>

      {history.length === 0 ? (
        <section className="card" data-testid="menu-history-empty">
          <h3>No completed sessions yet</h3>
          <p className="muted">
            Finish a session and its blocks, levels and accuracies appear here. Nothing is
            sent to a server.
          </p>
        </section>
      ) : (
        <div className="history-list">
          {history.map((record) => (
            <article className="card history-card" data-testid="history-session" key={record.id}>
              <div className="card-top">
                <div>
                  <p className="eyebrow">Session</p>
                  <h3>{formatDate(record.finishedAt)}</h3>
                </div>
                <span className="seed">
                  {record.results.length} {record.results.length === 1 ? "block" : "blocks"} ·{" "}
                  {formatDuration(totalDuration(record))}
                </span>
              </div>
              <ul className="history-blocks">
                {record.results.map((result, index) => (
                  <li className="history-block" key={`${record.id}-${result.mechanic}-${index}`}>
                    <span className="history-mechanic">
                      {MECHANIC_META[result.mechanic]?.name ?? result.mechanic}
                    </span>
                    <span className="history-level">
                      {typeof result.difficulty === "number"
                        ? `Level ${result.difficulty}`
                        : "Level —"}
                    </span>
                    <span className="history-accuracy">
                      {percent(result.metrics.accuracy ?? null)}
                    </span>
                    <span className="fine">{result.summary}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export function PracticeMenuScreen({
  history,
  adherenceCounts,
  hasSession,
  sessionLength,
  initialTab = "tests",
  onStartTest,
  onStartSession,
  onResume,
  onExportHistory,
  onHome,
}: PracticeMenuScreenProps) {
  const [tab, setTab] = useState<MenuTab>(initialTab);

  return (
    <section className="screen practice-menu-screen">
      <div className="hero menu-hero">
        <p className="eyebrow">Practice menu</p>
        <h1>Choose a test or review your history</h1>
        <p className="lede">
          Every test begins with a short explanation of what it measures, what the evidence
          supports and what it does not claim. Pick one task below, or run the interleaved
          session.
        </p>
        <button
          type="button"
          className="start-cta"
          onClick={hasSession ? onResume : onStartSession}
          data-testid="menu-start-session"
        >
          <span className="start-cta-label">
            {hasSession ? "Resume session" : "Start full session"}
          </span>
          <span className="start-cta-meta">
            {hasSession
              ? "Pick up where you paused"
              : `About ${sessionLength === "quick" ? "5" : "8"} minutes · ${
                  sessionLength === "quick" ? "2" : "4"
                } blocks · no flashing`}
          </span>
        </button>
      </div>

      <div className="menu-tabs" role="tablist" aria-label="Practice menu sections">
        <button
          type="button"
          role="tab"
          id="menu-tab-tests"
          aria-selected={tab === "tests"}
          aria-controls="menu-panel-tests"
          className={tab === "tests" ? "menu-tab menu-tab-active" : "menu-tab"}
          onClick={() => setTab("tests")}
        >
          Choose a test
        </button>
        <button
          type="button"
          role="tab"
          id="menu-tab-history"
          aria-selected={tab === "history"}
          aria-controls="menu-panel-history"
          className={tab === "history" ? "menu-tab menu-tab-active" : "menu-tab"}
          onClick={() => setTab("history")}
        >
          History ({history.length})
        </button>
      </div>

      {tab === "tests" ? (
        <div
          className="stack"
          role="tabpanel"
          id="menu-panel-tests"
          aria-labelledby="menu-tab-tests"
        >
          <div className="grid menu-test-grid">
            {(Object.keys(MECHANIC_META) as MechanicId[]).map((mechanic) => (
              <TestCard
                key={mechanic}
                mechanic={mechanic}
                history={history}
                onStartTest={onStartTest}
              />
            ))}
          </div>
          <p className="fine">
            A single-test session runs three blocks of the same task. The full session
            interleaves the four tasks. Both begin each block with the same explanation, and
            neither changes the other&apos;s scores.
          </p>
        </div>
      ) : (
        <HistoryPanel
          history={history}
          adherenceCounts={adherenceCounts}
          onExportHistory={onExportHistory}
        />
      )}

      <Button variant="ghost" onClick={onHome}>
        Back to home
      </Button>
    </section>
  );
}
