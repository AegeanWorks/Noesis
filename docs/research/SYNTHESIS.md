# Noesis Evidence Synthesis

**Review:** Noesis evidence review v1.0  
**Search date:** 2026-10-31  
**Evidence table:** [analysis/evidence_table.json](analysis/evidence_table.json)  
**Protocol:** [PROTOCOL.md](PROTOCOL.md)  
**PRISMA flow:** [PRISMA_FLOW.md](PRISMA_FLOW.md)  
**References:** [REFERENCES.md](REFERENCES.md)

---

## 1. Structured abstract

**Background.** "Brain training" is a family of interventions, not one treatment. Noesis is intended to combine cognitive training, neurofeedback, audio-visual entrainment and biometric feedback for multiple populations. The evidence for each component differs in direction, magnitude, durability and certainty, and the field has a history of claims outrunning data.

**Objectives.** Estimate which modality produces which outcome, for whom, against which comparator, at what dose, with what certainty and safety constraints; translate the result into product requirements and explicit non-claims.

**Methods.** PRISMA 2020 systematic umbrella review of systematic reviews and meta-analyses, supplemented by landmark RCTs. PubMed (1,495-review corpus plus ten scoping searches), OpenAlex citation chasing, ClinicalTrials.gov, and Crossref metadata verification. 2,360 unique bibliographic records and 363 trial records were screened; 109 records (87 primary, 22 context) and 270 outcomes were extracted, including November 2026 updates of six gaming-disorder engagement records, three photosensitivity safety records, one gamification record, three incentive-design records, three goal-setting records, two retrieval-practice records, two habit records, one gamification-caution record, one planning-interventions record, two mental-contrasting records and one test-anxiety record. Certainty is recorded as reported by the source review; independent GRADE was not performed.

**Results.** Computerized cognitive training (CCT) reliably improves trained tasks and produces short-term near transfer, but far transfer is absent or fragile in healthy adults and children. In older adults, reasoning and speed training produced durable everyday-function effects in the ACTIVE trial, while a 2026 MCI meta-analysis found near-null transfer and no low-risk-of-bias trial. Neurofeedback for ADHD shows no significant effect when outcomes are probably blinded (SMD 0.04; 95% CI -0.10 to 0.18), with a small signal for standard protocols (0.21; 0.02 to 0.40) and processing speed (0.35; 0.01 to 0.69). Consumer-grade neurofeedback shows no cognitive benefit. Binaural beats show small-to-large, context-dependent effects on anxiety and pain, but cognitive evidence is mixed and parameter-dependent. Combining physical exercise with cognitive training is the most consistent small effect in cognitively unimpaired older adults (SMD 0.26; 0.10 to 0.42), but the FINGER trial's between-group cognitive difference was only 0.022 Z-score per year and exercise increased musculoskeletal adverse events (7% vs 1%). Multimodal combinations are not reliably superior to their best single component. Engagement evidence points to behaviour-change techniques rather than points or game framing alone. Photosensitive seizure risk is a hard safety constraint for any flashing visual content.

**Conclusions.** The defensible product is a measurement-rich, domain-specific training system with explicit near-transfer claims, no intelligence or dementia-prevention claims, no ADHD treatment claim, and a safety layer for visual and exercise content. Most of the intended multimodal surface is experimental; only a narrow set of claims is evidence-supported.

---

## 2. How to read this review

### 2.1 What "evidence-supported" means here

A claim is **evidence-supported** only when:

1. at least one primary review or trial covers the exact modality × population × outcome comparison;
2. the effect is not explained away by passive-control comparison or unblinded assessment;
3. the source reports at least low certainty, or the finding is replicated across independent reviews with a consistent direction;
4. the effect size is large enough to matter to a user, not merely statistically significant.

Everything else is **experimental** (plausible, under-tested), **wellness-only** (relaxation, enjoyment, sleep hygiene framing) or **prohibited** (medical or enhancement claims the evidence does not support).

### 2.2 Certainty is provisional

The protocol planned independent GRADE. That was not done: it requires full-text appraisal of every review and trial. The certainty values in the evidence table are **as reported by the source**, and many sources did not report certainty at all (`not_reported`). Treat every certainty label as provisional. The direction and the pattern across reviews are more trustworthy than any single number.

### 2.3 Effect sizes are not interchangeable

- SMD/Hedges' g: 0.2 small, 0.5 moderate, 0.8 large, but context matters.
- A large SMD from a small network or a high-heterogeneity review is not a planning number.
- Negative values often mean improvement on symptom scales; the table records the scale direction in `favors` and `note`.
- SUCRA rankings are relative probabilities, not effect sizes.
- Several extracted effects are **implausible** (for example SMD 5.09, 3.71, 6.64). They are flagged and excluded from planning. Their presence is itself a finding about the field's reporting quality.

