import Lenis from 'lenis'
import { state } from './state'
import { CHAPTERS } from './chapters'

/* Smooth scroll. Lenis moves the real document scroll, so framer-motion's
   useScroll and the canvas read the same, already-smoothed value. */

let lenis = null

const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight

export function startScroll() {
  const update = () => {
    const max = maxScroll()
    state.target = max > 0 ? window.scrollY / max : 0
  }
  update()
  state.progress = state.target
  if (!state.reducedMotion) {
    lenis = new Lenis({ autoRaf: true, lerp: 0.08, wheelMultiplier: 0.9, touchMultiplier: 1.4 })
    lenis.on('scroll', update)
  }
  window.addEventListener('scroll', update, { passive: true })
  window.addEventListener('resize', update)
  return () => {
    lenis?.destroy()
    lenis = null
    window.removeEventListener('scroll', update)
    window.removeEventListener('resize', update)
  }
}

/** Jump to a point in the film (0 → 1). */
export function scrollToProgress(p) {
  const y = p * maxScroll()
  if (lenis) lenis.scrollTo(y, { duration: 2.2 })
  else window.scrollTo({ top: y, behavior: state.reducedMotion ? 'auto' : 'smooth' })
}

/** Jump to the settled middle of a chapter. */
export function scrollToChapter(id) {
  const c = CHAPTERS.find((ch) => ch.id === id)
  if (!c) return
  const settle = { hero: 0, cinematographer: 0.3, editor: 0.54, social: 0.74, contact: 1 }
  scrollToProgress(settle[id] ?? (c.start + c.end) / 2)
}
