# Behavioral Engagement Integration

**Source material:** CyberPulse `README.md` §Behavioral Psychology & Engagement Mechanics; CyberPulse `.aikit/decisions.md` ADR-002; `cyberpulse/rewards.py`; `cyberpulse/puzzles.py`.  
**Date:** 2026-11-01  
**Status:** Implemented as an opt-out **Motivation mode** with safeguards. This is not evidence of cognitive efficacy.  
**Companion:** [SYNTHESIS.md](SYNTHESIS.md), [DESIGN_IMPLICATIONS.md](DESIGN_IMPLICATIONS.md)

---

## 1. Why this document exists

CyberPulse is an entertainment game. Its behavioral-psychology section is a design rationale for making a hacking game engaging. Noesis is a cognitive-training and measurement product. Engagement that increases play time is not automatically good for a training user, and some of the mechanisms that make games compelling are also implicated in gambling harm and problematic gaming.

The first version of this audit recommended rejecting several CyberPulse mechanics. The product owner directed that they be integrated for adult and older-adult engagement. This document records that decision, the safeguards that bound the implementation, and the evidence that remains unresolved.

The governing rule is now:

> **Motivation mechanics may shape engagement, but they must never change cognitive scores, hide measurement, take real money, or put core progress at risk.**

---

## 2. Evidence standard

CyberPulse cites foundational psychology and neuroscience. Those sources are real, but they do not all support the use CyberPulse makes of them. This audit distinguishes:

- **Mechanism evidence:** does the psychological or neural effect exist?
- **Application evidence:** does using it in a training product improve learning, adherence or user welfare?
- **Ethical status:** does the mechanic respect autonomy, or does it exploit a bias?

A mechanism can be real and still require safeguards. Near-miss reward-circuit recruitment is real; that is precisely why it is used in gambling machines and why Noesis bounds it to a real personal-best comparison rather than a fake win.

---

## 3. Mechanism audit

| # | CyberPulse mechanism | Evidence status | Noesis implementation |
|---|---|---|---|
| 1 | Variable-ratio reward schedules (Skinner; Schultz) | Real reinforcement effect; dopamine prediction-error coding is well established. Application to training is not established, and the schedule is a core feature of gambling. | **Motivation mode:** 70% steady, 20% boost, 10% rare cosmetic momentum. Odds disclosed. Capped at 100 points per block. No effect on cognitive scores. |
| 2 | Near-miss effect (Clark et al., 2009) | Near misses were less pleasant but increased desire to play and recruited striatal/insula win circuitry; the authors link this to gambling addictiveness. | **Motivation mode:** a "near best" block cue within 5% of the real personal best, plus corrective N-back off-by-one feedback ("matched 1 back, not 2 back"). No fake win and no bonus for a wrong answer. |
| 3 | Loss aversion / push-your-luck (Kahneman & Tversky, 1979) | Prospect theory is robust. Loss-framed stakes can drive repeated play and anxiety. | **Motivation mode:** optional risk of bonus momentum only, resolved on the next block at 70% accuracy. Default is bank. Core progress is saved before the choice. |
| 4 | Zeigarnik effect / unfinished contracts | Context-dependent; plan-making can eliminate intrusive goal activation. Unfinished loops can create anxiety. | **Adopted:** optional when/where practice plan and a clear next-block preview. No artificial unfinished loops. |
| 5 | Autonomy and competence (Ryan & Deci; PENS) | Strong framework; game-specific evidence is mixed and often short-term. Autonomy and competence supports are low-risk. | **Adopted:** user-selected session length and difficulty; per-mechanic last/best accuracy; no composite score. |
| 6 | Deadline pressure / goal gradient (Kivetz et al.) | Goal-gradient effects are real, including in gambling jackpots. Artificial deadlines create pressure. | **Adopted with safeguards:** target-time display only, no penalty for exceeding it. Progress is visible without a countdown that punishes. |
| 7 | Combo streaks / flow channel (Csikszentmihalyi) | Flow is a useful heuristic, not a validated training mechanism. Streak loss can punish breaks. | **Motivation mode:** streak multiplier (x1-x3) on cosmetic momentum only. Losing a streak never removes cognitive progress. |
| 8 | Narrative transportation and character attachment | Transportation can increase engagement and persuasion, but can obscure measurement. | **Not in this slice.** Any future framing must not imply clinical benefit or hide the task. |
| 9 | Implementation intentions (Gollwitzer) | Meta-analytic support for goal attainment. | **Adopted:** optional when/where plan, local-only, editable, never blocking. |
| 10 | Meaningful narrative choice / self-concordance | Self-concordance and autonomy are plausible; narrative branching is unnecessary. | **Adapted:** choice of session length, difficulty and whether to bank or risk momentum. |
| 11 | Diegetic feedback / presence | Clear contextual feedback is good design; fiction is not required. | **Adopted the feedback, not the fiction:** explicit per-block results and non-claims. |