### 2.4 Near transfer, far transfer, and everyday function

- **Near transfer:** improvement on the trained task or a closely related task.
- **Far transfer:** improvement on an untrained cognitive domain, academic achievement, or everyday performance.
- **Everyday function:** self-reported or performance-based daily activities, work, school, independence.

The central empirical lesson of this literature is a gradient: trained task > near transfer > far transfer > everyday function. Most products advertise the right-hand side while the evidence supports the left.

---

## 3. Evidence at a glance

| Modality | Best-supported outcome | Best effect | Certainty | What is not supported |
|---|---|---|---|---|
| CCT / cognitive games | Trained task and short-term near transfer | Updating→span g=0.176; midlife WM 0.16, verbal memory 0.22, EF 0.48 | Low-moderate | Intelligence, academic gain, broad far transfer, dementia prevention |
| Neurofeedback | Processing speed in ADHD (small); protocol-specific symptom signal | Blinded ADHD total 0.04 (ns); standard protocols 0.21; processing speed 0.35 | Low | ADHD treatment, consumer-device cognitive enhancement, sleep |
| Audio-visual entrainment | Anxiety and pain (binaural beats) | Perioperative anxiety -1.38; pain -0.61; overall g=0.45 | Low | Cognitive enhancement, memory, durable mood change |
| Multimodal exercise + cognition | Global cognition in older adults | 0.26 vs health education; FINGER 0.022 Z/year | Low-moderate | Synergy over the best component; dementia prevention |
| Engagement | Physical activity and adherence | PA 0.19, MVPA 0.48, steps 0.54 | Not reported | Gamification as a mechanism |
| Safety | Photosensitive seizure risk; exercise AEs; game-related harms | Prevalence 0.3-3% photosensitivity; 7% vs 1% AEs in FINGER | Guidance | "Safe for everyone" |

---

## 4. Computerized cognitive training and cognitive games

### 4.1 Healthy adults and children: near transfer, not far transfer

The strongest and most consistent finding in the review is that cognitive training improves what it trains. Melby-Lervåg and Hulme (2013; PMID 22612437) found reliable short-term working-memory gains across 23 studies, with no convincing generalisation to nonverbal ability, verbal ability, inhibition, decoding or arithmetic. Their 2016 meta-analysis (87 publications, 145 comparisons; PMID 27474138) found no reliable far transfer against treated controls and no evidential value in the working-memory training literature. Simons et al. (2016; PMID 27697851) found extensive evidence for trained-task improvement, less for closely related tasks, and little for distantly related tasks or everyday performance; none of the industry-cited studies met all best-practice criteria.

There are pro-transfer findings. Jaeggi et al. (2008; PMID 18443283) reported dose-dependent transfer from n-back training to fluid intelligence. Au et al. (2015; PMID 25102926) pooled 20 n-back studies in healthy adults and found a small positive effect on fluid intelligence. The 2026 asymmetric-transfer meta-analysis (55 studies, 208 effect sizes, N=3,492; PMID 42711482) found that updating training transferred to span tasks (g=0.176) but span training did not transfer to updating (g=0.048, ns), and the advantage extended to non-working-memory outcomes. These findings support a **demand-based** account: training a more demanding, task-general operation can transfer further than training a narrow span task.

The conflict is real, but it is not symmetric. The pro-transfer findings are smaller, paradigm-specific, and often lack treated controls; the null findings are larger, use treated controls, and directly test the claims made by commercial products. A responsible product should plan for near transfer and treat far transfer as a research question.

### 4.2 Older adults and MCI: domain-specific, durable in some trials, fragile in meta-analysis

The ACTIVE trial is the strongest durability evidence in the field. At 5 years, reasoning training reduced IADL difficulty (effect size 0.29; 99% CI 0.03-0.55), while speed (0.26; -0.002 to 0.51) and memory (0.20; -0.06 to 0.46) did not (PMID 17179457). At 10 years, all three groups reported less IADL difficulty (memory 0.48, reasoning 0.38, speed 0.36; 99% CIs), and reasoning (0.23) and speed (0.66) maintained their targeted cognitive abilities while memory did not (PMID 24417410). This is a single large trial with self-reported function, but it is a serious counterweight to the blanket claim that brain training cannot affect everyday life.

The 2026 MCI review is the strongest counterweight in the other direction. Eight trials and 722 participants produced immediate near transfer g=0.14 (95% CI -0.23 to 0.50; very low certainty) and far transfer g=0.23 (-0.35 to 0.81; very low), with far transfer falling to 0.00 when one trial was excluded; sustained effects were near zero, and no trial was at low risk of bias (PMID 42959097).

Between these poles:

