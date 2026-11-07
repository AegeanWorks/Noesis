import type { MechanicMeta } from "../../engine/types";
import { Button } from "./Button";
import { EvidenceBadge } from "./EvidenceBadge";

interface TestBriefingProps {
  meta: MechanicMeta;
  blockIndex: number;
  blockCount: number;
  difficulty: number | null;
  onBegin: () => void;
}

export function TestBriefing({
  meta,
  blockIndex,
  blockCount,
  difficulty,
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
