# Safety and Regulatory Boundary

**Review:** Noesis evidence review v1.0  
**Status:** Risk analysis and design constraints; not legal advice  
**Evidence:** [SYNTHESIS.md](SYNTHESIS.md), [analysis/evidence_table.json](analysis/evidence_table.json)

---

## 1. Why this document exists

A multimodal brain-training product can expose users to:

- flashing lights and high-contrast patterns (seizure risk);
- immersive VR (cybersickness, falls);
- exercise (musculoskeletal injury, cardiac events in unscreened users);
- audio (hearing damage, annoyance, sleep disruption);
- EEG hardware (skin irritation, hygiene, data sensitivity);
- game mechanics (compulsive use, emotional distress);
- misleading claims (consumer-protection and medical-device risk).

The evidence review found that safety reporting in this field is inconsistent. A product that wants to be trusted must do better than the literature it cites.

---

## 2. Photosensitive seizures

### 2.1 Risk

The Epilepsy Foundation consensus and review report:

- Photosensitivity (abnormal EEG response to light or pattern) occurs in approximately **0.3-3%** of the population.
- The estimated prevalence of seizures from light stimuli is about **1 per 10,000**, or **1 per 4,000** in people aged 5-24.
- People with epilepsy have a **2-14%** chance of seizures precipitated by light or pattern.
- Frequencies of **15-25 Hz** are most provocative; the range is **1-65 Hz**.
- A flash is potentially hazardous at luminance **≥20 cd/m²**, frequency **≥3 Hz**, and solid visual angle **≥0.006 steradians** (about 10% of the central visual field).
- Transitions to or from saturated red are also risky.
- Patterns with more than five light-dark stripe pairs, high luminance and certain motion can provoke seizures.

Sources: PMIDs 16146439, 16146438, 41283196.

### 2.2 Design limits

Any visual content must enforce:

| Parameter | Limit | Enforcement |
|---|---|---|
| Flash frequency | No flashing above 3 Hz; avoid 10-20 Hz entirely | Render-time validator |
| Luminance | Keep flashes below 20 cd/m²; avoid full-screen white flashes | Render-time validator |
| Red | No saturated-red flashing or red/blue alternation | Content lint |
| Pattern density | No more than five light-dark stripe pairs when moving/oscillating | Content lint |
| Screen area | No large-area high-contrast flashing | Render-time validator |
| User control | Pause/stop always available; no forced flashing | UI requirement |
| Screening | Pre-use questionnaire for epilepsy/photosensitivity | Onboarding |
| Warning | Clear warning before any visual entrainment | UI requirement |

### 2.3 What not to build

- No "photic driving" or strobe mode in the MVP.
- No visual entrainment at 10-20 Hz.
- No user-uploaded flashing content without validation.
- No autoplay of flashing content.

---

## 3. Exercise and movement

### 3.1 Risk

FINGER reported adverse events in **46 (7%)** intervention participants versus **6 (1%)** controls; the most common was musculoskeletal pain (**32 participants, 5%**, versus none) (PMID 25771249). Older and frail users are at higher risk of falls, cardiac events and musculoskeletal injury.

### 3.2 Controls

- Pre-participation health screen (PAR-Q+ or equivalent).
- Fall-risk screen for older adults.
- Progression limits and rest days.
- No competitive or high-intensity defaults.
- Stop rules for chest pain, dizziness, shortness of breath, joint pain.
- Adverse-event capture and follow-up.
- Clear statement that the product is not a substitute for medical advice.

---

## 4. Audio

### 4.1 Risk

- Hearing damage from high volume or long exposure.
- Sleep disruption if used at bedtime.
- Annoyance, anxiety or dissociation in some users.
- Binaural beats require headphones; mono/stereo playback changes the stimulus.

### 4.2 Controls

- Volume ceiling and a "safe listening" onboarding.
- Session length limits.
- No sleep-time autoplay without a timer.
- Clear headphone requirement for binaural content.
- Parameter transparency: carrier frequency, beat frequency, duration, masking.
- No cognitive-enhancement claim.

---

## 5. Neurofeedback and EEG

### 5.1 Risk

- Skin irritation or infection from poor electrode hygiene.
- Signal-quality artefacts leading to false feedback.
- Frustration or distress when users cannot "control" the signal.
- Data sensitivity: EEG and biometric data can reveal health, emotion and cognitive state.
- Unvalidated consumer devices may not measure what they claim.

### 5.2 Evidence

- Consumer-grade neurofeedback showed no cognitive benefit and no target modulation in a 16-RCT meta-analysis (PMID 40246295).
- 19 of 21 studies did not assess adverse effects (PMID 40246295).
- A small adult ADHD review observed no treatment-related adverse events, but the evidence base is too small to conclude safety (PMID 42897476).
- Neurofeedback for ADHD shows no significant probably blinded effect (PMID 39661381).

### 5.3 Controls

- Validated hardware only; publish device validation.
- Learning metrics (does the user actually modulate the target?).
- Sham-controlled research protocol.
- Skin-contact hygiene instructions.
- No ADHD, cognition or sleep claim.
- Explicit consent for neural data; local-first processing where possible.
- Retention limits and deletion.

