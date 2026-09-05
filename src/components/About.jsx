import { about, brands, pages } from '../content/site.js'
import { Section, Bracket, Reveal } from './ui/Primitives.jsx'

export function About() {
  return (
    <Section id="about">
      <Reveal>
        <Bracket>{about.eyebrow}</Bracket>
        <h2 className="mt-6 max-w-4xl text-balance text-heading font-semibold text-surface-cream">
          {about.title}
        </h2>
      </Reveal>

      <div className="mt-16 grid gap-12 md:grid-cols-[1.6fr_1fr] md:gap-20">
        <Reveal>
          <div className="space-y-6">
            {about.body.map((p, i) => (
              <p key={i} className="text-pretty text-body-lg text-surface-50">{p}</p>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <dl className="divide-y divide-surface-25 border-y border-surface-25">
            {about.details.map((d) => (
              <div key={d.label} className="py-5">
                <dt className="text-caption text-surface-50">{d.label}</dt>
                <dd className="mt-1.5 text-body text-surface-cream">
                  {d.href ? (
                    <a
                      href={d.href}
                      {...(d.href.startsWith('http') ? { target: '_blank', rel: 'noreferrer noopener' } : null)}
                      className="transition-colors hover:text-shockingly-green"
                    >
                      {d.value}
                    </a>
                  ) : (
                    d.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>

      <LogoWall title="Brands I've worked with" items={brands} className="mt-24 md:mt-32" />
      <LogoWall title="Instagram pages I've handled / worked for" items={pages} className="mt-20" />
    </Section>
  )
}

/* Typographic logo wall. Set as cream wordmarks on hairline-bordered tiles —
   swap in real logo images later without changing the layout. */
function LogoWall({ title, items, className = '' }) {
  return (
    <div className={className}>
      <Reveal>
        <h3 className="text-subheading font-semibold text-surface-cream">{title}</h3>
      </Reveal>
      {/* Borders sit on the items themselves, so a short final row leaves
          empty space rather than painting the divider colour as a block. */}
      <ul className="mt-6 grid grid-cols-2 border-t border-l border-surface-25 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((name) => (
          <li
            key={name}
            className="flex min-h-[6.5rem] items-center justify-center border-r border-b border-surface-25 px-4 py-6 text-center text-body text-surface-50 transition-colors hover:text-surface-cream"
          >
            {name}
          </li>
        ))}
      </ul>
    </div>
  )
}
