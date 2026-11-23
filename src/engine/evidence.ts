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
      "Working-memory updating: you keep a stream of letters in mind and decide whether the current one matches the one N positions back. A 2017 multi-level meta-analysis of 33 randomized n-back training trials in healthy adults found medium transfer to untrained n-back tasks, but only very small effects on other working-memory tasks and cognitive control, with no evidence of a general-intelligence gain.",
    claimLevel: "supported",
    claim:
      "Trains working-memory updating; improves performance on untrained n-back tasks, with little transfer beyond the task.",
    qualifier:
      "Near transfer to untrained n-back only. The meta-analysis found very small effects on other working-memory tasks and cognitive control, and no evidence of a general-intelligence gain.",
    notClaimed: ["General intelligence", "Academic achievement", "Dementia prevention"],
    citations: [
      { pmid: "28116702", label: "N-back training meta-analysis (2017)" },
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
      { pmid: "38309625", label: "Go/No-Go appetitive-behaviour meta-analysis (2024)" },
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
  rotation: {
    id: "rotation",
    name: "Mental Rotation",
    domain: "reasoning",
    tagline: "Spatial reasoning",
    instructions:
      "Two block figures appear. Decide whether the right figure is the same shape rotated, or a mirror image. Keys 1 (same) and 2 (mirrored) work too.",
    brief:
      "Spatial-reasoning practice: decide whether a rotated block figure is the same shape or a mirror image. A 2013 meta-analysis of 217 training studies found a moderate average spatial-training effect (g=0.47) that was stable and transferred to untrained spatial tasks. A 2022 meta-analysis also found a small mathematics effect (g=0.28), but concrete materials outperformed computerized training, so this app claims spatial-task practice only.",
    claimLevel: "experimental",
    claim: "Practices mentally rotating and comparing spatial figures.",
    qualifier:
      "Task practice only. Accuracy is a within-session descriptive measure; this is not a diagnostic test and does not claim academic, general-intelligence or everyday-function benefits.",
    notClaimed: [
      "General intelligence",
      "Mathematics achievement",
      "Academic achievement",
      "Dementia prevention",
      "Everyday function",
    ],
    citations: [
      { pmid: "22663761", label: "Spatial skills training meta-analysis (2013)" },
      { pmid: "35073120", label: "Spatial training and mathematics meta-analysis (2022)" },
    ],
    safety: "Static block figures; no flashing.",
  },
  prospective: {
    id: "prospective",
    name: "Prospective Memory",
    domain: "episodic_memory",
    tagline: "Delayed intentions",
    instructions:
      "Sort each letter as a vowel or consonant. If the letter is Q, choose Remember instead. Keys 1, 2 and 3 work too.",
    brief:
      "Prospective-memory practice: hold a delayed intention while an ongoing letter task continues. A 2023 meta-analysis of 29 randomized trials found a moderate immediate training effect (g=0.54) in older adults, but the long-term effect (g=0.20) was not significant. This is an experimental focus test, not a validated protocol or an everyday-function claim.",
    claimLevel: "experimental",
    claim:
      "Practices remembering to carry out a delayed intention while an ongoing task continues.",
    qualifier:
      "Task practice only. Cue hits are a within-session descriptive measure; this is not a diagnostic test and does not claim long-term or everyday-function benefit.",
    notClaimed: [
      "General intelligence",
      "Everyday function",
      "Dementia prevention",
      "ADHD treatment",
      "Long-term memory improvement",
    ],
    citations: [
      { pmid: "35543836", label: "Prospective-memory training meta-analysis (2023)" },
    ],
    safety: "Static letters; no flashing.",
  },
  paired: {
    id: "paired",
    name: "Paired Associates",
    domain: "episodic_memory",
    tagline: "Verbal episodic memory",
    instructions:
      "Study the word pair, then choose the word that was paired with the cue. Keys 1-4 work too.",
    strategyHint:
      "Link the two words in a vivid image or a short sentence. The link can be silly; that is what makes it memorable.",
    brief:
      "Verbal episodic-memory practice: study a word pair, then retrieve its partner. A 2022 meta-analysis of 21 randomized trials found mnemonic training improved episodic memory immediately (g=0.408) and at follow-up (g=0.418) in healthy older adults; the evidence concerns strategy training, not this exact task. This is an experimental focus test with no far-transfer or everyday-function claim.",
    claimLevel: "experimental",
    claim: "Practices encoding and retrieving arbitrary word pairs.",
    qualifier:
      "Task practice only. Accuracy is a within-session descriptive measure; this is not a diagnostic test and does not claim general memory, academic or everyday-function improvement.",
    notClaimed: [
      "General intelligence",
      "Everyday function",
      "Dementia prevention",
      "ADHD treatment",
      "Long-term memory improvement",
    ],
    citations: [
      { pmid: "36301274", label: "Mnemonic memory-training meta-analysis (2022)" },
    ],
    safety: "Static words; no flashing.",
  },
  change: {
    id: "change",
    name: "Change Detection",
    domain: "working_memory",
    tagline: "Visual working memory",
    instructions:
      "A brief array of coloured squares appears, then one square changes colour. Tap the square that changed. Keys 1-9 work too.",
    brief:
      "Visual working-memory practice: hold a short array of colours across a brief delay and detect the changed square. Working-memory and executive-function training meta-analyses show short-term near transfer but no convincing far transfer. This is an experimental focus test, not a validated protocol or a general-intelligence claim.",
    claimLevel: "experimental",
    claim: "Practices holding visual colour-location information across a brief delay.",
    qualifier:
      "Task practice only. Accuracy and set size are within-session descriptive measures; this is not a diagnostic test and does not claim general memory or everyday-function improvement.",
    notClaimed: [
      "General intelligence",
      "Everyday function",
      "Dementia prevention",
      "ADHD treatment",
      "Long-term memory improvement",
    ],
    citations: [
      { pmid: "30998045", label: "Executive-function training meta-analysis (2019)" },
      { pmid: "32011155", label: "Cognitive training modules meta-analysis (2020)" },
    ],
    safety: "Static coloured squares; one brief change, no flashing.",
  },
  search: {
    id: "search",
    name: "Visual Search",
    domain: "executive_function",
    tagline: "Conjunction attention",
    instructions:
      "Find the red circle among the red squares and blue circles. Tap it as quickly as you can. Smaller and larger grids alternate so the app can compare search times.",
    brief:
      "Conjunction visual search: the target shares one feature with each distractor, so you must combine colour and shape to find it. Training studies show faster and more efficient search for the trained target, but no pooled healthy-adult effect estimate supports a transfer claim. This is an experimental focus test, not an attention diagnostic or a general-attention claim.",
    claimLevel: "experimental",
    claim: "Practices efficient conjunction search within a static grid.",
    qualifier:
      "Task practice only. Accuracy and the within-session set-size cost are descriptive measures; this is not a diagnostic test and does not claim improved general attention or everyday function.",
    notClaimed: [
      "General attention",
      "Everyday function",
      "General intelligence",
      "ADHD treatment",
      "Reading improvement",
    ],
    citations: [
      { pmid: "35838486", label: "Conjunction visual-search training study (2022)" },
      { pmid: "36922549", label: "Symbol-search serious game for readers (2023)" },
      { pmid: "30859709", label: "Visual-search training connectivity study (2019)" },
    ],
    safety: "Static coloured shapes; no flicker, no rapid presentation.",
  },
  symbol: {
    id: "symbol",
    name: "Digit Symbol",
    domain: "processing_speed",
    tagline: "Symbol association speed",
    instructions:
      "Learn the four digit-to-shape pairs in the legend, then tap the digit that matches each shape. Work steadily; accuracy and response time are both reported.",
    brief:
      "Digit-symbol association: link a visual symbol to its digit and respond under a time limit. Broad cognitive-training meta-analyses find small processing-speed near-transfer effects, but no task-specific digit-symbol training meta-analysis was located. This is an experimental focus test, not a processing-speed diagnostic or a general-speed claim.",
    claimLevel: "experimental",
    claim: "Practices a learned digit-to-symbol association under a time limit.",
    qualifier:
      "Task practice only. Accuracy, response time and the within-block change are descriptive measures; this is not a diagnostic test and does not claim faster thinking, intelligence or everyday benefit.",
    notClaimed: [
      "General processing speed",
      "General intelligence",
      "Academic achievement",
      "Everyday function",
      "Dementia prevention",
    ],
    citations: [
      { pmid: "32011155", label: "Cognitive training modules meta-analysis (2020)" },
      { pmid: "32980574", label: "Game-based training meta-regression (2021)" },
      { pmid: "30998045", label: "Executive-function training meta-analysis (2019)" },
    ],
    safety: "Static shapes and digits; no flicker, no audio.",
  },
};

export function claimLabel(level: ClaimLevel): string {
  return CLAIM_LABEL[level];
}

export function mechanicMeta(id: MechanicId): MechanicMeta {
  return MECHANIC_META[id];
}