---

## 4. How the bounded mechanics work

### 4.1 Variable-ratio bonuses

After each block, Motivation mode rolls one deterministic bonus tier from the session seed:

- **Steady:** 70%, +0 bonus
- **Boost:** 20%, +5 bonus
- **Rare:** 10%, +15 bonus

Momentum points are cosmetic. They are shown at block end and in the session results, but they never alter accuracy, d-prime, reaction time or any cognitive metric. A block is capped at 100 points. The odds are disclosed in Settings. The mode can be turned off at any time.

**Safeguard:** no real money, no purchasable currency, no infinite session loop, no score impact.

### 4.2 Near-best and corrective near-miss

There are two bounded near-miss behaviors:

**Block near-best cue.** This is a **real near-best comparison**, not a fake "almost win":

- it triggers only when the block accuracy is below the user's personal best but within 5 percentage points;
- it adds a fixed +10 momentum bonus;
- it never triggers on a loss;
- it is not shown if the user has no prior result for that mechanic.

**N-back off-by-one cue.** On a false alarm, if the current letter matches the N-1 or N+1 position, the feedback says "Almost: that letter matched 1 back, not 2 back." It is corrective feedback only: no momentum bonus, no hit, no change to accuracy.

**Safeguard:** both cues describe a real relationship in the data. Neither fabricates a win.

### 4.3 Optional push-your-luck

At the end of a non-final block, the user can:

- **Bank** the unbanked momentum and continue (default); or
- **Risk** it on the next block. If the next block reaches 70% accuracy, the stake is doubled; otherwise it is lost.

Only bonus momentum is at risk. The cognitive session, completed block results and practice history are already safe. The UI states the threshold before the choice.

**Safeguard:** risk is optional, opt-in per block, capped, and never applies to core progress or stored history.

### 4.4 Target time and streaks

The session shows elapsed time and a target time (8 minutes standard, 5 minutes quick). Exceeding the target changes the color of the clock but has no penalty. The current and best streak are shown during a block; the streak multiplier (x1-x3) applies only to momentum.

**Safeguard:** no countdown that ends the session, no streak-loss penalty outside the cosmetic bonus.

### 4.5 Autonomy, competence and implementation intentions

- Session length and difficulty are user-selected.
- The optional when/where plan is stored locally and can be edited or cleared.
- Per-mechanic last/best accuracy replaces a global score.
- The app states what each mechanic does not claim.

---

## 5. What changed in the app

| Change | Mechanism | Safeguard |
|---|---|---|
| Motivation mode (default on, toggle in Settings) | Variable reward, streak, near-best, optional risk | Cosmetic only; no effect on cognitive scores |
| 70/20/10 bonus tiers | Variable-ratio reward | Odds disclosed; 100-point cap; no real money |
| Streak multiplier x1-x3 | Combo/flow | Momentum only; core progress never lost |
| Near-best +10 | Near-miss / goal gradient | Real personal-best comparison only |
| N-back off-by-one cue | Near-miss feedback | Corrective only; no bonus, no hit |
| Bank or risk between blocks | Loss aversion / push-your-luck | Default bank; bonus-only stake; 70% threshold shown |
| Target time | Deadline/goal gradient | No penalty; elapsed clock only |
| When/where plan | Implementation intentions | Optional, local-only, editable |
| Session length/difficulty choice | Autonomy/competence | User-selected; no hidden adaptive claim |
| Weekly summary | Clear feedback | Informational; no loss-framed streak in the summary |
| Daily break cue after 2 sessions | Overuse guard | Non-blocking; never locks the user out |
| In-app motivation safeguards card | Transparency | Explains the bounded motivation design |

