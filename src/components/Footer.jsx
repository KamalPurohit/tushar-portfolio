import { meta, nav, mailto } from '../content/site.js'
import { Bracket } from './ui/Primitives.jsx'

/* Footer sits one surface step lighter than the canvas — a subtle terminator. */
export function Footer() {
  return (
    <footer className="border-t border-surface-25 bg-off-black">
      <div className="mx-auto max-w-(--container-page) px-6 py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <p className="text-heading-sm font-semibold">
              <span className="text-gradient-green">Tushar</span>
              <span className="text-surface-cream"> KB</span>
            </p>
            <Bracket className="mt-4">{meta.role}</Bracket>
            <p className="mt-2 text-body-sm text-surface-50">{meta.location}</p>
          </div>

          <nav aria-label="Footer">
            <h2 className="text-caption text-surface-50">Navigate</h2>
            <ul className="mt-4 space-y-2.5">
              {nav.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="text-body-sm text-surface-cream transition-opacity hover:opacity-70">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-caption text-surface-50">Elsewhere</h2>
            <ul className="mt-4 space-y-2.5">
              <li>
                <a href={mailto} className="text-body-sm text-surface-cream transition-opacity hover:opacity-70">
                  {meta.email}
                </a>
              </li>
              <li>
                <a href={meta.phoneHref} className="text-body-sm text-surface-cream transition-opacity hover:opacity-70">
                  {meta.phone}
                </a>
              </li>
              <li>
                <a href={meta.instagram} target="_blank" rel="noreferrer noopener"
                  className="text-body-sm text-surface-cream transition-opacity hover:opacity-70">
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-surface-25 pt-8">
          <p className="text-caption text-surface-50">
            © {new Date().getFullYear()} {meta.name}. All rights reserved.
          </p>
          <a href="#top" className="text-caption text-surface-50 transition-colors hover:text-surface-cream">
            Back to top ↑
          </a>
        </div>
      </div>
    </footer>
  )
}
