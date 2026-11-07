import { MECHANIC_META } from "../../engine/evidence";
import { Button } from "../components/Button";
import { EvidenceBadge } from "../components/EvidenceBadge";

interface EvidenceScreenProps {
  onHome: () => void;
}

function CitationLink({
  href,
  label,
  pmid,
}: {
  href: string;
  label: string;
  pmid: string;
}) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      <span className="citation-label">{label}</span>
      <span className="pmid">PMID {pmid}</span>
    </a>
  );
}

export function EvidenceScreen({ onHome }: EvidenceScreenProps) {
  return (
    <section className="screen evidence-screen">
      <p className="eyebrow">Evidence</p>
      <h1>What each mechanic can and cannot claim</h1>
      <p className="lede">
        The app is built from a PRISMA-style umbrella review of 112 reviews and trials. Each
        mechanic carries its own claim boundary; there is no combined “brain training works”
        claim.
      </p>

      <div className="stack">
        {Object.values(MECHANIC_META).map((meta) => (
          <article className="card evidence-card" key={meta.id}>
            <div className="card-top">
              <div>
                <p className="eyebrow">{meta.tagline}</p>
                <h2>{meta.name}</h2>
              </div>
              <EvidenceBadge level={meta.claimLevel} />
            </div>
            <p className="claim">{meta.claim}</p>
            <p className="fine">{meta.qualifier}</p>
            <h3>Not claimed</h3>
            <ul>
              {meta.notClaimed.map((claim) => (
                <li key={claim}>{claim}</li>
              ))}
            </ul>
            <h3>Sources</h3>
            <ul className="citations">
              {meta.citations.map((citation) => (
                <li key={citation.pmid}>
                  <CitationLink
                    href={`https://pubmed.ncbi.nlm.nih.gov/${citation.pmid}/`}
                    label={citation.label}
                    pmid={citation.pmid}
                  />
                </li>
              ))}
            </ul>
            <p className="fine">Safety: {meta.safety}</p>
          </article>
        ))}
      </div>

      <aside className="notice">
        <h3>How Motivation mode is bounded</h3>
        <p>
          Motivation mode adds variable bonus momentum, streaks, a near-best cue, corrective
          N-back off-by-one feedback and optional bonus-only risk. It never changes your cognitive scores. Core progress is banked
          before any risk, odds are disclosed, and the mode can be switched off. The same
          mechanisms are implicated in gambling harm, which is why the stakes are cosmetic and
          capped.
        </p>
        <ul className="citations">
          <li>
            <CitationLink
              href="https://pubmed.ncbi.nlm.nih.gov/19217383/"
              label="Clark et al. (2009): near misses increase desire to play"
              pmid="19217383"
            />
          </li>
          <li>
            <CitationLink
              href="https://pubmed.ncbi.nlm.nih.gov/33028074/"
              label="Global gaming-disorder prevalence: 3.05%"
              pmid="33028074"
            />
          </li>
          <li>
            <CitationLink
              href="https://pubmed.ncbi.nlm.nih.gov/34982715/"
              label="Gamification meta-analysis: short-term effects"
              pmid="34982715"
            />
          </li>
        </ul>
      </aside>

      <aside className="notice">
        <h3>Near transfer vs far transfer</h3>
        <p>
          Near transfer means improvement on a task close to what you practised. Far transfer
          means improvement in an untrained skill or everyday life. The evidence supports near
          transfer far more reliably than far transfer, which is why this app reports blocks
          separately and makes no intelligence claim.
        </p>
      </aside>

      <Button variant="ghost" onClick={onHome}>
        Back to home
      </Button>
    </section>
  );
}
