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
};

export function claimLabel(level: ClaimLevel): string {
  return CLAIM_LABEL[level];
}

export function mechanicMeta(id: MechanicId): MechanicMeta {
  return MECHANIC_META[id];
}