Not implemented: narrative campaign, real-money rewards, purchasable currency, infinite loops, notifications.

---

## 6. Evidence notes and citations

### 6.1 Near-miss and reward circuitry

- Clark, L., Lawrence, A. J., Astley-Jones, F., & Gray, N. (2009). Gambling near-misses enhance motivation to gamble and recruit win-related brain circuitry. *Neuron*, 61(3), 481-490. PMID 19217383. DOI 10.1016/j.neuron.2008.12.031.
- Schultz, W. (1998). Predictive reward signal of dopamine neurons. *Journal of Neurophysiology*, 80(1), 1-27. PMID 9658025. DOI 10.1152/jn.1998.80.1.1.
- Schultz, W. (2016). Dopamine reward prediction error coding. *Dialogues in Clinical Neuroscience*, 18(1), 23-32. PMID 27069377. DOI 10.31887/DCNS.2016.18.1/wschultz.

**Interpretation:** dopamine prediction-error coding explains learning from surprise. It does not imply that a training product should maximize surprise. The same circuitry is recruited by gambling near misses, which is why the Noesis near-miss is a real personal-best cue rather than a fake win.

### 6.2 Loss aversion and goal gradients

- Kahneman, D., & Tversky, A. (1979). Prospect theory: An analysis of decision under risk. *Econometrica*, 47(2), 263-291. DOI 10.2307/1914185.
- Kivetz, R., Urminsky, O., & Zheng, Y. (2006). The goal-gradient hypothesis resurrected: Purchase acceleration, illusionary goal progress, and customer retention. *Journal of Marketing Research*, 43(1), 39-58. DOI 10.1509/jmkr.43.1.39.
- Dixon, M. J., Harrigan, K. A., Sandhu, R., Collins, K., & Fugelsang, J. A. (2010). Losses disguised as wins in modern multi-line video slot machines. *Addiction*, 105(10), 1819-1824. PMID 20712818. DOI 10.1111/j.1360-0443.2010.03050.x.
- Li, E., Rockloff, M. J., Browne, M., & Donaldson, P. (2016). Jackpot structural features: Rollover effect and goal-gradient effect in EGM gambling. *Journal of Gambling Studies*, 32, 707-720. PMID 26063627. DOI 10.1007/s10899-015-9557-7.

**Interpretation:** these effects are real and are used in gambling design. Noesis confines them to cosmetic momentum and keeps core progress safe.

### 6.3 Self-determination and games

- Deci, E. L., & Ryan, R. M. (2000). The "what" and "why" of goal pursuits: Human needs and the self-determination of behavior. *Psychological Inquiry*, 11(4), 227-268. DOI 10.1207/S15327965PLI1104_01.
- Ryan, R. M., Rigby, C. S., & Przybylski, A. (2006). The motivational pull of video games: A self-determination theory approach. *Motivation and Emotion*, 30(4), 344-360. DOI 10.1007/s11031-006-9051-8.
- Sheldon, K. M., & Elliot, A. J. (1999). Goal striving, need satisfaction, and longitudinal well-being: The self-concordance model. *Journal of Personality and Social Psychology*, 76(3), 482-497. DOI 10.1037/0022-3514.76.3.482.

**Interpretation:** autonomy and competence are reasonable design principles. They are not evidence that a cognitive-training product improves cognition.

### 6.4 Implementation intentions

