export function normalizeSeed(seed: number): number {
  if (!Number.isFinite(seed)) return 1;
  const normalized = Math.trunc(seed) >>> 0;
  return normalized === 0 ? 1 : normalized;
}

export function nextRandom(state: number): [number, number] {
  let t = (state + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return [value, t >>> 0];
}

export function randomInt(state: number, maxExclusive: number): [number, number] {
  if (!Number.isFinite(maxExclusive) || maxExclusive <= 0) return [0, state];
  const [value, next] = nextRandom(state);
  return [Math.floor(value * Math.floor(maxExclusive)), next];
}

export function chance(state: number, probability: number): [boolean, number] {
  const [value, next] = nextRandom(state);
  return [value < probability, next];
}

export function shuffle<T>(items: readonly T[], state: number): [T[], number] {
  const result = [...items];
  let cursor = state;
  for (let i = result.length - 1; i > 0; i -= 1) {
    const [j, next] = randomInt(cursor, i + 1);
    cursor = next;
    const current = result[i];
    const other = result[j];
    if (current === undefined || other === undefined) continue;
    result[i] = other;
    result[j] = current;
  }
  return [result, cursor];
}

export function sampleIndices(
  population: number,
  count: number,
  state: number,
): [number[], number] {
  const safeCount = Math.max(0, Math.min(count, population));
  const indices = Array.from({ length: population }, (_, index) => index);
  const [shuffled, next] = shuffle(indices, state);
  return [shuffled.slice(0, safeCount), next];
}
