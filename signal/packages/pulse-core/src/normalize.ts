const EPSILON = 10;

/** Sigmoid mapping acceleration to [0, 1] */
export function sigmoid(x: number, k = 0.5): number {
  return 1 / (1 + Math.exp(-k * x));
}

export function mentionAcceleration(
  mentionsLast1h: number,
  mentionsPrev1h: number
): number {
  const denom = Math.max(mentionsPrev1h, EPSILON);
  const acceleration = (mentionsLast1h - mentionsPrev1h) / denom;
  return sigmoid(acceleration);
}

export function hashtagBirthRate(
  newHashtagsLast1h: number,
  baselineBirthRate7d: number
): number {
  const baseline = Math.max(baselineBirthRate7d, 1);
  const rate = newHashtagsLast1h / baseline;
  return Math.min(rate / 5.0, 1.0);
}

export function applyManipulationDiscount(
  raw: number,
  botFraction: number,
  shillFraction: number,
  coordinatedFraction: number
): number {
  let score = raw;

  if (botFraction > 0.3) {
    score = 0;
  } else if (shillFraction > 0.5) {
    score *= 0.1;
  } else if (coordinatedFraction > 0.6) {
    score *= 0.2;
  }

  return score;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