- Gollwitzer, P. M., & Sheeran, P. (2006). Implementation intentions and goal achievement: A meta-analysis of effects and processes. *Advances in Experimental Social Psychology*, 38, 69-119. DOI 10.1016/S0065-2601(06)38002-1.
- Masicampo, E. J., & Baumeister, R. F. (2011). Consider it done! Plan making can eliminate the cognitive effects of unfulfilled goals. *Journal of Personality and Social Psychology*, 101(4), 667-683. PMID 21688924. DOI 10.1037/a0024192.

**Interpretation:** this is the strongest adoption case in the CyberPulse set. It supports a specific when/where plan.

### 6.5 Gamification and game harms

- Gamification of physical activity: Hedges g=0.42 (95% CI 0.14-0.69), 16 studies, 2,407 participants. PMID 34982715. DOI 10.2196/26779. Tempered by an e-Health gamification review finding mostly short-term engagement through extrinsic rewards with weak evidence for behaviour change (PMID 28536062): rewards earn the session, they do not change the behaviour.
- Systematic review of gamification in e-Health: mostly short-term engagement through extrinsic rewards; weak empirical evidence. PMID 28536062. DOI 10.1016/j.jbi.2017.05.011.
- Global prevalence of gaming disorder: 3.05% (95% CI 2.38-3.91), 53 studies, 226,247 participants. PMID 33028074. DOI 10.1177/0004867420962851.
- I-PACE model of specific Internet-use disorders. PMID 27590829. DOI 10.1016/j.neubiorev.2016.08.033.

**Interpretation:** gamification can help adherence, but the evidence is short-term and the harm base is non-trivial. Motivation mode must remain bounded and removable.

### 6.6 Foundational books and original phenomena

- Skinner, B. F. (1953). *Science and Human Behavior*. Macmillan. (Variable-ratio schedules.)
- Csikszentmihalyi, M. (1990). *Flow: The Psychology of Optimal Experience*. Harper & Row. (Flow channel.)
- Zeigarnik, B. (1927). Das Behalten erledigter und unerledigter Handlungen. *Psychologische Forschung*, 9, 1-85. (Original Zeigarnik effect.)

These are foundational sources, not product evidence. They describe mechanisms; they do not establish that a training product should use them without limits.

### 6.7 Persuasive technology and autonomy

- Persuasive technology and computational manipulation: the case for a right to mental self-determination. PMID 37469930.

**Interpretation:** dark patterns and hypernudging are recognized autonomy risks. Motivation mode must be explainable and switchable.

### 6.8 Gaming-disorder update (November 2026)

Six engagement records were added to the evidence table as a targeted update; all six are primary rows:

- Global gaming-disorder prevalence 3.05% (95% CI 2.38-3.91), adjusted to 1.96% with stringent sampling; tool choice explains 77% of variance. PMID 33028074. DOI 10.1177/0004867420962851.
- Young-adult IGD prevalence 6.1% (95% CI 5.03-7.40), 8.1% in gamer-only samples, rising over time. PMID 41317410. DOI 10.1016/j.addbeh.2025.108576.
- Adolescent gaming-disorder burden 8.6% (95% CI 6.9-10.8) with an increasing year trend. PMID 40115446. DOI 10.1016/j.puhip.2024.100565.
- Structural-features scoping review (105 articles): two risk classes, immersion/realism features and gambling-like reward-punishment features; intermittent rewards, near-miss, random-chance purchases and in-game currency implicated. PMID 37256740. DOI 10.1556/2006.2023.00019.
- Risk/protective meta-analysis (253 studies, 210,557 participants): moderately strong heterogeneous risk factors (male gender, depression, impulsivity, anxiety, stress, gaming time, escape motivation); few robust protective factors with smaller effects (self-esteem, life satisfaction, education). PMID 36571943. DOI 10.1016/j.addbeh.2022.107590.
- Adult ADHD-IGD review: inattention and hyperactivity-impulsivity associated with IGD incidence and severity; cross-sectional, no causal mediation. PMID 41659171. DOI 10.3389/fpsyt.2025.1735922.

