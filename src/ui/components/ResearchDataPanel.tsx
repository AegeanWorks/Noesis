import { useState } from "react";
import type { ResearchEmailDraft } from "../../storage/researchEmail";
import {
  isActiveResearchConsent,
  type ResearchConsent,
} from "../../storage/researchConsent";
import {
  isValidEmail,
  normalizeEmail,
  type ResearchSettings,
} from "../../storage/researchSettings";
import { Button } from "./Button";

export interface ResearchPanelState {
  settings: ResearchSettings;
  consent: ResearchConsent | null;
  draft: ResearchEmailDraft | null;
  error: string | null;
  onStudyContactEmail: (value: string) => void;
  onOpenConsent: () => void;
  onWithdrawConsent: () => void;
  onPrepareEmail: () => void;
}

export function ResearchDataPanel({
  settings,
  consent,
  draft,
  error,
  onStudyContactEmail,
  onOpenConsent,
  onWithdrawConsent,
  onPrepareEmail,
}: ResearchPanelState) {
  const active = isActiveResearchConsent(consent);
  const withdrawnAt = consent?.withdrawnAt ?? null;
  const contactReady = isValidEmail(settings.studyContactEmail);
  const contactMatches =
    !active ||
    normalizeEmail(settings.studyContactEmail) ===
      normalizeEmail(consent?.studyContactEmail ?? "");
  const [copied, setCopied] = useState(false);

  const copyDraft = async () => {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draft.body);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="card stack research-panel" data-testid="research-panel">
      <h2>Research data sharing</h2>
      <p className="fine">
        Optional. Your practice data stays on this device until you choose to prepare it
        for the study team. There is no account and no server.
      </p>

      <label className="fine" htmlFor="study-contact-email">
        Study team email (set by the researcher)
      </label>
      <input
        id="study-contact-email"
        type="email"
        inputMode="email"
        maxLength={254}
        value={settings.studyContactEmail}
        placeholder="study@example.org"
        onChange={(event) => onStudyContactEmail(event.target.value)}
      />

      {active ? (
        <p className="fine" data-testid="research-consent-status">
          Consent given {consent?.consentedAt}. Participant code{" "}
          <strong>{consent?.participantCode}</strong>. Consent version{" "}
          {consent?.version}.
        </p>
      ) : withdrawnAt ? (
        <p className="fine" data-testid="research-consent-status">
          Consent withdrawn {withdrawnAt}. Future research emails are disabled.
        </p>
      ) : (
        <p className="fine" data-testid="research-consent-status">
          Consent not given. Read the informed consent before sending data.
        </p>
      )}

      {!contactReady ? (
        <p className="fine" data-testid="study-email-hint">
          Enter a valid study email before sending.
        </p>
      ) : null}
      {active && !contactMatches ? (
        <p
          className="notice notice-warn"
          data-testid="research-contact-changed"
          role="status"
        >
          The study email changed. Read the informed consent again before sending data.
        </p>
      ) : null}

      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="hero-actions">
        <Button variant="ghost" onClick={onOpenConsent} data-testid="open-research-consent">
          {active ? "Review informed consent" : "Read informed consent"}
        </Button>
        {active ? (
          <Button variant="ghost" onClick={onWithdrawConsent}>
            Withdraw research consent
          </Button>
        ) : null}
        <Button
          onClick={onPrepareEmail}
          disabled={!active || !contactReady || !contactMatches}
          data-testid="send-research-data"
        >
          Send research data
        </Button>
      </div>

      {draft ? (
        <section className="card research-email-draft" data-testid="research-email-draft">
          <h3>Email draft ready</h3>
          <p>
            Your data file was downloaded as <code>{draft.filename}</code>.
          </p>
          <p className="fine">
            Recipient: <strong>{draft.recipient}</strong>
          </p>
          <p className="fine">Subject: {draft.subject}</p>
          <pre className="code email-body">{draft.body}</pre>
          <div className="hero-actions">
            <a
              className="btn btn-primary"
              href={draft.mailto}
              data-testid="open-email-app"
            >
              Open email app
            </a>
            <Button variant="ghost" onClick={copyDraft}>
              {copied ? "Copied email text" : "Copy email text"}
            </Button>
          </div>
          <p className="fine">
            The file is not attached automatically. Attach <code>{draft.filename}</code>{" "}
            to the email before sending. The app did not send anything.
          </p>
        </section>
      ) : null}

      <p className="fine">
        The email is prepared locally. Your email provider will see your address when you
        send it. Withdrawing consent stops future emails; data already sent cannot be
        recalled.
      </p>
      <p className="fine" data-testid="fair-evidence">
        <strong>Why an export file:</strong> the FAIR principles favour documented, reusable
        data, so the JSON manifest and CSV layouts are field-documented and stay on your device
        until you choose to share.{" "}
        <a href="https://pubmed.ncbi.nlm.nih.gov/26978244/" target="_blank" rel="noreferrer">
          Wilkinson et al. 2016
        </a>{" "}
        <span className="pmid">PMID 26978244</span>.{" "}
        <strong>Consent stays versioned and revocable</strong> so participation remains under your
        control as the study evolves.{" "}
        <a href="https://pubmed.ncbi.nlm.nih.gov/42443473/" target="_blank" rel="noreferrer">
          O'Dea et al. 2026
        </a>{" "}
        <span className="pmid">PMID 42443473</span>
      </p>
    </div>
  );
}
