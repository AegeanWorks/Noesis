import { MECHANIC_META } from "../../engine/evidence";
import { Button } from "../components/Button";
import { EvidenceBadge } from "../components/EvidenceBadge";

interface EvidenceScreenProps {
  onHome: () => void;
}

export function EvidenceScreen({ onHome }: EvidenceScreenProps) {
  return (
    <section className="screen evidence-screen">
      <p className="eyebrow">Evidence</p>
      <h1>What each mechanic can and cannot claim</h1>
      <p className="lede">
        The app is built from a PRISMA-style umbrella review of 84 reviews and trials. Each
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
                  <a
                    href={`https://pubmed.ncbi.nlm.nih.gov/${citation.pmid}/`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {citation.label}
                  </a>{" "}
                  <span className="pmid">PMID {citation.pmid}</span>
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
            <a
              href="https://pubmed.ncbi.nlm.nih.gov/19217383/"
              target="_blank"
              rel="noreferrer"
            >
              Clark et al. (2009): near misses increase desire to play
            </a>{" "}
            <span className="pmid">PMID 19217383</span>
          </li>
          <li>
            <a
              href="https://pubmed.ncbi.nlm.nih.gov/33028074/"
              target="_blank"
              rel="noreferrer"
            >
              Global gaming-disorder prevalence: 3.05%
            </a>{" "}
            <span className="pmid">PMID 33028074</span>
          </li>
          <li>
            <a
              href="https://pubmed.ncbi.nlm.nih.gov/34982715/"
              target="_blank"
              rel="noreferrer"
            >
              Gamification meta-analysis: short-term effects
            </a>{" "}
            <span className="pmid">PMID 34982715</span>
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
