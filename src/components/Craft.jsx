import { disciplines } from '../content/site.js'
import { Section, Bracket, Hairline, Reveal } from './ui/Primitives.jsx'
import { Blob } from './ui/Blob.jsx'

/* The colour-per-discipline taxonomy is the system's signature: each craft
   keeps its own hue in both the label and the illustration. */
const ACCENT_TEXT = {
  pink: 'text-pink',
  orangey: 'text-orangey',
  lilac: 'text-lilac',
  blue: 'text-blue',
}

export function Craft() {
  return (
    <Section id="craft">
      <Reveal>
        <Bracket>What I do</Bracket>
        <h2 className="mt-6 max-w-3xl text-balance text-heading font-semibold text-surface-cream">
          Four disciplines, one production
        </h2>
      </Reveal>

      <div className="mt-16 md:mt-24">
        {disciplines.map((d, i) => (
          <div key={d.key}>
            {i > 0 && <Hairline />}
            <Reveal>
              <div className="grid items-center gap-10 py-12 md:grid-cols-2 md:gap-16 md:py-20">
                {/* Illustration column — alternates side for rhythm. */}
                <div className={i % 2 === 1 ? 'md:order-2' : ''}>
                  <Blob
                    shape={d.shape}
                    accent={d.accent}
                    className="w-full max-w-[24rem] md:max-w-[30rem]"
                  />
                </div>

                <div className={i % 2 === 1 ? 'md:order-1' : ''}>
                  <p className={`text-subheading font-semibold ${ACCENT_TEXT[d.accent]}`}>
                    {d.label}
                  </p>
                  <h3 className="mt-4 text-balance text-heading-sm font-semibold text-surface-cream">
                    {d.title}
                  </h3>
                  <p className="mt-6 max-w-xl text-pretty text-body-lg text-surface-50">
                    {d.body}
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        ))}
      </div>
    </Section>
  )
}