- VR-based cognitive training in MCI shows small-to-moderate effects on memory (0.20), attention/processing speed (0.25) and executive function (0.22), with small effects on global cognition and daily living (PMID 39793970).
- A separate VR meta-analysis found g=0.60 overall, with VR games 0.68 and VR training 0.52, and immersion level as a significant moderator (PMID 41281571).
- Serious games improved memory (0.35), but blank and active controls produced the same 0.35, which is a warning about non-specific effects (PMID 40474799).
- A 50-paper MCI network ranked VR (0.53), neuropsychological training (0.44), strategy training (0.26) and CBT (0.25), with programmes longer than 8 weeks performing better (PMID 38608550).
- A 43-RCT network found no moderation by duration, delivery format, interventionist expertise or control type, and ranked reminiscence therapy highest for global cognition (PMID 40436677).
- A 66-RCT technology-assisted network reported global cognition 0.563, depression -0.237 and quality of life 0.279, with VR cognitive training ranked best for cognition (PMID 41485445). It also reported very high heterogeneity (I²=88.9%) and a certainty claim higher than comparable reviews; it is flagged `certainty_conflict`.
- A 57-article digital-intervention network reported implausible effects (mobile games SMD 5.09; VR memory 2.71) and is excluded from planning (PMID 40505259).
- Pure cognitive training improved dual-task gait speed (0.39) but not single-task gait, functional mobility or balance; the effective protocol was 40-60 minutes, 2-3 times weekly for 8-10 weeks (PMID 42525971).

The pattern is consistent with the healthy-adult literature: **domain-specific gains are plausible; broad everyday improvement is not established; durability requires a maintenance design.**

### 4.3 Dementia

Cognitive stimulation and cognitive training can support cognition in people with dementia, particularly in mild stages, and cognitive rehabilitation can improve functional abilities and caregiver outcomes (PMID 39485657). The certainty is low and heterogeneity high. Network rankings favor reminiscence therapy for global cognition (PMID 40436677), but ranking is not proof.

Several dementia reviews report large effects that should not be used for planning: a 19-RCT Alzheimer's network reported an executive-function SMD of 3.71 for cognitive-plus-exercise versus exercise alone (PMID 42812254), and a 57-article digital network reported SMD 5.09 (PMID 40505259). A motor-cognitive review reported global cognition 1.00 and gait 0.40/0.28 but no significant improvement in memory, attention or executive function (PMID 40640327) — a composite-driven result that should be treated as a measurement warning. Exergaming for depressive symptoms in dementia reported -1.46 from six studies with very low certainty (PMID 39861961).

### 4.4 Children and ADHD

Cognitive training in children with ADHD shows small-to-moderate effects on attention and executive function, but not hyperactivity/impulsivity. A 10-study meta-analysis (N=446) reported attention -0.78, executive function -0.30 and hyperactivity/impulsivity -0.65 (ns), with larger attention effects in children under 10 and training longer than 30 days (PMID 38261550).

The larger and more recent reviews are less encouraging:

- A 52-RCT network of Chinese children with neurodevelopmental disorders found statistically significant but trivial effects (SMD 0.073-0.097) (PMID 42039077).
- A 67-study review reported overall EF g=0.673, exercise inhibition 0.900 and cognitive-training working memory 0.907 — implausible magnitudes, flagged and excluded from planning (PMID 37450981).
- A 42-study network found exercise best for inhibitory control at post-test (SUCRA 85.9%), behaviour therapy best at follow-up (95.1%), and neurofeedback significant at post-test but not at follow-up (PMID 40398202).
- A 37-RCT digital-intervention network found inattention -0.44 and hyperactivity/impulsivity -0.26, with executive function not significant (-0.41; -0.85 to 0.02); neurofeedback had the highest SUCRA for inattention, but most outcomes were subjective ratings (PMID 42358407).
- A 17-study computer-game review found neurofeedback -0.51 and physical exercise/VR -0.40, both very low certainty (PMID 40153883).

The Klingberg trials (2002, 2005; PMIDs 12424652, 15689731) showed near transfer and parent-rated symptom reduction in small samples. They are important historically but do not establish far transfer or blinded symptom benefit.

**Bottom line for ADHD:** cognitive training is not a treatment. It may be an adjunct that supports attention or executive-function practice in a supervised programme, but the evidence does not support replacing or delaying medication, and blinded outcomes attenuate the effects.

### 4.5 Clinical rehabilitation

