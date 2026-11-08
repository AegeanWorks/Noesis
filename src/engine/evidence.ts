import type { ClaimLevel, MechanicId, MechanicMeta } from "./types";

const CLAIM_LABEL: Record<ClaimLevel, string> = {
  supported: "Supported",
  experimental: "Experimental",
  wellness_only: "Wellness only",
};

export const MECHANIC_META: Record<MechanicId, MechanicMeta> = {
  nback: {
    id: "nback",
    name: "N-back",
    domain: "working_memory",
    tagline: "Working-memory updating",
    instructions:
      "A letter appears. Press Match only when it is the same as the letter N positions back.",
    brief:
      "Working-memory updating: you keep a stream of letters in mind and decide whether the current one matches the one N positions back. N-back is a standard updating paradigm; training improves the trained task and closely related working-memory tasks, but the best-controlled reviews find no general intelligence or academic gain.",
    claimLevel: "supported",
    claim:
      "Trains working-memory updating; may improve performance on closely related working-memory tasks during training.",
    qualifier:
      "Near transfer only. The best-controlled reviews find no general intelligence or academic gain.",
    notClaimed: ["General intelligence", "Academic achievement", "Dementia prevention"],
    citations: [
      { pmid: "42711482", label: "Asymmetric working-memory transfer (2026)" },
      { pmid: "22612437", label: "Working-memory training meta-analysis (2013)" },
      { pmid: "27474138", label: "No far transfer with treated controls (2016)" },
    ],
    safety: "Letters only. No flashing.",
  },
  gonogo: {
    id: "gonogo",
    name: "Go / No-Go",
    domain: "inhibition",
    tagline: "Response inhibition",
    instructions: "Press Respond for circles. Do not respond to squares.",
    brief:
      "Response inhibition and sustained attention: you press for one shape and withhold for another. Go/No-Go is a standard inhibition paradigm; practice improves performance on this task, but it is not an ADHD treatment and does not measure everyday impulse control.",
    claimLevel: "experimental",
    claim: "Practices response inhibition and sustained attention.",
    qualifier:
      "Task practice only. There is no far-transfer, ADHD-treatment or daily-impulse-control claim.",
    notClaimed: ["ADHD treatment", "Daily impulse control", "General intelligence"],
    citations: [
      { pmid: "40398202", label: "Inhibitory-control network meta-analysis (2025)" },
      { pmid: "37450981", label: "Executive-function review in ADHD (2023)" },
    ],
    safety: "Rapid shape changes. No flashing.",
  },
  reasoning: {
    id: "reasoning",
    name: "Reasoning",
    domain: "reasoning",
    tagline: "Inductive reasoning",
    instructions: "Choose the best answer. You can take up to 30 seconds per item.",
    brief:
      "Inductive reasoning: you find the rule in sequences, analogies and logic items. Reasoning training has the most durable domain-specific evidence in older adults (the ACTIVE trial); this is practice on reasoning items, not an IQ test and not a dementia-prevention programme.",
    claimLevel: "supported",
    claim:
      "Practices inductive reasoning; reasoning training has shown durable domain-specific effects in older adults.",
    qualifier:
      "Evidence is strongest for older adults (ACTIVE trial). It is not evidence of an IQ increase.",
    notClaimed: ["IQ increase", "Dementia prevention", "General problem-solving transfer"],
    citations: [
      { pmid: "24417410", label: "ACTIVE 10-year follow-up (2014)" },
      { pmid: "17179457", label: "ACTIVE 5-year follow-up (2006)" },
      { pmid: "41016407", label: "Lifestyle intervention network (2025)" },
    ],
    safety: "Text only. No flashing.",
  },
  speed: {
    id: "speed",
    name: "Speed Tap",
    domain: "processing_speed",
    tagline: "Processing speed",
    instructions: "Wait for the circle, then tap as quickly as you can.",
    brief:
      "Simple reaction time and timing consistency: you wait for a circle, then tap as fast as you can. This is reaction-time practice, not the UFOV divided-attention protocol that showed speed-training effects in ACTIVE; it does not measure everyday processing speed.",
    claimLevel: "experimental",
    claim:
      "Practices simple reaction speed and timing consistency; it is not a substitute for divided-attention speed training.",
    qualifier:
      "Reaction-time practice only. ACTIVE supports speed training in older adults, but this task is not the UFOV protocol.",
    notClaimed: ["General processing speed", "Everyday function", "Dementia prevention"],
    citations: [
      { pmid: "24417410", label: "ACTIVE 10-year speed effects (2014)" },
      { pmid: "17179457", label: "ACTIVE 5-year follow-up (2006)" },
    ],
    safety: "Single circle onset. No flashing.",
  },
  switching: {
    id: "switching",
    name: "Task Switch",
    domain: "cognitive_flexibility",
    tagline: "Cognitive flexibility",
    instructions:
      "Watch the rule. Colour rule: choose the colour. Shape rule: choose the shape. Keys 1 and 2 work too.",
    brief:
      "Cognitive flexibility: you alternate between a colour rule and a shape rule, so the same stimulus needs a different answer after a switch. Task-switching practice improves the trained switching task; executive-function training meta-analyses show small near-transfer and far-transfer effects in older adults, but this is not a general intelligence or everyday-function claim.",
    claimLevel: "experimental",
    claim:
      "Practices set-shifting, rule maintenance and switching between competing responses.",
    qualifier:
      "Task practice only. Executive-function training effects are small and mostly near transfer; this is not a diagnostic test and does not train general intelligence.",
    notClaimed: [
      "General intelligence",
      "Academic achievement",
      "Dementia prevention",
      "Everyday function",
    ],
    citations: [
      { pmid: "30998045", label: "Executive-function training meta-analysis (2019)" },
      { pmid: "32011155", label: "Cognitive training modules meta-analysis (2020)" },
    ],
    safety: "Static shapes and text only. No flashing.",
  },
  flanker: {
    id: "flanker",
    name: "Flanker",
    domain: "executive_function",
    tagline: "Interference control",
    instructions:
      "Choose the direction of the centre arrow. The surrounding arrows may point the other way. Keys 1 (left) and 2 (right) work too.",
    brief:
      "Interference control: you respond to the centre arrow while ignoring conflicting flankers. Executive-function training meta-analyses show small near-transfer effects in older adults; no Flanker-specific training meta-analysis was found in this review, so this is an experimental focus test, not a validated protocol or a general-intelligence or everyday-function claim.",
    claimLevel: "experimental",
    claim:
      "Practices interference control and the ability to suppress conflicting response cues.",
    qualifier:
      "Task practice only. Interference cost is a within-session descriptive measure; this is not a diagnostic test and does not train general intelligence or everyday function.",
    notClaimed: [
      "General intelligence",
      "Academic achievement",
      "Dementia prevention",
      "Everyday function",
      "ADHD treatment",
    ],
    citations: [
      { pmid: "30998045", label: "Executive-function training meta-analysis (2019)" },
      { pmid: "32011155", label: "Cognitive training modules meta-analysis (2020)" },
    ],
    safety: "Static arrow characters. No flashing.",
  },
  spatial: {
    id: "spatial",
    name: "Spatial Span",
    domain: "working_memory",
    tagline: "Visuospatial working memory",
    instructions:
      "Watch the blocks light up in order, then tap them in the same order. The sequence grows after a correct trial and shrinks after a miss. No time pressure beyond a generous recall window.",
    brief:
      "Visuospatial working-memory practice: a short block sequence is shown, then reproduced. A 2025 meta-analysis of cognitive training in healthy older adults found a small improvement on the Corsi Block task (d=0.16), and working-memory training reviews show short-term near transfer but no convincing far transfer. This is an experimental focus test, not a validated protocol or a general-intelligence claim.",
    claimLevel: "experimental",
    claim:
      "Practices holding and reproducing a sequence of spatial locations, the task a Corsi block test measures.",
    qualifier:
      "Task practice only. Span is a within-session descriptive measure; this is not a diagnostic test and does not train general intelligence or everyday function.",
    notClaimed: [
      "General intelligence",
      "Academic achievement",
      "Dementia prevention",
      "Everyday function",
      "ADHD treatment",
    ],
    citations: [
      { pmid: "37822255", label: "Cognitive training and Corsi Block meta-analysis (2025)" },
    ],
    safety: "Static grid; highlights change at a slow fixed pace with no flashing.",
  },
};

export function claimLabel(level: ClaimLevel): string {
  return CLAIM_LABEL[level];
}

export function mechanicMeta(id: MechanicId): MechanicMeta {
  return MECHANIC_META[id];
}
