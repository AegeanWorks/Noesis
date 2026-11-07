# Research Data Collection and Informed Consent

**Status:** data-collection addendum to the Noesis evidence review, 2026-11-08
**Scope:** consent, local data return and email hand-off; not a new efficacy claim
**Evidence table:** [analysis/evidence_table.json](analysis/evidence_table.json)

---

## 1. Question

Noesis is a local-only practice app. To use it as a data collector for future articles, two
things had to be added without turning it into a server-backed product:

1. a documented informed-consent process for research data sharing;
2. a way for a participant to send the de-identified export to the study team's email address.

The design question is not whether email is a good clinical data channel. It is how to add a
consent-gated, user-triggered hand-off that keeps the participant in control and keeps the
product's existing privacy posture.

---

## 2. Search and inclusion

A targeted PubMed update was run on 2026-11-08 with NCBI E-utilities (`esearch`, `esummary`,
`efetch`). Search terms included:

- `"e-consent" OR "electronic consent"` with a systematic-review filter (8 records);
- `"informed consent" AND "digital" AND "systematic review"` (81 records);
- `"broad consent" AND systematic review` (4 records);
- `data sharing` knowledge/attitudes/practices reviews (screening only).

Two e-consent systematic reviews were added to the evidence table as `context` records because
they concern the consent process, not cognitive-training efficacy:

| PMID | Record | Design | Key result |
|---|---|---|---|
| 37656499 | Cohen et al. (2023), *J Med Internet Res* | Systematic review of 35 studies / 13,281 participants | eConsent was better or not worse than paper for comprehension (20 studies), acceptability (8) and usability (5); no study favoured paper; cycle time increased; enrollment/retention data were limited |
| 36810093 | Mazzochi et al. (2023), *Trials* | Systematic review of 12 studies / 8,864 participants | Enrolment effects were mixed; e-consent may improve comprehension and recall; high heterogeneity and risk of bias; meta-analysis was not possible |

Both DOIs were checked against Crossref. Two further sources stayed narrative-only:

- PMID 42443473, a 2026 Perspective on digital-phenotyping data banking, recommends hybrid
  consent models that combine broad consent with dynamic consent, plus privacy-preserving
  governance and participant control.
- PMID 41813053, a measurement systematic review of data-sharing knowledge, attitudes and
  practices, found that most surveys lacked rigorous development and reporting, so its
  quantitative estimates are low-certainty context rather than design targets.

---

## 3. What the literature supports

### 3.1 Digital consent can improve comprehension, but does not automatically improve enrolment

The larger eConsent review found better or non-inferior comprehension, acceptability and
usability than paper, with no study favouring paper (PMID 37656499). The smaller review found
mixed enrolment effects and possible gains in comprehension and recall (PMID 36810093). The
product should therefore use digital consent to make the information easier to read and the
record easier to audit, not to claim that consenting digitally raises participation.

### 3.2 Consent needs a governance model, not just a checkbox

The data-banking Perspective argues for hybrid broad-plus-dynamic consent, meaningful
participant control, privacy-preserving governance and trust-building with people with lived
experience (PMID 42443473). For a local-only app, the proportionate version is:

- explicit consent for the current study and for future articles;
- a random participant code instead of a name or email in the data file;
- a versioned consent record included in the export;
- a withdrawal path that stops future sends;
- a clear statement that data already sent cannot be recalled.

### 3.3 The hand-off must remain user-triggered

The existing review requires local-first storage, data minimisation and explicit non-claims
(R6, R49). A server or background upload would add a new data controller, credential and
security surface. The app therefore prepares the export and an email draft locally. The user
must attach the downloaded JSON file and press send in their own email client.

---

## 4. Design decisions

| Decision | Literature basis | Product boundary |
|---|---|---|
| Add a separate **research consent** screen, not a single safety checkbox | eConsent comprehension and audit findings (PMID 37656499, 36810093); governance and participant control (PMID 42443473) | The existing safety acknowledgement remains separate; research sharing is optional |
| Write the consent in **English and Turkish** | The user's context is Turkish; eConsent comprehension depends on readable, participant-facing language | The study team must review the translation and the local ethics requirements |
| Require **five confirmations** before consent | Comprehension-first eConsent (PMID 37656499) | The checkboxes document understanding; they do not prove it |
| Store a **versioned consent record** with a random participant code | Auditability and data quality concerns in the eConsent review | No name, email or account identifier is stored in the data file |
| Block consent when the **study contact email** is not configured | A consent form without a contact is not informed | The study team must set the address in Settings before deployment |
| **Download the JSON** and prepare a **mailto draft**; never auto-send | Local-first posture (R49); no new server or credential | The user attaches the file and sends it; the email provider sees the sender address |
| Include consent metadata in the export but **not the study contact email** | Data minimisation; the contact is not participant data | The email draft carries the recipient; the JSON carries only the consent scope and code |
| **Withdrawal stops future emails** but keeps the audit record | Dynamic/broad consent governance (PMID 42443473); R49 | Already-sent data cannot be recalled; the consent screen says so |
| Add a browser proof for the full flow | eConsent usability evidence (PMID 37656499) | The proof covers consent, language switch, download and withdrawal, not a real mailbox |

---

## 5. Requirements added

- **R57:** Research data sharing is opt-in, consent-gated and pseudonymous. The export carries a
  random participant code and a versioned consent record, but no name, email address or account
  identifier. The study contact email is never written into the data file.
- **R58:** Informed consent is a separate, bilingual (English/Turkish), versioned document
  covering purpose, data, hand-off, voluntariness, risks, benefits, confidentiality, retention,
  withdrawal and contact. Consent is blocked when the study contact is missing; withdrawal is
  available in Settings and stops future emails.
- **R59:** The email hand-off is user-triggered and local: the app downloads the JSON file and
  prepares a recipient/subject/body draft with attachment instructions. It never sends
  automatically, never stores an SMTP credential, and never uploads data to a Noesis server.

---

## 6. What this addendum does not claim

- It is not legal advice and does not replace ethics-committee, IRB or KVKK/GDPR review.
- It does not claim that e-consent increases enrolment; the enrolment evidence is mixed.
- It does not claim that email is a secure clinical channel. The consent text tells the
  participant that their email provider will see their address.
- It does not make the research data anonymous. The participant code is pseudonymous; the study
  team is responsible for the approved re-identification and retention rules.
- It does not change any cognitive score or add a new cognitive claim.

---

## 7. References

The two e-consent records are in [REFERENCES.md](REFERENCES.md) and the evidence table. The
narrative-only sources are:

- PMID 42443473 - global data banking in digital phenotyping: hybrid broad/dynamic consent,
  governance and participant control.
- PMID 41813053 - data-sharing knowledge, attitudes and practices: measurement review,
  low-certainty survey evidence.