Clinical populations often show larger effects than healthy adults because there is more room to improve and because the training is embedded in rehabilitation. CCT after stroke improved global cognition (0.46), attention (-0.45), executive function (0.39) and quality of life (0.34), with limited effects on memory, language and motor function (PMID 40503808). Cognitive remediation in schizophrenia improved cognition (0.41), psychosocial functioning (0.36) and symptoms (0.28); functional effects were stronger when paired with psychiatric rehabilitation (PMID 18056233). CCT in cancer survivors improved executive function (0.26 at follow-up) and working memory (0.25 post, 0.30 follow-up) (PMID 41166838), while a breast-cancer review found a small FACT-Cog effect (0.20) with low-quality evidence and possible publication bias (PMID 40790842). CCT in people living with HIV improved six of eight cognitive domains and daily function (0.44) (PMID 35238931).

These are rehabilitation findings. They justify a **clinical adjunct** positioning with supervision, not a consumer wellness claim.

---

## 5. Neurofeedback

### 5.1 ADHD: the blinding effect decides the answer

The most important neurofeedback result in this review is the 2025 JAMA Psychiatry meta-analysis (38 RCTs, 2,472 participants; PMID 39661381). Probably blinded reports of ADHD total symptoms showed no significant improvement (SMD 0.04; 95% CI -0.10 to 0.18). Restricting to established standard protocols produced a small significant effect (0.21; 0.02 to 0.40). Of five neuropsychological outcomes, only processing speed improved (0.35; 0.01 to 0.69).

This is consistent with earlier work. Cortese et al. (2016; 13 trials, 520 participants; PMID 27238063) found an unblinded symptom effect of 0.35 (0.11-0.59) that disappeared with probably blinded ratings or active/sham controls; inhibition (0.30; -0.10 to 0.70) and attention (0.13; -0.09 to 0.36) were not significant. Sonuga-Barke et al. (2013; 54 records; PMID 23360949) found psychological treatment effects of 0.40-0.64 with raters closest to the treatment setting, attenuating to non-significance with the best blinded assessment.

The 2025 Lancet Psychiatry adult ADHD network (113 RCTs, 14,887 participants; PMID 39701638) reinforces the point: only stimulants and atomoxetine improved core symptoms on both self- and clinician-rated measures; non-pharmacological effects were inconsistent across raters; neurofeedback and neurostimulation evidence covered only 10 RCTs and 194 participants.

There are positive reviews. A 17-RCT review in children (N=939; PMID 40750997) reported improvements in global executive function, inhibition and working memory, with larger effects above 1,260 minutes and durable working-memory effects. A 2026 adult review (7 studies, 390 participants; PMID 42897476) found small, generally non-significant RCT effects but large naturalistic effects, and no treatment-related adverse events. A comparative review of neurofeedback, tDCS and TMS (18 articles; PMID 40505983) found no significant meta-analytic effect for any technique.

The conflict is best explained by outcome blinding and outcome type. Reviews that emphasize unblinded ratings or task-based measures find effects; reviews that require probably blinded ratings do not. **A product must not claim ADHD treatment.**

### 5.2 Healthy cognition and consumer devices

The consumer-grade evidence is negative for cognition. A meta-analysis of 16 RCTs (763 participants) and 5 within-participant designs found a small reduction in psychological distress (g=-0.16, p=.03) but no improvement in cognition (0.07, p=.48), state mindfulness (0.02, p=.83) or physiological health (0.11, p=.57); mechanistic modulation of brain targets was not found, and 19 of 21 studies did not assess adverse effects (PMID 40246295). The authors suggest "neurosuggestion" or placebo effects.

For healthy adults, a 60-study network found alpha (7-13 Hz) ranked highest for working and episodic memory, with an alpha-plus-working-memory effect of 6.64 that is not credible and an alpha episodic-memory effect of 0.84 (PMID 40275307). A frontal midline theta meta-analysis found g=0.66 but a confidence interval from -0.62 to 1.73, which is too imprecise to support a claim (PMID 38723734). A sport meta-analysis found g=0.78, with higher-quality studies reporting 1.07 — an atypical quality-effect direction that needs replication (PMID 40270441).

### 5.3 Clinical signals

PTSD and depression show the strongest clinical signals, but they come from supervised, often fMRI-guided protocols, not consumer EEG. PTSD meta-analyses report symptom reductions that survive sham-controlled sub-analysis (PMIDs 40072792, 38577405), with effects attributed to newer fMRI-guided neurofeedback. A depression meta-analysis reports g=-0.600 for symptoms, -0.726 for neurophysiology and -0.418 for neuropsychological function (PMID 38889442). Sleep is a clear negative: surface neurofeedback did not outperform controls on PSQI (control conditions improved more, 0.57) or insomnia severity (-0.13, ns) (PMID 39568666).

**Bottom line for neurofeedback:** a legitimate closed-loop learning tool, with a weak and blinding-sensitive clinical evidence base. It is not a consumer cognitive enhancer, not an ADHD treatment, and not a sleep intervention.

---

## 6. Audio-visual entrainment

