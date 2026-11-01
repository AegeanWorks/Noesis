const A = [
  -39.69683028665376, 220.9460984245205, -275.9285104469687,
  138.357751867269, -30.66479806614716, 2.506628277459239,
] as const;
const B = [
  -54.47609879822406, 161.5858368580409, -155.6989798598866,
  66.80131188771972, -13.28068155288572,
] as const;
const C = [
  -0.007784894002430293, -0.3223964580411365, -2.400758277161838,
  -2.549732539343734, 4.374664141464968, 2.938163982698783,
] as const;
const D = [
  0.007784695709041462, 0.3224671290700398, 2.445134137142996,
  3.754408661907416,
] as const;
const P_LOW = 0.02425;
const P_HIGH = 1 - P_LOW;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function probit(probability: number): number {
  if (probability <= 0) return -5;
  if (probability >= 1) return 5;
  if (probability < P_LOW) {
    const q = Math.sqrt(-2 * Math.log(probability));
    return (
      (((((C[0] * q + C[1]) * q + C[2]) * q + C[3]) * q + C[4]) * q +
        C[5]) /
      ((((D[0] * q + D[1]) * q + D[2]) * q + D[3]) * q + 1)
    );
  }
  if (probability <= P_HIGH) {
    const q = probability - 0.5;
    const r = q * q;
    return (
      ((((((A[0] * r + A[1]) * r + A[2]) * r + A[3]) * r + A[4]) * r +
        A[5]) *
        q) /
      (((((B[0] * r + B[1]) * r + B[2]) * r + B[3]) * r + B[4]) * r +
        1)
    );
  }
  const q = Math.sqrt(-2 * Math.log(1 - probability));
  return -(
    (((((C[0] * q + C[1]) * q + C[2]) * q + C[3]) * q + C[4]) * q +
      C[5]) /
    ((((D[0] * q + D[1]) * q + D[2]) * q + D[3]) * q + 1)
  );
}

export function dPrime(
  hits: number,
  targets: number,
  falseAlarms: number,
  nonTargets: number,
): number {
  const hitRate = (hits + 0.5) / (targets + 1);
  const falseAlarmRate = (falseAlarms + 0.5) / (nonTargets + 1);
  return round(clamp(probit(hitRate) - probit(falseAlarmRate), -5, 5), 3);
}

export function mean(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function round(value: number, digits = 2): number {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function rate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return round(numerator / denominator, 3);
}

export function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle] ?? null;
  const lower = sorted[middle - 1];
  const upper = sorted[middle];
  if (lower === undefined || upper === undefined) return null;
  return (lower + upper) / 2;
}

export function standardDeviation(values: readonly number[]): number {
  if (values.length < 2) return 0;
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - average) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function longestStreak<T>(items: readonly T[], predicate: (item: T) => boolean): number {
  let best = 0;
  let current = 0;
  for (const item of items) {
    if (predicate(item)) {
      current += 1;
      if (current > best) best = current;
    } else {
      current = 0;
    }
  }
  return best;
}

export function currentStreak<T>(items: readonly T[], predicate: (item: T) => boolean): number {
  let current = 0;
  for (let index = items.length - 1; index >= 0; index -= 1) {
    const item = items[index];
    if (item === undefined || !predicate(item)) break;
    current += 1;
  }
  return current;
}