Narrative-only (primary experimental studies, outside the umbrella-review table scope): rare loot-box rewards increase arousal and urge to open more (Larche et al., 2021, PMID 31760581); player-centered variable-ratio scheduling beats fixed experimenter schedules for enjoyment and performance in a memory-training game. Both support the bounded design: variable rewards stay cosmetic and disclosed, random-chance content and currencies are excluded entirely.

**Interpretation:** the disorder base rate is highest exactly where engagement mechanics bite hardest (young heavy users, impulsive users). Noesis has no social features, one reward currency (cosmetic momentum), no purchases, and fixed session lengths — the two strongest structural predictors (mandatory social play, reward-category count) do not apply. The remaining risk concentrates in variable-ratio bonuses, near-best cues and optional risk, which is why compulsive-use detection (open question 4) is now implemented rather than deferred.

### 6.9 Pull without compulsion (November 2026)

The November update adds the other half of the answer: game addictiveness pointed at brain function means verified behaviour-change techniques, not gambling-like features. The gamification meta-analysis (PMID 34982715, g=0.42 while active, g=0.15 at follow-up) and the exergame BCT review (PMID 40779747) support goal-setting, self-monitoring, feedback on behaviour and celebration of real achievement. Implemented as R37: a 14-day consistency calendar (self-monitoring), one-time milestone notices for session counts, practice-day streaks and adaptive level-ups (no loss framing, no streak punishment), and personal-best highlights that fire only when a prior best is genuinely beaten (feedback on behaviour, never a manufactured near-miss). Caps, odds disclosure, the break cue and the Motivation pause are untouched: pull is re-earned each session, restraint stays structural.

### 6.10 Trial arms for the RCT (November 2026)

When the device is used investigationally, stronger engagement variants must be testable without changing the default product. Implemented as R38: enrollment with an investigator-provided trial ID, a protocol-assigned arm (control or engagement), and explicit consent; the engagement arm adds a daily streak reminder; every session record carries its arm and the export carries the enrollment for analysis. Randomisation stays with the trial protocol — the app records and discloses, never assigns. Adverse-event capture, heavy-use detection and the Motivation pause run in every arm as the trial's safety monitoring.

### 6.11 Incentive design for the engagement arm (November 2026)

Three incentive records joined the table: deposit contracts beat lotteries and standard incentives and were the only design with effects persisting after the program (network meta-analysis of 35 RCTs, PMID 36367428); financial incentives beat usual care while active but fade after removal (PMID 24618584); contingency contracts work through all-or-nothing, attendance-contingent terms, with self-set terms best (PMID 25933128). Two mechanism reviews stayed narrative-only: reward anticipation drives hippocampal-VTA consolidation with larger effects at delayed test (PMID 26657967), and unexpected rewards engineer the prediction-error signal gamification runs on. A deposit-contract RCT added two warnings that shaped the design (PMID 36201384): deposits had lower uptake than plain rewards (61.7% vs 100%), and loss frames were significantly less effective than gain frames — so nothing is staked and everything is framed as gain.

Implemented as R39: the engagement arm uses a higher-variance bonus schedule (60/25/15 volatile vs 70/20/10 steady) for stronger reward-prediction errors, plus an attendance-contingent finisher bonus on completing every block. Both are disclosed per arm in Settings; the default product is untouched.

### 6.12 Weekly goals with goal-gradient framing (November 2026)

Three goal-setting records joined the table: specific goals have a large effect on behaviour in insufficiently active adults (g=1.11), and goals without rewards beat goals with rewards (PMID 38560998); multi-component goal setting works (d=0.55) with daily and combined daily-plus-weekly goals beating weekly-only ones (PMID 26445201); implementation intentions with reinforcement increase practice (PMID 30427874). The goal-gradient literature (Kivetz et al., primary studies, narrative-only) adds the mechanism: effort accelerates as the distance to the goal shrinks, which is why the app nudges hardest exactly one session short of the goal. Implemented as R40: one explicit weekly practice-day goal (default 3, adjustable 1-7) with progress display, a one-more-hits-it gradient nudge, and a met-goal acknowledgment that names rest as earned. The bar renders progress visually, like the stamp cards the goal-gradient studies used. The per-session when-where intention is the daily companion; the weekly goal is the reinforcement loop around it.