### 6.1 Binaural beats: anxiety and pain, not cognition

The largest binaural-beat meta-analysis (22 studies, 35 effect sizes; PMID 30073406) reported an overall g=0.45 across memory, attention, anxiety and analgesia; longer exposure was better, exposure before and during the task outperformed during-task only, and masking with noise was unnecessary. Because it pooled across domains, the overall figure should not be read as a cognitive effect.

Domain-specific reviews are more informative:

- Theta binaural beats (13 RCTs, 630 participants; PMID 42349368) reduced pain (SMD -0.53; -0.84 to -0.23; low certainty; four trials), but anxiety and cognition could not be pooled because of outcome heterogeneity. The authors report that theta entrainment favored episodic memory in some trials.
- Perioperative binaural beats (15 studies, 1,047 participants; PMID 41176178) reduced anxiety versus blank audio (SMD -1.38; -1.89 to -0.87; I²=91.6%), postoperative pain (-0.61; -1.03 to -0.19), systolic blood pressure (-5.57 mmHg) and heart rate (-3.37 bpm). Against non-binaural audio, anxiety was -1.01 and pain -0.52. Heterogeneity was very high and expectancy effects are plausible.
- A young-adult review (10 trials; PMID 41656644) reported SMDs of 0.3-0.6 across anxiety, sleep and cognition, but with small samples and heterogeneous designs.
- A 31-study review of music, noise and binaural beats found mixed or insufficient autonomic evidence and noted that arousal and cognition are usually studied separately (PMID 38458383).
- Chaieb et al. (2015; PMID 26029120) emphasize that frequency, duration and timing determine the effect, and that findings are contradictory.

**Bottom line for AVE:** the defensible use is relaxation, anxiety support and pain distraction, with parameter transparency. Cognitive enhancement is not supported. Any flashing visual entrainment adds a photosensitive seizure risk that must be engineered out.

---

## 7. Multimodal combinations

### 7.1 Exercise plus cognitive training is the most consistent small effect

The 2025 Lancet Healthy Longevity network (109 RCTs, 23,010 cognitively unimpaired older adults; PMID 41016407) found the strongest global-cognition effect for physical exercise plus cognitive training (SMD 0.26; 0.10-0.42), followed by cognitive training alone (0.21; 0.08-0.33), four-domain multidomain intervention (0.14; 0.02-0.27) and physical exercise alone (0.14; 0.05-0.22). Adding more domains did not automatically increase benefit. 40% of studies were at high risk of bias and publication bias was suggested.

The FINGER trial (1,260 at-risk older adults; PMID 25771249) is the pivotal multidomain RCT. The between-group difference in NTB total Z-score change was 0.022 per year (95% CI 0.002-0.042; p=0.030). This is statistically significant and practically tiny. Adverse events occurred in 46 (7%) intervention participants versus 6 (1%) controls, mostly musculoskeletal pain (32 participants, 5%, versus none). The trial demonstrates that a multidomain programme can shift cognition at population scale, and that the exercise component carries real safety costs.

### 7.2 Combination is not synergy

A 29-RCT network in MCI and dementia (2,910 participants; PMID 37769394) found that combined exercise plus cognitive intervention was superior to exercise alone for response inhibition, working memory and delayed recall, but **not superior to cognitive intervention alone on any outcome**. Synergy is not established. A 2026 review of combined physical and cognitive training for depression found SMD -0.40 overall, but the effect attenuated to -0.24 (ns) when restricted to depression-specific scales (PMID 42851694).

Digital exercise networks add nuance but not certainty. A 51-RCT Bayesian network (3,673 older adults; PMID 42612199) found non-immersive exergames improved global cognition versus no intervention (0.51) and routine intervention (0.32), and remote exercise improved memory (1.30), but certainty was very low for most comparisons and prediction intervals were wide. A 10-RCT community exergame review found a small overall effect g=0.135 (0.037-0.229), with memory a trend (0.179, p=.060) and global cognition, executive function and attention not significant (PMID 42040754).

In frail older adults, combined physical and cognitive intervention produced large effects (global cognition 1.05, frailty -1.03, gait 1.12) from 11 RCTs and 989 participants (PMID 42480329). The sample is small and the setting is specific; treat the magnitudes as hypothesis-generating.

### 7.3 Cognitive training plus non-invasive brain stimulation

A transdiagnostic meta-analysis (72 studies, 2,518 participants; PMID 37956054) found that adding non-invasive brain stimulation to cognitive training improved learning/memory only (g=0.18; 0.07-0.29), not seven other cognitive domains, symptoms or everyday functioning, and not at follow-up. Only four studies were at low risk of bias in all domains. This is not a consumer-safe or consumer-justified combination.

