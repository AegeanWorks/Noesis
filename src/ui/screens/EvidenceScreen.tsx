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
        The app is built from a PRISMA-style umbrella review of 163 reviews and trials. Each
        mechanic carries its own claim boundary; there is no combined “brain training works”
        claim.
      </p>

      <nav className="evidence-jump" aria-label="Jump to a mechanic">
        <span className="evidence-jump-label">Jump to</span>
        {Object.values(MECHANIC_META).map((meta) => (
          <button
            type="button"
            className="evidence-jump-chip"
            aria-label={`Jump to ${meta.name}`}
            onClick={() => {
              const reduced = document.documentElement.classList.contains("reduced-motion");
              document
                .getElementById(`evidence-${meta.id}`)
                ?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
              window.history.replaceState(null, "", `#evidence-${meta.id}`);
            }}
            key={meta.id}
          >
            {meta.name}
          </button>
        ))}
      </nav>

      <div className="stack">
        {Object.values(MECHANIC_META).map((meta) => (
          <article className="card evidence-card" id={`evidence-${meta.id}`} key={meta.id}>
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
          <li>
            <CitationLink
              href="https://pubmed.ncbi.nlm.nih.gov/35989930/"
              label="Motivation supports adherence, not game-format outcomes"
              pmid="35989930"
            />
          </li>
          <li>
            <CitationLink
              href="https://pubmed.ncbi.nlm.nih.gov/37531408/"
              label="Gameplay features, not genre labels, predict transfer"
              pmid="37531408"
            />
          </li>
          <li>
            <CitationLink
              href="https://pubmed.ncbi.nlm.nih.gov/29172564/"
              label="Action-game effects shrink in interventions and with bias correction"
              pmid="29172564"
            />
          </li>
          <li>
            <CitationLink
              href="https://pubmed.ncbi.nlm.nih.gov/36201384/"
              label="Deposits cut uptake and loss frames underperform gain frames"
              pmid="36201384"
            />
          </li>
          <li>
            <CitationLink
              href="https://pubmed.ncbi.nlm.nih.gov/37469930/"
              label="Hypernudging and autonomy: why rewards stay conspicuous and optional"
              pmid="37469930"
            />
          </li>
          <li>
            <CitationLink
              href="https://pubmed.ncbi.nlm.nih.gov/26657967/"
              label="Reward can bias what is learned, so momentum never changes scores"
              pmid="26657967"
            />
          </li>
          <li>
            <CitationLink
              href="https://pubmed.ncbi.nlm.nih.gov/27590829/"
              label="Cue-reactivity models explain why no real stakes or push cues"
              pmid="27590829"
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
        <p className="fine" data-testid="transfer-gradient-evidence">
          Three meta-analyses of chess, music and working-memory training found that effect sizes
          shrink as study quality rises and far transfer rarely occurs.{" "}
          <CitationLink
            href="https://pubmed.ncbi.nlm.nih.gov/29276344/"
            label="Sala & Gobet 2017: does far transfer exist?"
            pmid="29276344"
          />
        </p>
        <h3 data-testid="not-supported-heading">What the review does not support</h3>
        <ul className="citations" data-testid="not-supported-list">
          <li>
            <CitationLink
              href="https://pubmed.ncbi.nlm.nih.gov/22612437/"
              label="No general-intelligence or academic gain from working-memory training"
              pmid="22612437"
            />
          </li>
          <li>
            <CitationLink
              href="https://pubmed.ncbi.nlm.nih.gov/36977764/"
              label="No ADHD symptom treatment from computerized training (blinded outcomes)"
              pmid="36977764"
            />
          </li>
          <li>
            <CitationLink
              href="https://pubmed.ncbi.nlm.nih.gov/24607830/"
              label="No established everyday-function benefit in healthy adults"
              pmid="24607830"
            />
          </li>
          <li>
            <CitationLink
              href="https://pubmed.ncbi.nlm.nih.gov/37065695/"
              label="No proven extra working-memory benefit from combining exercise with cognitive training"
              pmid="37065695"
            />
          </li>
          <li>
            <CitationLink
              href="https://pubmed.ncbi.nlm.nih.gov/38230719/"
              label="No reliable prediction of training response from baseline expectancy"
              pmid="38230719"
            />
          </li>
          <li>
            <CitationLink
              href="https://pubmed.ncbi.nlm.nih.gov/33913064/"
              label="No mood-disorder treatment claim from consumer brain training"
              pmid="33913064"
            />
          </li>
        </ul>
      </aside>

      <Button variant="ghost" onClick={onHome}>
        Back to home
      </Button>
    </section>
  );
}