### 6.13 Retrieval practice and spacing as the core loop (November 2026)

Two Psychological Bulletin meta-analyses close the loop on what the app fundamentally is. Testing beats restudy for retention (g=0.50, 81% of effects positive, strongest with effortful recall plus feedback; PMID 25150680), and spaced study beats massed study at every retention interval with the optimal gap rising with the retention interval (PMID 16719566). Practice-testing and spaced-retrieval reviews from the education literature (Adesope 2017; Latimier et al. 2020, both narrative-only: no MEDLINE record) converge on the same prescription with two moderators that shaped the design: benefits are stronger when the test lags study by more than a day, and formats that mix recall with recognition outperform restudy on retention and transfer. Implemented as R41: the app states its loop plainly (every block tests and scores immediately), and spacing is structural — the weekly goal counts days, the back-to-back check-in fires within the hour, and the calendar shows the distribution, not just the total.

### 6.14 Habit formation with slip tolerance (November 2026)

Two habit records joined the table: habit strength improves with intervention (SMD 0.69) but takes about two months to start forming, with morning and self-selected practice strongest (PMID 39685110); and habit correlates with behavioural frequency at r=0.46 through context-dependent repetition (PMID 21626256). Two mechanism sources stayed narrative-only: Lally et al. 2009, whose 84-day study showed a single missed day does not materially affect formation, and the 2021 habit-tracking guidelines. Implemented as R42: when yesterday slipped but the week shows prior practice, home says so plainly — one session today keeps it forming, nothing resets. The ~2-month horizon sets honest expectations; the calendar accumulates and never subtracts. A fortnight-plus absence gets the same treatment with lapse-not-relapse framing: a welcome-back notice instead of a blank slate.

### 6.15 Focused retrieval of the weakest link (November 2026)
The testing and spacing rows (PMIDs 25150680, 16719566) already support the core loop; two education reviews sharpen the prescription without joining the table (no MEDLINE record): Adesope et al. 2017, where practice testing beat restudy with stronger benefits when the lag exceeded a day, and Latimier et al. 2020, where spaced retrieval plus mixed recall-recognition formats beat massed restudy on retention and transfer. Implemented as R43: every mechanic card offers an explicit focus session (three blocks, one task), and home suggests the weakest recent link — spaced retrieval works best on what you almost know. Focus is choice, never lock-in; the full mixed session stays the default.

### 6.16 Temptation bundling in the plan (November 2026)

Milkman et al. 2014 showed gym-only audiobooks lifted visits 51% enforced and 29% self-set (PMID 25843979); a 6,792-person follow-up found audiobooks plus bundling encouragement raised weekly workouts 10-14% with effects persisting 17 weeks (doi 10.1016/j.obhdp.2020.09.003, no MEDLINE record). The app can only offer the self-set version, so R44 adds an optional pairing line to the when-where plan: train with an existing indulgence, stated explicitly at planning time.

### 6.17 Coping planning completes the bundle (November 2026)

A planning-interventions meta-analysis of 41 RCTs joined the table (SMD 0.35, stronger with reinforcement during follow-up; PMID 35742582), alongside the Cochrane-style finding that action and coping planning show small-to-medium objective effects and that self-set terms work best. Implemented as R45: the plan form now holds the full HAPA bundle — when and where (action cue), paired with what indulgence (temptation), and what to do if stuck (coping response). Reinforcement for all three is the weekly goal plus the summary; self-set wording stays verbatim in the stored plan.

### 6.18 Shareable accountability without accounts (November 2026)
Social accountability improves adherence, but accounts and servers are out of scope. The compromise is a copyable weekly summary: totals, goal progress and minutes in one pasteable line for a coach, clinician or investigator. No new data leaves the device except by the user's own paste. See R46.