**Bottom line for multimodal:** pair cognitive work with movement because the combination has the most consistent small effect and plausible vascular/metabolic mechanisms, not because "more modalities" is inherently better. Measure component contributions and safety.

---

## 8. Engagement, adherence and delivery

The engagement evidence is about behaviour, not cognition. A 20-RCT exergame review (2,211 participants; PMID 40779747) found improvements in physical activity (SMD 0.19), moderate-to-vigorous activity (0.48) and step count (0.54). Behaviour-change technique count moderated effectiveness; goal setting, action planning, self-monitoring and instruction were the most used techniques. This suggests that **structured behaviour-change design**, not points or badges alone, drives adherence.

A review of gamification and language learning in older adults found mixed results, leaning positive for gamified cognitive training (PMID 39605199). A review of reviews of digital ADHD interventions (26 reviews, 34,442 participants; PMID 40264083) found low-quality evidence and adverse effects in 8 of 26 reviews (30.1%), including physical discomfort, emotional reactions and behavioural issues such as video-game addiction. A digital ADHD network found parent/teacher-rated improvements but noted subjective outcomes and heterogeneity (PMID 42358407).

**Bottom line for engagement:** design for adherence explicitly, measure dropout and sustained use, and treat game framing as a delivery layer rather than a mechanism. Safety monitoring is part of engagement design.

---

## 9. Safety

### 9.1 Photosensitive seizures

This is the hardest safety constraint for any visual entrainment or flashing game. The Epilepsy Foundation consensus reports that photosensitivity occurs in approximately 0.3-3% of the population; the estimated prevalence of seizures from light stimuli is about 1 per 10,000 (1 per 4,000 in ages 5-24); people with epilepsy have a 2-14% chance of light- or pattern-precipitated seizures (PMID 16146439). Frequencies of 15-25 Hz are most provocative, with a range of 1-65 Hz. A flash is potentially hazardous at luminance ≥20 cd/m², frequency ≥3 Hz and solid visual angle ≥0.006 steradians; transitions to or from saturated red are also risky (PMID 16146438). The 2026 consensus advises designers of games, videos and VR to avoid bright flashing patterns in the 10-20 Hz range, repetitive colour flashes, and oscillating or static stripes (PMID 41283196).

**Product implication:** any visual entrainment must have a pre-use photosensitivity screen, a hard frequency/luminance cap, no saturated-red flashing, a pattern-density limit, and a documented emergency stop. This is not optional.

### 9.2 Exercise adverse events

FINGER reported 7% versus 1% adverse events, mostly musculoskeletal pain (PMID 25771249). Exercise is not a harmless add-on for older or frail users; it needs screening, progression limits and fall-risk controls.

### 9.3 Game and digital harms

Digital ADHD reviews report physical discomfort, emotional reactions and behavioural issues including video-game addiction in 30.1% of included reviews (PMID 40264083). Consumer neurofeedback studies largely fail to assess adverse effects (19 of 21; PMID 40246295). Binaural-beat perioperative reviews measured adverse events such as nausea, dizziness and hearing impairment, but reporting is inconsistent (PMID 41176178).

### 9.4 Neurofeedback and EEG

No treatment-related adverse events were observed in a small adult ADHD review (PMID 42897476), but the evidence base is too small and too poorly reported to conclude safety. EEG devices create skin-contact, hygiene and data-protection issues. Neural and biometric data are sensitive; consent, retention and deletion must be explicit.

### 9.5 Regulatory boundary

Brain-training products occupy a spectrum:

- **Wellness / entertainment:** no medical intended purpose; general cognitive or relaxation claims must still be truthful and not misleading.
- **Medical device / digital therapeutic:** if the product claims to diagnose, treat, mitigate, cure or prevent a disease (including ADHD, dementia, depression or insomnia), it likely requires regulatory clearance or approval (FDA in the US; MDR in the EU).
- **Advertising:** regulators have acted against unsupported cognitive-improvement claims; the US FTC's 2016 Lumosity settlement is the canonical example.

This review is not legal advice. A regulatory assessment must precede any clinical claim.

---

## 10. Population synthesis

### 10.1 Children and adolescents

The evidence is dominated by ADHD and neurodevelopmental samples. Cognitive training and digital interventions can move attention and executive-function task scores, but effects on hyperactivity/impulsivity are inconsistent, blinded ratings attenuate effects, and far transfer to school performance is not established. Exercise and behaviour therapy have the most consistent signals for inhibitory control, with better maintenance than neurofeedback. **No product should be marketed as an ADHD treatment or as a school-performance enhancer.**

### 10.2 Healthy adults

Near transfer is reliable; far transfer is not. Midlife cognitive training shows small domain-specific effects (EF 0.48, verbal memory 0.22, WM 0.16; PMID 39235660), but the best-controlled reviews find no far transfer. Consumer neurofeedback has no cognitive effect. Binaural beats may reduce anxiety but not enhance cognition. **The honest healthy-adult value proposition is practice, engagement and measurement, not intelligence enhancement.**

