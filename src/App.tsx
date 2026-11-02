import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { stableHash } from "./engine/hash";
import type { MechanicId } from "./engine/types";
import {
  addBlockMotivation,
  bankMotivation,
  createMotivation,
  FINISHER_BONUS,
  finishSessionMotivation,
  riskMotivation,
  STEADY_SCHEDULE,
  VOLATILE_SCHEDULE,
  type MotivationState,
} from "./engine/motivation";
import { defaultSessionConfig } from "./engine/session";
import { sessionView } from "./engine/session";
import { sessionStore } from "./engine/store";
import type { SessionRecord } from "./storage/history";
import { downloadHistoryExport } from "./storage/export";
import {
  appendSession,
  bestAccuracyFor,
  clearHistory,
  loadHistory,
  todayStats,
  weekStats,
} from "./storage/history";
import type { PracticeIntention } from "./storage/intention";
import { clearIntention, loadIntention, saveIntention } from "./storage/intention";
import type { SafetyProfile } from "./storage/safety";
import { clearSafety, loadSafety } from "./storage/safety";
import type { AdverseEvent } from "./storage/adverseEvents";
import {
  clearAdverseEvents,
  loadAdverseEvents,
} from "./storage/adverseEvents";
import {
  clearStudy,
  enrollStudy,
  loadStudy,
  withdrawStudy,
  type StudyArm,
} from "./storage/study";
import {
  clearEngagement,
  detectHeavyUse,
  detectMilestones,
  dismissHeavyUseToday,
  isHeavyUseDismissedToday,
  isMotivationPaused,
  loadEngagement,
  markMilestonesSeen,
  pauseMotivationToday,
  resumeMotivation,
} from "./storage/engagement";
import {
  clearFarChecks,
  loadFarChecks,
  logFarCheck,
} from "./storage/farChecks";
import type { FarCheckOutcome } from "./ui/screens/FarCheckScreen";
import { FarCheckScreen } from "./ui/screens/FarCheckScreen";
import {
  applySessionResults,
  loadAdaptive,
  setAdaptiveEnabled,
} from "./storage/adaptive";
import { detectNewBests, weakestRecentMechanic } from "./storage/history";
import type { Difficulty, SessionLength } from "./storage/settings";
import { clearSettings, loadSettings, saveSettings } from "./storage/settings";
import {
  clearSessionSnapshot,
  loadSessionSnapshot,
} from "./storage/sessionSnapshot";
import { useSessionClock } from "./ui/useSessionClock";
import { useSessionPersistence } from "./ui/useSessionPersistence";
import { useSessionState } from "./ui/useSession";
import { EvidenceScreen } from "./ui/screens/EvidenceScreen";
import { HomeScreen } from "./ui/screens/HomeScreen";
import { ResultsScreen } from "./ui/screens/ResultsScreen";
import { SafetyScreen } from "./ui/screens/SafetyScreen";
import { SessionScreen } from "./ui/screens/SessionScreen";
import { SettingsScreen } from "./ui/screens/SettingsScreen";

  type Screen = "home" | "safety" | "session" | "results" | "evidence" | "settings" | "farcheck";

function initialScreen(): Screen {
  return loadSafety()?.acknowledged ? "home" : "safety";
}

