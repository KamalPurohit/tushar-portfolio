export const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t)

/** 0 → 1 as p moves from a to b. */
export const range = (p, a, b) => clamp01((p - a) / (b - a))

export const smooth = (t) => t * t * (3 - 2 * t)

/** Eased 0 → 1 as p moves from a to b. */
export const ease = (p, a, b) => smooth(range(p, a, b))

/** Eased in across a → b, eased back out across c → d. */
export const window4 = (p, a, b, c, d) => ease(p, a, b) * (1 - ease(p, c, d))

export const lerp = (a, b, t) => a + (b - a) * t

/** Frame-rate independent exponential smoothing. */
export const damp = (current, target, lambda, dt) =>
  lerp(current, target, 1 - Math.exp(-lambda * dt))

/** Deterministic pseudo-random in [0, 1) from an integer seed. */
export const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}