### 10.3 Older adults and MCI

This is the most promising population for a multimodal product, but also the one where overclaiming is most harmful. The ACTIVE trial shows durable domain-specific and everyday-function effects for reasoning and speed training. The 2026 MCI review shows near-null transfer and no low-risk-of-bias trial. Exercise plus cognitive training has the most consistent small effect. **The defensible claim is "supports domain-specific practice and may help maintain everyday function in some older adults," not "prevents dementia."**

### 10.4 Clinical populations

Stroke, schizophrenia, cancer, HIV and depression show larger effects, but the interventions are embedded in rehabilitation and often supervised. Functional benefit depends on the surrounding rehabilitation context (schizophrenia, PMID 18056233). **Clinical use should be adjunctive, supervised, and regulated.**

---

## 11. Cross-cutting lessons

1. **The transfer gradient is the field's central fact.** Trained task > near transfer > far transfer > everyday function.
2. **Blinding changes the answer.** The same intervention can look effective with unblinded raters and null with probably blinded raters (ADHD neurofeedback, non-pharmacological ADHD treatments).
3. **Active controls matter.** Waiting-list comparisons inflate effects. Serious games produced the same effect against blank and active controls (PMID 40474799), which suggests non-specific effects.
4. **Dose is not linear or universal.** More training is not always better; updating training transferred more at lower doses (PMID 42711482); training dose was not a significant moderator in a neuroimaging meta-analysis (PMID 41772608); aPASAT dose did not moderate depression effects (PMID 36853526).
5. **Durability is the exception, not the rule.** Most effects fade; ACTIVE is the notable exception for reasoning and speed.
6. **Combination is not synergy.** Exercise plus cognitive training beats exercise alone but not cognitive training alone (PMID 37769394).
7. **Measurement quality is the bottleneck.** Composite outcomes can improve while domain-specific tests do not (PMID 40640327); self-reported function and unblinded ratings drive many positive results.
8. **Safety reporting is poor.** Consumer neurofeedback and many game studies do not assess adverse effects.
9. **The literature is conflicted, and the conflicts are informative.** Do not resolve them by choosing the most favourable review.

---

## 12. Claim ladder

| Claim | Evidence status | Allowed wording | Certainty |
|---|---|---|---|
| Improves performance on the trained task | Supported | "Practice and track this skill" | Low-moderate |
| Produces short-term near transfer | Supported | "May improve performance on closely related tasks" | Low-moderate |
| Improves working memory in healthy adults | Supported, short-term | "May improve working-memory task performance during training" | Low |
| Improves fluid intelligence / far transfer | Not supported | Do not claim | — |
| Improves academic achievement | Not supported | Do not claim | — |
| Prevents or slows dementia | Not supported | Do not claim | — |
| Treats ADHD | Not supported | Do not claim; adjunct only with clinician | — |
| Reduces anxiety (binaural beats, perioperative) | Supported as adjunct | "May support relaxation in specific contexts" | Low |
| Improves sleep | Not supported for neurofeedback; weak for audio | "May support a bedtime routine" (wellness only) | Very low |
| Improves everyday function in older adults | Mixed, domain-specific | "Reasoning and speed practice may help maintain everyday function" | Low |
| Rehabilitation adjunct after stroke | Supported in rehabilitation | "Supervised rehabilitation adjunct" | Low-moderate (source-reported) |
| Consumer EEG enhances cognition | Not supported | Do not claim | — |
| Multimodal programme prevents cognitive decline | Not supported | "Supports a healthy lifestyle" (wellness only) | — |

---

## 13. Design implications (summary)

The full requirements are in [DESIGN_IMPLICATIONS.md](DESIGN_IMPLICATIONS.md). The five decisions that follow directly from the evidence:

1. **Build a measurement engine first.** The product's differentiator should be trustworthy, repeated measurement of near transfer, far transfer, adherence and safety — not a new game.
2. **Make adaptivity a hypothesis, not a selling point.** Adaptive demand has a mechanistic rationale (PMID 41772608) and updating training transfers better than span training (PMID 42711482), but adaptive versus fixed difficulty has not consistently beaten fixed difficulty on behaviour.
3. **Separate modalities in the UI and in the claims.** CCT, neurofeedback and AVE have different evidence, different safety profiles and different regulatory status. A combined "brain score" would be misleading.
4. **Engineer the safety layer before the content.** Photosensitivity screening and caps, exercise screening, audio-level limits, adverse-event capture, and neural-data consent.
5. **Use active controls and blinded outcomes in internal trials.** If the product cannot show an effect against an active control, it should not claim one.

