import { useEffect, useState } from 'react'
import Experience from './scene/Experience'
import Overlay from './ui/Overlay'
import Cursor from './ui/Cursor'
import Loader from './ui/Loader'
import { state } from './lib/state'
import { startScroll } from './lib/scroll'
import { FILM_LENGTH_VH } from './lib/chapters'

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

/** Pointer and touch → shared normalised pointer. Idle touch screens get a
 *  slow wandering gaze so the figure never freezes. */
function usePointer() {
  useEffect(() => {
    const set = (x, y) => {
      state.pointer.x = (x / window.innerWidth) * 2 - 1
      state.pointer.y = -(y / window.innerHeight) * 2 + 1
      state.lastInput = performance.now()
    }
    const onMove = (e) => set(e.clientX, e.clientY)
    const onTouch = (e) => e.touches[0] && set(e.touches[0].clientX, e.touches[0].clientY)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('touchstart', onTouch, { passive: true })
    window.addEventListener('touchmove', onTouch, { passive: true })

    let raf
    const wander = (now) => {
      if (now - state.lastInput > 3500) {
        const t = now / 1000
        state.pointer.x += (Math.sin(t * 0.35) * 0.55 - state.pointer.x) * 0.02
        state.pointer.y += (Math.sin(t * 0.23 + 1) * 0.3 - state.pointer.y) * 0.02
      }
      raf = requestAnimationFrame(wander)
    }
    raf = requestAnimationFrame(wander)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('touchstart', onTouch)
      window.removeEventListener('touchmove', onTouch)
    }
  }, [])
}

export default function App() {
  const [webgl] = useState(hasWebGL)
  usePointer()
  useEffect(() => startScroll(), [])

  return (
    <>
      {webgl ? <Experience /> : <div className="scene scene--fallback" />}
      <Overlay />
      {/* Fixed layer for in-scene HTML (drei <Html>); body would scroll it away. */}
      <div id="html-layer" className="html-layer" />
      {!state.mobile && <Cursor />}
      {webgl && <Loader />}
      <div className="film" style={{ height: `${FILM_LENGTH_VH}vh` }} aria-hidden="true" />
    </>
  )
}
