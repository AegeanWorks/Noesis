import type { Confidence, MechanicMeta } from "../../engine/types";
import { Button } from "./Button";
import { EvidenceBadge } from "./EvidenceBadge";

interface TestBriefingProps {
  meta: MechanicMeta;
  blockIndex: number;
  blockCount: number;
  difficulty: number | null;
  confidence?: Confidence | null | undefined;
  onConfidence?: ((value: Confidence) => void) | undefined;
  onBegin: () => void;
}

const CONFIDENCE_OPTIONS: readonly { value: Confidence; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export function TestBriefing({
  meta,
  blockIndex,
  blockCount,
  difficulty,
  confidence = null,
  onConfidence,
  onBegin,
}: TestBriefingProps) {
  const source = meta.citations[0];

  return (
    <article
      className="card test-briefing"
      data-testid="test-briefing"
      aria-labelledby="test-briefing-title"
    >
      <div className="card-top">
        <div>
          <p className="eyebrow">
            Before this test · Block {blockIndex + 1} of {blockCount}
            {difficulty !== null ? ` · Level ${difficulty}` : ""}
          </p>
          <h2 id="test-briefing-title">{meta.name}</h2>
          <p className="muted">{meta.tagline}</p>
        </div>
        <EvidenceBadge level={meta.claimLevel} />
      </div>

      <section className="briefing-section">
        <h3>What this measures</h3>
        <p>{meta.brief}</p>
      </section>

      <section className="briefing-section">
        <h3>How to respond</h3>
        <p>{meta.instructions}</p>
        <p className="fine">
          Your score starts when you begin. You can pause at any time after that.
        </p>
      </section>

      {meta.strategyHint ? (
        <section
          className="briefing-section briefing-strategy"
          data-testid="briefing-strategy"
        >
          <h3>Strategy tip</h3>
          <p>{meta.strategyHint}</p>
        </section>
      ) : null}

      {onConfidence ? (
        <section className="briefing-section briefing-confidence">
          <h3>Confidence check (optional)</h3>
          <p className="fine">
            How confident are you about this block? This is a reflection, not a score or a
            diagnostic calibration.
          </p>
          <div className="confidence-options" role="group" aria-label="Confidence check">
            {CONFIDENCE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`confidence-option${
                  confidence === option.value ? " confidence-option-active" : ""
                }`}
                aria-pressed={confidence === option.value}
                data-testid={`confidence-${option.value}`}
                onClick={() => onConfidence(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="fine confidence-evidence" data-testid="confidence-evidence">
            Evidence note: item-level confidence judgments can slightly change what people
            remember (g≈0.22), and confidence is often a weak predictor of actual accuracy. This
            block-level prompt is a reflection, not a validated memory intervention.{" "}
            <a
              href="https://pubmed.ncbi.nlm.nih.gov/40875340/"
              target="_blank"
              rel="noreferrer"
            >
              PMID 40875340
            </a>
          </p>
        </section>
      ) : null}

      <section className="briefing-section">
        <h3>What the evidence supports</h3>
        <p>{meta.claim}</p>
        <p className="fine">{meta.qualifier}</p>
      </section>

      <section className="briefing-section">
        <h3>Not claimed</h3>
        <ul className="briefing-list">
          {meta.notClaimed.map((claim) => (
            <li key={claim}>{claim}</li>
          ))}
        </ul>
      </section>

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

      <p className="fine">
        <strong>Safety:</strong> {meta.safety} This explanation does not change your score.
      </p>

      <Button onClick={onBegin} className="wide" data-testid="begin-test">
        Begin test
      </Button>
    </article>
  );
}