---

## 14. Evidence gaps and research agenda

1. **Healthy-adult far transfer:** no adequately powered, actively controlled, blinded trial with a validated everyday outcome.
2. **Durability:** few trials follow participants beyond 3 months; ACTIVE is the exception.
3. **Adaptive algorithms:** no head-to-head evidence that commercial adaptivity outperforms fixed difficulty on far transfer.
4. **Multimodal component isolation:** almost no factorial trials; combination effects cannot be attributed.
5. **AVE parameter space:** frequency, duration, timing, masking and individual differences are under-studied; most reviews pool heterogeneous protocols.
6. **Consumer device validation:** signal quality, learning metrics and sham controls are weak.
7. **Safety reporting:** adverse events are inconsistently measured and reported.
8. **Diverse populations:** most evidence is from high-income countries, English-language publications, and predominantly White or East Asian samples; external validity is limited.
9. **Children:** near-transfer effects are modest and far transfer to school performance is not established.
10. **Clinical populations:** rehabilitation-embedded effects may not transfer to unsupervised home use.

---

## 15. Measurement plan for Noesis

The review implies a minimum viable evidence system:

| Layer | Measure | Frequency | Purpose |
|---|---|---|---|
| Engagement | Sessions started/completed, dropout, streak, time-on-task | Every session | Adherence and dose |
| Near transfer | Validated task battery matched to the trained domain | Baseline, mid, post | Does the trained skill improve? |
| Far transfer | Untrained domain tasks + a real-world proxy | Baseline, post, 3-month follow-up | Does it generalise? |
| Everyday function | Self-report and, where possible, performance-based | Baseline, post, follow-up | Does it matter? |
| Safety | Adverse events, photosensitivity screen, exercise screen, sleep/headache/eye strain | Every session or weekly | Harm detection |
| Blinding | Assessor-blind or automated outcomes | Every trial | Bias control |
| Comparator | Active control (alternative activity) | Every trial | Non-specific effect control |
| Expectancy | Credibility/expectancy scale | Baseline | Placebo control |
| Pre-registration | Protocol and analysis plan | Before each trial | Analytic integrity |

A product claim should be tied to a pre-registered comparison, not to a correlation between usage and self-reported improvement.

---

## 16. Limitations

1. **AI-assisted, not human-led.** No independent dual screening, no independent GRADE, no full-text appraisal of all records.
2. **973 rule-eligible and 446 rule-excluded reviews not extracted.** They are logged but not synthesised; this is a prioritisation deviation.
3. **Certainty is source-reported and provisional.**
4. **English-language only.**
5. **No direct PsycINFO, Embase, CINAHL or ERIC search.**
6. **Overlapping reviews.** Many reviews reuse the same trials; the review does not compute corrected covered area or pooled trial-level estimates.
7. **Publication bias.** Positive results are more likely to be published; several included reviews report suspected bias.
8. **Implausible effects and sign inconsistencies.** Some included reviews report effect sizes that cannot be true (for example SMD 5.09, 3.71 or 6.64); they are flagged and excluded from planning. A few abstracts also report a positive SMD with a negative confidence interval, or vice versa (PMIDs 39861961, 40790842). The table retains the magnitude, normalizes the sign to the direction of benefit, and records the original in the outcome note.
9. **Preprint and unverified identifiers.** Four records have preprint DOIs and seven are PMID-only.
10. **Fast-moving field.** The search is a 2026-10-31 snapshot; conclusions may change with new trials.
11. **No legal or regulatory determination.** The safety and regulatory section is context, not legal advice.

---

## 17. Conclusion

The evidence does not support a general "brain training makes you smarter" product. It supports a narrower, more useful product: a **measurement-rich, domain-specific training system** that improves the skills it trains, honestly reports near transfer, tests far transfer instead of assuming it, avoids medical claims, and treats safety as a first-class feature.

The strongest opportunities are:

- **older adults** using reasoning/speed practice plus movement, with everyday-function outcomes and long follow-up;
- **clinical rehabilitation adjuncts** where supervision and functional context already exist;
- **relaxation and anxiety support** with audio, clearly separated from cognitive claims;
- **engagement and adherence** as a measurable product capability.

The weakest opportunities are:

- consumer neurofeedback for cognitive enhancement;
- binaural beats for memory or intelligence;
- any dementia-prevention, ADHD-treatment or IQ claim;
- a single composite "brain score" that hides modality-specific effects.

Noesis should be built to prove itself, not to assume the claim.

---

## 18. References

All 109 included records, with PMIDs and verified DOIs, are listed in [REFERENCES.md](REFERENCES.md). The machine-readable version with outcomes, certainty, flags and product use is [analysis/evidence_table.json](analysis/evidence_table.json).
