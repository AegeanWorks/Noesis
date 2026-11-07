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

};

export function claimLabel(level: ClaimLevel): string {
  return CLAIM_LABEL[level];
}

export function mechanicMeta(id: MechanicId): MechanicMeta {
  return MECHANIC_META[id];
}