export function App() {
  const [boot] = useState(() => {
    const snapshot = loadSessionSnapshot();
    if (snapshot) sessionStore.restore(snapshot.state);
    return snapshot;
  });
  const [safety, setSafety] = useState<SafetyProfile | null>(() => loadSafety());
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [paused, setPaused] = useState(false);
  const [settings, setSettings] = useState(() => loadSettings());
  const [history, setHistory] = useState<SessionRecord[]>(() => loadHistory());
  const [intention, setIntention] = useState<PracticeIntention | null>(() => loadIntention());
  const [motivation, setMotivation] = useState<MotivationState | null>(
    () => boot?.motivation ?? null,
  );
  const savedSession = useRef<string | null>(null);
  const [lastSessionId, setLastSessionId] = useState<string | null>(null);
  const [adverseEvents, setAdverseEvents] = useState<AdverseEvent[]>(() => loadAdverseEvents());
  const [engagement, setEngagement] = useState(() => loadEngagement());
  const [adaptive, setAdaptive] = useState(() => loadAdaptive());
  const [study, setStudy] = useState(() => loadStudy());
  const [farSeed, setFarSeed] = useState<number | null>(null);
  const [farChecks, setFarChecks] = useState(() => loadFarChecks());
  const motivationPaused =
    engagement.motivationPausedDay !== null && isMotivationPaused();
  const motivationActive = settings.motivationMode && !motivationPaused;
  const motivatedBlock = useRef<number>(-1);
  const state = useSessionState();
  const newMilestones = detectMilestones(history, adaptive.log, engagement.seenMilestones);
  const newBests = detectNewBests(state?.results ?? [], history, lastSessionId ?? "");

  useSessionClock(paused || screen !== "session");
  useSessionPersistence(
    state,
    motivationActive ? motivation : null,
    state?.phase === "running" || state?.phase === "block_complete",
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("reduced-motion", settings.reducedMotion);
    root.classList.toggle("large-text", settings.largeText);
    root.classList.toggle("high-contrast", settings.highContrast);
  }, [settings.reducedMotion, settings.largeText, settings.highContrast]);

  useEffect(() => {
    if (state?.phase !== "complete" || state.results.length === 0) return;
    clearSessionSnapshot();
    setMotivation((current) => (current ? bankMotivation(current) : current));
    const id = stableHash({ seed: state.config.seed, results: state.results });
    if (savedSession.current !== id) {
      savedSession.current = id;
      setLastSessionId(id);
      setAdaptive(applySessionResults(state.results));
      const enrolled = loadStudy();
      setStudy(enrolled);
      const finisher =
        enrolled.enrolled && enrolled.arm === "engagement" ? FINISHER_BONUS : 0;
      setMotivation((current) =>
        current ? finishSessionMotivation(current, finisher) : current,
      );
      setHistory(
        appendSession({
          id,
          finishedAt: new Date().toISOString(),
          seed: state.config.seed,
          results: state.results,
          arm: enrolled.enrolled ? enrolled.arm : null,
        }),
      );
    }
    if (screen === "session") {
      setScreen("results");
      setPaused(false);
    }
  }, [state, screen]);

  const startSession = useCallback(
    (focus?: MechanicId) => {
      clearSessionSnapshot();      const seed = Date.now() >>> 0;
      motivatedBlock.current = -1;
      const adaptiveState = loadAdaptive();
      setAdaptive(adaptiveState);
      const arm = loadStudy();
      setStudy(arm);
      setMotivation(
        settings.motivationMode && !isMotivationPaused()
          ? createMotivation(
              seed,
              arm.enrolled && arm.arm === "engagement" ? VOLATILE_SCHEDULE : STEADY_SCHEDULE,
            )
          : null,
      );
      sessionStore.start(
        defaultSessionConfig(
          seed,
          settings.difficulty,
          settings.sessionLength,
          adaptiveState.enabled ? adaptiveState.levels : undefined,
          focus,
        ),
      );
      sessionStore.dispatch({ type: "begin" });
      setScreen("session");
      setPaused(false);
    },
    [settings.difficulty, settings.sessionLength],
  );

  const handleFocusMechanic = useCallback(
    (mechanic: MechanicId) => {
      startSession(mechanic);
    },
    [startSession],
  );

  const continueSession = useCallback(() => {
    if (sessionStore.getSnapshot()) {
      setPaused(false);
      setScreen("session");
    } else {
      startSession();
    }
  }, [startSession]);

  const endSession = useCallback(() => {
    clearSessionSnapshot();
    sessionStore.dispatch({ type: "abort" });
    sessionStore.reset();
    setMotivation(null);
    setPaused(false);
    setScreen("home");
  }, []);

  const respond = useCallback(() => {
    sessionStore.dispatch({ type: "respond" });
  }, []);

  const answer = useCallback((option: number) => {
    sessionStore.dispatch({ type: "answer", option });
  }, []);

  const nextBlock = useCallback(() => {
    sessionStore.dispatch({ type: "next" });
  }, []);

  const bankAndNext = useCallback(() => {
    setMotivation((current) => (current ? bankMotivation(current) : current));
    sessionStore.dispatch({ type: "next" });
  }, []);

  const riskAndNext = useCallback(() => {
    setMotivation((current) => (current ? riskMotivation(current) : current));
    sessionStore.dispatch({ type: "next" });
  }, []);

  useLayoutEffect(() => {
    if (!motivationActive || state?.phase !== "block_complete") return;
    const result = state.results[state.results.length - 1];
    if (!result || motivatedBlock.current === state.blockIndex) return;
    motivatedBlock.current = state.blockIndex;
    setMotivation((current) => {
      const base = current ?? createMotivation(state.config.seed);
      return addBlockMotivation(
        base,
        state.blockIndex,
        result,
        bestAccuracyFor(history, result.mechanic),
      );
    });
  }, [state, motivationActive, history]);

  const handleSafetyComplete = useCallback(() => {
    setSafety(loadSafety());
    startSession();
  }, [startSession]);

  const resetSafety = useCallback(() => {
    clearSafety();
    setSafety(null);
    setScreen("safety");
  }, []);

  const exportHistory = useCallback(() => {
    downloadHistoryExport(
      history,
      study.enrolled && study.studyId && study.arm && study.consentedAt
        ? { studyId: study.studyId, arm: study.arm, consentedAt: study.consentedAt }
        : null,
      { farChecks: loadFarChecks(), adverseEvents: loadAdverseEvents() },
    );
  }, [history, study]);

  const clearPracticeHistory = useCallback(() => {
    clearHistory();
    setHistory([]);
  }, []);

  const handleClearAdverseEvents = useCallback(() => {
    clearAdverseEvents();
    setAdverseEvents([]);
  }, []);

  const handlePauseMotivation = useCallback(() => {
    setEngagement(pauseMotivationToday());
  }, []);

  const handleResumeMotivation = useCallback(() => {
    setEngagement(resumeMotivation());
  }, []);

  const handleAdaptiveToggle = useCallback((enabled: boolean) => {
    setAdaptive(setAdaptiveEnabled(enabled));
  }, []);

  const handleDismissHeavyUse = useCallback(() => {
    setEngagement(dismissHeavyUseToday());
  }, []);

  const handleEnrollStudy = useCallback((studyId: string, arm: StudyArm) => {
    setStudy(enrollStudy({ studyId, arm, consented: true }));
  }, []);

  const handleWithdrawStudy = useCallback(() => {
    setStudy(withdrawStudy());
  }, []);

  const handleDismissMilestones = useCallback(() => {
    setEngagement((current) =>
      markMilestonesSeen(
        detectMilestones(history, adaptive.log, current.seenMilestones).map(
          (milestone) => milestone.id,
        ),
      ),
    );
  }, [history, adaptive.log]);

  const startFarCheck = useCallback(() => {
    setFarSeed(Date.now() >>> 0);
    setScreen("farcheck");
  }, []);

  const handleCompleteFarCheck = useCallback(
    (outcome: FarCheckOutcome) => {
      const enrolled = loadStudy();
      setStudy(enrolled);
      setFarChecks(
        logFarCheck({
          ...outcome,
          seed: farSeed ?? 1,
          arm: enrolled.enrolled ? enrolled.arm : null,
        }),
      );
      setFarSeed(null);
      setScreen("home");
    },
    [farSeed],
  );

  const handleCancelFarCheck = useCallback(() => {
    setFarSeed(null);
    setScreen("home");
  }, []);

  const handleSaveIntention = useCallback((when: string, where: string, pairing: string, obstacle: string) => {
    setIntention(saveIntention({ when, where, pairing, obstacle }));
  }, []);

  const handleClearIntention = useCallback(() => {
    clearIntention();
    setIntention(null);
  }, []);

  const clearData = useCallback(() => {
    clearSafety();
    clearSettings();
    clearHistory();
    clearIntention();
    clearAdverseEvents();
    clearEngagement();
    clearStudy();
    clearFarChecks();
    clearSessionSnapshot();
    setHistory([]);
    setAdverseEvents([]);
    setFarChecks([]);
    setEngagement(loadEngagement());
    setStudy(loadStudy());
    setLastSessionId(null);
    setIntention(null);
    setMotivation(null);
    window.location.reload();
  }, []);

  const setReducedMotion = useCallback(
    (value: boolean) => {
      const next = { ...settings, reducedMotion: value };
      setSettings(next);
      saveSettings(next);
    },
    [settings],
  );

  const setDifficulty = useCallback(
    (value: Difficulty) => {
      const next = { ...settings, difficulty: value };
      setSettings(next);
      saveSettings(next);
    },
    [settings],
  );

  const setSessionLength = useCallback(
    (value: SessionLength) => {
      const next = { ...settings, sessionLength: value };
      setSettings(next);
      saveSettings(next);
    },
    [settings],
  );

  const setWeeklyGoal = useCallback(
    (value: number) => {
      const next = { ...settings, weeklyGoal: value };
      setSettings(next);
      saveSettings(next);
    },
    [settings],
  );

  const setMotivationMode = useCallback(
    (value: boolean) => {
      const next = { ...settings, motivationMode: value };
      setSettings(next);
      saveSettings(next);
      if (!value) setMotivation(null);
    },
    [settings],
  );

  const setLargeText = useCallback(
    (value: boolean) => {
      const next = { ...settings, largeText: value };
      setSettings(next);
      saveSettings(next);
    },
    [settings],
  );

  const setHighContrast = useCallback(
    (value: boolean) => {
      const next = { ...settings, highContrast: value };
      setSettings(next);
      saveSettings(next);
    },
    [settings],
  );

  const setHideClock = useCallback(
    (value: boolean) => {
      const next = { ...settings, hideClock: value };
      setSettings(next);
      saveSettings(next);
    },
    [settings],
  );

  const view = state ? sessionView(state) : null;
  const week = weekStats(history);
  const today = todayStats(history);
  const hasSession =
    state !== null && state.phase !== "complete" && state.phase !== "aborted";

  return (
    <div className="app-shell">
      <header className="topbar">
        <button
          type="button"
          className="brand"
          onClick={() => setScreen("home")}
          aria-label="Noesis home"
        >
          <span className="brand-mark" aria-hidden="true">
            N
          </span>
          <span>Noesis</span>
        </button>
        {screen !== "session" ? (
          <nav className="nav" aria-label="Main">
            <button
              type="button"
              className={screen === "home" ? "nav-active" : ""}
              onClick={() => setScreen("home")}
              aria-current={screen === "home" ? "page" : undefined}
            >
              Home
            </button>
            <button
              type="button"
              className={screen === "evidence" ? "nav-active" : ""}
              onClick={() => setScreen("evidence")}
              aria-current={screen === "evidence" ? "page" : undefined}
            >
              Evidence
            </button>
            <button
              type="button"
              className={screen === "settings" ? "nav-active" : ""}
              onClick={() => setScreen("settings")}
              aria-current={screen === "settings" ? "page" : undefined}
            >
              Settings
            </button>
          </nav>
        ) : (
          <span className="session-tag">Session</span>
        )}
      </header>

      <main className="app-main">
        {screen === "safety" ? <SafetyScreen onComplete={handleSafetyComplete} /> : null}

        {screen === "home" ? (
          <HomeScreen
            hasSession={hasSession}
            history={history}
            week={week}
            today={today}
            intention={intention}
            sessionLength={settings.sessionLength}
            weeklyGoal={settings.weeklyGoal}
            heavyUse={detectHeavyUse(history)}
            heavyUseDismissed={isHeavyUseDismissedToday()}
            motivationOn={settings.motivationMode}
            motivationPaused={motivationPaused}
            milestones={newMilestones}
            studyArm={study.enrolled ? study.arm : null}
            farChecks={farChecks}
            onStartFarCheck={startFarCheck}
            weakest={weakestRecentMechanic(history)}
            onFocusMechanic={handleFocusMechanic}
            onStart={() => startSession()}
            onContinue={continueSession}
            onSaveIntention={handleSaveIntention}
            onClearIntention={handleClearIntention}
            onEvidence={() => setScreen("evidence")}
            onPauseMotivation={handlePauseMotivation}
            onDismissHeavyUse={handleDismissHeavyUse}
            onDismissMilestones={handleDismissMilestones}
          />
        ) : null}

        {screen === "session" ? (
          view ? (
            <SessionScreen
              view={view}
              paused={paused}
              onPause={() => setPaused(true)}
              onResume={() => setPaused(false)}
              onEnd={endSession}
              onNext={nextBlock}
              onBankAndNext={bankAndNext}
              onRiskAndNext={riskAndNext}
              onRespond={respond}
              onAnswer={answer}
              motivation={motivationActive ? motivation : null}
              targetMs={settings.sessionLength === "quick" ? 5 * 60_000 : 8 * 60_000}
              elapsedMs={state?.tick ?? 0}
              showClock={!settings.hideClock}
            />
          ) : (
            <section className="screen">
              <h1>No active session</h1>
              <p className="lede">Start a session to begin.</p>
              <button type="button" className="btn btn-primary" onClick={() => startSession()}>
                Start session
              </button>
            </section>
          )
        ) : null}

        {screen === "farcheck" && farSeed !== null ? (
          <FarCheckScreen
            seed={farSeed}
            onComplete={handleCompleteFarCheck}
            onCancel={handleCancelFarCheck}
          />
        ) : null}

        {screen === "results" ? (
          <ResultsScreen
            results={state?.results ?? []}
            motivation={motivation}
            sessionId={lastSessionId}
            newBests={newBests}
            onAdverseLogged={setAdverseEvents}
            onRestart={() => startSession()}
            onEvidence={() => setScreen("evidence")}
            onHome={() => setScreen("home")}
          />
        ) : null}

        {screen === "evidence" ? (
          <EvidenceScreen onHome={() => setScreen("home")} />
        ) : null}

        {screen === "settings" ? (
          <SettingsScreen
            reducedMotion={settings.reducedMotion}
            difficulty={settings.difficulty}
            sessionLength={settings.sessionLength}
            weeklyGoal={settings.weeklyGoal}
            motivationMode={settings.motivationMode}
            largeText={settings.largeText}
            highContrast={settings.highContrast}
            hideClock={settings.hideClock}
            historyCount={history.length}
            history={history}
            adverseEvents={adverseEvents}
            onClearAdverseEvents={handleClearAdverseEvents}
            study={study}
            onEnrollStudy={handleEnrollStudy}
            onWithdrawStudy={handleWithdrawStudy}
            motivationPaused={motivationPaused}
            onResumeMotivation={handleResumeMotivation}
            adaptiveEnabled={adaptive.enabled}
            adaptiveLevels={adaptive.levels}
            onAdaptiveToggle={handleAdaptiveToggle}
            onReducedMotion={setReducedMotion}
            onDifficulty={setDifficulty}
            onSessionLength={setSessionLength}
            onWeeklyGoal={setWeeklyGoal}
            onMotivationMode={setMotivationMode}
            onLargeText={setLargeText}
            onHighContrast={setHighContrast}
            onHideClock={setHideClock}
            onResetSafety={resetSafety}
            onExportHistory={exportHistory}
            onClearHistory={clearPracticeHistory}
            onClearData={clearData}
            onHome={() => setScreen("home")}
          />
        ) : null}
      </main>

      <footer className="footer">
        <p>
          {safety?.acknowledged
            ? "Safety profile saved on this device."
            : "Safety profile not set."}{" "}
          Noesis is not medical care.
        </p>
      </footer>
    </div>
  );
}