---

## 6. Game and digital harms

A review of reviews of digital ADHD interventions found adverse effects in **8 of 26 reviews (30.1%)**, including physical discomfort, emotional reactions and behavioural issues such as video-game addiction (PMID 40264083). The evidence is low quality, but the signal is consistent enough to require design controls:

- session limits, a visible target time and break reminders;
- no loot boxes, real-money rewards, purchasable currency or infinite scroll;
- variable bonuses and streaks are cosmetic, capped and switchable; streak loss never removes core progress;
- parental controls for minors;
- reporting channel for distress;
- clear distinction between training and play.

---

## 7. Data protection

Noesis may process:

- cognitive performance data;
- EEG/biometric data;
- health and medication information;
- voice or video if added later;
- usage and adherence data.

Requirements:

1. **Lawful basis and consent** for each data category.
2. **Purpose limitation:** training data is not repurposed for advertising.
3. **Data minimisation:** collect only what the claim requires.
4. **Retention and deletion:** user-accessible export and deletion.
5. **Local-first option:** on-device processing for neural data where feasible.
6. **Security:** encryption at rest and in transit; access logging.
7. **Minors:** verifiable parental consent where required.
8. **Third parties:** no sale of neural or health data.

Regulatory frameworks to assess with counsel: GDPR (EU), UK GDPR, HIPAA (US, if a covered entity or business associate), state privacy laws, and medical-device data rules.

---

## 8. Regulatory boundary

### 8.1 Wellness vs medical device

The key question is **intended purpose** and **claims**, not the technology.

| Product claim | Likely status | Consequence |
|---|---|---|
| "Practice working memory" | Wellness / general | Truthful advertising; no medical claim |
| "May improve performance on closely related tasks" | Wellness, if carefully qualified | Must be substantiated |
| "Improves intelligence" | Not supported | Do not make |
| "Prevents dementia" | Medical / disease prevention | Likely medical-device and drug-claim territory |
| "Treats ADHD" | Medical | Requires clinical evidence and regulatory clearance |
| "Treats depression, anxiety or insomnia" | Medical | Requires clinical evidence and regulatory clearance |
| "Reduces perioperative anxiety" | Medical context | Clinical setting only; not a consumer claim |

### 8.2 US

- Software with a medical intended purpose is generally **Software as a Medical Device (SaMD)** and may require FDA clearance or approval.
- General wellness products can avoid device regulation only if they are intended for general wellness and do not make disease claims.
- Advertising is regulated by the FTC; unsupported cognitive-improvement claims can be deemed deceptive. The 2016 Lumosity settlement is the canonical example.
- State and federal privacy laws apply to health and biometric data.

### 8.3 European Union

- Software with a medical intended purpose is a **medical device** under MDR 2017/745.
- Rule 11 generally classifies software providing information for diagnostic or therapeutic decisions as at least class IIa, with higher classes for serious harm.
- Clinical claims require clinical evaluation, post-market surveillance and a conformity assessment.
- GDPR applies to neural and biometric data.

### 8.4 Other markets

- UK: UKCA/MHRA regime.
- Canada: Health Canada.
- Australia: TGA.
- Japan: PMDA.
- Turkey: TİTCK.

A market-by-market assessment is required before launch in each jurisdiction.

---

## 9. Claim wording

### Allowed (with evidence links and qualifications)

- "Practice and track working memory."
- "May improve performance on closely related tasks during training."
- "A relaxation tool with adjustable audio parameters."
- "A supervised rehabilitation adjunct for clinical settings."
- "Designed for healthy adults who want structured cognitive practice."

### Prohibited

- "Boost your IQ."
- "Reverse brain aging."
- "Prevent dementia."
- "Treat ADHD."
- "Cure insomnia."
- "Clinically proven to improve memory" (unless a specific, pre-registered trial supports the exact claim and the regulatory pathway is in place).
- "Scientifically proven" without a citation and a defined outcome.

---

## 10. Safety checklist for release

- [ ] Photosensitivity screen and warning.
- [ ] Render-time flash/luminance/red/pattern limits.
- [ ] Exercise health screen and stop rules.
- [ ] Audio volume ceiling and headphone guidance.
- [ ] EEG device validation and hygiene instructions.
- [ ] Adverse-event capture with severity and follow-up.
- [ ] Data consent, export, deletion and retention.
- [ ] Prohibited-claim lint in UI and store copy.
- [ ] Regulatory triage completed for each market.
- [ ] Clinical claims reviewed by qualified counsel and clinical advisors.
- [ ] Incident response and user support pathway.

---

## 11. Open questions

1. What is the minimum flash-validation standard for interactive content that is generated dynamically?
2. How should the product handle user-uploaded or AI-generated visual content?
3. What is the correct screening instrument for photosensitivity in a consumer app?
4. Does VR add seizure risk beyond the display refresh and flash characteristics?
5. What is the adverse-event rate of home-based cognitive training in older adults?
6. How should neural data be handled under GDPR special-category rules?
7. Which claims are acceptable for a "wellness" product in each target market?
8. What evidence standard will regulators accept for a digital cognitive training device?
