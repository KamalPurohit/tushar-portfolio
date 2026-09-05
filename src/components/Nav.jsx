import { useEffect, useState } from 'react'
import { nav, meta, mailto } from '../content/site.js'
import { PillButton } from './ui/Primitives.jsx'

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        scrolled ? 'border-b border-surface-25 bg-just-black/90 backdrop-blur-xl' : 'border-b border-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-(--container-page) items-center justify-between gap-4 px-6 py-4">
        <a href="#top" className="text-body font-semibold tracking-[-0.01em]">
          <span className="text-gradient-green">Tushar</span>
          <span className="text-surface-cream"> KB</span>
        </a>

        {/* Tight 6–16px link spacing keeps the bar compact and editorial. */}
        <ul className="hidden items-center gap-1.5 md:flex">
          {nav.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="block px-3 py-2.5 text-body-sm text-surface-50 transition-colors hover:text-surface-cream"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <PillButton
            href={mailto}
            gradient
            className="hidden !py-2.5 !text-body-sm sm:inline-flex"
          >
            Let’s Talk
          </PillButton>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
            className="grid size-10 place-items-center rounded-full text-surface-cream md:hidden"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 8h16M4 16h16" />}
            </svg>
          </button>
        </div>
      </nav>

      {open && (
        <ul className="border-t border-surface-25 bg-just-black px-6 py-2 md:hidden">
          {nav.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                onClick={() => setOpen(false)}
                className="block py-3 text-body text-surface-50 transition-colors hover:text-surface-cream"
              >
                {item.label}
              </a>
            </li>
          ))}
          <li className="py-3">
            <a href={mailto} className="text-body text-shockingly-green">Let’s Talk</a>
          </li>
        </ul>
      )}
    </header>
  )
}
