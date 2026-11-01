import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const SRC = join(__dirname, "..", "..", "src");

const SENSITIVE = [
  "adhd",
  "dementia",
  "alzheimer",
  "brain age",
  "smarter",
  "nootropic",
  "intelligence",
  "academic",
  "iq",
];

function termHit(sentence: string): string | undefined {
  return SENSITIVE.find((term) => new RegExp(`\\b${term}\\b`, "i").test(sentence));
}

const NEGATIONS = [
  "not",
  "no",
  "never",
  "without",
  "neither",
  "nor",
  "cannot",
  "can't",
  "doesn't",
  "does not",
  "do not",
  "isn't",
  "is not",
  "aren't",
  "n't",
  "non-",
  "unproven",
  "no evidence",
];

function stringLiterals(source: string): string[] {
  const found: string[] = [];
  const pattern = /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source)) !== null) {
    found.push(match[0].slice(1, -1));
  }
  return found;
}

function sentences(text: string): string[] {
  return text.split(/(?<=[.?!])\s+/);
}

function isNegated(sentence: string): boolean {
  const lower = ` ${sentence.toLowerCase()} `;
  return NEGATIONS.some((negation) => lower.includes(negation));
}

export function findAffirmativeClaims(source: string): string[] {
  const problems: string[] = [];
  for (const literal of stringLiterals(source)) {
    for (const sentence of sentences(literal)) {
      const hit = termHit(sentence);
      if (hit && !isNegated(sentence)) {
        problems.push(`"${sentence.trim()}" uses "${hit}" without a negation`);
      }
    }
  }
  return problems;
}

function sources(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...sources(full));
    } else if (/\.(tsx?|ts)$/.test(entry) && !entry.endsWith(".test.tsx") && !entry.endsWith(".test.ts")) {
      files.push(full);
    }
  }
  return files;
}

describe("prohibited-claim lint (R5)", () => {
  it("flags affirmative marketing claims in fixtures", () => {
    expect(findAffirmativeClaims(`const a = "Boost your brain age!";`)).toHaveLength(1);
    expect(findAffirmativeClaims(`const a = "This prevents dementia.";`)).toHaveLength(1);
    expect(findAffirmativeClaims(`const a = "Treats ADHD naturally.";`)).toHaveLength(1);
    expect(findAffirmativeClaims(`const a = "Raise your IQ in weeks.";`)).toHaveLength(1);
  });

  it("accepts negated boundary copy in fixtures", () => {
    expect(
      findAffirmativeClaims(`const a = "It does not diagnose, treat or prevent ADHD.";`),
    ).toEqual([]);
    expect(
      findAffirmativeClaims(`const a = "Makes no intelligence claim.";`),
    ).toEqual([]);
    expect(
      findAffirmativeClaims(`const a = "There is no evidence of an IQ increase.";`),
    ).toEqual([]);
  });

  it("finds no affirmative prohibited claim in shipped UI copy", () => {
    const problems: string[] = [];
    for (const file of sources(SRC)) {
      if (file.replace(/\\/g, "/").endsWith("engine/evidence.ts")) continue;
      const flagged = findAffirmativeClaims(readFileSync(file, "utf-8"));
      for (const item of flagged) problems.push(`${file}: ${item}`);
    }
    expect(problems).toEqual([]);
  });
});
