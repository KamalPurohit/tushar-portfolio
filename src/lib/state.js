/* Shared, mutable, per-frame state. Deliberately not React state: the canvas
   reads it every frame and the DOM writes it from event listeners, so routing
   it through React would re-render the tree 60 times a second. */

const coarse =
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
const narrow = typeof window !== 'undefined' && window.innerWidth < 820

export const state = {
  /** Raw scroll progress in story time, 0 → STORY_END (lib/chapters). */
  target: 0,
  /** Damped scroll progress — what every scene reads. */
  progress: 0,
  /** Pointer in normalised device coords, -1 → 1, y up. */
  pointer: { x: 0, y: 0 },
  /** performance.now() of the last real pointer/touch input. */
  lastInput: -Infinity,
  /** Touch-first device: no hover, lighter effects. */
  mobile: coarse || narrow,
  reducedMotion:
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  /** Which 3D social icon is under the pointer, if any (drives the cursor). */
  hovering: null,
}
