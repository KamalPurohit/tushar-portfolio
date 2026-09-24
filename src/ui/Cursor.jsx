import { useEffect, useRef } from 'react'
import { state } from '../lib/state'

/* A two-part cursor: a precise dot and a lagging focus ring that opens up
   over anything interactive — links, buttons, and the 3D social icons. */
export default function Cursor() {
  const dot = useRef()
  const ring = useRef()
  useEffect(() => {
    document.documentElement.classList.add('has-cursor')
    const pos = { x: innerWidth / 2, y: innerHeight / 2 }
    const lag = { ...pos }
    let hot = false
    let down = false
    let raf
    const move = (e) => {
      pos.x = e.clientX
      pos.y = e.clientY
      hot = !!e.target.closest?.('a, button')
    }
    const press = () => (down = true)
    const release = () => (down = false)
    const loop = () => {
      lag.x += (pos.x - lag.x) * 0.18
      lag.y += (pos.y - lag.y) * 0.18
      const active = hot || state.hovering
      dot.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`
      ring.current.style.transform = `translate3d(${lag.x}px, ${lag.y}px, 0) scale(${(active ? 1.9 : 1) * (down ? 0.8 : 1)})`
      ring.current.classList.toggle('is-active', !!active)
      raf = requestAnimationFrame(loop)
    }
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', press)
    window.addEventListener('pointerup', release)
    raf = requestAnimationFrame(loop)
    return () => {
      document.documentElement.classList.remove('has-cursor')
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', press)
      window.removeEventListener('pointerup', release)
    }
  }, [])
  return (
    <>
      <div ref={ring} className="cursor-ring" aria-hidden="true" />
      <div ref={dot} className="cursor-dot" aria-hidden="true" />
    </>
  )
}
