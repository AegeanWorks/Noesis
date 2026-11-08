# Practice Menu and Pre-Test Briefing

**Status:** UX addendum to the Noesis evidence review, 2026-11-08
**Scope:** product-design decisions; not a new efficacy claim
**Evidence table:** [analysis/evidence_table.json](analysis/evidence_table.json)

---

## 1. Question

Two interface changes were requested:

1. a menu where a user can choose which test to run, or review their practice history;
2. a brief explanation before every test.

The design question is not "does a menu make people smarter?" It is narrower: does the
literature support explicit choice, clear expectations and low-stakes framing as engagement and
measurement practices, while keeping every cognitive claim inside its evidence boundary?

---

## 2. Search and inclusion

A targeted PubMed update was run on 2026-11-08 with NCBI E-utilities (`esearch`, `esummary`,
`efetch`). Search terms included:

- `self-determination theory intervention health meta-analysis` (39 records, 2 selected);
- `self-determination theory interventions health behavior change meta-analysis`;
- `test anxiety performance meta-analysis instructions` (14 records, 1 already included);
- `autonomy support adherence intervention meta-analysis` (screening only).

Two self-determination-theory (SDT) meta-analyses were added to the evidence table as
`context` records because they concern engagement design, not cognitive-training efficacy:

| PMID | Record | Design | Key result |
|---|---|---|---|
| 32437175 | Sheeran et al. (2020), *J Consult Clin Psychol* | Meta-analysis of 56 articles / 65 tests | Health-behaviour effect d+=0.23 (range 0.16-0.29); corrected for publication and small-sample bias d+>=0.15; autonomous motivation and perceived competence mediated the effect |
| 31983293 | Ntoumanis et al. (2021), *Health Psychol Rev* | Meta-analysis of 73 studies | Small-to-medium changes in SDT constructs and health behaviour at post-test and follow-up; need support and autonomous motivation were associated with behaviour change |

Both DOIs were checked against Crossref. The existing table already contains the test-anxiety,
retrieval-practice, spacing, interleaving and adherence records used below.

---

## 3. What the literature supports

### 3.1 Explicit choice is an autonomy-supportive engagement technique

SDT interventions produce small but reliable behaviour effects, and the effect is mediated by
autonomous motivation and perceived competence rather than by external pressure (PMID 32437175,
31983293). A menu that lets the user choose a single test or the interleaved session is therefore
a defensible autonomy support: it gives a reason, offers a meaningful choice and keeps the
default available. It is not evidence that choosing a test improves cognition.

### 3.2 Predictable, low-stakes instructions reduce avoidable pressure

Test anxiety is negatively related to performance across a 30-year meta-analytic review of 238
studies, and perceived difficulty and high-stakes consequences are associated with higher anxiety
(PMID 29156362). The existing review already requires low-stakes framing and an optional hidden
clock for this reason (R50). A short explanation before a block cannot remove evaluative pressure,
but it can make the task predictable: what will appear, what to press, how long it lasts, what is
measured and what is not claimed.

### 3.3 Briefing does not replace the training mechanism

The training mechanism remains retrieval practice with feedback (PMID 25150680), distributed
across days (PMID 16719566), with interleaving for the mixed session (PMID 31556629). A briefing
is a transparency layer before the retrieval attempt, not a study phase and not a cognitive
enhancement. It must not delay or replace the first response once the user begins.

### 3.4 History must stay per-block and level-aware

The review's measurement rule is domain-specific reporting with no composite "brain score"
(see SYNTHESIS §2.4 and DESIGN_IMPLICATIONS R2/R34). The history view therefore lists each block
with its mechanic, level, accuracy and existing summary. It never averages blocks across
mechanics and never turns the record into a single progress number. It also shows a neutral
started/completed/ended-early summary from the adherence log (R60); completion is information,
not a performance score.

### 3.5 Claim transparency is already a product requirement

Every user-facing claim links to its evidence record and date (R6), and each mechanic declares
what it does not claim (R1/R4/R5). The briefing repeats the claim boundary at the moment of
practice, when a user is most likely to infer that the task is a diagnostic test.

---

## 4. Design decisions

| Decision | Literature basis | Product boundary |
|---|---|---|
| Add a **Menu** screen with two tabs: Choose a test / History | SDT autonomy support (PMID 32437175, 31983293); focus sessions already exist (R43) | Choice is engagement design; it is not an efficacy claim |
| Offer the **full interleaved session** beside single-test sessions | Interleaving supports inductive learning (PMID 31556629); focus sessions are the deliberate blocked exception (R52) | The menu does not claim one format is superior for every user |
| Show **last/best accuracy and block count** per test | Self-monitoring and feedback on behaviour support adherence (PMID 40779747); per-domain reporting (R2/R34) | No composite score; bests compare only within the same level |
| Show **full local history** with per-block level and accuracy | Measurement transparency and portability (R2/R34/R49) | No account, server or cross-mechanic roll-up |
| Show a **brief explanation before every block** | Test anxiety and pressure (PMID 29156362); autonomy support (PMID 32437175); claim transparency (R6) | The briefing changes no score and makes no cognitive-enhancement claim |
| State **what it measures, how to respond, what is supported, what is not claimed, primary source and safety** | R1/R4/R5/R6; per-mechanic registry | The source is the same PMID used in the Evidence screen |
| Pause the session clock while the briefing is open | The block has not started; time-on-task must not include reading | Clock resumes only after **Begin test** |
| Keep the briefing **short and skippable in one action** | Low-stakes framing; no coercion | **Begin test** is the only gate; no timer, no quiz about the explanation |

---

## 5. Requirements added

- **R54:** A practice menu exposes every test and the complete local block history. Users can
  start one test, start or resume the interleaved session, or review past blocks. Explicit choice
  is autonomy support; it is not marketed as a cognitive advantage.
- **R55:** Before every test block, a brief explanation states the construct, the response rule,
  the supported claim, the explicit non-claims, a primary source and the safety note. The session
  clock does not run until the user begins. The briefing changes no score and is not itself
  evidence of efficacy.
- **R56:** History reports each block separately with its mechanic, level, accuracy and summary.
  It never creates a composite score and never compares blocks across levels.

---

## 6. What this addendum does not claim

- It does not claim that a menu, a briefing or choice improves cognition, intelligence or
  academic achievement.
- It does not claim that the briefing reduces clinical anxiety; it only removes avoidable
  ambiguity and pressure from the practice flow.
- It does not change the far-transfer conclusion: broad transfer remains unsupported
  (PMID 27697851, 27474138).
- It does not replace the safety review; photosensitivity and adverse-event rules still apply
  (R14-R18).

---

## 7. References

The two SDT records are in [REFERENCES.md](REFERENCES.md) and the evidence table. The remaining
sources are existing included records:

- PMID 29156362 - test anxiety, 30-year meta-analysis.
- PMID 25150680 - testing versus restudy.
- PMID 16719566 - distributed practice.
- PMID 31556629 - interleaving and moderators.
- PMID 40779747 - behaviour-change techniques in exergames.
- PMID 27697851 / 27474138 - far-transfer limits.
- PMID 24417410 - ACTIVE 10-year follow-up.
