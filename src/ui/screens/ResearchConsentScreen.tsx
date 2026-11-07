import { useState } from "react";
import { RESEARCH_CONSENT_TEXT } from "../../content/researchConsentText";
import {
  RESEARCH_CONSENT_VERSION,
  giveResearchConsent,
  isActiveResearchConsent,
  type ConsentLanguage,
  type ResearchConsent,
} from "../../storage/researchConsent";
import { isValidEmail } from "../../storage/researchSettings";
import { Button } from "../components/Button";

interface ResearchConsentScreenProps {
  studyContactEmail: string;
  existingConsent: ResearchConsent | null;
  onComplete: (consent: ResearchConsent) => void;
  onCancel: () => void;
}

export function ResearchConsentScreen({
  studyContactEmail,
  existingConsent,
  onComplete,
  onCancel,
}: ResearchConsentScreenProps) {
  const active = isActiveResearchConsent(existingConsent);
  const [language, setLanguage] = useState<ConsentLanguage>(
    existingConsent?.language ?? "en",
  );
  const copy = RESEARCH_CONSENT_TEXT[language];
  const [checked, setChecked] = useState<boolean[]>(() =>
    copy.checkboxes.map(() => false),
  );
  const [error, setError] = useState<string | null>(null);
  const contactReady = isValidEmail(studyContactEmail);
  const contact = studyContactEmail.trim() || "—";
  const canSubmit = contactReady && checked.every(Boolean);
  const stale =
    existingConsent !== null && existingConsent.version !== RESEARCH_CONSENT_VERSION;
  const withdrawn = existingConsent?.withdrawnAt != null && !active;

  const toggle = (index: number) => {
    setChecked((current) =>
      current.map((value, itemIndex) => (itemIndex === index ? !value : value)),
    );
  };

  const submit = () => {
    const consent = giveResearchConsent({
      studyContactEmail,
      scopes: { dataSharing: true, futureArticles: true },
      language,
    });
    if (!consent) {
      setError(copy.missingContact);
      return;
    }
    onComplete(consent);
  };

  return (
    <section className="screen consent-screen">
      <div className="consent-head">
        <div>
          <p className="eyebrow">Research</p>
          <h1>{copy.title}</h1>
        </div>
        <div className="consent-language" role="group" aria-label="Consent language">
          <Button
            variant={language === "en" ? "primary" : "ghost"}
            onClick={() => setLanguage("en")}
            aria-pressed={language === "en"}
            data-testid="research-consent-language-en"
          >
            English
          </Button>
          <Button
            variant={language === "tr" ? "primary" : "ghost"}
            onClick={() => setLanguage("tr")}
            aria-pressed={language === "tr"}
            data-testid="research-consent-language-tr"
          >
            Türkçe
          </Button>
        </div>
      </div>

      <p className="lede">{copy.lede}</p>
      <p className="fine">
        {copy.versionLabel} · {copy.contactLabel}: {contact}
      </p>

      {active ? (
        <section className="card" data-testid="consent-active">
          <h2>{copy.activeTitle}</h2>
          <p>{copy.activeBody}</p>
          <p className="fine">
            Participant code: <strong>{existingConsent?.participantCode}</strong>
          </p>
          <p className="fine">Consent given: {existingConsent?.consentedAt}</p>
          <div className="hero-actions">
            <Button variant="ghost" onClick={onCancel}>
              Back to settings
            </Button>
          </div>
        </section>
      ) : (
        <>
          {withdrawn ? (
            <p className="notice" data-testid="consent-withdrawn" role="status">
              {copy.withdrawnNotice}
            </p>
          ) : null}
          {stale ? (
            <p className="notice notice-warn" data-testid="consent-stale" role="status">
              {copy.staleNotice}
            </p>
          ) : null}
          {!contactReady ? (
            <p
              className="notice notice-warn"
              data-testid="consent-contact-missing"
              role="alert"
            >
              {copy.missingContact}
            </p>
          ) : null}

          <div className="consent-sections">
            {copy.sections.map((section) => (
              <section className="card consent-section" key={section.heading}>
                <h2>{section.heading}</h2>
                <p>{section.body.replace("{email}", contact)}</p>
              </section>
            ))}
          </div>

          <section className="card consent-agreement">
            <h2>{copy.agreementHeading}</h2>
            {copy.checkboxes.map((label, index) => (
              <label className="check" key={label}>
                <input
                  type="checkbox"
                  checked={checked[index] ?? false}
                  onChange={() => toggle(index)}
                />
                {label}
              </label>
            ))}
            {error ? (
              <p className="error" role="alert">
                {error}
              </p>
            ) : null}
            <div className="hero-actions">
              <Button
                onClick={submit}
                disabled={!canSubmit}
                data-testid="give-consent"
              >
                {copy.submit}
              </Button>
              <Button variant="ghost" onClick={onCancel}>
                {copy.cancel}
              </Button>
            </div>
            <p className="fine">{copy.notLegal}</p>
          </section>
        </>
      )}
    </section>
  );
}