### 6.19 Mental contrasting calibrated to delivery mode (November 2026)
Two MCII reviews joined the table: mental contrasting with implementation intentions improves goal attainment (g=0.34, 21 studies; PMID 34054628), and mental contrasting alone improves health behaviour (g=0.28, matching MCII in that pool; PMID 30879403). The moderator that matters for an app: interactive formation reaches g=0.47 while document-delivered formats run g=0.28. Implemented as R47: copy and expectations use the document number, formation stays interactive (user-typed, self-set wording), and the saved plan keeps goal and obstacle visible together so the contrast is re-read, not just written once.

### 6.20 A far check that expects the null (November 2026)

The landmark reviews say far transfer is absent or fragile (PMIDs 27697851, 27474138) — so the app stops implying it and starts measuring it. Implemented as R48: a monthly 8-word study plus 16-trial old/new recognition check on its own screen, store and 30-day schedule, never mixed into practice metrics. It states the base rate up front (reviews usually find no transfer) so a low score reads as data, not failure. Sessions carry the trial arm, making it a ready far outcome for the RCT.

### 6.21 The export is the whole record (November 2026)

The copyable summary covers the week, but trials and portability need everything: R49 puts practice sessions, far checks and symptom reports — each arm-tagged where applicable — into the single JSON export. Nothing stays stranded on-device.

### 6.22 Calm timing for anxious trainers (November 2026)

A 238-study meta-analysis finds test anxiety negatively related to performance, with self-esteem protective and perceived difficulty and stakes raising anxiety (PMID 29156362); untimed conditions beat timed ones, most for high-anxious test-takers. Implemented as R50: an opt-in hide-the-clock setting, default off. The timer still paces sessions underneath; only the display is suppressed. Low stakes stay structural: practice framing, no diagnosis, no composite score.

### 6.23 Exposure logging makes arms auditable (November 2026)

A trial arm difference that cannot be audited in the data does not exist for analysis. Implemented as R51: every completed session records its engagement exposure (bonus schedule, banked total, finisher, per-block tiers) and the export carries the adaptation log alongside sessions, far checks and symptom reports.

---

## 7. Safeguards and design rules

1. **Cognitive scores stay deterministic.** Motivation never changes accuracy, d-prime, reaction time or stored results.
2. **Bonuses are cosmetic.** No real money, no purchasable currency, no progression locked behind random rewards.
3. **Core progress is banked before any risk.** A risky choice can only affect bonus momentum.
4. **Risk is optional and bounded.** Default is bank; the threshold is shown; the stake is capped.
5. **Near-miss is real.** The block cue uses an actual personal-best gap; the N-back cue uses an actual off-by-one lag. Neither fabricates a win.
6. **Odds are disclosed.** Settings states the 70/20/10 distribution.
7. **The mode is switchable.** Users can turn Motivation mode off at any time.
8. **No infinite loops.** Sessions have a fixed block count and a target time.
9. **No composite cognitive score.** Each domain is reported separately.
10. **Every mechanic must be explainable in one sentence.** If it cannot be, it is a dark pattern.
11. **Marketing copy is an active ingredient.** Expectation alone moves training scores (Foroughi et al. 2016, PMID 27325761, primary study, narrative-only), so honest claims are not just ethics — they keep the measured effect attributable to practice.

---

## 8. Open questions

1. Does Motivation mode improve 4-week adherence in adults and older adults?
2. Does the optional risk mechanic increase anxiety or dropout in older adults?
3. Does the near-best cue motivate or discourage users who plateau?
4. How should the app detect compulsive use and respond? **Implemented:** the app watches for heavy-use patterns (many sessions in a day, back-to-back sessions, long daily totals) and responds with a caring, non-coercive check-in that suggests rest and offers one-tap Motivation pause — never a lockout. See DESIGN_IMPLICATIONS R36.
5. Does a target time create helpful pacing or unwanted pressure? **Implemented as choice:** pacing stays default-on (the clock still paces the session) and users who feel pressured can hide it in Settings (R50). The question of which is better for whom stays open for the trial.
6. Which safeguards should be default-on versus opt-in in a clinical or assisted-living setting?

These are product research questions, not established evidence. They should be tested, not asserted. In particular, Motivation mode is an engagement feature, not a treatment for cognitive decline.
