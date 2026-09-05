import { contact, meta, mailto } from '../content/site.js'
import { Section, Bracket, Reveal, PillButton, Hairline } from './ui/Primitives.jsx'

const LINES = [
  { label: 'Location', value: meta.location, href: meta.locationMap },
  { label: 'Phone', value: meta.phone, href: meta.phoneHref },
  { label: 'Email', value: meta.email, href: mailto },
]

export function Contact() {
  return (
    <Section id="contact">
      <Reveal>
        <Bracket>{contact.eyebrow}</Bracket>
        <h2 className="mt-6 max-w-4xl text-balance text-heading-lg font-semibold text-surface-cream">
          {contact.title}
        </h2>

        <p className="mt-10 max-w-2xl text-pretty text-body-lg text-surface-50">
          {contact.teaser}
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <PillButton href={mailto} gradient>Drop me a line</PillButton>
          <PillButton href={meta.instagram}>Instagram</PillButton>
        </div>
      </Reveal>

      <Hairline className="mt-20" />
      <dl className="grid gap-px bg-surface-25 sm:grid-cols-3">
        {LINES.map((l) => (
          <div key={l.label} className="bg-just-black py-8 pr-6">
            <dt className="text-caption text-surface-50">{l.label}</dt>
            <dd className="mt-2 text-subheading font-semibold">
              <a
                href={l.href}
                {...(l.href.startsWith('http') ? { target: '_blank', rel: 'noreferrer noopener' } : null)}
                className="text-surface-cream transition-colors hover:text-shockingly-green"
              >
                {l.value}
              </a>
            </dd>
          </div>
        ))}
      </dl>
      <Hairline />
    </Section>
  )
}
